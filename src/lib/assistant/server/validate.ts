import "server-only";

import { ASSISTANT_LIMITS } from "@/lib/assistant/shared/protocol";
import type { ChatTurn } from "@/lib/assistant/shared/protocol";

export type BodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; code: "too_large" | "bad_request" };

/**
 * Reads the body while counting the bytes actually received. The
 * Content-Length header is only a hint: a request that lies about it, or uses
 * chunked encoding, is still cut off once it passes the limit.
 */
export async function readBodyLimited(
  request: Request,
  maxBytes: number = ASSISTANT_LIMITS.maxBodyBytes,
): Promise<BodyResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0) {
      return { ok: false, code: "bad_request" };
    }
    if (length > maxBytes) return { ok: false, code: "too_large" };
  }

  if (!request.body) return { ok: false, code: "bad_request" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, code: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, code: "bad_request" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export type ParsedChat = {
  /** Earlier messages. Untrusted, including the ones labelled "assistant". */
  history: ChatTurn[];
  /** The latest user message. Untrusted. */
  question: string;
  starterId: string | null;
};

export type ParseResult =
  { ok: true; value: ParsedChat } | { ok: false; message: string };

// Control characters except tab and newline, plus zero-width and bidi marks.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const INVISIBLE =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

export function sanitizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(INVISIBLE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const STARTER_ID = /^[a-z0-9-]{1,40}$/;

function fail(message: string): ParseResult {
  return { ok: false, message };
}

/**
 * Strict parsing. Unknown keys, unknown roles, wrong types and oversize text
 * are all rejected. Nothing the client sends is trusted: roles are only
 * labels, the system role is not accepted, and text is cleaned before use.
 */
export function parseChatRequest(bytes: Uint8Array): ParseResult {
  let raw: unknown;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    raw = JSON.parse(text);
  } catch {
    return fail("Request body is not valid JSON.");
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("Request body must be an object.");
  }
  const body = raw as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (key !== "messages" && key !== "starterId") {
      return fail("Unknown field in request.");
    }
  }

  let starterId: string | null = null;
  if (body.starterId !== undefined) {
    if (
      typeof body.starterId !== "string" ||
      !STARTER_ID.test(body.starterId)
    ) {
      return fail("Invalid starter id.");
    }
    starterId = body.starterId;
  }

  const messages = body.messages;
  if (!Array.isArray(messages)) return fail("messages must be a list.");
  if (messages.length < 1 || messages.length > ASSISTANT_LIMITS.maxMessages) {
    return fail("Wrong number of messages.");
  }

  const turns: ChatTurn[] = [];
  let totalChars = 0;

  for (const item of messages as unknown[]) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return fail("Invalid message.");
    }
    const message = item as Record<string, unknown>;
    const keys = Object.keys(message);
    if (keys.length !== 2 || !("role" in message) || !("content" in message)) {
      return fail("Invalid message.");
    }
    const { role, content } = message;
    if (role !== "user" && role !== "assistant") {
      return fail("Invalid message role.");
    }
    if (typeof content !== "string") return fail("Invalid message content.");

    const max =
      role === "user"
        ? ASSISTANT_LIMITS.maxUserChars
        : ASSISTANT_LIMITS.maxAssistantChars;
    if (content.length > max * 2) return fail("Message is too long.");

    const clean = sanitizeText(content);
    if (clean.length === 0) return fail("Message is empty.");
    if (clean.length > max) return fail("Message is too long.");

    totalChars += clean.length;
    turns.push({ role, content: clean });
  }

  if (totalChars > ASSISTANT_LIMITS.maxTotalChars) {
    return fail("Conversation is too long.");
  }

  const last = turns[turns.length - 1];
  if (!last || last.role !== "user") {
    return fail("The last message must come from the user.");
  }

  return {
    ok: true,
    value: {
      history: turns.slice(0, -1),
      question: last.content,
      starterId,
    },
  };
}
