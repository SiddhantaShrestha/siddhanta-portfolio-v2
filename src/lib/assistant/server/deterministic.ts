import "server-only";

import { experience } from "@/content/about";
import { projectNotes } from "@/content/assistant/notes";
import { getProjectBySlug, projects } from "@/content/projects";
import { skillGroups } from "@/content/skills";
import { starterQuestions } from "@/lib/assistant/shared/starter-questions";
import type { StarterId } from "@/lib/assistant/shared/starter-questions";

/**
 * Fixed answers for the suggested questions. They are assembled from the same
 * verified content the site renders, need no API key and no model, and keep
 * working when the AI quota is used up.
 */
export type DeterministicAnswer = {
  text: string;
  /** Source catalog keys, resolved to links by the caller. */
  sourceKeys: string[];
};

function requireProject(slug: string) {
  const project = getProjectBySlug(slug);
  if (!project?.caseStudy) throw new Error(`Missing project "${slug}".`);
  return { project, caseStudy: project.caseStudy };
}

function recruitNepal(): DeterministicAnswer {
  const { project, caseStudy } = requireProject("recruit-nepal");
  const note = projectNotes["recruit-nepal"];
  const role = experience[0];
  if (!note || !role) throw new Error("Missing Recruit Nepal content.");
  const scale = caseStudy.glance?.find((g) => g.label === "Scale");

  const lines = [
    `Siddhanta is a ${role.title} at ${role.organization} (${role.period}).`,
    note.ownershipStatement,
    `Areas he contributed to: ${(caseStudy.contributions ?? []).join("; ")}.`,
  ];
  if (scale) lines.push(`Platform scale: ${scale.value}.`);
  lines.push(`More detail is on the ${project.name} case study.`);

  return { text: lines.join("\n\n"), sourceKeys: ["project:recruit-nepal"] };
}

function soloProjects(): DeterministicAnswer {
  const names = (kind: "independent" | "collaborative" | "unspecified") =>
    projects
      .filter((p) => projectNotes[p.slug]?.ownership === kind)
      .map((p) => p.name);

  const independent = names("independent");
  const team = names("collaborative");
  const unspecified = names("unspecified");

  const lines = [
    `Independent projects: ${independent.join(", ")}.`,
    `Team projects: ${team.join(", ")}.`,
  ];
  if (unspecified.length > 0) {
    lines.push(
      `${unspecified.join(", ")}: the case study does not state individual ownership, so no claim is made either way.`,
    );
  }

  return {
    text: lines.join("\n\n"),
    sourceKeys: projects.map((p) => `project:${p.slug}`),
  };
}

function citedocs(): DeterministicAnswer {
  const { project, caseStudy } = requireProject("citedocs");
  const note = projectNotes.citedocs;
  const steps = (caseStudy.architecture?.steps ?? []).map(
    (s, i) => `${i + 1}. ${s.title}: ${s.detail}`,
  );

  const lines = [
    `CiteDocs: ${project.summary}`,
    note?.ownershipStatement ?? "",
    "How it works:",
    steps.join("\n"),
  ];
  const headline = caseStudy.evaluation?.headline.context;
  if (headline) lines.push(`Retrieval test: ${headline}`);
  lines.push(
    "The test scores the search step only. It is not a general measure of answer quality.",
  );

  return {
    text: lines.filter(Boolean).join("\n\n"),
    sourceKeys: ["project:citedocs"],
  };
}

function researchAgent(): DeterministicAnswer {
  const { project, caseStudy } = requireProject("research-evaluation-agent");
  const steps = (caseStudy.architecture?.steps ?? []).map(
    (s, i) => `${i + 1}. ${s.title}: ${s.detail}`,
  );

  const note = projectNotes["research-evaluation-agent"];
  return {
    text: [
      project.summary,
      note?.ownershipStatement ?? "",
      "Pipeline stages:",
      steps.join("\n"),
      "A score of 8 or above skips revision. Grounding runs on both paths.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    sourceKeys: ["project:research-evaluation-agent"],
  };
}

function skills(): DeterministicAnswer {
  const rows = skillGroups.map(
    (group) => `${group.title}: ${group.items.map((i) => i.name).join(", ")}`,
  );
  return {
    text: [
      "Technologies verified on this portfolio:",
      rows.join("\n"),
      "Each skill is tied to the projects where it was used on the case study pages.",
    ].join("\n\n"),
    sourceKeys: ["page:about", "page:projects"],
  };
}

const builders: Record<StarterId, () => DeterministicAnswer> = {
  "recruit-nepal": recruitNepal,
  "solo-projects": soloProjects,
  citedocs,
  "research-agent": researchAgent,
  skills,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds a starter by id, or by an exact (normalized) match of the question.
 * Anything else returns null and goes to the model.
 */
export function matchStarter(
  starterId: string | null,
  question: string,
): StarterId | null {
  if (starterId) {
    const byId = starterQuestions.find((s) => s.id === starterId);
    if (byId) return byId.id;
  }
  const wanted = normalize(question);
  const byText = starterQuestions.find((s) => normalize(s.question) === wanted);
  return byText ? byText.id : null;
}

export function getDeterministicAnswer(id: StarterId): DeterministicAnswer {
  return builders[id]();
}

export function listStarterIds(): StarterId[] {
  return Object.keys(builders) as StarterId[];
}
