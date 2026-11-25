import "server-only";

import type { AssistantErrorCode } from "@/lib/assistant/shared/protocol";

/**
 * The only surface the rest of the assistant knows about a model provider.
 * Swap the model or the provider by writing another ChatProvider.
 * No automatic retries: a provider makes one attempt and reports the result.
 */
export type ProviderMessage = {
  role: "system" | "user";
  content: string;
};

export type ProviderRequest = {
  messages: ProviderMessage[];
  maxOutputTokens: number;
  signal: AbortSignal;
};

export interface ChatProvider {
  readonly id: string;
  /** Yields plain text deltas. Throws ProviderError on failure. */
  stream(request: ProviderRequest): AsyncGenerator<string, void, void>;
}

export type ProviderErrorCode = Extract<
  AssistantErrorCode,
  "unavailable" | "quota" | "upstream" | "timeout"
>;

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status?: number;

  constructor(code: ProviderErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}
