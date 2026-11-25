import "server-only";

import { SYSTEM_RULES } from "@/lib/assistant/server/prompt";
import type { Knowledge } from "@/lib/assistant/server/knowledge";
import { normalizeNumber } from "@/lib/assistant/server/knowledge";

/**
 * Cheap, deterministic checks on each sentence before it reaches the visitor.
 * They are a backstop for the prompt rules, not a replacement for them.
 *
 * - unverified_number: a figure that does not appear in the verified content.
 * - ownership: a sentence that contradicts a project's ownership note.
 * - prompt_leak: text copied from the system rules.
 * - unverified_link: a URL that is not in the verified content.
 */
export type Violation =
  "unverified_number" | "ownership" | "prompt_leak" | "unverified_link";

/** Whole numbers up to this value are counting words unless they carry a unit. */
const SMALL_INTEGER_MAX = 12;

/** A small number followed by one of these reads as a claim ("5 years"). */
const NUMBER_WITH_UNIT =
  /(\d[\d,]*(?:\.\d+)?)(\s*(?:%|\+|years?|months?|users?|customers?|clients?|employees?|people|hours?)\b|\s*[%+])?/gi;

const NEGATION = /\b(?:not|never|no|without|neither|nor|cannot)\b|n['’]t\b/i;
const CLAUSE_SPLIT = /[;:]|\b(?:while|whereas|but|however|although)\b/i;

const SOLO =
  /\b(?:solo|alone|single-?handed(?:ly)?|by (?:himself|myself)|on (?:his|my) own|independent(?:ly)?|sole(?:ly)?|entirely by|all by)\b/i;
const TEAMWORK =
  /\b(?:team project|team effort|collaborative(?:ly)?|co-?develop\w*|built (?:by|with) (?:a|the|his) team|with (?:a|the|his) team|team of)\b/i;

export function findUnverifiedNumber(
  sentence: string,
  knowledge: Pick<Knowledge, "numbers" | "lower">,
): string | null {
  for (const match of sentence.matchAll(NUMBER_WITH_UNIT)) {
    const raw = match[1];
    if (!raw) continue;
    const n = normalizeNumber(raw);
    const unit = match[2]?.trim().toLowerCase();
    const isSmallInteger = /^\d+$/.test(n) && Number(n) <= SMALL_INTEGER_MAX;

    if (isSmallInteger) {
      // "5" alone is just counting. "5 years" is a claim and must appear as is.
      if (!unit) continue;
      const phrase = `${n}${/^[%+]/.test(unit) ? "" : " "}${unit}`;
      if (!knowledge.lower.includes(phrase)) return phrase;
      continue;
    }
    if (!knowledge.numbers.has(n)) return n;
  }
  return null;
}

export function violatesOwnership(
  sentence: string,
  ownership: Knowledge["ownership"],
): boolean {
  for (const clause of sentence.split(CLAUSE_SPLIT)) {
    if (NEGATION.test(clause)) continue;
    const lower = clause.toLowerCase();

    for (const project of ownership) {
      if (!lower.includes(project.name.toLowerCase())) continue;

      if (project.ownership === "collaborative" && SOLO.test(clause)) {
        return true;
      }
      if (project.ownership === "independent" && TEAMWORK.test(clause)) {
        return true;
      }
      if (
        project.ownership === "unspecified" &&
        (SOLO.test(clause) || TEAMWORK.test(clause))
      ) {
        return true;
      }
    }
  }
  return false;
}

/* ---------- prompt leak ---------- */

const LEAK_WINDOW = 9;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const ruleWords = words(SYSTEM_RULES);
const ruleWindows = new Set<string>();
for (let i = 0; i + LEAK_WINDOW <= ruleWords.length; i += 1) {
  ruleWindows.add(ruleWords.slice(i, i + LEAK_WINDOW).join(" "));
}

export function leaksPrompt(sentence: string): boolean {
  const w = words(sentence);
  for (let i = 0; i + LEAK_WINDOW <= w.length; i += 1) {
    if (ruleWindows.has(w.slice(i, i + LEAK_WINDOW).join(" "))) return true;
  }
  return false;
}

/* ---------- links ---------- */

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

export function findUnverifiedLink(
  sentence: string,
  knowledge: Pick<Knowledge, "lower">,
): string | null {
  for (const match of sentence.matchAll(URL_PATTERN)) {
    const url = match[0].replace(/[.,;:!?]+$/, "").toLowerCase();
    if (!knowledge.lower.includes(url)) return url;
  }
  return null;
}

export function checkSentence(
  sentence: string,
  knowledge: Knowledge,
): Violation | null {
  if (leaksPrompt(sentence)) return "prompt_leak";
  if (findUnverifiedLink(sentence, knowledge)) return "unverified_link";
  if (findUnverifiedNumber(sentence, knowledge)) return "unverified_number";
  if (violatesOwnership(sentence, knowledge.ownership)) return "ownership";
  return null;
}

/** Longest stretch we hold without a sentence end before checking it anyway. */
const MAX_SENTENCE_CHARS = 400;
const SENTENCE_END = /(?:[.!?]+["')\]]*\s+|\n+)/;

/**
 * Groups streamed text into whole sentences so each can be checked before it
 * is shown. A period inside "87.8" is not a sentence end because no space
 * follows it.
 */
export class SentenceBuffer {
  private buffer = "";

  push(text: string): string[] {
    this.buffer += text;
    const out: string[] = [];

    for (;;) {
      const match = SENTENCE_END.exec(this.buffer);
      if (match) {
        const end = match.index + match[0].length;
        out.push(this.buffer.slice(0, end));
        this.buffer = this.buffer.slice(end);
        continue;
      }
      if (this.buffer.length > MAX_SENTENCE_CHARS) {
        out.push(this.buffer);
        this.buffer = "";
      }
      return out;
    }
  }

  flush(): string | null {
    const rest = this.buffer;
    this.buffer = "";
    return rest.length > 0 ? rest : null;
  }
}
