import { isSafeSourceHref } from "@/lib/assistant/shared/protocol";
import type {
  AssistantErrorCode,
  AssistantEvent,
  SourceLink,
} from "@/lib/assistant/shared/protocol";

const ERROR_CODES: readonly AssistantErrorCode[] = [
  "bad_request",
  "too_large",
  "forbidden",
  "rate_limited",
  "busy",
  "unavailable",
  "quota",
  "upstream",
  "timeout",
];

function isErrorCode(value: unknown): value is AssistantErrorCode {
  return (
    typeof value === "string" &&
    (ERROR_CODES as readonly string[]).includes(value)
  );
}

function cleanSources(value: unknown): SourceLink[] {
  if (!Array.isArray(value)) return [];
  const out: SourceLink[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const { label, href } = item as Record<string, unknown>;
    // Defense in depth: the server already limits links to its allowlist.
    if (
      typeof label === "string" &&
      label.length <= 80 &&
      isSafeSourceHref(href)
    ) {
      out.push({ label, href });
    }
  }
  return out.slice(0, 4);
}

/** Validates one decoded line. Anything unexpected returns null. */
export function toAssistantEvent(value: unknown): AssistantEvent | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  switch (record.t) {
    case "meta":
      return record.mode === "deterministic" || record.mode === "model"
        ? { t: "meta", mode: record.mode }
        : null;
    case "text":
    case "notice":
      return typeof record.v === "string" ? { t: record.t, v: record.v } : null;
    case "sources":
      return { t: "sources", v: cleanSources(record.v) };
    case "error":
      return isErrorCode(record.code) && typeof record.message === "string"
        ? {
            t: "error",
            code: record.code,
            message: record.message.slice(0, 300),
          }
        : null;
    case "done":
      return { t: "done" };
    default:
      return null;
  }
}

/**
 * Reads an NDJSON byte stream. Handles lines split across chunks and
 * multi-byte characters split across chunks. Bad lines are skipped.
 */
export async function* readEventStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<AssistantEvent, void, void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const parse = (line: string): AssistantEvent | null => {
    if (!line.trim()) return null;
    try {
      return toAssistantEvent(JSON.parse(line));
    } catch {
      return null;
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const event = parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (event) yield event;
        newline = buffer.indexOf("\n");
      }
    }
    buffer += decoder.decode();
    const last = parse(buffer);
    if (last) yield last;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
