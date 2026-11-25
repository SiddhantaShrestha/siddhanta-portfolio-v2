import "server-only";

import { createDurableGate } from "@/lib/assistant/server/gate-durable";
import type {
  DurableObjectNamespaceLike,
  SharedGateLimits,
} from "@/lib/assistant/server/gate-durable";
import type { UsageGate } from "@/lib/assistant/server/gate";

/**
 * Where the assistant finds Cloudflare bindings. It works with either adapter
 * and adds no dependency:
 *
 * - OpenNext keeps the request context on a well-known global symbol.
 * - vinext (and any plain Worker) exposes `env` from "cloudflare:workers".
 *
 * Under `next dev` or `next start` on Node, neither exists. The result is
 * "not Cloudflare", the shared gate is missing, and the production model path
 * stays closed.
 */

export type RateLimitBindingLike = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export type RuntimeContext = {
  /** True only when real Cloudflare bindings were found. */
  cloudflare: boolean;
  /** The shared Durable Object gate, or null when it is not bound. */
  gate: UsageGate | null;
  /** Cheap per-location pre-filter, or null when it is not bound. */
  edgeLimit: RateLimitBindingLike | null;
  /** String vars and secrets from the Worker env. Never logged. */
  env: Record<string, string> | undefined;
};

export const NO_CLOUDFLARE: RuntimeContext = {
  cloudflare: false,
  gate: null,
  edgeLimit: null,
  env: undefined,
};

const OPENNEXT_CONTEXT = Symbol.for("__cloudflare-context__");
const WORKERS_MODULE = "cloudflare:workers";

type Bindings = Record<string, unknown>;

function isRecord(value: unknown): value is Bindings {
  return typeof value === "object" && value !== null;
}

async function findBindings(): Promise<Bindings | null> {
  const context = (globalThis as Record<symbol, unknown>)[OPENNEXT_CONTEXT];
  if (isRecord(context) && isRecord(context.env)) return context.env;

  try {
    // The specifier is a variable and the bundler hints stop Next from trying
    // to resolve it, so Node builds never see this module.
    const mod: unknown = await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ WORKERS_MODULE
    );
    if (isRecord(mod) && isRecord(mod.env)) return mod.env;
  } catch {
    // Not running on Workers.
  }
  return null;
}

function asNamespace(value: unknown): DurableObjectNamespaceLike | null {
  return isRecord(value) &&
    typeof value.idFromName === "function" &&
    typeof value.get === "function"
    ? (value as unknown as DurableObjectNamespaceLike)
    : null;
}

function asRateLimit(value: unknown): RateLimitBindingLike | null {
  return isRecord(value) && typeof value.limit === "function"
    ? (value as unknown as RateLimitBindingLike)
    : null;
}

function stringVars(bindings: Bindings): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(bindings)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export const DEFAULT_DAILY_LIMIT = 100;
const MAX_DAILY_LIMIT = 500;

/**
 * Model turns allowed per UTC day. Default 100: at most about 80 neurons per
 * turn on the default model, so 100 turns stay under the 10,000 neuron free
 * allocation with room to spare.
 */
export function readDailyLimit(
  env: Record<string, string> | undefined,
): number {
  const parsed = Number.parseInt(env?.ASSISTANT_DAILY_LIMIT ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_DAILY_LIMIT;
  return Math.min(parsed, MAX_DAILY_LIMIT);
}

export const PER_VISITOR_MODEL_LIMIT = 6;
export const PER_VISITOR_WINDOW_MS = 60_000;
/** Longer than the provider timeout, so a crashed request frees itself. */
export const GATE_LOCK_MS = 30_000;

export function sharedGateLimits(
  env: Record<string, string> | undefined,
): SharedGateLimits {
  return {
    perVisitorLimit: PER_VISITOR_MODEL_LIMIT,
    windowMs: PER_VISITOR_WINDOW_MS,
    dailyLimit: readDailyLimit(env),
    lockMs: GATE_LOCK_MS,
  };
}

export async function resolveRuntime(): Promise<RuntimeContext> {
  const bindings = await findBindings();
  if (!bindings) return NO_CLOUDFLARE;

  const env = stringVars(bindings);
  const namespace = asNamespace(bindings.ASSISTANT_GATE);
  return {
    cloudflare: true,
    gate: namespace
      ? createDurableGate(namespace, sharedGateLimits(env))
      : null,
    edgeLimit: asRateLimit(bindings.ASSISTANT_EDGE_LIMIT),
    env,
  };
}

/**
 * Per-location pre-filter. It is approximate by design, so it only ever
 * blocks. A failure of the binding is not allowed to block real visitors,
 * because the strict checks happen later in the shared gate.
 */
export async function edgeAllows(
  binding: RateLimitBindingLike | null,
  key: string,
): Promise<boolean> {
  if (!binding) return true;
  try {
    return (await binding.limit({ key })).success;
  } catch {
    return true;
  }
}
