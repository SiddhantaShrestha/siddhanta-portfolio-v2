import "server-only";

import type {
  BoundedRateLimiter,
  DailyBudget,
} from "@/lib/assistant/server/rate-limit";

/**
 * The model gate: per-visitor limit, daily model budget and (for the shared
 * gate) the in-flight lock, checked in one step before any model call.
 *
 * Two kinds:
 * - "local"  per-process memory. Fine for development. NOT a public limit,
 *            because every Worker isolate has its own counters.
 * - "shared" one Durable Object. Exact across isolates and locations.
 *            The only kind the production model path accepts.
 */
export type GateDenied = {
  ok: false;
  reason: "rate_limited" | "quota" | "busy" | "unavailable";
  retryAfterSeconds: number;
};

export type GateGranted = {
  ok: true;
  /** Always call once the request ends. Safe to call more than once. */
  release: () => Promise<void> | void;
};

export interface UsageGate {
  readonly kind: "local" | "shared";
  acquire(visitor: string): Promise<GateGranted | GateDenied>;
}

/** The Phase 6A in-memory checks, behind the gate interface. */
export class LocalUsageGate implements UsageGate {
  readonly kind = "local" as const;
  private readonly modelLimiter: BoundedRateLimiter;
  private readonly dailyBudget: DailyBudget;

  constructor(parts: {
    modelLimiter: BoundedRateLimiter;
    dailyBudget: DailyBudget;
  }) {
    this.modelLimiter = parts.modelLimiter;
    this.dailyBudget = parts.dailyBudget;
  }

  async acquire(visitor: string): Promise<GateGranted | GateDenied> {
    const model = this.modelLimiter.check(visitor);
    if (!model.allowed) {
      return {
        ok: false,
        reason: "rate_limited",
        retryAfterSeconds: model.retryAfterSeconds,
      };
    }
    if (!this.dailyBudget.tryConsume()) {
      return { ok: false, reason: "quota", retryAfterSeconds: 0 };
    }
    // The in-flight lock is held by the handler for local gates.
    return { ok: true, release: () => undefined };
  }
}
