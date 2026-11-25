/**
 * Hand-written guardrails for the assistant, one entry per project slug.
 * Facts here must match src/content/projects.ts and the Phase 4 content audit.
 * The knowledge builder throws if a project has no note.
 */

export type Ownership = "collaborative" | "independent" | "unspecified";

export type ProjectNote = {
  ownership: Ownership;
  /** Short, plain statement the assistant must keep intact. */
  ownershipStatement: string;
  /** Things the assistant must never claim about this project. */
  doNotClaim: string[];
};

export const projectNotes: Record<string, ProjectNote> = {
  "recruit-nepal": {
    ownership: "collaborative",
    ownershipStatement:
      "Team product. Siddhanta is a Full Stack Developer on it and contributed across many areas. He is not the sole developer and did not personally build every feature.",
    doNotClaim: [
      "sole ownership or that he built the whole platform",
      "any metric other than the project-reported 7,597 unique users (November 2026), which is not audited and is not a personal result",
      "internal hosting, infrastructure, credentials or confidential business details",
    ],
  },
  citedocs: {
    ownership: "independent",
    ownershipStatement:
      "Personal project, independently developed by Siddhanta from database to interface and deployment.",
    doNotClaim: [
      "that the Hit@5 result (36 of 41 questions) measures answer quality; it only scores the search step",
      "that keyword or hybrid search is part of the product; the app searches with vectors only",
    ],
  },
  "job-post-automation": {
    ownership: "collaborative",
    ownershipStatement:
      "Team project, developed collaboratively. It is not an independent project.",
    doNotClaim: [
      "sole ownership",
      "implementation details for Facebook or Instagram publishing; only the LinkedIn path is documented in the public repository",
      "any usage numbers or results beyond what the case study states",
    ],
  },
  "research-evaluation-agent": {
    ownership: "independent",
    ownershipStatement:
      "Independent applied AI project, designed and implemented by Siddhanta.",
    doNotClaim: [
      "that a score of 8 or above triggers revision; revision happens only when the score is below 8",
      "accuracy or benchmark numbers; none are published",
    ],
  },
  "youtube-chatbot": {
    ownership: "unspecified",
    ownershipStatement:
      "The case study does not state individual ownership. Do not say it was built independently and do not say it was a team project.",
    doNotClaim: [
      "who built it or how much of it Siddhanta wrote",
      "support for languages other than English captions",
    ],
  },
  recipenest: {
    ownership: "independent",
    ownershipStatement:
      "Independently developed full-stack app across the React frontend, Express API, MongoDB data layer and eSewa integration.",
    doNotClaim: [
      "user numbers, revenue or real payment volumes",
      "anything about the separate RecipeNest repository beyond what the case study states",
    ],
  },
};

/** Rules that apply to the whole site, not one project. */
export const globalNotes: string[] = [
  "The interactive lab on the homepage (Job Post Automation, CiteDocs and Research Evaluation Agent tabs) uses fictional sample data. It is illustrative, not real output from those systems.",
  "The profile text mentions DevOps, but no specific DevOps tools are verified on this portfolio. Do not name any.",
  "No salary, availability, visa, references or personal details beyond the public contact information are published. For those, direct the visitor to the contact section.",
  "Private project information (internal hosting, credentials, confidential metrics) is not published and must not be guessed.",
];
