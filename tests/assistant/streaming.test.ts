import assert from "node:assert/strict";
import test from "node:test";
import { MarkerFilter } from "@/lib/assistant/server/markers";
import { SentenceBuffer } from "@/lib/assistant/server/output-guard";
import { ProviderError } from "@/lib/assistant/server/provider";
import { SseParser } from "@/lib/assistant/server/sse";
import { getSourceCatalog } from "@/lib/assistant/server/sources";
import { createWorkersAiProvider } from "@/lib/assistant/server/workers-ai";
import { FAKE_CONFIG, sseData, sseResponse } from "./helpers";

async function collect(gen: AsyncGenerator<string, void, void>) {
  let out = "";
  for await (const piece of gen) out += piece;
  return out;
}

function providerWith(fetchImpl: typeof fetch) {
  return createWorkersAiProvider(FAKE_CONFIG, fetchImpl);
}

const request = () => ({
  messages: [{ role: "user" as const, content: "hi" }],
  maxOutputTokens: 100,
  signal: new AbortController().signal,
});

/* ---------- SSE parser ---------- */

test("SSE parser handles a payload split at every byte", () => {
  const payload = `data: {"a":"héllo"}\n\ndata: [DONE]\n\n`;
  const bytes = new TextEncoder().encode(payload);
  const parser = new SseParser();
  const events: string[] = [];
  for (const byte of bytes)
    events.push(...parser.pushBytes(new Uint8Array([byte])));
  events.push(...parser.end());
  assert.deepEqual(events, ['{"a":"héllo"}', "[DONE]"]);
});

test("SSE parser handles CRLF, CR, comments and multi-line data", () => {
  const parser = new SseParser();
  const events = [
    ...parser.push(": keep-alive\r\ndata: one\r\n\r\n"),
    ...parser.push("data: two\rdata: three\r\r"),
    ...parser.push("data: four"),
    ...parser.end(),
  ];
  assert.deepEqual(events, ["one", "two\nthree", "four"]);
});

test("SSE parser waits when a CR and LF are split across chunks", () => {
  const parser = new SseParser();
  const events = [...parser.push("data: x\r"), ...parser.push("\n\r\n")];
  assert.deepEqual(events, ["x"]);
});

/* ---------- marker filter ---------- */

function filterAll(chunks: string[]) {
  const filter = new MarkerFilter(getSourceCatalog());
  let text = "";
  for (const chunk of chunks) text += filter.push(chunk);
  text += filter.flush();
  return { text, sources: filter.sources() };
}

test("valid markers become allowlisted source links", () => {
  const { text, sources } = filterAll([
    "See the case study. [[project:citedocs]]",
  ]);
  assert.equal(text, "See the case study. ");
  assert.deepEqual(sources, [
    { label: "CiteDocs", href: "/projects/citedocs" },
  ]);
});

test("a marker split across chunks is held, then resolved", () => {
  const whole = "Done. [[project:citedocs]] Next.";
  for (let cut = 1; cut < whole.length; cut += 1) {
    const { text, sources } = filterAll([
      whole.slice(0, cut),
      whole.slice(cut),
    ]);
    assert.equal(text, "Done.  Next.", `cut at ${cut}`);
    assert.equal(sources.length, 1, `cut at ${cut}`);
  }
});

test("invalid, unknown and malformed markers are stripped, never linked", () => {
  const { text, sources } = filterAll([
    "A [[project:does-not-exist]] B [[page:https://evil.test]] C [[project:citedocs/../../x]] D [[javascript:alert(1)]] E",
  ]);
  assert.equal(text, "A  B  C  D  E");
  assert.deepEqual(sources, []);
});

test("an unfinished marker at the end of the stream is dropped", () => {
  const { text, sources } = filterAll(["The answer. [[project:cite"]);
  assert.equal(text, "The answer. ");
  assert.deepEqual(sources, []);
});

