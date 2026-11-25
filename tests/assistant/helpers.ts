import { createDefaultDeps } from "@/lib/assistant/server/handler";
import type { HandlerDeps } from "@/lib/assistant/server/handler";
import { ProviderError } from "@/lib/assistant/server/provider";
import type {
  ChatProvider,
  ProviderRequest,
} from "@/lib/assistant/server/provider";
import type { AssistantEvent } from "@/lib/assistant/shared/protocol";

export const ORIGIN = "http://localhost:3000";

export const FAKE_CONFIG = {
  accountId: "a".repeat(32),
  apiToken: "test-token-not-a-real-credential",
  model: "@cf/test/fake-model",
  baseUrl: "https://example.invalid/client/v4",
  maxOutputTokens: 400,
  maxOutputChars: 1800,
  timeoutMs: 5_000,
};

export type ScriptedProvider = ChatProvider & {
  calls: ProviderRequest[];
};

/** A model that replays fixed text deltas, or throws a chosen error. */
export function scriptedProvider(
  script: string[] | { error: ProviderError },
): ScriptedProvider {
  const calls: ProviderRequest[] = [];
  return {
    id: "scripted",
    calls,
    async *stream(request) {
      calls.push(request);
      if (!Array.isArray(script)) throw script.error;
      for (const delta of script) {
        if (request.signal.aborted) return;
        yield delta;
        // Let the consumer interleave, like a real network stream.
        await Promise.resolve();
      }
    },
  };
}

export function makeDeps(
  provider: ChatProvider | null,
  overrides: Partial<HandlerDeps> = {},
): HandlerDeps {
  return {
    ...createDefaultDeps(),
    getConfig: () =>
      provider
        ? { status: "ready", config: FAKE_CONFIG }
        : { status: "unconfigured" },
    getProvider: () => {
      if (!provider) throw new Error("No provider in this test.");
      return provider;
    },
    ...overrides,
  };
}

export function chatRequest(
  body: unknown,
  options: {
    ip?: string;
    origin?: string | null;
    contentType?: string;
    raw?: BodyInit;
    headers?: Record<string, string>;
  } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": options.contentType ?? "application/json",
    "cf-connecting-ip": options.ip ?? "203.0.113.7",
    ...options.headers,
  };
  if (options.origin !== null) headers.origin = options.origin ?? ORIGIN;

  return new Request(`${ORIGIN}/api/assistant`, {
    method: "POST",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

export function ask(question: string, extra: Record<string, unknown> = {}) {
  return { messages: [{ role: "user", content: question }], ...extra };
}

export async function readEvents(
  response: Response,
): Promise<AssistantEvent[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AssistantEvent);
}

export function textOf(events: AssistantEvent[]): string {
  return events
    .filter((e): e is Extract<AssistantEvent, { t: "text" }> => e.t === "text")
    .map((e) => e.v)
    .join("");
}

export function sourcesOf(events: AssistantEvent[]) {
  const found = events.find(
    (e): e is Extract<AssistantEvent, { t: "sources" }> => e.t === "sources",
  );
  return found?.v ?? [];
}

/** Build an SSE byte stream split into the given chunks. */
export function sseResponse(chunks: string[], init: ResponseInit = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

export function sseData(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}
