import assert from "node:assert/strict";
import test from "node:test";
import { buildKnowledge } from "@/lib/assistant/server/knowledge";

test("knowledge builds", () => {
  const k = buildKnowledge();
  console.log(
    "chars",
    k.text.length,
    "approx tokens",
    Math.round(k.text.length / 4),
  );
  assert.ok(k.text.length > 1000);
});