test("a lone [[ with no end does not swallow the rest forever", () => {
  const long = "x".repeat(200);
  const { text } = filterAll([`before [[ ${long} after`]);
  assert.ok(text.startsWith("before "));
  assert.ok(text.includes("after"));
});

test("duplicate markers produce one link and the count is capped", () => {
  const markers = [
    "[[project:citedocs]]",
    "[[project:citedocs]]",
    "[[project:recruit-nepal]]",
    "[[project:recipenest]]",
    "[[project:youtube-chatbot]]",
    "[[project:job-post-automation]]",
  ].join(" ");
  const { sources } = filterAll([markers]);
  assert.equal(sources.length, 4);
});

/* ---------- sentence buffer ---------- */

test("sentences are released whole and decimals do not split", () => {
  const buffer = new SentenceBuffer();
  const out = [
    ...buffer.push("It scored 87.8 percent. The next"),
    ...buffer.push(" sentence is here. Tail"),
  ];
  assert.deepEqual(out, [
    "It scored 87.8 percent. ",
    "The next sentence is here. ",
  ]);
  assert.equal(buffer.flush(), "Tail");
});

/* ---------- Workers AI provider ---------- */

test("provider joins deltas from SSE split mid-event", async () => {
  const body = `${sseData("Hel")}${sseData("lo")}data: [DONE]\n\n`;
  const provider = providerWith(async () =>
    sseResponse([body.slice(0, 17), body.slice(17, 60), body.slice(60)]),
  );
  assert.equal(await collect(provider.stream(request())), "Hello");
});

test("provider sends the key only in the Authorization header, one attempt", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  const provider = providerWith(async (url, init) => {
    seen.push({ url: String(url), init: init ?? {} });
    return sseResponse([sseData("ok"), "data: [DONE]\n\n"]);
  });
  await collect(provider.stream(request()));
  assert.equal(seen.length, 1, "no automatic retries");
  const call = seen[0];
  assert.ok(call);
  const headers = call.init.headers as Record<string, string>;
  assert.equal(headers.authorization, `Bearer ${FAKE_CONFIG.apiToken}`);
  assert.ok(!call.url.includes(FAKE_CONFIG.apiToken));
  assert.ok(!String(call.init.body).includes(FAKE_CONFIG.apiToken));
  assert.equal(call.init.redirect, "error");
});

test("provider switches model thinking off in the request", async () => {
  let body: Record<string, unknown> = {};
  const provider = providerWith(async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return sseResponse([sseData("ok"), "data: [DONE]\n\n"]);
  });
  await collect(provider.stream(request()));
  assert.deepEqual(body.chat_template_kwargs, { enable_thinking: false });
});

test("provider uses the AI binding when present and skips REST", async () => {
  let restCalls = 0;
  const seen: Record<string, unknown>[] = [];
  const fetchImpl: typeof fetch = async () => {
    restCalls += 1;
    return sseResponse([sseData("from-rest"), "data: [DONE]\n\n"]);
  };
  const encoder = new TextEncoder();
  const ai = {
    async run(_model: string, inputs: Record<string, unknown>) {
      seen.push(inputs);
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(sseData("from-binding")));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
    },
  };
  const provider = createWorkersAiProvider(FAKE_CONFIG, fetchImpl, ai);
  assert.equal(await collect(provider.stream(request())), "from-binding");
  assert.equal(restCalls, 0);
  assert.equal(seen[0]?.stream, true);
  assert.deepEqual(seen[0]?.chat_template_kwargs, {
    enable_thinking: false,
  });
});

test("thinking text is never shown, and thinking-only output is an error", async () => {
  const thinking = (text: string) =>
    `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: text, content: "" } }] })}\n\n`;

  const mixed = providerWith(async () =>
    sseResponse([
      thinking("secret reasoning "),
      sseData("Visible answer."),
      "data: [DONE]\n\n",
    ]),
  );
  assert.equal(await collect(mixed.stream(request())), "Visible answer.");

  const onlyThinking = providerWith(async () =>
    sseResponse([thinking("still thinking"), "data: [DONE]\n\n"]),
  );
  await assert.rejects(
    collect(onlyThinking.stream(request())),
    (e: unknown) => e instanceof ProviderError && e.code === "upstream",
  );
});

