import "server-only";

import type {
  GateDenied,
  GateGranted,
  UsageGate,
} from "@/lib/assistant/server/gate";

/**
 * Minimal structural types for the Durable Object namespace, so this file
 * needs no Cloudflare type package and works with any adapter.
 */
export type DurableObjectStubLike = {
  fetch(input: string, init?: RequestInit): Promise<Response>;
};

export type DurableObjectNamespaceLike = {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStubLike;
};

export type SharedGateLimits = {
  perVisitorLimit: number;
  windowMs: number;
  dailyLimit: number;
  lockMs: number;
};

const GATE_NAME = "global";
const CALL_TIMEOUT_MS = 3_000;
const DENIED_REASONS = new Set([
  "busy",
  "rate_limited",
  "quota",
  "unavailable",
]);

const UNAVAILABLE: GateDenied = {
  ok: false,
  reason: "unavailable",
  retryAfterSeconds: 30,
};

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("gate timeout")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

function parseDecision(value: unknown): GateDenied | { token: string } | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (raw.ok === true) {
    return typeof raw.token === "string" &&
      raw.token.length > 0 &&
      raw.token.length <= 64
      ? { token: raw.token }
      : null;
  }
  if (
    raw.ok === false &&
    typeof raw.reason === "string" &&
    DENIED_REASONS.has(raw.reason) &&
    typeof raw.retryAfterSeconds === "number"
  ) {
    return {
      ok: false,
      reason: raw.reason as GateDenied["reason"],
      retryAfterSeconds: Math.min(
        86_400,
        Math.max(1, Math.floor(raw.retryAfterSeconds)),
      ),
    };
  }
  return null;
}

/**
 * Client for the AssistantGate Durable Object. Fails closed: any error,
 * timeout or unexpected reply means "unavailable", never "allowed".
 */
export function createDurableGate(
  namespace: DurableObjectNamespaceLike,
  limits: SharedGateLimits,
  options: { timeoutMs?: number } = {},
): UsageGate {
  const timeoutMs = options.timeoutMs ?? CALL_TIMEOUT_MS;
  const stub = () => namespace.get(namespace.idFromName(GATE_NAME));

  const post = async (path: string, body: unknown): Promise<unknown> => {
    const response = await withTimeout(
      stub().fetch(`https://assistant-gate${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      timeoutMs,
    );
    if (!response.ok) throw new Error("gate error");
    return response.json();
  };

  return {
    kind: "shared",
    async acquire(visitor): Promise<GateGranted | GateDenied> {
      let decision: ReturnType<typeof parseDecision>;
      try {
        decision = parseDecision(
          await post("/acquire", { visitor, ...limits }),
        );
      } catch {
        return UNAVAILABLE;
      }
      if (!decision) return UNAVAILABLE;
      if ("ok" in decision) return decision;

      const { token } = decision;
      let released = false;
      return {
        ok: true,
        release: async () => {
          if (released) return;
          released = true;
          try {
            await post("/release", { visitor, token });
          } catch {
            // The lock expires on its own after lockMs.
          }
        },
      };
    },
  };
}
