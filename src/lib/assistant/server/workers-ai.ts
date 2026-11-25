import "server-only";

import { ProviderError } from "@/lib/assistant/server/provider";
import type {
  ChatProvider,
  ProviderRequest,
} from "@/lib/assistant/server/provider";
import { SseParser } from "@/lib/assistant/server/sse";
import type { AssistantConfig } from "@/lib/assistant/server/config";

/** Malformed `data:` events tolerated before the response is treated as bad. */
const MAX_MALFORMED_EVENTS = 3;

type FetchLike = typeof fetch;

/**
 * Cloudflare Workers AI through its OpenAI-compatible REST endpoint.
 * Plain fetch and Web streams only, so it runs the same on Node and on Workers.
 * One attempt per call. No AI Gateway, so no request logging is configured.
 */
export function createWorkersAiProvider(
  config: AssistantConfig,
  fetchImpl: FetchLike = fetch,
): ChatProvider {
  const url = `${config.baseUrl}/accounts/${config.accountId}/ai/v1/chat/completions`;

  return {
    id: `workers-ai:${config.model}`,

    async *stream(request: ProviderRequest) {
      const timeout = AbortSignal.timeout(config.timeoutMs);
      const signal = AbortSignal.any([request.signal, timeout]);

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiToken}`,
            "content-type": "application/json",
            accept: "text/event-stream",
          },
          body: JSON.stringify({
            model: config.model,
            messages: request.messages,
            stream: true,
            max_tokens: request.maxOutputTokens,
            temperature: 0.2,
          }),
          signal,
          redirect: "error",
          cache: "no-store",
        });
      } catch (error) {
        throw toProviderError(error, timeout, request.signal);
      }

      if (!response.ok) {
        // The body is never forwarded to visitors and never logged.
        await response.body?.cancel().catch(() => undefined);
        throw statusToError(response.status);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        await response.body?.cancel().catch(() => undefined);
        throw new ProviderError("upstream", "Unexpected response type.");
      }

      const reader = response.body.getReader();
      const parser = new SseParser();
      let malformed = 0;
      let produced = false;
      let finished = false;

      try {
        while (!finished) {
          let chunk: ReadableStreamReadResult<Uint8Array>;
          try {
            chunk = await reader.read();
          } catch (error) {
            throw toProviderError(error, timeout, request.signal);
          }

          const payloads = chunk.done
            ? parser.end()
            : parser.pushBytes(chunk.value);

          for (const payload of payloads) {
            if (payload.trim() === "[DONE]") {
              finished = true;
              break;
            }
            const parsed = parseEvent(payload);
            if (parsed.kind === "malformed") {
              malformed += 1;
              if (malformed > MAX_MALFORMED_EVENTS) {
                throw new ProviderError("upstream", "Malformed stream.");
              }
              continue;
            }
            if (parsed.kind === "error") {
              throw new ProviderError(
                "upstream",
                "Provider reported an error.",
              );
            }
            if (parsed.text) {
              produced = true;
              yield parsed.text;
            }
          }

          if (chunk.done) finished = true;
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }

      if (!produced) {
        throw new ProviderError("upstream", "Empty response.");
      }
    },
  };
}

function statusToError(status: number): ProviderError {
  if (status === 429) {
    return new ProviderError("quota", "Provider rate limit or quota.", status);
  }
  if (status === 401 || status === 403) {
    return new ProviderError(
      "unavailable",
      "Provider rejected the request.",
      status,
    );
  }
  if (status === 408 || status === 504) {
    return new ProviderError("timeout", "Provider timed out.", status);
  }
  return new ProviderError("upstream", "Provider error.", status);
}

function toProviderError(
  error: unknown,
  timeout: AbortSignal,
  caller: AbortSignal,
): Error {
  if (error instanceof ProviderError) return error;
  if (timeout.aborted)
    return new ProviderError("timeout", "Provider timed out.");
  if (caller.aborted) return abortError();
  if (error instanceof Error && error.name === "AbortError")
    return abortError();
  return new ProviderError("upstream", "Could not reach the provider.");
}

function abortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

type ParsedEvent =
  { kind: "text"; text: string } | { kind: "malformed" } | { kind: "error" };

/**
 * Only `delta.content` is used. Reasoning fields are ignored. Events with no
 * text (role or finish events) return an empty text.
 */
function parseEvent(payload: string): ParsedEvent {
  const none: ParsedEvent = { kind: "text", text: "" };
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return { kind: "malformed" };
  }
  if (typeof json !== "object" || json === null) return { kind: "malformed" };

  const record = json as Record<string, unknown>;
  if ("error" in record && record.error) return { kind: "error" };

  const choices = record.choices;
  if (!Array.isArray(choices)) return { kind: "malformed" };
  const first: unknown = choices[0];
  if (first === undefined) return none;
  if (typeof first !== "object" || first === null) return { kind: "malformed" };

  const delta = (first as Record<string, unknown>).delta;
  if (delta === undefined || delta === null) return none;
  if (typeof delta !== "object") return { kind: "malformed" };

  const content = (delta as Record<string, unknown>).content;
  return typeof content === "string" ? { kind: "text", text: content } : none;
}
