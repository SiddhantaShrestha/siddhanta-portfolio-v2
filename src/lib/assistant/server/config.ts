import "server-only";

/**
 * Server-only assistant configuration. Read at request time, never at import.
 *
 * CLOUDFLARE_ACCOUNT_ID               Cloudflare account id
 * CLOUDFLARE_AI_API_TOKEN             API token scoped to Workers AI
 * ASSISTANT_MODEL                     optional, defaults to DEFAULT_MODEL
 * ASSISTANT_PRODUCTION_GATES_CONFIRMED  must be "true" before the model path
 *                                     runs in a production build (see
 *                                     docs/phase-6a-assistant.md and
 *                                     docs/phase-6b-production.md)
 * ASSISTANT_DAILY_LIMIT               optional, read by runtime.ts
 *
 * None of these use the NEXT_PUBLIC_ prefix. Values are never logged.
 */

/**
 * Chosen from the Workers AI catalog: Workers Free still includes it after the
 * 2026-07-28 change, $0.10 per M input and $0.30 per M output tokens.
 */
export const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";

export type AssistantConfig = {
  accountId: string;
  apiToken: string;
  model: string;
  baseUrl: string;
  maxOutputTokens: number;
  /** Hard server-side cap on streamed answer characters. */
  maxOutputChars: number;
  timeoutMs: number;
};

export type ConfigResult =
  | { status: "ready"; config: AssistantConfig }
  /** No credentials. Deterministic starter answers still work. */
  | { status: "unconfigured" }
  /** Production build without confirmed deployment gates. Fails closed. */
  | { status: "blocked"; reason: "production_gates" };

type Env = Record<string, string | undefined>;

const ACCOUNT_ID = /^[a-f0-9]{32}$/i;
const MODEL_ID = /^@cf\/[a-z0-9._-]+\/[a-z0-9._-]+$/i;

/**
 * Fails closed: anything except an explicit development or test mode counts as
 * production. Workers do not always define NODE_ENV, and a missing value must
 * never open the model path.
 */
export function isProductionMode(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "development" && nodeEnv !== "test";
}

export function readConfig(env: Env = process.env): ConfigResult {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = env.CLOUDFLARE_AI_API_TOKEN?.trim();

  if (!accountId || !apiToken || !ACCOUNT_ID.test(accountId)) {
    return { status: "unconfigured" };
  }

  if (
    isProductionMode(env.NODE_ENV) &&
    env.ASSISTANT_PRODUCTION_GATES_CONFIRMED !== "true"
  ) {
    return { status: "blocked", reason: "production_gates" };
  }

  const requestedModel = env.ASSISTANT_MODEL?.trim();
  const model =
    requestedModel && MODEL_ID.test(requestedModel)
      ? requestedModel
      : DEFAULT_MODEL;

  return {
    status: "ready",
    config: {
      accountId,
      apiToken,
      model,
      baseUrl: "https://api.cloudflare.com/client/v4",
      maxOutputTokens: 400,
      maxOutputChars: 1800,
      timeoutMs: 20_000,
    },
  };
}
