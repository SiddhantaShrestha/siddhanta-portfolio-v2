import assert from "node:assert/strict";
import test from "node:test";
import { isProductionMode, readConfig } from "@/lib/assistant/server/config";
import { handleAssistantRequest } from "@/lib/assistant/server/handler";
import {
  BoundedRateLimiter,
  getVisitorKey,
  normalizeIp,
} from "@/lib/assistant/server/rate-limit";
import {
  DEFAULT_DAILY_LIMIT,
  NO_CLOUDFLARE,
  edgeAllows,
  readDailyLimit,
  resolveRuntime,
} from "@/lib/assistant/server/runtime";
import type { RateLimitBindingLike } from "@/lib/assistant/server/runtime";
import {
  ORIGIN,
  ask,
  chatRequest,
  cloudflareRuntime,
  fakeGateNamespace,
  makeDeps,
  readEvents,
  scriptedProvider,
  textOf,
} from "./helpers";

const production = { isProduction: () => true } as const;

/** Deps that behave like one Worker isolate in production. */
function isolate(
  provider: ReturnType<typeof scriptedProvider>,
  namespace: ReturnType<typeof fakeGateNamespace>,
  limits: Parameters<typeof cloudflareRuntime>[1] = {},
) {
  return makeDeps(provider, {
    ...production,
    getRuntime: async () => cloudflareRuntime(namespace, limits),
  });
}

/* ---------- the model stays closed without the shared gate ---------- */

test("production without the shared gate never reaches the model", async () => {
  const provider = scriptedProvider(["should not run. "]);
  const deps = makeDeps(provider, {
    ...production,
    getRuntime: async () => ({ ...NO_CLOUDFLARE, cloudflare: true }),
  });
  const response = await handleAssistantRequest(
    chatRequest(ask("Do you know Rust?")),
    deps,
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "unavailable");
  assert.equal(provider.calls.length, 0);
});

test("a missing NODE_ENV counts as production, so the model gate fails closed", () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: "d".repeat(32),
    CLOUDFLARE_AI_API_TOKEN: "x",
  };
  assert.equal(isProductionMode(undefined), true);
  assert.equal(isProductionMode("production"), true);
  assert.equal(isProductionMode("development"), false);
  assert.equal(isProductionMode("test"), false);
  assert.equal(readConfig(env).status, "blocked");
  assert.equal(readConfig({ ...env, NODE_ENV: "" }).status, "blocked");
});

test("starters keep working in production with no gate and no key", async () => {
  const response = await handleAssistantRequest(
    chatRequest(ask("What are your main skills?", { starterId: "skills" })),
    makeDeps(null, { ...production, getRuntime: async () => NO_CLOUDFLARE }),
  );
  assert.equal(response.status, 200);
  assert.equal((await readEvents(response))[0]?.t, "meta");
});

test("with the shared gate, the model path works and the gate is released", async () => {
  const ns = fakeGateNamespace();
  const provider = scriptedProvider(["Hello there. "]);
  const response = await handleAssistantRequest(
    chatRequest(ask("Do you know Rust?")),
    isolate(provider, ns),
  );
  assert.equal(response.status, 200);
  assert.match(textOf(await readEvents(response)), /Hello there/);
  assert.deepEqual(
    ns.requests.map((r) => r.path),
    ["/acquire", "/release"],
  );
});

/* ---------- bypassing the in-memory counters does not help ---------- */

test("many isolates with empty memory counters still share one daily budget", async () => {
  const ns = fakeGateNamespace();
  const provider = scriptedProvider(["Fine. "]);
  // Each request gets brand-new in-memory limiters, the worst case for a
  // per-isolate counter. A different address each time avoids per-visitor
  // limits, so only the shared budget can stop them.
  const responses = await Promise.all(
    Array.from({ length: 40 }, (_, i) =>
      handleAssistantRequest(
        chatRequest(ask(`Question number ${i}`), { ip: `198.51.100.${i + 1}` }),
        isolate(provider, ns, { dailyLimit: 3 }),
      ),
    ),
  );
  const statuses = responses.map((r) => r.status);
  await Promise.all(responses.map((r) => r.text()));

  assert.equal(statuses.filter((s) => s === 200).length, 3);
  assert.equal(statuses.filter((s) => s === 429).length, 37);
  assert.equal(
    provider.calls.length,
    3,
    "the model was called exactly 3 times",
  );
});

