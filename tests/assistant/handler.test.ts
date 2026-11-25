import assert from "node:assert/strict";
import test from "node:test";
import { readConfig } from "@/lib/assistant/server/config";
import { handleAssistantRequest } from "@/lib/assistant/server/handler";
import {
  BoundedRateLimiter,
  DailyBudget,
} from "@/lib/assistant/server/rate-limit";
import { ProviderError } from "@/lib/assistant/server/provider";
import {
  ask,
  chatRequest,
  makeDeps,
  readEvents,
  scriptedProvider,
  sourcesOf,
  textOf,
} from "./helpers";

/* ---------- starters work without a key or quota ---------- */

test("starter questions answer with no provider and no API key", async () => {
  const deps = makeDeps(null);
  const response = await handleAssistantRequest(
    chatRequest(ask("What are your main skills?", { starterId: "skills" })),
    deps,
  );
  assert.equal(response.status, 200);
  const events = await readEvents(response);
  assert.deepEqual(events[0], { t: "meta", mode: "deterministic" });
  assert.match(textOf(events), /Technologies verified/);
  assert.equal(events.at(-1)?.t, "done");
});

test("starter questions still work when the AI quota is exhausted", async () => {
  const provider = scriptedProvider(["should not run. "]);
  const deps = makeDeps(provider, { dailyBudget: new DailyBudget(0) });

  const model = await handleAssistantRequest(
    chatRequest(ask("Tell me about yourself")),
    deps,
  );
  assert.equal(model.status, 429);
  assert.equal((await model.json()).code, "quota");

  const starter = await handleAssistantRequest(
    chatRequest(ask("How does CiteDocs work?", { starterId: "citedocs" }), {
      ip: "203.0.113.50",
    }),
    deps,
  );
  assert.equal(starter.status, 200);
  assert.match(textOf(await readEvents(starter)), /36 of 41/);
  assert.equal(provider.calls.length, 0, "starters never reach the model");
});

test("typing a starter question exactly is also answered without the model", async () => {
  const provider = scriptedProvider(["no"]);
  const response = await handleAssistantRequest(
    chatRequest(ask("What did you build at Recruit Nepal?")),
    makeDeps(provider),
  );
  const events = await readEvents(response);
  assert.deepEqual(events[0], { t: "meta", mode: "deterministic" });
  assert.equal(provider.calls.length, 0);
});

test("a free-form question with no key is unavailable, not a crash", async () => {
  const response = await handleAssistantRequest(
    chatRequest(ask("Do you know Rust?")),
    makeDeps(null),
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "unavailable");
  assert.match(body.message, /suggested questions still work/);
});

/* ---------- request gates ---------- */

test("cross-origin and origin-less requests are refused", async () => {
  const deps = makeDeps(scriptedProvider(["x"]));
  const evil = await handleAssistantRequest(
    chatRequest(ask("hi"), { origin: "https://evil.test" }),
    deps,
  );
  assert.equal(evil.status, 403);

  const none = await handleAssistantRequest(
    chatRequest(ask("hi"), { origin: null }),
    deps,
  );
  assert.equal(none.status, 403);

  const sameSite = await handleAssistantRequest(
    chatRequest(ask("hi"), {
      origin: null,
      headers: { "sec-fetch-site": "same-origin" },
    }),
    makeDeps(scriptedProvider(["Hello there. "])),
  );
  assert.equal(sameSite.status, 200);
});

test("only JSON requests are accepted", async () => {
  const response = await handleAssistantRequest(
    chatRequest(null, { contentType: "text/plain", raw: "hello" }),
    makeDeps(scriptedProvider(["x"])),
  );
  assert.equal(response.status, 400);
});

test("oversize bodies return 413 before anything runs", async () => {
  const provider = scriptedProvider(["x"]);
  const big = JSON.stringify({
    messages: [{ role: "user", content: "a".repeat(20_000) }],
  });
  const response = await handleAssistantRequest(
    chatRequest(null, { raw: big }),
    makeDeps(provider),
  );
  assert.equal(response.status, 413);
  assert.equal(provider.calls.length, 0);
});

test("error responses never carry credentials or upstream detail", async () => {
  const deps = makeDeps(
    scriptedProvider({
      error: new ProviderError("quota", "token abc leaked", 429),
    }),
  );
  const response = await handleAssistantRequest(
    chatRequest(ask("Hello?")),
    deps,
  );
  const text = await response.text();
  assert.ok(!text.includes("abc leaked"));
  assert.ok(!text.includes("test-token"));
  assert.ok(!text.includes("Bearer"));
});

/* ---------- limits ---------- */

test("per-visitor model limit returns 429 with Retry-After", async () => {
  const deps = makeDeps(scriptedProvider(["Hi there. "]), {
    modelLimiter: new BoundedRateLimiter({
      limit: 2,
      windowMs: 60_000,
      maxKeys: 10,
    }),
  });
  for (let i = 0; i < 2; i += 1) {
    const ok = await handleAssistantRequest(
      chatRequest(ask(`Question ${i}`)),
      deps,
    );
    assert.equal(ok.status, 200);
    await ok.text();
  }
  const limited = await handleAssistantRequest(
    chatRequest(ask("One more")),
    deps,
  );
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) >= 1);
});