test("provider ignores malformed events up to a small limit", async () => {
  const provider = providerWith(async () =>
    sseResponse([
      "data: {not json\n\n",
      sseData("fine"),
      "data: 42\n\n",
      "data: [DONE]\n\n",
    ]),
  );
  assert.equal(await collect(provider.stream(request())), "fine");
});

test("provider fails on too many malformed events", async () => {
  const bad = "data: {nope\n\n".repeat(6);
  const provider = providerWith(async () =>
    sseResponse([bad, sseData("late")]),
  );
  await assert.rejects(collect(provider.stream(request())), (e: unknown) => {
    assert.ok(e instanceof ProviderError);
    assert.equal(e.code, "upstream");
    return true;
  });
});

test("provider treats an empty stream as an upstream error", async () => {
  const provider = providerWith(async () => sseResponse(["data: [DONE]\n\n"]));
  await assert.rejects(collect(provider.stream(request())), /Empty response/);
});

test("provider surfaces an in-stream error payload", async () => {
  const provider = providerWith(async () =>
    sseResponse([sseData("partial"), 'data: {"error":{"message":"boom"}}\n\n']),
  );
  await assert.rejects(collect(provider.stream(request())), (e: unknown) => {
    assert.ok(e instanceof ProviderError);
    assert.equal(e.code, "upstream");
    assert.ok(!e.message.includes("boom"), "upstream text is not forwarded");
    return true;
  });
});

test("provider maps HTTP errors and never exposes the upstream body", async () => {
  const cases: [number, string][] = [
    [429, "quota"],
    [401, "unavailable"],
    [403, "unavailable"],
    [504, "timeout"],
    [500, "upstream"],
    [400, "upstream"],
  ];
  for (const [status, code] of cases) {
    const provider = providerWith(
      async () => new Response("secret-upstream-detail", { status }),
    );
    await assert.rejects(collect(provider.stream(request())), (e: unknown) => {
      assert.ok(e instanceof ProviderError, `status ${status}`);
      assert.equal(e.code, code, `status ${status}`);
      assert.ok(!e.message.includes("secret-upstream-detail"));
      return true;
    });
  }
});

test("provider rejects non-SSE success responses", async () => {
  const provider = providerWith(
    async () =>
      new Response("<html>captive portal</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
  );
  await assert.rejects(
    collect(provider.stream(request())),
    /Unexpected response/,
  );
});

test("network failure becomes a generic upstream error", async () => {
  const provider = providerWith(async () => {
    throw new TypeError("fetch failed: ECONNRESET 10.0.0.5");
  });
  await assert.rejects(collect(provider.stream(request())), (e: unknown) => {
    assert.ok(e instanceof ProviderError);
    assert.equal(e.code, "upstream");
    assert.ok(!e.message.includes("10.0.0.5"));
    return true;
  });
});

test("cancelling the caller signal stops the stream and closes the reader", async () => {
  let cancelled = false;
  const controller = new AbortController();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode(sseData("first")));
    },
    cancel() {
      cancelled = true;
    },
  });
  const provider = providerWith(
    async () =>
      new Response(stream, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
  );
  const gen = provider.stream({ ...request(), signal: controller.signal });
  const first = await gen.next();
  assert.equal(first.value, "first");
  await gen.return(undefined);
  assert.equal(cancelled, true, "upstream body was cancelled");
});

test("an aborted request surfaces as AbortError, not a provider error", async () => {
  const controller = new AbortController();
  const provider = providerWith(async (_url, init) => {
    await new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    });
    return new Response(null);
  });
  const pending = collect(
    provider.stream({ ...request(), signal: controller.signal }),
  );
  controller.abort();
  await assert.rejects(pending, (e: unknown) => {
    assert.ok(e instanceof Error);
    assert.equal(e.name, "AbortError");
    return true;
  });
});
