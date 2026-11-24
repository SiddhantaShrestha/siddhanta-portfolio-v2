export type LabPipeline = {
  id: string;
  title: string;
  projectSlug: string;
  steps: string[];
};

export const labIntro =
  "A space for AI applications, automation workflows, and systems that connect models to real products.";

export const labPipelines: LabPipeline[] = [
  {
    id: "job-post",
    title: "Job Post Automation",
    projectSlug: "job-post-automation",
    steps: [
      "Vacancy arrives by webhook",
      "Required fields are checked",
      "Gemini writes a caption and poster",
      "Company logo comes from Google Drive",
      "Caption and poster publish to LinkedIn",
    ],
  },
  {
    id: "research-eval",
    title: "Research Evaluation Agent",
    projectSlug: "research-evaluation-agent",
    steps: [
      "Draft a research report from source documents",
      "Evaluator scores relevance, completeness, clarity, and evidence",
      "Below 8, revise using the critique",
      "Check claims against retrieved passages",
    ],
  },
];

export const workstationStations = [
  {
    id: "monitor",
    label: "Monitor",
    description: "Full stack projects",
    href: "/#projects",
  },
  {
    id: "orb",
    label: "AI orb",
    description: "AI engineering",
    href: "/#lab",
  },
  {
    id: "panel",
    label: "Control panel",
    description: "Workflow automation",
    href: "/#lab",
  },
  {
    id: "rack",
    label: "Server rack",
    description: "Backend and DevOps",
    href: "/#skills",
  },
] as const;

export type StationId = (typeof workstationStations)[number]["id"];
