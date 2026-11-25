/**
 * A tiny, safe reader for model text. It understands only:
 * paragraphs, bullet lists, numbered lists, and **bold**.
 *
 * It returns plain data. The UI turns that data into React elements, so no
 * HTML string is ever built or injected, and nothing from the model can
 * become a tag, a link or an attribute.
 */

export type InlineRun = { text: string; bold: boolean };

export type MessageBlock =
  | { type: "paragraph"; runs: InlineRun[] }
  | { type: "list"; ordered: boolean; items: InlineRun[][] };

const BULLET = /^\s*[*\-•]\s+(.*)$/;
const NUMBERED = /^\s*\d{1,2}[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const BOLD = /\*\*([^*\n]+?)\*\*/g;

/** Splits one line of text into plain and bold runs. */
export function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let last = 0;
  for (const match of text.matchAll(BOLD)) {
    const start = match.index ?? 0;
    if (start > last) runs.push({ text: text.slice(last, start), bold: false });
    runs.push({ text: match[1] ?? "", bold: true });
    last = start + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs;
}

export function parseMessage(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: InlineRun[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({
        type: "paragraph",
        runs: parseInline(paragraph.join(" ")),
      });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ...list });
      list = null;
    }
  };

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();

    if (line.trim() === "" || RULE.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flushParagraph();
      const ordered = numbered !== null;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline((item[1] ?? "").trim()));
      continue;
    }

    flushList();
    const heading = HEADING.exec(line);
    if (heading) {
      // The prompt asks for no headings. If one slips in, show it as bold text.
      flushParagraph();
      blocks.push({
        type: "paragraph",
        runs: [{ text: (heading[1] ?? "").trim(), bold: true }],
      });
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks;
}
