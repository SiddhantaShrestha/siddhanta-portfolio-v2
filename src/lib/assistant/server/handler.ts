import "server-only";

import { getSiteUrl } from "@/lib/env";
import { readConfig } from "@/lib/assistant/server/config";
import type { ConfigResult } from "@/lib/assistant/server/config";
import {
  getDeterministicAnswer,
  matchStarter,
} from "@/lib/assistant/server/deterministic";
import { getKnowledge } from "@/lib/assistant/server/knowledge";
import type { Knowledge } from "@/lib/assistant/server/knowledge";
import { buildChatMessages } from "@/lib/assistant/server/prompt";
import type { ChatProvider } from "@/lib/assistant/server/provider";
import {
  BoundedRateLimiter,
  DailyBudget,
  InFlightGuard,
  getVisitorKey,
} from "@/lib/assistant/server/rate-limit";
import {
  getSourceCatalog,
  resolveSource,
} from "@/lib/assistant/server/sources";
import type { SourceCatalog } from "@/lib/assistant/server/sources";
import {
  ERROR_MESSAGES,
  eventsToStream,
  modelEvents,
  staticEvents,
} from "@/lib/assistant/server/stream";
import {
  parseChatRequest,
  readBodyLimited,
} from "@/lib/assistant/server/validate";
import { createWorkersAiProvider } from "@/lib/assistant/server/workers-ai";
import type {
  AssistantErrorBody,
  AssistantErrorCode,
  SourceLink,
} from "@/lib/assistant/shared/protocol";

export type HandlerDeps = {
  /** Read on every request so a missing key is handled, not cached. */
  getConfig: () => ConfigResult;
  getProvider: (
    config: Extract<ConfigResult, { status: "ready" }>["config"],
  ) => ChatProvider;
  getKnowledge: () => Knowledge;
  getCatalog: () => SourceCatalog;
  /** Every request, including the deterministic starters. */
  generalLimiter: BoundedRateLimiter;
  /** Model requests only. */
  modelLimiter: BoundedRateLimiter;
  dailyBudget: DailyBudget;
  inFlight: InFlightGuard;
  /** Origins allowed to call the endpoint, besides the request's own. */
  extraOrigins: string[];
  newNonce: () => string;
};

const STATUS: Record<AssistantErrorCode, number> = {
  bad_request: 400,
  too_large: 413,
  forbidden: 403,
  rate_limited: 429,
  busy: 409,
  unavailable: 503,
  quota: 429,
  upstream: 502,
  timeout: 504,
};

function errorResponse(
  code: AssistantErrorCode,
  extra: { retryAfterSeconds?: number; message?: string } = {},
): Response {
  const body: AssistantErrorBody = {
    t: "error",
    code,
    message: extra.message ?? ERROR_MESSAGES[code],
  };
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  if (extra.retryAfterSeconds) {
    headers.set("retry-after", String(extra.retryAfterSeconds));
  }
  return new Response(JSON.stringify(body), {
    status: STATUS[code],
    headers,
  });
}

const STREAM_HEADERS = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function isAllowedOrigin(request: Request, extra: string[]): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    let own: string;
    try {
      own = new URL(request.url).origin;
    } catch {
      return false;
    }
    return origin === own || extra.includes(origin);
  }
  // No Origin header: accept only browsers that say the call is same-origin.
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export async function handleAssistantRequest(
  request: Request,
  deps: HandlerDeps,
): Promise<Response> {
  if (!isAllowedOrigin(request, deps.extraOrigins)) {
    return errorResponse("forbidden");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return errorResponse("bad_request");
  }

  const visitor = await getVisitorKey(request.headers);

  const general = deps.generalLimiter.check(visitor);
  if (!general.allowed) {
    return errorResponse("rate_limited", {
      retryAfterSeconds: general.retryAfterSeconds,
    });
  }

  const body = await readBodyLimited(request);
  if (!body.ok) return errorResponse(body.code);

  const parsed = parseChatRequest(body.bytes);
  if (!parsed.ok)
    return errorResponse("bad_request", { message: parsed.message });
  const { history, question, starterId } = parsed.value;

  const catalog = deps.getCatalog();
  const starter = matchStarter(starterId, question);

  // One active request per visitor, starter or model.
  const release = deps.inFlight.acquire(visitor);
  if (!release) return errorResponse("busy");

  // Deterministic answers: no key, no model, no AI quota.
  if (starter) {
    try {
      const answer = getDeterministicAnswer(starter);
      const sources = answer.sourceKeys
        .map((key) => resolveSource(key, catalog))
        .filter((link): link is SourceLink => link !== null);
      return new Response(
        eventsToStream(staticEvents("deterministic", answer.text, sources), {
          onFinish: release,
        }),
        { status: 200, headers: STREAM_HEADERS },
      );
    } catch {
      release();
      return errorResponse("upstream");
    }
  }

  const configResult = deps.getConfig();
  if (configResult.status !== "ready") {
    release();
    return errorResponse("unavailable");
  }
  const { config } = configResult;

  const model = deps.modelLimiter.check(visitor);
  if (!model.allowed) {
    release();
    return errorResponse("rate_limited", {
      retryAfterSeconds: model.retryAfterSeconds,
    });
  }
  if (!deps.dailyBudget.tryConsume()) {
    release();
    return errorResponse("quota");
  }

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const knowledge = deps.getKnowledge();
  const messages = buildChatMessages({
    knowledge,
    history,
    question,
    nonce: deps.newNonce(),
  });

  const events = modelEvents({
    provider: deps.getProvider(config),
    messages,
    knowledge,
    catalog,
    maxOutputTokens: config.maxOutputTokens,
    maxOutputChars: config.maxOutputChars,
    abort,
  });

  return new Response(
    eventsToStream(events, {
      onCancel: () => abort.abort(),
      onFinish: release,
    }),
    { status: 200, headers: STREAM_HEADERS },
  );
}

/** Production wiring. Limits are per process, see docs/phase-6a-assistant.md. */
export function createDefaultDeps(): HandlerDeps {
  return {
    getConfig: () => readConfig(),
    getProvider: (config) => createWorkersAiProvider(config),
    getKnowledge,
    getCatalog: getSourceCatalog,
    generalLimiter: new BoundedRateLimiter({
      limit: 40,
      windowMs: 60_000,
      maxKeys: 5_000,
    }),
    modelLimiter: new BoundedRateLimiter({
      limit: 6,
      windowMs: 60_000,
      maxKeys: 5_000,
    }),
    dailyBudget: new DailyBudget(150),
    inFlight: new InFlightGuard({ maxKeys: 2_000, maxHoldMs: 45_000 }),
    extraOrigins: [getSiteUrl()],
    newNonce: () => crypto.randomUUID().replace(/-/g, "").slice(0, 16),
  };
}
