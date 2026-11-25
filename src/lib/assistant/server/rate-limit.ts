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

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function parseIpv4(text: string): number[] | null {
  const match = IPV4.exec(text);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every((n) => n <= 255) ? parts : null;
}

/**
 * Canonical network key for an address, or null when it is not an address.
 * IPv4 is used as is. IPv6 is cut to its /64, because one household or phone
 * gets a whole /64 and can rotate through it freely.
 */
export function normalizeIp(input: string | null | undefined): string | null {
  const text = (input ?? "").trim().toLowerCase();
  if (text.length < 2 || text.length > 45) return null;

  const v4 = parseIpv4(text);
  if (v4) return v4.join(".");
  if (!/^[0-9a-f:.]+$/.test(text) || !text.includes(":")) return null;

  let groupsText = text;
  // A dotted IPv4 tail ("::ffff:1.2.3.4") counts as two groups.
  const lastColon = text.lastIndexOf(":");
  const tail = text.slice(lastColon + 1);
  if (tail.includes(".")) {
    const embedded = parseIpv4(tail);
    if (!embedded) return null;
    const hi = ((embedded[0] ?? 0) << 8) | (embedded[1] ?? 0);
    const lo = ((embedded[2] ?? 0) << 8) | (embedded[3] ?? 0);
    groupsText = `${text.slice(0, lastColon + 1)}${hi.toString(16)}:${lo.toString(16)}`;
  } else if (text.includes(".")) {
    return null;
  }

  const halves = groupsText.split("::");
  if (halves.length > 2) return null;
  const split = (part: string) => (part === "" ? [] : part.split(":"));
  const head = split(halves[0] ?? "");
  const rest = halves.length === 2 ? split(halves[1] ?? "") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;

  const groups = [
    ...head,
    ...Array<string>(halves.length === 2 ? missing : 0).fill("0"),
    ...rest,
  ];
  if (groups.length !== 8) return null;
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;

  // IPv4-mapped (::ffff:a.b.c.d) is really an IPv4 client.
  const mapped = groups.slice(0, 5).every((g) => parseInt(g, 16) === 0);
  if (mapped && groups[5] === "ffff") {
    const hi = parseInt(groups[6] ?? "0", 16);
    const lo = parseInt(groups[7] ?? "0", 16);
    return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
  }
  return `${groups
    .slice(0, 4)
    .map((g) => g.padStart(4, "0"))
    .join(":")}::/64`;
}

export type VisitorKeyOptions = {
  /**
   * Trust the cf-connecting-ip header. Cloudflare's edge sets it and replaces
   * any value a client sends, but only when traffic really passes through
   * Cloudflare. Everywhere else it is just a client header, so callers must
   * pass false and every visitor shares one "unknown" bucket.
   * x-forwarded-for and x-real-ip are never used: a client can send either.
   */
  trustCloudflareHeader?: boolean;
};

/**
 * Stable anonymous key for a visitor. The raw address is hashed and never
 * stored or logged.
 */
export async function getVisitorKey(
  headers: Headers,
  options: VisitorKeyOptions = {},
): Promise<string> {
  const trust = options.trustCloudflareHeader ?? true;
  const source =
    (trust && normalizeIp(headers.get("cf-connecting-ip"))) || "unknown";

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return [...new Uint8Array(digest).slice(0, 8)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
