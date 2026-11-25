import assert from "node:assert/strict";
import test from "node:test";
import {
  readEventStream,
  toAssistantEvent,
} from "@/lib/assistant/shared/events";
import { buildRequestMessages } from "@/lib/assistant/shared/history";
import { ASSISTANT_LIMITS } from "@/lib/assistant/shared/protocol";
import type { AssistantEvent } from "@/lib/assistant/shared/protocol";

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>) {
  const out: AssistantEvent[] = [];
  for await (const event of readEventStream(stream)) out.push(event);
  return out;
}

test("client reads NDJSON split at every byte, including multi-byte text", async () => {
  const lines =
    [
      { t: "meta", mode: "model" },
      { t: "text", v: "Héllo wörld. " },
      { t: "sources", v: [{ label: "CiteDocs", href: "/projects/citedocs" }] },
      { t: "done" },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n") + "\n";
  const bytes = new TextEncoder().encode(lines);
  const chunks = Array.from(bytes, (byte) => new Uint8Array([byte]));
  const events = await readAll(streamOf(chunks));
  assert.deepEqual(
    events.map((e) => e.t),
    ["meta", "text", "sources", "done"],
  );
  assert.equal((events[1] as { v: string }).v, "Héllo wörld. ");
});

test("client skips malformed lines and handles a final line with no newline", async () => {
  const body = `not json\n{"t":"text","v":"ok"}\n{"t":"bogus"}\n{"t":"done"}`;
  const events = await readAll(streamOf([new TextEncoder().encode(body)]));
  assert.deepEqual(events, [{ t: "text", v: "ok" }, { t: "done" }]);
});

test("client drops unsafe source links even if the server sent them", () => {
  const event = toAssistantEvent({
    t: "sources",
    v: [
      { label: "ok", href: "/projects/citedocs" },
      { label: "bad", href: "https://evil.test" },
      { label: "bad2", href: "javascript:alert(1)" },
      { label: "bad3", href: "//evil.test" },
      { label: "bad4", href: "/api/assistant" },
    ],
  });
  assert.deepEqual(event, {
    t: "sources",
    v: [{ label: "ok", href: "/projects/citedocs" }],
  });
});

test("client rejects events with the wrong shape", () => {
  assert.equal(toAssistantEvent({ t: "text", v: 5 }), null);
  assert.equal(
    toAssistantEvent({ t: "error", code: "nope", message: "x" }),
    null,
  );
  assert.equal(toAssistantEvent({ t: "meta", mode: "other" }), null);
  assert.equal(toAssistantEvent("text"), null);
  assert.equal(toAssistantEvent(null), null);
});

test("request history is trimmed so honest requests are always accepted", () => {
  const long = "a".repeat(5_000);
  const completed = Array.from({ length: 10 }, (_, i) => ({
    role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: long,
  }));
  const messages = buildRequestMessages(completed, "b".repeat(900));

  assert.ok(messages.length <= ASSISTANT_LIMITS.maxMessages);
  assert.equal(messages.at(-1)?.role, "user");
  assert.equal(messages.at(-1)?.content.length, ASSISTANT_LIMITS.maxUserChars);
  const total = messages.reduce((sum, m) => sum + m.content.length, 0);
  assert.ok(total <= ASSISTANT_LIMITS.maxTotalChars);
  for (const m of messages) {
    const max =
      m.role === "user"
        ? ASSISTANT_LIMITS.maxUserChars
        : ASSISTANT_LIMITS.maxAssistantChars;
    assert.ok(m.content.length <= max);
  }
});
