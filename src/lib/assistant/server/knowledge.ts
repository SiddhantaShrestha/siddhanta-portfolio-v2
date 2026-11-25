import "server-only";

import { aboutCopy, experience } from "@/content/about";
import { globalNotes, projectNotes } from "@/content/assistant/notes";
import { projects } from "@/content/projects";
import type { Project } from "@/content/projects";
import { skillGroups } from "@/content/skills";
import { profile } from "@/content/site";

/**
 * Compact, curated knowledge for the model. Built from the same typed content
 * the site renders, so edits flow through. No images, figures or layout data.
 * No retrieval: the whole block goes into every prompt.
 */
export type Knowledge = {
  text: string;
  /** Lowercase copy of text for phrase checks. */
  lower: string;
  /** Normalized numbers that appear in the knowledge. Used by the output guard. */
  numbers: ReadonlySet<string>;
  /** Project name to ownership, used by the output guard. */
  ownership: ReadonlyArray<{
    name: string;
    slug: string;
    ownership: "collaborative" | "independent" | "unspecified";
  }>;
};

/** Rough ceiling for the knowledge block, about 7.5k tokens. */
export const KNOWLEDGE_MAX_CHARS = 30_000;

const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/g;

export function normalizeNumber(raw: string): string {
  return raw.replace(/,/g, "").replace(/\.$/, "");
}

export function extractNumbers(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map(normalizeNumber);
}

function line(label: string, value: string | undefined): string {
  return value ? `${label}: ${value}` : "";
}

function projectBlock(project: Project): string {
  const note = projectNotes[project.slug];
  if (!note) {
    throw new Error(`Assistant notes missing for project "${project.slug}".`);
  }
  const cs = project.caseStudy;
  const out: string[] = [
    `### ${project.name} (slug: ${project.slug})`,
    line("Type", project.category),
    line("Ownership", `${note.ownership}. ${note.ownershipStatement}`),
    line("Summary", project.summary),
    line("About", project.description),
    line("Stack", project.stack.join(", ")),
    line("Case study page", project.caseStudyHref),
  ];

  const publicLinks = project.links
    .filter((l) => /^https?:\/\//.test(l.href))
    .map((l) => `${l.label}: ${l.href}`);
  if (publicLinks.length)
    out.push(line("Public links", publicLinks.join("; ")));
  if (cs?.overview) out.push(line("Overview", cs.overview));
  if (cs?.glance?.length) {
    out.push(
      line(
        "At a glance",
        cs.glance.map((g) => `${g.label}: ${g.value}`).join("; "),
      ),
    );
  }
  if (cs?.role) out.push(line("Role", cs.role.body));
  if (cs?.contributions?.length) {
    out.push(line("Contributions", cs.contributions.join("; ")));
  }
  if (project.highlights.length) {
    out.push(line("Highlights", project.highlights.join(" ")));
  }
  if (cs?.architecture) {
    out.push(
      line("Architecture", cs.architecture.summary),
      ...cs.architecture.steps.map((s) => `- ${s.title}: ${s.detail}`),
    );
  }
  if (cs?.decisions?.length) {
    out.push(
      "Decisions:",
      ...cs.decisions.map((d) => `- ${d.title}: ${d.body}`),
    );
  }
  if (cs?.evaluation) {
    const ev = cs.evaluation;
    out.push(
      line("Evaluation", `${ev.definition} ${ev.headline.context}`),
      ...ev.methods.map(
        (m) =>
          `- ${m.label}: Hit@1 ${m.hit1}/${ev.sampleSize}, Hit@5 ${m.hit5}/${ev.sampleSize}`,
      ),
      ...ev.caveats.map((c) => `- Caveat: ${c}`),
    );
  }
  if (cs?.results?.length) {
    out.push(line("Results", cs.results.join(" ")));
  }
  out.push(line("Must not claim", note.doNotClaim.join("; ")));

  return out.filter(Boolean).join("\n");
}

function aboutBlock(): string {
  const roles = experience.map(
    (r) =>
      `- ${r.title}, ${r.organization} (${r.period}, ${r.location}): ${r.points.join(" ")}`,
  );
  return ["## About and experience", aboutCopy.body, ...roles].join("\n");
}

function skillsBlock(): string {
  const rows = skillGroups.map(
    (g) =>
      `- ${g.title}: ${g.items
        .map((i) => `${i.name} (${i.usedIn.join(", ")})`)
        .join("; ")}`,
  );
  return ["## Verified skills and where they were used", ...rows].join("\n");
}

function profileBlock(): string {
  return [
    "## Profile",
    `${profile.name}. ${profile.roleLine}. Based in ${profile.location}.`,
    `${profile.intro}`,
    `Public contact: email ${profile.email}, GitHub ${profile.social.github}, LinkedIn ${profile.social.linkedin}. Contact section: /#contact`,
  ].join("\n");
}

export function buildKnowledge(): Knowledge {
  const text = [
    profileBlock(),
    aboutBlock(),
    skillsBlock(),
    "## Projects",
    ...projects.map(projectBlock),
    "## Site notes",
    ...globalNotes.map((n) => `- ${n}`),
  ].join("\n\n");

  if (text.length > KNOWLEDGE_MAX_CHARS) {
    throw new Error(
      `Assistant knowledge is ${text.length} characters. Limit is ${KNOWLEDGE_MAX_CHARS}.`,
    );
  }

  return {
    text,
    lower: text.toLowerCase(),
    numbers: new Set(extractNumbers(text)),
    ownership: projects.map((p) => ({
      name: p.name,
      slug: p.slug,
      ownership: projectNotes[p.slug]?.ownership ?? "unspecified",
    })),
  };
}

let cached: Knowledge | null = null;

export function getKnowledge(): Knowledge {
  cached ??= buildKnowledge();
  return cached;
}
