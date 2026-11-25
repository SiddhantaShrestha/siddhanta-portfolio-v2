import type { LabWorkflow } from "@/content/lab-workflows/types";

/**
 * Research Evaluation Agent lab demo.
 * Threshold semantics verified from public src/pipeline.py:
 * REVISION_SCORE_THRESHOLD = 8.0
 * score >= 8.0 → revision skipped
 * score < 8.0 → revision runs
 *
 * All scores, drafts, and critiques are illustrative samples.
 * No aggregation formula is claimed.
 */

const STAGES = [
  {
    id: "retrieve",
    title: "Retrieve",
    purpose:
      "Load local source documents, chunk passages, and rank relevant text for grounding.",
    tech: ["Local sources", "Chunked passages", "Ranked relevance"],
    kind: "input" as const,
  },
  {
    id: "generate",
    title: "Generate",
    purpose:
      "Produce an initial structured research draft from the retrieved passages.",
    tech: ["Groq", "Structured draft"],
    kind: "model" as const,
  },
  {
    id: "evaluate",
    title: "Evaluate",
    purpose:
      "Score the draft against defined criteria, including relevance, completeness, clarity, and evidence use.",
    tech: ["Relevance", "Completeness", "Clarity", "Evidence use"],
    kind: "process" as const,
  },
  {
    id: "revise",
    title: "Revise when below 8",
    purpose:
      "If the evaluation score falls below 8, revise the draft using the evaluator critique. Public pipeline.py skips revision when score >= 8.0.",
    tech: ["Threshold: 8", "Uses evaluator critique"],
    kind: "boundary" as const,
  },
  {
    id: "grounding",
    title: "Grounding check",
    purpose:
      "Verify claims against retrieved passages and record run artifacts for inspection. Both revised and unrevised paths still run grounding.",
    tech: ["Claims vs passages", "Run artifacts"],
    kind: "output" as const,
  },
];

const sharedRetrieval = {
  input: {
    kind: "text" as const,
    label: "Query",
    body: "What cadence does the demonstration handbook recommend for design guild office hours?",
  },
  output: {
    kind: "ranking" as const,
    label: "Retrieved passages (order only)",
    caption:
      "Illustrative passage order from a sample local corpus. Similarity scores are not shown.",
    items: [
      {
        rank: 1,
        document: "handbook-demo.md",
        chunkLabel: "passage 01",
        excerpt:
          "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
      },
      {
        rank: 2,
        document: "onboarding-demo.md",
        chunkLabel: "passage 03",
        excerpt: "Guild leads publish weekly notes after the Tuesday session.",
      },
    ],
  },
};

const draftSample =
  "The design guild meets for office hours each Tuesday morning. Notes are shared after the session.";

