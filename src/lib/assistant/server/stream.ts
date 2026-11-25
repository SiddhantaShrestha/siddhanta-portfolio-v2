import "server-only";

import { MarkerFilter } from "@/lib/assistant/server/markers";
import {
  SentenceBuffer,
  checkSentence,
} from "@/lib/assistant/server/output-guard";
import { ProviderError } from "@/lib/assistant/server/provider";
import type {
  ChatProvider,
  ProviderMessage,
} from "@/lib/assistant/server/provider";
import type { Knowledge } from "@/lib/assistant/server/knowledge";
import type { SourceCatalog } from "@/lib/assistant/server/sources";
import type {
  AssistantEvent,
  AssistantErrorCode,
  SourceLink,
} from "@/lib/assistant/shared/protocol";

const encoder = new TextEncoder();

export function encodeEvent(event: AssistantEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export const ERROR_MESSAGES: Record<AssistantErrorCode, string> = {
  bad_request: "That request could not be read. Please try again.",
  too_large: "That message is too long.",
  forbidden: "This request is not allowed.",
  rate_limited: "Too many questions in a short time. Please wait a moment.",
  busy: "Please wait for the current answer to finish.",
  unavailable:
    "The AI part is not available right now. The suggested questions still work.",
  quota:
    "The AI answers have reached their limit for now. The suggested questions still work.",
  upstream:
    "The AI service had a problem. Please try again, or use a suggested question.",
  timeout: "The AI service took too long. Please try again.",
};

const BLOCKED_NOTICE =
  "I can't confirm part of that answer from the verified portfolio content, so I stopped it here. The case study pages have the checked details.";

type EventSource = AsyncGenerator<AssistantEvent, void, void>;

/** Wraps an event generator as an NDJSON byte stream with clean cancellation. */
export function eventsToStream(
  events: EventSource,
  hooks: {
    onCancel?: () => void;
    /** May be async, for example to release a shared lock. Errors are ignored. */
    onFinish?: () => void | Promise<void>;
  } = {},
): ReadableStream<Uint8Array> {
  let finished = false;
  const finish = async () => {
    if (finished) return;
    finished = true;
    try {
      await hooks.onFinish?.();
    } catch {
      // A failed release must never break the response.
    }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await events.next();
        if (next.done) {
          // Release first, so a shared lock is freed before the stream ends.
          await finish();
          controller.close();
          return;
        }
        controller.enqueue(encodeEvent(next.value));
      } catch {
        await finish();
        controller.error(new Error("stream failed"));
      }
    },
    async cancel() {
      hooks.onCancel?.();
      try {
        await events.return(undefined);
      } finally {
        await finish();
      }
    },
  });
}

export async function* staticEvents(
  mode: "deterministic",
  text: string,
  sources: SourceLink[],
): EventSource {
  yield { t: "meta", mode };
  yield { t: "text", v: text };
  if (sources.length > 0) yield { t: "sources", v: sources };
  yield { t: "done" };
}

export type ModelRunArgs = {
  provider: ChatProvider;
  messages: ProviderMessage[];
  knowledge: Knowledge;
  catalog: SourceCatalog;
  maxOutputTokens: number;
  maxOutputChars: number;
  /** Aborted when the visitor leaves or the stream is cancelled. */
  abort: AbortController;
  /**
   * Called when the guard stops an answer. For offline evaluation only. The
   * route never sets it, so nothing about a blocked answer is logged.
   */
  onBlocked?: (reason: string, sentence: string) => void;
};

/**
 * Runs the model and yields guarded events. Text only leaves this function a
 * whole sentence at a time, after the marker filter and the output guard.
 */
export async function* modelEvents(args: ModelRunArgs): EventSource {
  const { provider, knowledge, catalog, abort } = args;
  yield { t: "meta", mode: "model" };

  const markers = new MarkerFilter(catalog);
  const sentences = new SentenceBuffer();
  let emitted = 0;
  let stopped = false;
  let blocked = false;

  const handle = (sentence: string): AssistantEvent | null => {
    const violation = checkSentence(sentence, knowledge);
    if (violation) {
      args.onBlocked?.(violation, sentence);
      stopped = true;
      blocked = true;
      return { t: "notice", v: BLOCKED_NOTICE };
    }
    if (emitted + sentence.length > args.maxOutputChars) {
      stopped = true;
      return null;
    }
    emitted += sentence.length;
    return { t: "text", v: sentence };
  };

  try {
    for await (const delta of provider.stream({
      messages: args.messages,
      maxOutputTokens: args.maxOutputTokens,
      signal: abort.signal,
    })) {
      for (const sentence of sentences.push(markers.push(delta))) {
        const event = handle(sentence);
        if (event) yield event;
        if (stopped) break;
      }
      if (stopped) {
        abort.abort();
        break;
      }
    }

    if (!stopped) {
      const tail = sentences.push(markers.flush());
      const rest = sentences.flush();
      for (const sentence of rest ? [...tail, rest] : tail) {
        const event = handle(sentence);
        if (event) yield event;
        if (stopped) break;
      }
    }

    if (emitted === 0 && !blocked) {
      yield errorEvent("upstream");
      return;
    }

    const found = markers.sources();
    if (found.length > 0) yield { t: "sources", v: found };
    yield { t: "done" };
  } catch (error) {
    if (abort.signal.aborted && !(error instanceof ProviderError)) return;
    if (error instanceof ProviderError) {
      console.error(
        `[assistant] provider error: ${error.code} ${error.status ?? ""}`,
      );
      yield errorEvent(error.code);
      return;
    }
    if (error instanceof Error && error.name === "AbortError") return;
    console.error("[assistant] unexpected stream error");
    yield errorEvent("upstream");
  } finally {
    abort.abort();
  }
}

export function errorEvent(code: AssistantErrorCode): AssistantEvent {
  return { t: "error", code, message: ERROR_MESSAGES[code] };
}