test("the per-visitor limit holds across isolates", async () => {
  const ns = fakeGateNamespace();
  const provider = scriptedProvider(["Fine. "]);
  const statuses: number[] = [];
  for (let i = 0; i < 9; i += 1) {
    const response = await handleAssistantRequest(
      chatRequest(ask(`Question ${i}`), { ip: "203.0.113.9" }),
      isolate(provider, ns, { perVisitorLimit: 4 }),
    );
    statuses.push(response.status);
    await response.text();
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 429, 429, 429, 429, 429]);
});

test("simultaneous submissions are blocked even across isolates", async () => {
  const ns = fakeGateNamespace();
  let open!: () => void;
  const hold = new Promise<void>((resolve) => (open = resolve));
  const slow = scriptedProvider(["Done. "]);
  const originalStream = slow.stream.bind(slow);
  slow.stream = async function* (request) {
    await hold;
    yield* originalStream(request);
  };

  const first = await handleAssistantRequest(
    chatRequest(ask("First question")),
    isolate(slow, ns),
  );
  // A different isolate, so its local in-flight lock knows nothing.
  const second = await handleAssistantRequest(
    chatRequest(ask("Second question")),
    isolate(scriptedProvider(["No. "]), ns),
  );
  assert.equal(second.status, 409);

  open();
  await first.text();
  const third = await handleAssistantRequest(
    chatRequest(ask("Third question")),
    isolate(scriptedProvider(["Yes. "]), ns),
  );
  assert.equal(third.status, 200);
  await third.text();
});

test("a broken gate means no model call, never a free pass", async () => {
  const ns = fakeGateNamespace();
  ns.failWith = async () => {
    throw new Error("down");
  };
  const provider = scriptedProvider(["should not run. "]);
  const response = await handleAssistantRequest(
    chatRequest(ask("Do you know Rust?")),
    isolate(provider, ns),
  );
  assert.equal(response.status, 503);
  assert.equal(provider.calls.length, 0);
});

test("cancelling the request releases the shared lock", async () => {
  const ns = fakeGateNamespace();
  const provider = scriptedProvider(Array.from({ length: 50 }, () => "Word. "));
  const response = await handleAssistantRequest(
    chatRequest(ask("A long answer please")),
    isolate(provider, ns),
  );
  const reader = response.body!.getReader();
  await reader.read();
  await reader.cancel();

  const next = await handleAssistantRequest(
    chatRequest(ask("Another question")),
    isolate(scriptedProvider(["Ok. "]), ns),
  );
  assert.equal(next.status, 200, "the visitor is not stuck behind a lost lock");
  await next.text();
});

test("daily limit comes from config and is capped", () => {
  assert.equal(readDailyLimit(undefined), DEFAULT_DAILY_LIMIT);
  assert.equal(readDailyLimit({ ASSISTANT_DAILY_LIMIT: "25" }), 25);
  assert.equal(
    readDailyLimit({ ASSISTANT_DAILY_LIMIT: "0" }),
    DEFAULT_DAILY_LIMIT,
  );
  assert.equal(
    readDailyLimit({ ASSISTANT_DAILY_LIMIT: "-4" }),
    DEFAULT_DAILY_LIMIT,
  );
  assert.equal(
    readDailyLimit({ ASSISTANT_DAILY_LIMIT: "abc" }),
    DEFAULT_DAILY_LIMIT,
  );
  assert.equal(readDailyLimit({ ASSISTANT_DAILY_LIMIT: "99999" }), 500);
});

/* ---------- trusted request metadata only ---------- */

test("normalizeIp accepts real addresses and groups IPv6 by /64", () => {
  assert.equal(normalizeIp("203.0.113.7"), "203.0.113.7");
  assert.equal(normalizeIp(" 203.0.113.7 "), "203.0.113.7");
  assert.equal(normalizeIp("999.1.1.1"), null);
  assert.equal(normalizeIp("1.2.3"), null);
  assert.equal(normalizeIp("<script>"), null);
  assert.equal(normalizeIp(""), null);
  assert.equal(normalizeIp(null), null);
  assert.equal(normalizeIp("a".repeat(60)), null);
  assert.equal(normalizeIp(":::"), null);
  assert.equal(normalizeIp("1:2:3:4:5:6:7:8:9"), null);
  assert.equal(normalizeIp("1::2::3"), null);

  const a = normalizeIp("2001:db8:aaaa:bbbb:1:2:3:4");
  const b = normalizeIp("2001:DB8:aaaa:bbbb:ffff:ffff:ffff:ffff");
  assert.equal(a, b, "same /64, same visitor");
  assert.notEqual(a, normalizeIp("2001:db8:aaaa:cccc::1"));
  assert.equal(
    normalizeIp("2001:db8::1"),
    normalizeIp("2001:0db8:0000:0000:0000:0000:0000:0001"),
  );
  assert.equal(normalizeIp("::ffff:203.0.113.7"), "203.0.113.7");
});