export const researchEvalWorkflow: LabWorkflow = {
  id: "research-eval",
  title: "Research Evaluation Agent",
  projectSlug: "research-evaluation-agent",
  summary:
    "Step through the verified evaluation loop: retrieve, generate, evaluate, revise when the score is below 8, then check grounding against retrieved passages.",
  disclaimer:
    "Illustrative samples only. Scores, drafts, and critiques are demonstration data. This lab does not call Groq or run the live pipeline.",
  stages: STAGES,
  defaultScenarioId: "below-8",
  scenarios: [
    {
      id: "below-8",
      label: "Score below 8",
      description:
        "Illustrative overall score 7. Revision runs, then grounding checks the revised report.",
      maxReachableStageIndex: 4,
      stageViews: {
        retrieve: {
          ...sharedRetrieval,
          note: "Sample files and excerpts are invented for this demonstration.",
        },
        generate: {
          input: {
            kind: "ranking",
            label: "Passages available to the draft",
            items: sharedRetrieval.output.items,
          },
          output: {
            kind: "text",
            label: "Draft report (sample)",
            body: draftSample,
          },
          note: "Draft text is illustrative, not a live Groq response.",
        },
        evaluate: {
          input: {
            kind: "text",
            label: "Draft under review",
            body: draftSample,
          },
          output: {
            kind: "scores",
            label: "Evaluation (sample)",
            overall: 7,
            caption:
              "Illustrative overall score 7. Public pipeline.py revises when score < 8.0. Criterion notes are illustrative labels only. No aggregation formula is claimed.",
            criteria: [
              {
                criterion: "Relevance",
                note: "Sample critique: topic is close, but the draft understates the Tuesday time window.",
              },
              {
                criterion: "Completeness",
                note: "Sample critique: missing the 10:00 to 11:00 detail from the top passage.",
              },
              {
                criterion: "Clarity",
                note: "Sample critique: wording is clear enough for a short brief.",
              },
              {
                criterion: "Evidence use",
                note: "Sample critique: ties weakly to retrieved passages.",
              },
            ],
          },
        },
        revise: {
          input: {
            kind: "status",
            label: "Revision gate",
            status: "ready",
            detail:
              "Illustrative score 7 < 8.0, so revision runs with the evaluator critique.",
          },
          output: {
            kind: "text",
            label: "Revised report (sample)",
            body: "According to the demonstration handbook, design guild office hours run on Tuesdays from 10:00 to 11:00. Guild leads publish weekly notes after that session.",
          },
          note: "Revision text is illustrative. Pipeline.py calls revise_report when score < REVISION_SCORE_THRESHOLD.",
        },
        grounding: {
          input: {
            kind: "text",
            label: "Final report under audit",
            body: "According to the demonstration handbook, design guild office hours run on Tuesdays from 10:00 to 11:00. Guild leads publish weekly notes after that session.",
          },
          output: {
            kind: "claims",
            label: "Grounding check (sample)",
            items: [
              {
                claim: "Office hours are on Tuesdays from 10:00 to 11:00.",
                supported: true,
                evidence: "handbook-demo.md · passage 01",
              },
              {
                claim: "Guild leads publish weekly notes after the session.",
                supported: true,
                evidence: "onboarding-demo.md · passage 03",
              },
            ],
          },
          note: "Grounding still runs after revision. Claim labels are illustrative.",
        },
      },
    },
    {
      id: "at-or-above-8",
      label: "Score 8 or above",
      description:
        "Illustrative overall score 8. Revision is skipped. The draft continues to grounding.",
      maxReachableStageIndex: 4,
      skippedStageIds: ["revise"],
      stageViews: {
        retrieve: {
          ...sharedRetrieval,
          note: "Sample files and excerpts are invented for this demonstration.",
        },
        generate: {
          input: {
            kind: "ranking",
            label: "Passages available to the draft",
            items: sharedRetrieval.output.items,
          },
          output: {
            kind: "text",
            label: "Draft report (sample)",
            body: "According to the demonstration handbook, design guild office hours run on Tuesdays from 10:00 to 11:00. Guild leads publish weekly notes after that session.",
          },
          note: "Draft text is illustrative, not a live Groq response.",
        },
        evaluate: {
          input: {
            kind: "text",
            label: "Draft under review",
            body: "According to the demonstration handbook, design guild office hours run on Tuesdays from 10:00 to 11:00. Guild leads publish weekly notes after that session.",
          },
          output: {
            kind: "scores",
            label: "Evaluation (sample)",
            overall: 8,
            caption:
              "Illustrative overall score 8. Public pipeline.py skips revision when score >= 8.0. Criterion notes are illustrative labels only. No aggregation formula is claimed.",
            criteria: [
              {
                criterion: "Relevance",
                note: "Sample critique: draft answers the asked cadence question.",
              },
              {
                criterion: "Completeness",
                note: "Sample critique: includes weekday and time window from the top passage.",
              },
              {
                criterion: "Clarity",
                note: "Sample critique: concise and direct.",
              },
              {
                criterion: "Evidence use",
                note: "Sample critique: stays close to retrieved wording.",
              },
            ],
          },
        },
        revise: {
          input: {
            kind: "status",
            label: "Revision gate",
            status: "skipped",
            detail:
              "Illustrative score 8 >= 8.0. Revision is skipped. The draft is copied forward as the final report.",
          },
          output: {
            kind: "status",
            label: "Revision result",
            status: "skipped",
            detail:
              "Matches pipeline.py: if score >= REVISION_SCORE_THRESHOLD (8.0), revision_skipped is true and grounding still runs on the draft.",
          },
          note: "This stage stays visible so you can inspect the skip path.",
        },
        grounding: {
          input: {
            kind: "text",
            label: "Final report under audit",
            body: "According to the demonstration handbook, design guild office hours run on Tuesdays from 10:00 to 11:00. Guild leads publish weekly notes after that session.",
          },
          output: {
            kind: "claims",
            label: "Grounding check (sample)",
            items: [
              {
                claim: "Office hours are on Tuesdays from 10:00 to 11:00.",
                supported: true,
                evidence: "handbook-demo.md · passage 01",
              },
              {
                claim: "Guild leads publish weekly notes after the session.",
                supported: true,
                evidence: "onboarding-demo.md · passage 03",
              },
            ],
          },
          note: "Grounding still runs when revision is skipped.",
        },
      },
    },
  ],
};
