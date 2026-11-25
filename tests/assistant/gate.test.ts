import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  GATE_HARD_LIMITS,
  acquire,
  initSchema,
  parseAcquire,
  release,
} from "../../cloudflare/gate-core";
import type { AcquireRequest } from "../../cloudflare/gate-core";
import { createDurableGate } from "@/lib/assistant/server/gate-durable";
import { GATE_LOCK_MS } from "@/lib/assistant/server/runtime";
import { GATE_LIMITS, fakeGateNamespace, sqliteGateSql } from "./helpers";

const visitor = (n: number) => n.toString(16).padStart(16, "0");

function request(n: number, over: Partial<AcquireRequest> = {}) {
  return {
    visitor: visitor(n),
    perVisitorLimit: 6,
    windowMs: 60_000,
    dailyLimit: 100,
    lockMs: 30_000,
    ...over,
  } satisfies AcquireRequest;
}

function freshSql() {
  const db = new DatabaseSync(":memory:");
  const sql = sqliteGateSql(db);
  initSchema(sql);
  return { db, sql };
}

const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);

/* ---------- the gate core, on a real SQLite engine ---------- */

test("the daily budget is exact and shared by every visitor", () => {
  const { sql } = freshSql();
  let granted = 0;
  for (let i = 1; i <= 20; i += 1) {
    const result = acquire(sql, request(i, { dailyLimit: 5 }), T0, `t${i}`);
    if (result.ok) {
      granted += 1;
      release(sql, visitor(i), `t${i}`);
    }
  }
  assert.equal(granted, 5, "20 different visitors, only 5 model turns");

  const denied = acquire(sql, request(99, { dailyLimit: 5 }), T0, "x");
  assert.deepEqual(
    denied.ok ? null : denied.reason,
    "quota",
    "an unseen visitor is still refused",
  );
});

test("the daily budget rolls over at 00:00 UTC", () => {
  const { sql } = freshSql();
  const late = Date.UTC(2026, 10, 25, 23, 59, 30);
  assert.ok(acquire(sql, request(1, { dailyLimit: 1 }), late, "a").ok);
  const refused = acquire(sql, request(2, { dailyLimit: 1 }), late, "b");
  assert.equal(refused.ok, false);
  assert.ok(!refused.ok && refused.retryAfterSeconds <= 30);

  const next = Date.UTC(2026, 10, 26, 0, 0, 5);
  assert.ok(acquire(sql, request(2, { dailyLimit: 1 }), next, "c").ok);
});

test("one visitor is held to the per-minute limit, then recovers", () => {
  const { sql } = freshSql();
  let now = T0;
  for (let i = 0; i < 3; i += 1) {
    const r = acquire(sql, request(1, { perVisitorLimit: 3 }), now, `t${i}`);
    assert.ok(r.ok);
    release(sql, visitor(1), `t${i}`);
    now += 1_000;
  }
  const blocked = acquire(sql, request(1, { perVisitorLimit: 3 }), now, "no");
  assert.ok(!blocked.ok && blocked.reason === "rate_limited");
  assert.ok(!blocked.ok && blocked.retryAfterSeconds >= 1);

  assert.ok(
    acquire(sql, request(2, { perVisitorLimit: 3 }), now, "other").ok,
    "other visitors are unaffected",
  );
  assert.ok(
    acquire(sql, request(1, { perVisitorLimit: 3 }), T0 + 61_000, "later").ok,
    "the window passed",
  );
});

test("a visitor cannot start a second request while one is running", () => {
  const { sql } = freshSql();
  const first = acquire(sql, request(1), T0, "first");
  assert.ok(first.ok);
  const second = acquire(sql, request(1), T0 + 100, "second");
  assert.ok(!second.ok && second.reason === "busy");

  release(sql, visitor(1), "first");
  assert.ok(acquire(sql, request(1), T0 + 200, "third").ok);
});

test("a refused request does not spend the daily budget", () => {
  const { sql } = freshSql();
  assert.ok(acquire(sql, request(1, { dailyLimit: 2 }), T0, "a").ok);
  for (let i = 0; i < 10; i += 1) {
    const busy = acquire(sql, request(1, { dailyLimit: 2 }), T0 + i, "x");
    assert.ok(!busy.ok && busy.reason === "busy");
  }
  release(sql, visitor(1), "a");
  assert.ok(
    acquire(sql, request(2, { dailyLimit: 2 }), T0 + 50, "b").ok,
    "10 busy refusals used none of the budget",
  );
});

test("locks expire, and a stale token cannot free a newer lock", () => {
  const { sql } = freshSql();
  assert.ok(acquire(sql, request(1, { lockMs: 1_000 }), T0, "old").ok);
  const later = T0 + 1_500;
  assert.ok(acquire(sql, request(1, { lockMs: 1_000 }), later, "new").ok);

  release(sql, visitor(1), "old"); // late release from the first request
  const stillBusy = acquire(sql, request(1), later + 10, "x");
  assert.ok(!stillBusy.ok && stillBusy.reason === "busy");
});

test("rows expire, so storage stays small", () => {
  const { db, sql } = freshSql();
  for (let i = 1; i <= 50; i += 1) {
    const r = acquire(sql, request(i, { dailyLimit: 500 }), T0, `t${i}`);
    assert.ok(r.ok);
    release(sql, visitor(i), `t${i}`);
  }
  const count = () =>
    (db.prepare("SELECT COUNT(*) AS n FROM visitors").get() as { n: number }).n;
  assert.equal(count(), 50);

  acquire(sql, request(1000, { dailyLimit: 500 }), T0 + 120_000, "later");
  assert.equal(count(), 1, "everything older than the window was removed");
});

