import type { StationId } from "@/content/lab";
import { labPipelines } from "@/content/lab";
import { getProjectBySlug } from "@/content/projects";
import { skillGroups } from "@/content/skills";

export type StationProjectLink = {
  slug: string;
  name: string;
  summary: string;
  href: string;
};

export type StationPanelContent = {
  id: StationId;
  title: string;
  eyebrow: string;
  body: string;
  projects: StationProjectLink[];
  /** Extra verified lines (skills, pipeline steps). Never invent these. */
  notes: string[];
  sectionHref: string;
  sectionLabel: string;
};

function projectLink(slug: string): StationProjectLink {
  const project = getProjectBySlug(slug);
  if (!project) {
    throw new Error(`Missing verified project for station panel: ${slug}`);
  }
  return {
    slug: project.slug,
    name: project.name,
    summary: project.summary,
    href: project.caseStudyHref,
  };
}

const jobPost = labPipelines.find((pipeline) => pipeline.id === "job-post");

const backendSkills =
  skillGroups
    .find((group) => group.id === "backend")
    ?.items.map((item) => item.name) ?? [];
const cloudSkills =
  skillGroups
    .find((group) => group.id === "cloud")
    ?.items.map((item) => item.name) ?? [];
const databaseSkills =
  skillGroups
    .find((group) => group.id === "databases")
    ?.items.map((item) => item.name) ?? [];

export const stationPanels: Record<StationId, StationPanelContent> = {
  monitor: {
    id: "monitor",
    title: "Full stack development",
    eyebrow: "Monitor",
    body: "Product work across the stack, from React and Next.js interfaces to Node and Express APIs. Two highlights sit on this desk; the full project list is one step away.",
    projects: [projectLink("recruit-nepal"), projectLink("recipenest")],
    notes: [],
    sectionHref: "/#projects",
    sectionLabel: "Explore all projects",
  },
  orb: {
    id: "orb",
    title: "AI engineering",
    eyebrow: "AI orb",
    body: "Verified AI applications that retrieve, evaluate, and answer from real sources.",
    projects: [
      projectLink("citedocs"),
      projectLink("research-evaluation-agent"),
      projectLink("youtube-chatbot"),
    ],
    notes: [],
    sectionHref: "/#lab",
    sectionLabel: "Open the AI lab",
  },
  panel: {
    id: "panel",
    title: "Workflow automation",
    eyebrow: "Control panel",
    body: "Automation that connects webhooks, models, and publishing tools into a repeatable workflow.",
    projects: [projectLink("job-post-automation")],
    notes: jobPost?.steps ?? [],
    sectionHref: "/#lab",
    sectionLabel: "See automation in the lab",
  },
  rack: {
    id: "rack",
    title: "Backend engineering",
    eyebrow: "Server rack",
    body: "APIs, services, and the data stores that support the products above. Only tools already listed in the skills section appear here.",
    projects: [projectLink("recruit-nepal"), projectLink("recipenest")],
    notes: [
      `Backend: ${backendSkills.join(", ")}.`,
      `Data: ${databaseSkills.join(", ")}.`,
      `Cloud and deployment: ${cloudSkills.join(", ")}.`,
    ],
    sectionHref: "/#skills",
    sectionLabel: "View backend skills",
  },
};

export function getStationPanel(id: StationId): StationPanelContent {
  return stationPanels[id];
}

/**
 * Which side of the stage the HTML panel occupies for this station, so the
 * camera can keep the object in the free half of the frame.
 */
export const PANEL_SIDE: Record<StationId, "left" | "right"> = {
  monitor: "right",
  orb: "right",
  panel: "right",
  rack: "left",
};
