import "server-only";

import { getSiteUrl } from "@/lib/env";
import { isProductionMode, readConfig } from "@/lib/assistant/server/config";
import type { ConfigResult } from "@/lib/assistant/server/config";
import {
  getDeterministicAnswer,
  matchStarter,
} from "@/lib/assistant/server/deterministic";
import { getKnowledge } from "@/lib/assistant/server/knowledge";
import type { Knowledge } from "@/lib/assistant/server/knowledge";
import { LocalUsageGate } from "@/lib/assistant/server/gate";
import type { GateDenied } from "@/lib/assistant/server/gate";
import { buildChatMessages } from "@/lib/assistant/server/prompt";
import type { ChatProvider } from "@/lib/assistant/server/provider";
import {
  BoundedRateLimiter,
  DailyBudget,
  InFlightGuard,
  getVisitorKey,
} from "@/lib/assistant/server/rate-limit";
import {
  NO_CLOUDFLARE,
  edgeAllows,
  resolveRuntime,
} from "@/lib/assistant/server/runtime";
import type { RuntimeContext } from "@/lib/assistant/server/runtime";
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
  /**
   * Read on every request so a missing key is handled, not cached. The env
   * argument is the Worker env (vars and secrets) when running on Cloudflare.
   */
  getConfig: (env?: Record<string, string>) => ConfigResult;
  getProvider: (
    config: Extract<ConfigResult, { status: "ready" }>["config"],
  ) => ChatProvider;
  getKnowledge: () => Knowledge;
  getCatalog: () => SourceCatalog;
  /** Finds Cloudflare bindings: the shared gate and the edge pre-filter. */
  getRuntime: () => Promise<RuntimeContext>;
  /** Fails closed. Production requires the shared gate for the model path. */
  isProduction: () => boolean;
  /** Per-process limit for every request, including the starters. */
  generalLimiter: BoundedRateLimiter;
  /** Local gate parts, used only when no shared gate is bound (development). */
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
    let originUrl: URL;
    let own: string;
    try {
      originUrl = new URL(origin);
      own = new URL(request.url).origin;
    } catch {
      return false;
    }
    if (origin === own || extra.includes(origin)) return true;
    // Behind an adapter, request.url may not carry the public hostname (the
    // OpenNext Worker reports http://localhost:PORT). A browser sends Origin
    // for the page that made the call, and a page on another site cannot
    // change the Host header, so this still rejects cross-site calls.
    const host = request.headers.get("host")?.toLowerCase();
    return host !== undefined && originUrl.host.toLowerCase() === host;
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

  // A failure to look up bindings means "no shared gate", which fails closed.
  const runtime = await deps.getRuntime().catch(() => NO_CLOUDFLARE);
  const production = deps.isProduction();

  // Only the Cloudflare edge sets cf-connecting-ip honestly. Anywhere else
  // in production the header is just client input, so it is ignored.
  const visitor = await getVisitorKey(request.headers, {
    trustCloudflareHeader: runtime.cloudflare || !production,
  });

  if (!(await edgeAllows(runtime.edgeLimit, visitor))) {
    return errorResponse("rate_limited", { retryAfterSeconds: 10 });
  }

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

  const configResult = deps.getConfig(runtime.env);
  if (configResult.status !== "ready") {
    release();
    return errorResponse("unavailable");
  }
  const { config } = configResult;

  // Shared gate when bound. Otherwise the per-process gate, which is only
  // acceptable outside production, because every isolate has its own counters.
  const gate =
    runtime.gate ??
    new LocalUsageGate({
      modelLimiter: deps.modelLimiter,
      dailyBudget: deps.dailyBudget,
    });
  if (production && gate.kind !== "shared") {
    release();
    return errorResponse("unavailable");
  }

  const grant = await gate.acquire(visitor);
  if (!grant.ok) {
    release();
    return gateDeniedResponse(grant);
  }
  const releaseAll = async () => {
    try {
      await grant.release();
    } finally {
      release();
    }
  };

  try {
    const abort = new AbortController();
    request.signal.addEventListener("abort", () => abort.abort(), {
      once: true,
    });

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
        onFinish: releaseAll,
      }),
      { status: 200, headers: STREAM_HEADERS },
    );
  } catch {
    await releaseAll();
    return errorResponse("upstream");
  }
}

function gateDeniedResponse(denied: GateDenied): Response {
  switch (denied.reason) {
    case "rate_limited":
      return errorResponse("rate_limited", {
        retryAfterSeconds: denied.retryAfterSeconds,
      });
    case "quota":
      return errorResponse("quota");
    case "busy":
      return errorResponse("busy");
    default:
      return errorResponse("unavailable");
  }
}
/**
 * Production wiring. The per-process limiters are a first layer. The model
 * path in production also needs the shared Durable Object gate, see
 * docs/phase-6b-production.md.
 */
export function createDefaultDeps(): HandlerDeps {
  return {
    getConfig: (env) =>
      readConfig({
        ...process.env,
        ...env,
        // A literal, so the build inlines it. Never read from the Worker env.
        NODE_ENV: process.env.NODE_ENV,
      }),
    getRuntime: resolveRuntime,
    isProduction: () => isProductionMode(process.env.NODE_ENV),
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