test("rows only exist for granted requests, so floods cannot grow the table", () => {
  const { db, sql } = freshSql();
  acquire(sql, request(1, { dailyLimit: 1 }), T0, "a");
  for (let i = 2; i <= 500; i += 1) {
    acquire(sql, request(i, { dailyLimit: 1 }), T0, `t${i}`);
  }
  const rows = (
    db.prepare("SELECT COUNT(*) AS n FROM visitors").get() as { n: number }
  ).n;
  assert.equal(rows, 1);
});

test("untrusted requests to the gate are validated and clamped", () => {
  assert.equal(parseAcquire(null), null);
  assert.equal(parseAcquire({}), null);
  assert.equal(parseAcquire({ ...request(1), visitor: "../../etc" }), null);
  assert.equal(parseAcquire({ ...request(1), dailyLimit: -5 }), null);
  assert.equal(parseAcquire({ ...request(1), dailyLimit: 1.5 }), null);
  assert.equal(parseAcquire({ ...request(1), dailyLimit: "9" }), null);

  const clamped = parseAcquire({
    ...request(1),
    dailyLimit: 1_000_000,
    perVisitorLimit: 1_000_000,
    windowMs: 10 ** 12,
    lockMs: 10 ** 12,
  });
  assert.ok(clamped);
  assert.equal(clamped.dailyLimit, GATE_HARD_LIMITS.dailyLimit);
  assert.equal(clamped.perVisitorLimit, GATE_HARD_LIMITS.perVisitorLimit);
  assert.equal(clamped.windowMs, GATE_HARD_LIMITS.windowMs);
  assert.equal(clamped.lockMs, GATE_HARD_LIMITS.lockMs);
});

test("SQL injection through the visitor key is impossible", () => {
  const { sql } = freshSql();
  assert.equal(
    parseAcquire({ ...request(1), visitor: "a'; DROP TABLE budget;--" }),
    null,
  );
  // Release ignores anything that is not a visitor key.
  release(sql, "x'; DROP TABLE visitors;--", "t");
  assert.ok(acquire(sql, request(1), T0, "ok").ok);
});

/* ---------- the Durable Object class and its client ---------- */

test("the Durable Object only accepts POST to known paths", async () => {
  const ns = fakeGateNamespace();
  const stub = ns.get(ns.idFromName("global"));
  const bad = await stub.fetch("https://assistant-gate/nope", {
    method: "POST",
    body: "{}",
  });
  assert.equal(bad.status, 404);
  const get = await stub.fetch("https://assistant-gate/acquire");
  assert.equal(get.status, 405);
  const junk = await stub.fetch("https://assistant-gate/acquire", {
    method: "POST",
    body: "not json",
  });
  assert.equal(junk.status, 400);
});

test("several isolates share one budget through the Durable Object", async () => {
  const ns = fakeGateNamespace();
  // Ten separate clients model ten Worker isolates with no shared memory.
  const isolates = Array.from({ length: 10 }, () =>
    createDurableGate(ns, { ...GATE_LIMITS, dailyLimit: 7 }),
  );
  const results = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      isolates[i % 10]!.acquire(visitor(i + 1)),
    ),
  );
  assert.equal(
    results.filter((r) => r.ok).length,
    7,
    "60 concurrent callers, exactly 7 model turns",
  );
});

test("the client fails closed on errors, timeouts and strange replies", async () => {
  const limits = { ...GATE_LIMITS };
  const cases: Record<string, (url: string) => Promise<Response>> = {
    "a thrown error": async () => {
      throw new Error("boom");
    },
    "an HTTP error": async () => new Response("no", { status: 500 }),
    "invalid JSON": async () => new Response("<html>"),
    "a reply that says ok but has no token": async () =>
      Response.json({ ok: true }),
    "an unknown reason": async () =>
      Response.json({ ok: false, reason: "sure", retryAfterSeconds: 1 }),
    "a reply with the wrong shape": async () => Response.json([1, 2, 3]),
  };
  for (const [name, failWith] of Object.entries(cases)) {
    const ns = fakeGateNamespace();
    ns.failWith = failWith;
    const result = await createDurableGate(ns, limits).acquire(visitor(1));
    assert.ok(!result.ok && result.reason === "unavailable", name);
  }

  const slow = fakeGateNamespace();
  slow.failWith = () => new Promise<Response>(() => undefined);
  const started = Date.now();
  const timedOut = await createDurableGate(slow, limits, {
    timeoutMs: 50,
  }).acquire(visitor(1));
  assert.ok(!timedOut.ok && timedOut.reason === "unavailable");
  assert.ok(Date.now() - started < 1_000, "gave up quickly");
});

test("release frees the lock once, and a failed release is not an error", async () => {
  const ns = fakeGateNamespace();
  const gate = createDurableGate(ns, GATE_LIMITS);
  const first = await gate.acquire(visitor(1));
  assert.ok(first.ok);
  const busy = await gate.acquire(visitor(1));
  assert.ok(!busy.ok && busy.reason === "busy");

  assert.ok(first.ok);
  await first.release();
  await first.release(); // a second call does nothing
  const releases = ns.requests.filter((r) => r.path === "/release");
  assert.equal(releases.length, 1);

  const again = await gate.acquire(visitor(1));
  assert.ok(again.ok);
  ns.failWith = async () => {
    throw new Error("network");
  };
  assert.ok(again.ok);
  await assert.doesNotReject(async () => again.release());
});

test("the lock outlives the provider timeout", () => {
  // A crashed request must free itself, but never while it could still run.
  assert.ok(GATE_LOCK_MS > 20_000);
});