test("an untrusted cf-connecting-ip header is ignored", async () => {
  const a = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "1.1.1.1" }),
    {
      trustCloudflareHeader: false,
    },
  );
  const b = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "2.2.2.2" }),
    {
      trustCloudflareHeader: false,
    },
  );
  const none = await getVisitorKey(new Headers(), {
    trustCloudflareHeader: false,
  });
  assert.equal(a, b);
  assert.equal(a, none);
});

test("x-forwarded-for and x-real-ip are never used", async () => {
  const base = await getVisitorKey(
    new Headers({ "cf-connecting-ip": "1.1.1.1" }),
  );
  const spoof = await getVisitorKey(
    new Headers({
      "cf-connecting-ip": "1.1.1.1",
      "x-forwarded-for": "9.9.9.9",
      "x-real-ip": "8.8.8.8",
    }),
  );
  assert.equal(base, spoof);

  const onlyForwarded = await getVisitorKey(
    new Headers({ "x-forwarded-for": "9.9.9.9", "x-real-ip": "8.8.8.8" }),
  );
  assert.equal(onlyForwarded, await getVisitorKey(new Headers()));
});

function limitedDeps(
  runtime: Awaited<ReturnType<typeof cloudflareRuntime>> | typeof NO_CLOUDFLARE,
) {
  return makeDeps(null, {
    ...production,
    getRuntime: async () => runtime,
    generalLimiter: new BoundedRateLimiter({
      limit: 2,
      windowMs: 60_000,
      maxKeys: 100,
    }),
  });
}

async function starter(
  deps: ReturnType<typeof limitedDeps>,
  ip: string,
  headers: Record<string, string> = {},
) {
  const response = await handleAssistantRequest(
    new Request(`${ORIGIN}/api/assistant`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        ...(ip ? { "cf-connecting-ip": ip } : {}),
        ...headers,
      },
      body: JSON.stringify(
        ask("What are your main skills?", { starterId: "skills" }),
      ),
    }),
    deps,
  );
  // Read the body so the in-flight lock is released before the next call.
  await response.text();
  return response.status;
}

test("in production off Cloudflare, rotating the header does not dodge limits", async () => {
  const deps = limitedDeps(NO_CLOUDFLARE);
  const statuses = [];
  for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"]) {
    statuses.push(await starter(deps, ip));
  }
  assert.deepEqual(statuses, [200, 200, 429, 429]);
});

test("on Cloudflare, addresses are separate visitors", async () => {
  const deps = limitedDeps(cloudflareRuntime(fakeGateNamespace()));
  const statuses = [];
  for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"]) {
    statuses.push(await starter(deps, ip));
  }
  assert.deepEqual(statuses, [200, 200, 200, 200]);
});

test("on Cloudflare, forwarded headers cannot create new visitors", async () => {
  const deps = limitedDeps(cloudflareRuntime(fakeGateNamespace()));
  const statuses = [];
  for (let i = 0; i < 4; i += 1) {
    statuses.push(
      await starter(deps, "5.5.5.5", {
        "x-forwarded-for": `10.0.0.${i}`,
        "x-real-ip": `10.1.0.${i}`,
      }),
    );
  }
  assert.deepEqual(statuses, [200, 200, 429, 429]);
});

test("a request with no Cloudflare address shares one bucket", async () => {
  const deps = limitedDeps(cloudflareRuntime(fakeGateNamespace()));
  const statuses = [];
  for (let i = 0; i < 4; i += 1) {
    statuses.push(
      await starter(deps, "", { "x-forwarded-for": `10.0.0.${i}` }),
    );
  }
  assert.deepEqual(statuses, [200, 200, 429, 429]);
});

/* ---------- edge pre-filter ---------- */

