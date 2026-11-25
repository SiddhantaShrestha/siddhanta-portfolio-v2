import assert from "node:assert/strict";
import test from "node:test";
import {
  parseInline,
  parseMessage,
} from "@/lib/assistant/shared/format-message";

const plain = (runs: { text: string }[]) => runs.map((r) => r.text).join("");

test("bullet lists with asterisks become list items", () => {
  const blocks = parseMessage(
    "He built these on his own:\n* CiteDocs\n* RecipeNest\n* Research Evaluation Agent",
  );
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0]?.type, "paragraph");
  const list = blocks[1];
  assert.ok(list && list.type === "list");
  assert.equal(list.ordered, false);
  assert.deepEqual(list.items.map(plain), [
    "CiteDocs",
    "RecipeNest",
    "Research Evaluation Agent",
  ]);
});

test("dash, bullet dot and numbered lists are understood", () => {
  const dash = parseMessage("- one\n- two")[0];
  assert.ok(dash && dash.type === "list" && !dash.ordered);
  const dot = parseMessage("• one\n• two")[0];
  assert.ok(dot && dot.type === "list" && dot.items.length === 2);
  const numbered = parseMessage("1. first\n2) second")[0];
  assert.ok(numbered && numbered.type === "list" && numbered.ordered);
  assert.equal(numbered.items.length, 2);
});

test("bold text is split into runs, and stray asterisks stay plain", () => {
  assert.deepEqual(parseInline("A **key** point"), [
    { text: "A ", bold: false },
    { text: "key", bold: true },
    { text: " point", bold: false },
  ]);
  // Unclosed while streaming: shown as text, never an error.
  assert.deepEqual(parseInline("Half **open"), [
    { text: "Half **open", bold: false },
  ]);
});

test("a line that starts with bold is not a bullet", () => {
  const blocks = parseMessage("**Summary** of the work");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.type, "paragraph");
});

test("blank lines split paragraphs and single newlines join", () => {
  const blocks = parseMessage("First line\nstill first.\n\nSecond.");
  assert.equal(blocks.length, 2);
  const first = blocks[0];
  assert.ok(first && first.type === "paragraph");
  assert.equal(plain(first.runs), "First line still first.");
});

test("bullets inside a list can carry bold labels", () => {
  const list = parseMessage("* **CiteDocs**: search app")[0];
  assert.ok(list && list.type === "list");
  assert.deepEqual(list.items[0], [
    { text: "CiteDocs", bold: true },
    { text: ": search app", bold: false },
  ]);
});

test("headings and rules never leak raw markers", () => {
  const blocks = parseMessage("## Skills\n---\n* React");
  assert.equal(blocks.length, 2);
  const heading = blocks[0];
  assert.ok(heading && heading.type === "paragraph");
  assert.equal(plain(heading.runs), "Skills");
});

test("HTML and links stay as plain text", () => {
  const blocks = parseMessage(
    "<img src=x onerror=alert(1)> [click](http://evil.example) <b>hi</b>",
  );
  assert.equal(blocks.length, 1);
  const block = blocks[0];
  assert.ok(block && block.type === "paragraph");
  // The parser returns only text and a bold flag. There is nothing else a
  // renderer could turn into markup.
  assert.deepEqual(Object.keys(block.runs[0] ?? {}).sort(), ["bold", "text"]);
  assert.ok(plain(block.runs).includes("<img src=x"));
});

test("empty and whitespace-only text gives no blocks", () => {
  assert.deepEqual(parseMessage(""), []);
  assert.deepEqual(parseMessage("  \n \n"), []);
});
