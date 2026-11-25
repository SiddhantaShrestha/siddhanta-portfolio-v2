import "server-only";

/**
 * In-memory guards for local development and as a soft first layer.
 *
 * These are per process (per isolate on Workers), so they are NOT a public
 * production limit. Production needs the gates in docs/phase-6a-assistant.md.
 * Every structure here is bounded and expires entries, so a flood of unique
 * keys cannot grow memory without limit.
 */

type Clock = () => number;

export type RateDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type Window = { count: number; resetAt: number };

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys: number;
  now?: Clock;
};

/** Fixed-window counter per key, with expiry and a hard key bound. */
export class BoundedRateLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly now: Clock;
  private readonly options: RateLimiterOptions;
  private lastSweep = 0;

  constructor(options: RateLimiterOptions) {
    this.options = options;
    this.now = options.now ?? Date.now;
  }

  check(key: string): RateDecision {
    const now = this.now();
    this.sweep(now);

    let entry = this.windows.get(key);
    if (!entry || entry.resetAt <= now) {
      this.windows.delete(key);
      this.makeRoom();
      entry = { count: 0, resetAt: now + this.options.windowMs };
      this.windows.set(key, entry);
    }

    if (entry.count >= this.options.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  get size(): number {
    return this.windows.size;
  }

  private sweep(now: number): void {
    // Sweeping is O(n), so do it at most about once per second.
    if (now - this.lastSweep < 1000) return;
    this.lastSweep = now;
    for (const [key, entry] of this.windows) {
      if (entry.resetAt <= now) this.windows.delete(key);
    }
  }

  private makeRoom(): void {
    while (this.windows.size >= this.options.maxKeys) {
      const oldest = this.windows.keys().next();
      if (oldest.done) return;
      this.windows.delete(oldest.value);
    }
  }
}

/** Allows one active request per key. Locks expire so a crash cannot stick. */
export class InFlightGuard {
  private readonly locks = new Map<string, number>();
  private readonly now: Clock;
  private readonly options: {
    maxKeys: number;
    /** A lock older than this is treated as released. */
    maxHoldMs: number;
    now?: Clock;
  };

  constructor(options: { maxKeys: number; maxHoldMs: number; now?: Clock }) {
    this.options = options;
    this.now = options.now ?? Date.now;
  }

  /** Returns a release function, or null when the key already has a request. */
  acquire(key: string): (() => void) | null {
    const now = this.now();
    this.sweep(now);

    const existing = this.locks.get(key);
    if (existing !== undefined && existing > now) return null;
    // Fail closed when the table is full of live locks.
    if (existing === undefined && this.locks.size >= this.options.maxKeys) {
      return null;
    }

    const expiresAt = now + this.options.maxHoldMs;
    this.locks.set(key, expiresAt);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      // Do not delete a newer lock that replaced an expired one.
      if (this.locks.get(key) === expiresAt) this.locks.delete(key);
    };
  }

  get size(): number {
    return this.locks.size;
  }

  private sweep(now: number): void {
    for (const [key, expiresAt] of this.locks) {
      if (expiresAt <= now) this.locks.delete(key);
    }
  }
}

/** Soft cap on model requests per UTC day. Rolls over at 00:00 UTC. */
export class DailyBudget {
  private day = "";
  private used = 0;
  private readonly now: Clock;
  private readonly limit: number;

  constructor(limit: number, now?: Clock) {
    this.limit = limit;
    this.now = now ?? Date.now;
  }

  tryConsume(): boolean {
    const today = new Date(this.now()).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.used = 0;
    }
    if (this.used >= this.limit) return false;
    this.used += 1;
    return true;
  }
}

const IP_LIKE = /^[0-9a-f:.]{3,45}$/i;

/**
 * Stable anonymous key for a visitor. Prefers the Cloudflare header, which
 * Cloudflare sets itself. Other forwarded headers can be spoofed when the app
 * is reachable without a trusted proxy, which is a documented limitation.
 * The raw address is hashed and never stored or logged.
 */
export async function getVisitorKey(headers: Headers): Promise<string> {
  const candidate =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    "";
  const ip = candidate.trim();
  const source = IP_LIKE.test(ip) ? ip : "unknown";

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return [...new Uint8Array(digest).slice(0, 8)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
