/**
 * Suggested questions. Client safe: ids and text only.
 * The deterministic answers live on the server (see server/deterministic.ts)
 * and are built from verified portfolio content.
 */
export const starterQuestions = [
  { id: "recruit-nepal", question: "What did you build at Recruit Nepal?" },
  { id: "solo-projects", question: "Which projects were solo?" },
  { id: "citedocs", question: "How does CiteDocs work?" },
  {
    id: "research-agent",
    question: "What is the Research Evaluation Agent?",
  },
  { id: "skills", question: "What are your main skills?" },
] as const;

export type StarterId = (typeof starterQuestions)[number]["id"];
