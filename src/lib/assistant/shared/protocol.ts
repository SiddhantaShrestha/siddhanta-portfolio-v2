/**
 * Types and limits shared by the assistant route and the chat UI.
 * Client safe: no portfolio data, no credentials, no provider code.
 */

export const ASSISTANT_ENDPOINT = "/api/assistant";

export const ASSISTANT_LIMITS = {
  /** Hard cap on request body bytes, measured on bytes actually received. */
  maxBodyBytes: 8 * 1024,
  /** Most messages a request may carry. The client trims to this. */
  maxMessages: 6,
  maxUserChars: 400,
  /** Assistant messages are untrusted. Long ones are rejected. */
  maxAssistantChars: 1200,
  maxTotalChars: 3000,
} as const;

export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type ChatRequestBody = {
  messages: ChatTurn[];
  /** Optional id of a suggested starter question. */
  starterId?: string;
};

export type SourceLink = {
  label: string;
  /** Always a same-site path. The server builds it from an allowlist. */
  href: string;
};

export type AssistantErrorCode =
  | "bad_request"
  | "too_large"
  | "forbidden"
  | "rate_limited"
  | "busy"
  | "unavailable"
  | "quota"
  | "upstream"
  | "timeout";

/** One line of the NDJSON response stream. */
export type AssistantEvent =
  | { t: "meta"; mode: "deterministic" | "model" }
  | { t: "text"; v: string }
  | { t: "notice"; v: string }
  | { t: "sources"; v: SourceLink[] }
  | { t: "error"; code: AssistantErrorCode; message: string }
  | { t: "done" };

/** Body of a non-streaming error response. */
export type AssistantErrorBody = {
  t: "error";
  code: AssistantErrorCode;
  message: string;
};

export const SAME_SITE_HREF = /^\/(?:projects\/[a-z0-9-]{1,60}|#[a-z-]{1,30})$/;

export function isSafeSourceHref(href: unknown): href is string {
  return typeof href === "string" && SAME_SITE_HREF.test(href);
}
