import assert from "node:assert/strict";
import test from "node:test";
import {
  BoundedRateLimiter,
  DailyBudget,
  InFlightGuard,
  getVisitorKey,
} from "@/lib/assistant/server/rate-limit";

test("limiter allows up to the limit, then blocks with retry-after", () => {
  let now = 1_000_000;
  const limiter = new BoundedRateLimiter({
    limit: 3,
    windowMs: 60_000,
    maxKeys: 10,
    now: () => now,
  });
  assert.ok(limiter.check("a").allowed);
  assert.ok(limiter.check("a").allowed);
  assert.ok(limiter.check("a").allowed);
  const blocked = limiter.check("a");
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
  assert.ok(limiter.check("b").allowed, "other visitors are unaffected");

  now += 60_001;
  assert.ok(limiter.check("a").allowed, "window expired");
});

test("limiter memory is bounded by maxKeys", () => {
  const limiter = new BoundedRateLimiter({
    limit: 1,
    windowMs: 60_000,
    maxKeys: 50,
  });
  for (let i = 0; i < 10_000; i += 1) limiter.check(`key-${i}`);
  assert.ok(limiter.size <= 50, `size was ${limiter.size}`);
});

test("limiter expires old entries", () => {
  let now = 0;
  const limiter = new BoundedRateLimiter({
    limit: 1,
    windowMs: 10_000,
    maxKeys: 1_000,
    now: () => now,
  });
  for (let i = 0; i < 200; i += 1) limiter.check(`k${i}`);
  assert.equal(limiter.size, 200);
  now += 20_000;
  limiter.check("fresh");
  assert.equal(limiter.size, 1, "expired entries were swept");
});

test("in-flight guard allows one request per key and releases once", () => {
  const guard = new InFlightGuard({ maxKeys: 10, maxHoldMs: 1_000 });
  const release = guard.acquire("v");
  assert.ok(release);
  assert.equal(guard.acquire("v"), null, "second request is refused");
  assert.ok(guard.acquire("other"), "other visitors are unaffected");
  release?.();
  release?.();
  assert.ok(guard.acquire("v"), "free again after release");
});

test("in-flight locks expire so a lost request cannot block forever", () => {
  let now = 0;
  const guard = new InFlightGuard({
    maxKeys: 10,
    maxHoldMs: 1_000,
    now: () => now,
  });
  const first = guard.acquire("v");
  assert.ok(first);
  now += 1_001;
  const second = guard.acquire("v");
  assert.ok(second, "expired lock was replaced");
  first?.(); // a late release of the old lock must not free the new one
  assert.equal(guard.acquire("v"), null);
});

test("in-flight guard is bounded and fails closed when full", () => {
  const guard = new InFlightGuard({ maxKeys: 3, maxHoldMs: 60_000 });
  assert.ok(guard.acquire("a"));
  assert.ok(guard.acquire("b"));
  assert.ok(guard.acquire("c"));
  assert.equal(guard.acquire("d"), null);
  assert.ok(guard.size <= 3);
});

test("daily budget rolls over at 00:00 UTC", () => {
  let now = Date.UTC(2026, 10, 25, 23, 59, 0);
  const budget = new DailyBudget(2, () => now);
  assert.ok(budget.tryConsume());
  assert.ok(budget.tryConsume());
  assert.equal(budget.tryConsume(), false);
  now = Date.UTC(2026, 10, 26, 0, 0, 1);
  assert.ok(budget.tryConsume());
});

test("visitor key is a stable hash, never the raw address", async () => {
  const a = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "203.0.113.7" }),
  );
  const b = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "203.0.113.7" }),
  );
  const c = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "203.0.113.8" }),
  );
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(!a.includes("203"));
  const junk = await getVisitorKey(
    new Headers({ "x-forwarded-for": "<script>" }),
  );
  const none = await getVisitorKey(new Headers());
  assert.equal(junk, none, "malformed addresses share the unknown bucket");
});
