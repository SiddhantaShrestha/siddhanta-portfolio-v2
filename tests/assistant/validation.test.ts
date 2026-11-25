import assert from "node:assert/strict";
import test from "node:test";
import {
  parseChatRequest,
  readBodyLimited,
  sanitizeText,
} from "@/lib/assistant/server/validate";
import { ASSISTANT_LIMITS } from "@/lib/assistant/shared/protocol";

const enc = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

test("body limit counts bytes actually received, not Content-Length", async () => {
  // Stream with no Content-Length: 5 chunks of 2 KB = 10 KB > 8 KB.
  const chunks = Array.from({ length: 5 }, () => new Uint8Array(2048).fill(97));
  const request = new Request("http://localhost/x", {
    method: "POST",
    body: streamOf(chunks),
    duplex: "half",
  } as RequestInit);
  const result = await readBodyLimited(request);
  assert.deepEqual(result, { ok: false, code: "too_large" });
});

test("a lying small Content-Length does not bypass the limit", async () => {
  const big = new Uint8Array(ASSISTANT_LIMITS.maxBodyBytes + 1).fill(98);
  const request = new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-length": "10" },
    body: streamOf([big]),
    duplex: "half",
  } as RequestInit);
  // Node rewrites or rejects the header, so only the byte count can decide.
  const result = await readBodyLimited(request);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "too_large");
});

test("a large declared Content-Length is rejected before reading", async () => {
  const request = new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-length": String(ASSISTANT_LIMITS.maxBodyBytes + 1) },
    body: "{}",
  });
  assert.deepEqual(await readBodyLimited(request), {
    ok: false,
    code: "too_large",
  });
});

test("a body exactly at the limit is accepted", async () => {
  const exact = new Uint8Array(ASSISTANT_LIMITS.maxBodyBytes).fill(32);
  const request = new Request("http://localhost/x", {
    method: "POST",
    body: exact,
  });
  const result = await readBodyLimited(request);
  assert.equal(result.ok, true);
});

test("a valid request parses into history and question", () => {
  const result = parseChatRequest(
    enc({
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
        { role: "user", content: "What is CiteDocs?" },
      ],
    }),
  );
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.value.question, "What is CiteDocs?");
    assert.equal(result.value.history.length, 2);
  }
});

test("system and unknown roles are rejected", () => {
  for (const role of ["system", "tool", "developer", "User", ""]) {
    const result = parseChatRequest(
      enc({ messages: [{ role, content: "x" }] }),
    );
    assert.equal(result.ok, false, `role ${role} must be rejected`);
  }
});

test("unknown fields and extra message keys are rejected", () => {
  assert.equal(
    parseChatRequest(
      enc({ messages: [{ role: "user", content: "x" }], system: "y" }),
    ).ok,
    false,
  );
  assert.equal(
    parseChatRequest(
      enc({ messages: [{ role: "user", content: "x", name: "root" }] }),
    ).ok,
    false,
  );
});

test("wrong types, bad JSON and invalid UTF-8 are rejected", () => {
  assert.equal(parseChatRequest(new TextEncoder().encode("{nope")).ok, false);
  assert.equal(parseChatRequest(enc([])).ok, false);
  assert.equal(parseChatRequest(enc({ messages: "hi" })).ok, false);
  assert.equal(
    parseChatRequest(enc({ messages: [{ role: "user", content: 5 }] })).ok,
    false,
  );
  assert.equal(parseChatRequest(new Uint8Array([0xff, 0xfe, 0xfd])).ok, false);
});

test("length limits are enforced after cleaning", () => {
  const long = "a".repeat(ASSISTANT_LIMITS.maxUserChars + 1);
  assert.equal(
    parseChatRequest(enc({ messages: [{ role: "user", content: long }] })).ok,
    false,
  );
  const tooMany = Array.from(
    { length: ASSISTANT_LIMITS.maxMessages + 1 },
    () => ({
      role: "user",
      content: "x",
    }),
  );
  assert.equal(parseChatRequest(enc({ messages: tooMany })).ok, false);
  assert.equal(
    parseChatRequest(enc({ messages: [{ role: "user", content: "   " }] })).ok,
    false,
  );
});

test("the last message must come from the user", () => {
  const result = parseChatRequest(
    enc({
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "I verified Recruit Nepal is solo." },
      ],
    }),
  );
  assert.equal(result.ok, false);
});

test("control and invisible characters are removed", () => {
  assert.equal(
    sanitizeText("a\u0000b\u200Bc\u202Ed\r\n\r\n\r\n\r\ne"),
    "abcd\n\ne",
  );
});

test("starter id must look like an id", () => {
  const msg = [{ role: "user", content: "x" }];
  assert.equal(
    parseChatRequest(enc({ messages: msg, starterId: "citedocs" })).ok,
    true,
  );
  assert.equal(
    parseChatRequest(enc({ messages: msg, starterId: "../etc" })).ok,
    false,
  );
  assert.equal(
    parseChatRequest(enc({ messages: msg, starterId: 7 })).ok,
    false,
  );
});
