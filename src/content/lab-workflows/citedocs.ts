import type { LabWorkflow } from "@/content/lab-workflows/types";

/**
 * CiteDocs lab demo.
 * Stages follow the verified case study architecture.
 * All documents and answers are fictional demonstration data.
 * Rankings show order only. No similarity scores are invented.
 */

const STAGES = [
  {
    id: "session",
    title: "Sign in and membership",
    purpose:
      "A signed-in user belongs to a team as an admin or a member. Role and team come from the server session on every question.",
    tech: ["Admin or member", "Server-side session"],
    kind: "input" as const,
  },
  {
    id: "documents",
    title: "Documents and chunks",
    purpose:
      "An admin uploads text or PDF and sets visibility to team or admins. Documents are split into chunks, and visibility is copied onto every chunk.",
    tech: ["Text or PDF", "team or admins", "300-character chunks"],
    kind: "process" as const,
  },
  {
    id: "embeddings",
    title: "Embeddings",
    purpose:
      "Each chunk is embedded and stored in pgvector as vector(768). Local nomic-embed-text via Ollama is the default path, with Gemini embeddings optional.",
    tech: [
      "vector(768)",
      "nomic-embed-text via Ollama",
      "gemini-embedding-001, optional",
    ],
    kind: "model" as const,
  },
  {
    id: "retrieval",
    title: "Permission-filtered search",
    purpose:
      "Vector search filters by team and role inside the SQL query. Nearby chunks are never fetched and hidden afterwards. The demo uses an exact scan with no vector index, returning the top 5 chunks.",
    tech: ["Filter in SQL", "Exact scan", "Top 5 chunks"],
    kind: "boundary" as const,
  },
  {
    id: "answer",
    title: "Cited answer",
    purpose:
      "Retrieved sentences are numbered. The model returns only a sentence number, and the app prints that exact sentence with its document, chunk, and a short quote.",
    tech: ["Sentence numbers", "Document and chunk shown"],
    kind: "output" as const,
  },
];

const demoDocsAdmin = [
  {
    id: "doc-handbook",
    document: "Team Handbook (demo)",
    visibility: "team" as const,
    excerpt:
      "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
    accessible: true,
  },
  {
    id: "doc-onboarding",
    document: "Onboarding Notes (demo)",
    visibility: "team" as const,
    excerpt:
      "New engineers receive laptop setup guides during their first week.",
    accessible: true,
  },
  {
    id: "doc-comp",
    document: "Compensation Policy (demo)",
    visibility: "admins" as const,
    excerpt: "Engineering bonuses are paid on the last Friday of April.",
    accessible: true,
  },
];

const demoDocsMember = demoDocsAdmin.map((doc) => ({
  ...doc,
  accessible: doc.visibility === "team",
}));

const adminRanking = [
  {
    rank: 1,
    document: "Compensation Policy (demo)",
    chunkLabel: "chunk 02",
    excerpt: "Engineering bonuses are paid on the last Friday of April.",
  },
  {
    rank: 2,
    document: "Team Handbook (demo)",
    chunkLabel: "chunk 04",
    excerpt:
      "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
  },
  {
    rank: 3,
    document: "Onboarding Notes (demo)",
    chunkLabel: "chunk 01",
    excerpt:
      "New engineers receive laptop setup guides during their first week.",
  },
];

const memberRanking = [
  {
    rank: 1,
    document: "Team Handbook (demo)",
    chunkLabel: "chunk 04",
    excerpt:
      "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
  },
  {
    rank: 2,
    document: "Onboarding Notes (demo)",
    chunkLabel: "chunk 01",
    excerpt:
      "New engineers receive laptop setup guides during their first week.",
  },
];

const sharedQuestion =
  "When are engineering bonuses paid according to the demonstration corpus?";