test("simultaneous submissions from one visitor are refused", async () => {
  // A model that stays open until we release it.
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const slow = scriptedProvider(["unused"]);
  slow.stream = async function* () {
    await gate;
    yield "Done now. ";
  };
  const deps = makeDeps(slow);

  const first = await handleAssistantRequest(
    chatRequest(ask("First question")),
    deps,
  );
  assert.equal(first.status, 200);
  // The stream has not been read yet, so the first request still holds the lock.
  const reader = first.body?.getReader();
  const pending = reader?.read();

  const second = await handleAssistantRequest(
    chatRequest(ask("Second question")),
    deps,
  );
  assert.equal(second.status, 409);
  assert.equal((await second.json()).code, "busy");

  const other = await handleAssistantRequest(
    chatRequest(ask("Different visitor"), { ip: "198.51.100.9" }),
    deps,
  );
  assert.equal(other.status, 200);
  await other.body?.cancel();

  release();
  await pending;
  while (!(await reader?.read())?.done) {
    /* drain */
  }

  const after = await handleAssistantRequest(
    chatRequest(ask("Third question")),
    deps,
  );
  assert.equal(after.status, 200, "lock was released when the stream ended");
  await after.body?.cancel();
});

test("cancelling the response aborts the model and frees the visitor", async () => {
  let seen: AbortSignal | null = null;
  const provider = scriptedProvider(["unused"]);
  provider.stream = async function* (request) {
    seen = request.signal;
    yield "First sentence. ";
    await new Promise<void>((resolve) => {
      if (request.signal.aborted) resolve();
      else
        request.signal.addEventListener("abort", () => resolve(), {
          once: true,
        });
    });
  };
  const deps = makeDeps(provider);
  const response = await handleAssistantRequest(
    chatRequest(ask("Hello there")),
    deps,
  );
  const reader = response.body?.getReader();
  await reader?.read(); // meta
  await reader?.read(); // first sentence
  await reader?.cancel();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(
    (seen as AbortSignal | null)?.aborted,
    true,
    "model signal was aborted",
  );

  const next = await handleAssistantRequest(
    chatRequest(ask("Again please")),
    deps,
  );
  assert.equal(next.status, 200, "visitor is not stuck as busy");
  await next.body?.cancel();
});

/* ---------- upstream failures ---------- */

test("upstream failures become a clean error event, after any partial text", async () => {
  const provider = scriptedProvider(["x"]);
  provider.stream = async function* () {
    yield "Partial answer here. ";
    throw new ProviderError("upstream", "boom");
  };
  const response = await handleAssistantRequest(
    chatRequest(ask("Hello?")),
    makeDeps(provider),
  );
  const events = await readEvents(response);
  assert.equal(textOf(events), "Partial answer here. ");
  const last = events.at(-1);
  assert.equal(last?.t, "error");
  assert.ok(last?.t === "error" && last.code === "upstream");
});

test("a model that returns nothing is reported, not shown as an empty answer", async () => {
  const response = await handleAssistantRequest(
    chatRequest(ask("Hello?")),
    makeDeps(scriptedProvider(["[[project:citedocs]]"])),
  );
  const events = await readEvents(response);
  assert.equal(events.at(-1)?.t, "error");
  assert.equal(sourcesOf(events).length, 0);
});

test("long answers are cut at a sentence boundary under the server cap", async () => {
  const sentence =
    "CiteDocs answers from passages the signed-in role may read. ";
  const response = await handleAssistantRequest(
    chatRequest(ask("Tell me everything")),
    makeDeps(scriptedProvider(Array.from({ length: 80 }, () => sentence))),
  );
  const events = await readEvents(response);
  assert.ok(textOf(events).length <= 1800);
  assert.equal(events.at(-1)?.t, "done");
});

/* ---------- production gate ---------- */

test("the model path fails closed in production until gates are confirmed", () => {
  const base = {
    CLOUDFLARE_ACCOUNT_ID: "b".repeat(32),
    CLOUDFLARE_AI_API_TOKEN: "x",
  };
  assert.equal(
    readConfig({ ...base, NODE_ENV: "production" }).status,
    "blocked",
  );
  assert.equal(
    readConfig({
      ...base,
      NODE_ENV: "production",
      ASSISTANT_PRODUCTION_GATES_CONFIRMED: "true",
    }).status,
    "ready",
  );
  assert.equal(
    readConfig({ ...base, NODE_ENV: "development" }).status,
    "ready",
  );
  assert.equal(readConfig({ NODE_ENV: "development" }).status, "unconfigured");
  assert.equal(
    readConfig({
      ...base,
      CLOUDFLARE_ACCOUNT_ID: "not-an-id",
      NODE_ENV: "development",
    }).status,
    "unconfigured",
  );
});

test("config rejects model ids that are not Workers AI model names", () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: "c".repeat(32),
    CLOUDFLARE_AI_API_TOKEN: "x",
    NODE_ENV: "development",
  };
  const bad = readConfig({
    ...env,
    ASSISTANT_MODEL: "https://evil.test/model",
  });
  assert.ok(
    bad.status === "ready" &&
      bad.config.model === "@cf/google/gemma-4-26b-a4b-it",
  );
  const good = readConfig({
    ...env,
    ASSISTANT_MODEL: "@cf/zai-org/glm-4.7-flash",
  });
  assert.ok(
    good.status === "ready" &&
      good.config.model === "@cf/zai-org/glm-4.7-flash",
  );
});
