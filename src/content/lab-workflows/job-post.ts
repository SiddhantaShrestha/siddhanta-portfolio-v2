import type { LabWorkflow } from "@/content/lab-workflows/types";

/**
 * Job Post Automation lab demo.
 * Stages follow the verified public LinkedIn n8n export only.
 * Facebook and Instagram are confirmed team publishing targets, but they are
 * not executable stages here because their node-level paths are not in the
 * public LinkedIn-focused repository.
 *
 * All vacancy fields, captions, and status lines are fictional samples.
 */

const STAGES = [
  {
    id: "webhook",
    title: "Authenticated webhook",
    purpose:
      "A vacancy arrives as a JSON payload on an authenticated webhook. Required fields in the public export are title and link.",
    tech: ["Webhook", "JSON vacancy", "Auth required"],
    kind: "input" as const,
  },
  {
    id: "validate",
    title: "Validate fields",
    purpose:
      "The workflow checks required fields before any generation step runs. A missing title or link stops the run here.",
    tech: ["Required: title, link", "Optional helpers"],
    kind: "process" as const,
  },
  {
    id: "gemini",
    title: "Gemini-assisted content",
    purpose:
      "Gemini 2.5 Flash prepares a hiring caption and a poster image edit prompt from the validated vacancy.",
    tech: ["Gemini 2.5 Flash", "Caption", "Poster prompt"],
    kind: "model" as const,
  },
  {
    id: "drive",
    title: "Brand logo from Google Drive",
    purpose:
      "Where the public export supports it, a brand logo is downloaded from Google Drive for the poster.",
    tech: ["Google Drive", "Brand logo"],
    kind: "boundary" as const,
  },
  {
    id: "linkedin",
    title: "LinkedIn publishing",
    purpose:
      "The documented LinkedIn OAuth path publishes the caption and poster. This demo covers LinkedIn only.",
    tech: ["LinkedIn OAuth", "Caption and poster"],
    kind: "output" as const,
  },
];

const validPayloadFields = [
  {
    key: "title",
    value: "Senior Frontend Engineer",
    required: true,
  },
  {
    key: "link",
    value: "https://example.com/jobs/frontend-senior",
    required: true,
  },
  {
    key: "company",
    value: "Northbridge Labs",
  },
  {
    key: "location",
    value: "Kathmandu (hybrid)",
  },
  {
    key: "employment_type",
    value: "Full-time",
  },
  {
    key: "description",
    value:
      "Build product interfaces for an analytics platform used by internal teams.",
  },
];

const invalidPayloadFields = [
  {
    key: "title",
    value: "Senior Frontend Engineer",
    required: true,
  },
  {
    key: "link",
    value: "",
    required: true,
    missing: true,
  },
  {
    key: "company",
    value: "Northbridge Labs",
  },
  {
    key: "location",
    value: "Kathmandu (hybrid)",
  },
];

export const jobPostWorkflow: LabWorkflow = {
  id: "job-post",
  title: "Job Post Automation",
  projectSlug: "job-post-automation",
  summary:
    "Step through the verified LinkedIn vacancy workflow: webhook intake, validation, Gemini-assisted caption and poster work, a Google Drive logo step, then LinkedIn publishing.",
  disclaimer:
    "Illustrative samples only. This lab does not call webhooks, Gemini, Google Drive, or LinkedIn.",
  teamScopeNote:
    "The broader team project also publishes to Facebook and Instagram. Those channels are confirmed at the product level, but they are not shown as executable stages here because their implementations are not documented in the public LinkedIn n8n export.",
  stages: STAGES,
  defaultScenarioId: "valid-vacancy",
  scenarios: [
    {
      id: "valid-vacancy",
      label: "Valid vacancy",
      description:
        "Title and link are present. The workflow can continue through LinkedIn publishing.",
      maxReachableStageIndex: 4,
      stageViews: {
        webhook: {
          input: {
            kind: "status",
            label: "Trigger",
            status: "ready",
            detail:
              "Authenticated POST receives a fictional vacancy payload for Northbridge Labs.",
          },
          output: {
            kind: "fields",
            label: "Received payload",
            fields: validPayloadFields,
          },
          note: "Sample company and job details are invented for this demonstration.",
        },
        validate: {
          input: {
            kind: "fields",
            label: "Fields under check",
            fields: validPayloadFields.filter((field) => field.required),
          },
          output: {
            kind: "status",
            label: "Validation result",
            status: "ok",
            detail:
              "Required fields title and link are present. Generation steps may run.",
          },
        },
        gemini: {
          input: {
            kind: "fields",
            label: "Validated vacancy",
            fields: [
              { key: "title", value: "Senior Frontend Engineer" },
              { key: "company", value: "Northbridge Labs" },
              { key: "location", value: "Kathmandu (hybrid)" },
            ],
          },
          output: {
            kind: "text",
            label: "Generated caption (sample)",
            body: "Northbridge Labs is hiring a Senior Frontend Engineer in Kathmandu (hybrid). Build interfaces for an analytics platform used by internal teams. Apply: https://example.com/jobs/frontend-senior",
          },
          note: "Caption and poster prompt text are invented samples, not a live Gemini response.",
        },
        drive: {
          input: {
            kind: "status",
            label: "Asset request",
            status: "ready",
            detail:
              "Workflow requests the brand logo configured for this vacancy poster.",
          },
          output: {
            kind: "text",
            label: "Logo step (sample)",
            body: "Retrieved fictional asset: northbridge-labs-logo.png from a Google Drive placeholder path used in the public export pattern.",
          },
        },
        linkedin: {
          input: {
            kind: "text",
            label: "Publish package",
            body: "Caption plus poster that includes the Drive logo, prepared for the documented LinkedIn OAuth posting path.",
          },
          output: {
            kind: "status",
            label: "Publish result (sample)",
            status: "ok",
            detail:
              "Illustrative LinkedIn post accepted for the Senior Frontend Engineer vacancy. No live API call was made.",
          },
        },
      },
    },
    {
      id: "missing-link",
      label: "Missing link",
      description:
        "Title is present but the required link is missing. The workflow stops at validation.",
      maxReachableStageIndex: 1,
      stageViews: {
        webhook: {
          input: {
            kind: "status",
            label: "Trigger",
            status: "ready",
            detail:
              "Authenticated POST receives an incomplete fictional vacancy payload.",
          },
          output: {
            kind: "fields",
            label: "Received payload",
            fields: invalidPayloadFields,
          },
          note: "The missing link is intentional so you can see validation block later stages.",
        },
        validate: {
          input: {
            kind: "fields",
            label: "Fields under check",
            fields: invalidPayloadFields.filter((field) => field.required),
          },
          output: {
            kind: "status",
            label: "Validation result",
            status: "blocked",
            detail:
              "Required field link is missing. Gemini content, Drive logo retrieval, and LinkedIn publishing do not run.",
          },
          note: "Later stages stay locked until the payload includes title and link.",
        },
      },
    },
  ],
};