function edge(behavior: "allow" | "deny" | "throw") {
  const calls: string[] = [];
  const binding: RateLimitBindingLike & { calls: string[] } = {
    calls,
    async limit({ key }) {
      calls.push(key);
      if (behavior === "throw") throw new Error("binding down");
      return { success: behavior === "allow" };
    },
  };
  return binding;
}

test("the edge limiter blocks before the gate or the model is touched", async () => {
  const ns = fakeGateNamespace();
  const provider = scriptedProvider(["no. "]);
  const binding = edge("deny");
  const response = await handleAssistantRequest(
    chatRequest(ask("Do you know Rust?")),
    makeDeps(provider, {
      ...production,
      getRuntime: async () => cloudflareRuntime(ns, {}, { edgeLimit: binding }),
    }),
  );
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) >= 1);
  assert.equal(ns.requests.length, 0);
  assert.equal(provider.calls.length, 0);
  assert.equal(binding.calls.length, 1);
  assert.ok(
    /^[0-9a-f]{16}$/.test(binding.calls[0]!),
    "key is the hashed visitor",
  );
});

test("an edge limiter outage does not lock out visitors", async () => {
  assert.equal(await edgeAllows(edge("throw"), "k"), true);
  assert.equal(await edgeAllows(edge("allow"), "k"), true);
  assert.equal(await edgeAllows(edge("deny"), "k"), false);
  assert.equal(await edgeAllows(null, "k"), true);
});

/* ---------- runtime lookup ---------- */

test("bindings are found through the OpenNext context and typed safely", async () => {
  const symbol = Symbol.for("__cloudflare-context__");
  const holder = globalThis as Record<symbol, unknown>;
  const ns = fakeGateNamespace();
  holder[symbol] = {
    env: {
      ASSISTANT_GATE: ns,
      ASSISTANT_EDGE_LIMIT: edge("allow"),
      ASSISTANT_DAILY_LIMIT: "2",
      CLOUDFLARE_AI_API_TOKEN: "secret-value",
      NOT_A_STRING: { nested: true },
    },
  };
  try {
    const runtime = await resolveRuntime();
    assert.equal(runtime.cloudflare, true);
    assert.equal(runtime.gate?.kind, "shared");
    assert.ok(runtime.edgeLimit);
    assert.equal(runtime.env?.ASSISTANT_DAILY_LIMIT, "2");
    assert.equal(
      runtime.env?.NOT_A_STRING,
      undefined,
      "only strings are copied",
    );

    // The daily limit from env reaches the gate.
    const ok = [];
    for (let i = 1; i <= 4; i += 1) {
      const grant = await runtime.gate!.acquire(
        i.toString(16).padStart(16, "0"),
      );
      ok.push(grant.ok);
    }
    assert.deepEqual(ok, [true, true, false, false]);
  } finally {
    delete holder[symbol];
  }
});

test("a binding of the wrong type is ignored, not trusted", async () => {
  const symbol = Symbol.for("__cloudflare-context__");
  const holder = globalThis as Record<symbol, unknown>;
  holder[symbol] = {
    env: { ASSISTANT_GATE: "oops", ASSISTANT_EDGE_LIMIT: 42 },
  };
  try {
    const runtime = await resolveRuntime();
    assert.equal(runtime.cloudflare, true);
    assert.equal(runtime.gate, null);
    assert.equal(runtime.edgeLimit, null);
  } finally {
    delete holder[symbol];
  }
});

test("outside Cloudflare there are no bindings", async () => {
  const runtime = await resolveRuntime();
  assert.equal(runtime.cloudflare, false);
  assert.equal(runtime.gate, null);
});

/* ---------- origin check behind an adapter ---------- */

test("the origin may match the Host header when request.url is rewritten", async () => {
  const deps = makeDeps(null, { getRuntime: async () => NO_CLOUDFLARE });
  const post = (origin: string, host: string) =>
    handleAssistantRequest(
      new Request(`${ORIGIN}/api/assistant`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          host,
          "cf-connecting-ip": "203.0.113.7",
        },
        body: JSON.stringify(
          ask("What are your main skills?", { starterId: "skills" }),
        ),
      }),
      deps,
    );

  const ok = await post("https://portfolio.example", "portfolio.example");
  assert.equal(ok.status, 200);
  await ok.text();

  const cross = await post("https://evil.example", "portfolio.example");
  assert.equal(cross.status, 403, "another site cannot change the Host header");

  const nullOrigin = await post("null", "portfolio.example");
  assert.equal(nullOrigin.status, 403);
});
