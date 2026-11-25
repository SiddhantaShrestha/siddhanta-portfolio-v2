/**
 * Shared usage gate. This is the logic that runs inside one Durable Object.
 *
 * Why a Durable Object: it is a single instance with strong consistency, so
 * the daily budget, the per-visitor window and the in-flight lock are exact
 * across every Worker isolate and every Cloudflare location. Per-isolate
 * memory counters and the Rate Limiting binding are both approximate.
 *
 * This file has no imports and no Cloudflare types on purpose. It only needs
 * a synchronous `sql.exec`, which Durable Object SQLite storage provides, so
 * the same code runs in tests against a real SQLite engine.
 *
 * Every acquire runs without an `await`, so Durable Object input gates make
 * the read, check and write one atomic step.
 */

export type SqlValue = string | number | null;

export type GateSql = {
  exec(
    query: string,
    ...bindings: SqlValue[]
  ): { toArray(): Record<string, unknown>[] };
};

export type AcquireRequest = {
  /** Anonymous visitor key, 16 hex characters. Never a raw address. */
  visitor: string;
  perVisitorLimit: number;
  windowMs: number;
  dailyLimit: number;
  /** How long the in-flight lock lasts if release is never called. */
  lockMs: number;
};

export type DeniedReason = "busy" | "rate_limited" | "quota" | "unavailable";

export type AcquireResult =
  | { ok: true; token: string }
  | { ok: false; reason: DeniedReason; retryAfterSeconds: number };

/** Upper bounds, so a bad caller cannot configure the gate open. */
export const GATE_HARD_LIMITS = {
  dailyLimit: 500,
  perVisitorLimit: 30,
  windowMs: 3_600_000,
  lockMs: 120_000,
  maxVisitors: 2_000,
} as const;

const VISITOR_KEY = /^[0-9a-f]{16}$/;

export function initSchema(sql: GateSql): void {
  sql.exec(
    `CREATE TABLE IF NOT EXISTS visitors (
       key TEXT PRIMARY KEY,
       window_start INTEGER NOT NULL,
       count INTEGER NOT NULL,
       lock_token TEXT,
       lock_until INTEGER NOT NULL,
       expires_at INTEGER NOT NULL
     )`,
  );
  sql.exec(
    `CREATE TABLE IF NOT EXISTS budget (
       day TEXT PRIMARY KEY,
       used INTEGER NOT NULL
     )`,
  );
}

function positiveInt(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1) return null;
  return Math.min(value, max);
}

/** Validates untrusted JSON. Returns null for anything malformed. */
export function parseAcquire(input: unknown): AcquireRequest | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.visitor !== "string" || !VISITOR_KEY.test(raw.visitor)) {
    return null;
  }
  const perVisitorLimit = positiveInt(
    raw.perVisitorLimit,
    GATE_HARD_LIMITS.perVisitorLimit,
  );
  const windowMs = positiveInt(raw.windowMs, GATE_HARD_LIMITS.windowMs);
  const dailyLimit = positiveInt(raw.dailyLimit, GATE_HARD_LIMITS.dailyLimit);
  const lockMs = positiveInt(raw.lockMs, GATE_HARD_LIMITS.lockMs);
  if (!perVisitorLimit || !windowMs || !dailyLimit || !lockMs) return null;
  return {
    visitor: raw.visitor,
    perVisitorLimit,
    windowMs,
    dailyLimit,
    lockMs,
  };
}

function seconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000));
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function acquire(
  sql: GateSql,
  request: AcquireRequest,
  now: number,
  token: string,
): AcquireResult {
  const day = new Date(now).toISOString().slice(0, 10);

  // Expire old rows first, so the tables cannot grow without limit.
  sql.exec("DELETE FROM visitors WHERE expires_at <= ?", now);
  sql.exec("DELETE FROM budget WHERE day <> ?", day);

  const row = sql
    .exec(
      "SELECT window_start, count, lock_until FROM visitors WHERE key = ?",
      request.visitor,
    )
    .toArray()[0];

  if (row && num(row.lock_until) > now) {
    return {
      ok: false,
      reason: "busy",
      retryAfterSeconds: seconds(num(row.lock_until) - now),
    };
  }

  let windowStart = now;
  let count = 0;
  if (row && num(row.window_start) + request.windowMs > now) {
    windowStart = num(row.window_start);
    count = num(row.count);
  }
  if (count >= request.perVisitorLimit) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterSeconds: seconds(windowStart + request.windowMs - now),
    };
  }

  const used = num(
    sql.exec("SELECT used FROM budget WHERE day = ?", day).toArray()[0]?.used,
  );
  if (used >= request.dailyLimit) {
    const nextMidnight = Date.parse(`${day}T00:00:00.000Z`) + 86_400_000;
    return {
      ok: false,
      reason: "quota",
      retryAfterSeconds: seconds(nextMidnight - now),
    };
  }

  if (!row) {
    const total = num(
      sql.exec("SELECT COUNT(*) AS n FROM visitors").toArray()[0]?.n,
    );
    // Rows only exist for granted requests, so this is a safety net.
    if (total >= GATE_HARD_LIMITS.maxVisitors) {
      return { ok: false, reason: "unavailable", retryAfterSeconds: 30 };
    }
  }

  sql.exec(
    `INSERT INTO budget (day, used) VALUES (?, 1)
     ON CONFLICT(day) DO UPDATE SET used = used + 1`,
    day,
  );
  const lockUntil = now + request.lockMs;
  sql.exec(
    `INSERT INTO visitors (key, window_start, count, lock_token, lock_until, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       window_start = excluded.window_start,
       count = excluded.count,
       lock_token = excluded.lock_token,
       lock_until = excluded.lock_until,
       expires_at = excluded.expires_at`,
    request.visitor,
    windowStart,
    count + 1,
    token,
    lockUntil,
    Math.max(windowStart + request.windowMs, lockUntil),
  );

  return { ok: true, token };
}

/** Frees the visitor's lock. A stale token cannot free a newer lock. */
export function release(sql: GateSql, visitor: string, token: string): void {
  if (!VISITOR_KEY.test(visitor) || token.length === 0 || token.length > 64) {
    return;
  }
  // Only the lock is cleared. The row stays until its rate window ends
  // (expires_at is never earlier than that), then the next acquire sweeps it.
  sql.exec(
    `UPDATE visitors SET lock_until = 0, lock_token = NULL
     WHERE key = ? AND lock_token = ?`,
    visitor,
    token,
  );
}