export const citedocsWorkflow: LabWorkflow = {
  id: "citedocs",
  title: "CiteDocs Retrieval",
  projectSlug: "citedocs",
  summary:
    "Explore permission-aware document Q&A: session role, chunked documents, embeddings, SQL-filtered retrieval, and a cited answer from numbered sentences.",
  disclaimer:
    "Illustrative samples only. Documents, rankings, and answers are demonstration data. This lab does not search a live CiteDocs deployment.",
  stages: STAGES,
  defaultScenarioId: "admin",
  scenarios: [
    {
      id: "admin",
      label: "Admin role",
      description:
        "Signed in as an admin. Team and admins-only demonstration documents are visible to retrieval.",
      maxReachableStageIndex: 4,
      stageViews: {
        session: {
          input: {
            kind: "status",
            label: "Session",
            status: "ready",
            detail:
              "Demonstration session for team Northbridge with role admin. Role comes from the server session, not the client.",
          },
          output: {
            kind: "fields",
            label: "Session fields",
            fields: [
              { key: "team", value: "Northbridge (demo)" },
              { key: "role", value: "admin" },
              { key: "source", value: "server session" },
            ],
          },
        },
        documents: {
          input: {
            kind: "status",
            label: "Corpus",
            status: "ready",
            detail:
              "Three fictional demonstration documents. Visibility is team or admins, copied onto every 300-character chunk.",
          },
          output: {
            kind: "chunks",
            label: "Demonstration documents",
            items: demoDocsAdmin,
          },
          note: "All document titles and excerpts are invented for this lab.",
        },
        embeddings: {
          input: {
            kind: "status",
            label: "Index step",
            status: "ready",
            detail:
              "Accessible chunks are embedded and stored in pgvector as vector(768).",
          },
          output: {
            kind: "fields",
            label: "Embedding settings",
            fields: [
              { key: "column", value: "vector(768)" },
              { key: "default_model", value: "nomic-embed-text via Ollama" },
              { key: "optional_model", value: "gemini-embedding-001" },
              { key: "chunk_length", value: "300 characters" },
            ],
          },
        },
        retrieval: {
          input: {
            kind: "text",
            label: "Question",
            body: sharedQuestion,
          },
          output: {
            kind: "ranking",
            label: "Top results (order only)",
            caption:
              "Illustrative ranking order for an admin session. Similarity scores are not shown.",
            items: adminRanking,
          },
          note: "The admins-only compensation passage is included because the session role is admin.",
        },
        answer: {
          input: {
            kind: "ranking",
            label: "Numbered sentences from retrieval",
            items: [
              {
                rank: 1,
                document: "Compensation Policy (demo)",
                chunkLabel: "sentence 1",
                excerpt:
                  "Engineering bonuses are paid on the last Friday of April.",
              },
              {
                rank: 2,
                document: "Team Handbook (demo)",
                chunkLabel: "sentence 2",
                excerpt:
                  "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
              },
            ],
          },
          output: {
            kind: "text",
            label: "Cited answer (sample)",
            body: "Answer uses sentence 1.\nDocument: Compensation Policy (demo)\nChunk: chunk 02\nQuote: Engineering bonuses are paid on the last Friday of April.",
          },
          note: "The model returns a sentence number only. The app prints the exact sentence with its source.",
        },
      },
    },
    {
      id: "member",
      label: "Member role",
      description:
        "Signed in as a member. Admins-only demonstration documents stay out of the retrieval results.",
      maxReachableStageIndex: 4,
      stageViews: {
        session: {
          input: {
            kind: "status",
            label: "Session",
            status: "ready",
            detail:
              "Demonstration session for team Northbridge with role member. Role comes from the server session, not the client.",
          },
          output: {
            kind: "fields",
            label: "Session fields",
            fields: [
              { key: "team", value: "Northbridge (demo)" },
              { key: "role", value: "member" },
              { key: "source", value: "server session" },
            ],
          },
        },
        documents: {
          input: {
            kind: "status",
            label: "Corpus",
            status: "ready",
            detail:
              "Same demonstration corpus. The member role cannot access admins-only documents.",
          },
          output: {
            kind: "chunks",
            label: "Demonstration documents",
            items: demoDocsMember,
          },
          note: "Compensation Policy is marked inaccessible for the member role.",
        },
        embeddings: {
          input: {
            kind: "status",
            label: "Index step",
            status: "ready",
            detail:
              "Embeddings still exist for the full corpus, but retrieval filters by role inside SQL.",
          },
          output: {
            kind: "fields",
            label: "Embedding settings",
            fields: [
              { key: "column", value: "vector(768)" },
              { key: "default_model", value: "nomic-embed-text via Ollama" },
              { key: "filter", value: "applied at query time in SQL" },
              { key: "chunk_length", value: "300 characters" },
            ],
          },
        },
        retrieval: {
          input: {
            kind: "text",
            label: "Question",
            body: sharedQuestion,
          },
          output: {
            kind: "ranking",
            label: "Top results (order only)",
            caption:
              "Illustrative ranking order for a member session. The admins-only compensation passage is absent because the filter runs inside the SQL query.",
            items: memberRanking,
          },
          note: "No admins-only chunk appears, even though that text would answer the question.",
        },
        answer: {
          input: {
            kind: "ranking",
            label: "Numbered sentences from retrieval",
            items: [
              {
                rank: 1,
                document: "Team Handbook (demo)",
                chunkLabel: "sentence 1",
                excerpt:
                  "Office hours for the design guild are Tuesdays from 10:00 to 11:00.",
              },
              {
                rank: 2,
                document: "Onboarding Notes (demo)",
                chunkLabel: "sentence 2",
                excerpt:
                  "New engineers receive laptop setup guides during their first week.",
              },
            ],
          },
          output: {
            kind: "status",
            label: "Cited answer (sample)",
            status: "blocked",
            detail:
              "Illustrative outcome: retrieved team-visible sentences do not contain the bonus payment date, so the member path cannot cite the admins-only policy. Permission filtering happened before answer generation.",
          },
          note: "This shows the permission boundary. It is not a live CiteDocs response.",
        },
      },
    },
  ],
};
