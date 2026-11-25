export type ProjectLink = {
  label: string;
  href: string;
  external: boolean;
};

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectEvidence = {
  kind: "retrieval" | "evaluation";
  title: string;
  body: string;
};

/** Optional prose block for a case study section. */
export type CaseStudySection = {
  heading: string;
  body: string;
};

/** Gallery figure with a required caption for Phase 4 pages. */
export type CaseStudyFigure = ProjectImage & {
  caption: string;
  /** Opens a native dialog so visitors can inspect a large diagram or screenshot. */
  expandable?: boolean;
};

/** One verified architecture / pipeline step. No speculative diagrams. */
export type CaseStudyArchStep = {
  title: string;
  detail: string;
  /** Short verified facts shown as labels under the step. */
  tags?: string[];
  /** Optional emphasis label for a step that enforces a key boundary. */
  badge?: string;
};

/** Small label and value pair for the at-a-glance rail. */
export type CaseStudyFact = {
  label: string;
  value: string;
};

/** One search method scored on the same question set. */
export type CaseStudyEvaluationMethod = {
  label: string;
  detail?: string;
  hit1: number;
  hit5: number;
  mrr: number;
  /** Marks the method the shipped product uses. */
  shipped?: boolean;
};

export type CaseStudyEvaluationPoint = {
  passageChars: number;
  hit5: number;
};

export type CaseStudyEvaluationSeries = {
  label: string;
  points: CaseStudyEvaluationPoint[];
};

/**
 * Retrieval evaluation with its full context. Hit@k measures whether the
 * expected source passage appears in the top k retrieved results. It does
 * not measure answer wording or general AI accuracy.
 */
export type CaseStudyEvaluation = {
  title: string;
  metricLabel: string;
  definition: string;
  sampleSize: number;
  sampleNote: string;
  /** Fixed settings for the headline comparison. */
  config: CaseStudyFact[];
  headline: {
    hits: number;
    label: string;
    context: string;
  };
  methodsCaption: string;
  methods: CaseStudyEvaluationMethod[];
  passageLength?: {
    caption: string;
    series: CaseStudyEvaluationSeries[];
  };
  checks?: string[];
  caveats: string[];
  source: ProjectLink;
};

export type CaseStudyDecision = {
  title: string;
  body: string;
};

/**
 * Known case study section ids. Used by `sectionOrder` so each project can
 * lead with its strengths. Unknown ids are ignored at render time.
 */
export type CaseStudySectionId =
  | "overview"
  | "problem"
  | "role"
  | "architecture"
  | "features"
  | "decisions"
  | "screenshots"
  | "evidence";

/** Default CiteDocs order. Also used as the fallback for missing ids. */
export const DEFAULT_CASE_STUDY_SECTION_ORDER: readonly CaseStudySectionId[] = [
  "overview",
  "problem",
  "role",
  "architecture",
  "features",
  "decisions",
  "screenshots",
  "evidence",
] as const;

/**
 * Optional case study detail. Homepage cards ignore this object.
 * Omit or leave fields undefined when evidence is missing.
 */
export type ProjectCaseStudy = {
  /** Only published case studies use the Phase 4B layout. Others keep the stub. */
  published?: boolean;
  /**
   * Optional section order. Only listed ids that have content are rendered.
   * Missing ids that still have content append in the default CiteDocs order.
   */
  sectionOrder?: CaseStudySectionId[];
  overview?: string;
  /** At-a-glance rail beside the overview. */
  glance?: CaseStudyFact[];
  problem?: CaseStudySection;
  role?: CaseStudySection;
  /** Confirmed areas of personal work, shown as a list under the role text. */
  contributions?: string[];
  evaluation?: CaseStudyEvaluation;
  architecture?: {
    summary: string;
    steps: CaseStudyArchStep[];
    /** Optional section title. Defaults to "How it is built". */
    heading?: string;
    /** Optional section label. Defaults to "Architecture". */
    label?: string;
  };
  features?: string[];
  decisions?: CaseStudyDecision[];
  figures?: CaseStudyFigure[];
  /**
   * Gallery layout. "stack" is full-width figures for product screenshots.
   * Defaults to "grid".
   */
  galleryLayout?: "grid" | "stack";
  /** Optional screenshots section label. Defaults to "Screenshots". */
  galleryLabel?: string;
  /** Optional screenshots section title. Defaults to "The product in use". */
  galleryTitle?: string;
  results?: string[];
};

export type Project = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  highlights: string[];
  stack: string[];
  featured: boolean;
  image: ProjectImage | null;
  evidence: ProjectEvidence | null;
  caseStudyHref: string;
  links: ProjectLink[];
  /** Phase 4 case study body. Optional so homepage and routes stay compatible. */
  caseStudy?: ProjectCaseStudy;
};

export const projects: Project[] = [
  {
    slug: "recruit-nepal",
    name: "Recruit Nepal",
    category: "Professional work · Full-stack developer",
    summary:
      "Recruit Nepal connects candidates and employers across Nepal. As of November 2026, the platform reports 7,597 unique users.",
    description:
      "Major professional full-stack work on Recruit Nepal’s hiring platform: employer interfaces, APIs, AI CV extraction, candidate search and matching, recruiter workflows, and application tracking, built with the wider product team.",
    highlights: [
      "Contributed across employer dashboards, recruiter workflows, application tracking, candidate search and matching, and related Intern Nepal CRM work.",
      "Worked across the Next.js and Express TypeScript stack, including PostgreSQL, Redis job queues, realtime Socket.IO surfaces, and AI-assisted CV and recruitment flows.",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "TanStack Query",
      "Zustand",
      "React Hook Form",
      "Zod",
      "NextAuth",
      "Framer Motion",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Sequelize",
      "pgvector",
      "Redis",
      "BullMQ",
      "Socket.IO",
      "JWT",
      "Azure AI Document Intelligence",
      "OpenAI",
      "Anthropic",
      "Gemini",
    ],
    featured: true,
    image: {
      src: "/projects/recruitnepal.png",
      alt: "Recruit Nepal homepage with job search and candidate sign-up",
      width: 1600,
      height: 1000,
    },
    evidence: null,
    caseStudyHref: "/projects/recruit-nepal",
    links: [
      {
        label: "Visit Recruit Nepal",
        href: "https://recruitnepal.com",
        external: true,
      },
    ],
    caseStudy: {
      published: true,
      sectionOrder: [
        "overview",
        "problem",
        "role",
        "screenshots",
        "features",
        "architecture",
        "decisions",
        "evidence",
      ],
      galleryLayout: "stack",
      overview:
        "Recruit Nepal is a hiring platform that connects candidates and employers across Nepal. It is one of my major professional engineering projects as a Full Stack Developer. The product is built collaboratively; this write-up covers the breadth of my contributions across frontend, backend, and AI features without claiming sole ownership of every module.",
      glance: [
        { label: "Type", value: "Collaborative professional work" },
        { label: "Ownership", value: "Team product · Full Stack Developer" },
        {
          label: "Frontend",
          value: "Next.js App Router, React, TypeScript, Tailwind, shadcn/ui",
        },
        {
          label: "Backend",
          value: "Node.js, Express, PostgreSQL, Redis, BullMQ",
        },
        {
          label: "AI",
          value: "Azure Document Intelligence, OpenAI, Anthropic, Gemini",
        },
        {
          label: "Scale",
          value: "7,597 unique users · project-reported, Nov 2026",
        },
      ],
      problem: {
        heading: "Problem and motivation",
        body: "Hiring teams needed shared workflows for jobs, applications, review, and matching. Structured CV data and AI-assisted steps had to fit into recruiter tools without forcing manual re-entry from PDFs.",
      },
      role: {
        heading: "My contribution",
        body: "Full Stack Developer at Intern Nepal / Recruit Nepal (Jun 2025–present), after an earlier intern period (Jul 2024–Jan 2025). I have worked extensively across almost every major part of the platform. The platform is developed with a team. I do not claim to be the sole developer or to have personally implemented every individual feature.",
      },
      contributions: [
        "Employer dashboards and interfaces",
        "Backend APIs and integrations",
        "AI-powered CV extraction",
        "Candidate search and matching",
        "Recruiter workflows",
        "Application tracking and ATS surfaces",
        "Relevant Intern Nepal CRM development and integrations",
        "Broader frontend and backend platform engineering",
      ],
      architecture: {
        summary:
          "The product stack spans a Next.js App Router frontend and a Node.js/Express TypeScript API, with PostgreSQL (Sequelize, pgvector), Redis and BullMQ for data and background work, Socket.IO for realtime surfaces, and AI providers for CV extraction and assisted recruitment. Internal hosting diagrams stay private, so the stages below stay at the contribution and system layer.",
        steps: [
          {
            title: "Employer and recruiter clients",
            detail:
              "Employer dashboards, recruiter workflows, and related UI on Next.js App Router with React and TypeScript. UI uses Tailwind CSS and shadcn/ui (Radix). Client data and forms use TanStack Query, Zustand, React Hook Form, and Zod. Auth and motion use NextAuth and Framer Motion; realtime updates use Socket.IO on the client.",
            tags: [
              "Next.js App Router",
              "React",
              "TypeScript",
              "Tailwind CSS",
              "shadcn/ui",
              "TanStack Query",
              "Zustand",
              "NextAuth",
            ],
          },
          {
            title: "APIs, auth, and realtime",
            detail:
              "Node.js and Express TypeScript REST APIs behind candidate, recruiter, and application workflows. Request validation with Zod, authenticated access with JWT and NextAuth-backed sessions, and Socket.IO for realtime recruiter and applicant surfaces.",
            tags: [
              "Node.js",
              "Express",
              "TypeScript",
              "JWT",
              "Zod",
              "Socket.IO",
            ],
          },
          {
            title: "Data, vectors, and job queues",
            detail:
              "PostgreSQL is the primary store, accessed with Sequelize, including pgvector for vector-backed retrieval needs. Redis and BullMQ handle caches and background jobs so long-running work stays off the request path.",
            tags: ["PostgreSQL", "Sequelize", "pgvector", "Redis", "BullMQ"],
          },
          {
            title: "AI CV extraction and model APIs",
            detail:
              "Azure AI Document Intelligence extracts structured information from CVs. Broader assisted recruitment steps use configured model APIs across OpenAI, Azure, Anthropic, and Gemini. Prompts and extraction flows are refined for recruiter workflows.",
            tags: [
              "Azure Document Intelligence",
              "OpenAI",
              "Anthropic",
              "Gemini",
            ],
            badge: "AI extraction",
          },
          {
            title: "Search, tracking, and CRM",
            detail:
              "Candidate search and matching, application tracking and ATS surfaces, plus relevant Intern Nepal CRM development and integrations connected to the broader recruitment product line.",
            tags: [
              "Candidate search",
              "Matching",
              "ATS tracking",
              "Intern Nepal CRM",
            ],
          },
        ],
      },
      features: [
        "Employer dashboards and interfaces.",
        "Backend APIs and integrations.",
        "AI-powered CV extraction.",
        "Candidate search and matching.",
        "Recruiter workflows.",
        "Application tracking and management.",
        "Related Intern Nepal CRM development and integrations.",
      ],
      decisions: [
        {
          title: "Credit breadth without claiming sole authorship",
          body: "Case study language stresses extensive cross-stack involvement and concrete engineering responsibilities, while keeping collaborative ownership explicit so readers do not infer that one person built the entire product.",
        },
        {
          title: "Keep private infrastructure out of the write-up",
          body: "No internal hosting diagrams, credentials, or confidential operational metrics are published. Architecture steps stay tied to publicly stated stack and contribution areas.",
        },
      ],
      figures: [
        {
          src: "/projects/recruitnepal.png",
          alt: "Recruit Nepal homepage with job search and candidate sign-up",
          width: 1600,
          height: 1000,
          caption:
            "Recruit Nepal marketing homepage with job search and candidate sign-up.",
        },
        {
          src: "/projects/recruit-nepal-applicant-review.png",
          alt: "Recruit Nepal applicant review dashboard on the test server with demo applicants",
          width: 1600,
          height: 1000,
          caption:
            "Test environment only. Applicant review dashboard using demo applicant rows. Recruiters can review AI suggestions and update hiring stages. Not a production screenshot; no real candidate personal data is visible in this export.",
        },
      ],
      results: [
        "Project-reported figure: 7,597 unique users as of November 2026. This is a product-reported metric from the portfolio and experience copy, not an independently audited measurement. It describes platform scale, not personal growth attribution.",
      ],
    },
  },
  {
    slug: "citedocs",
    name: "CiteDocs",
    category: "Personal project · AI document search",
    summary:
      "A Q&A app that searches documents a teammate has permission to read and cites the passage behind each answer.",
    description:
      "Independently built document Q&A with permission-aware search, cited passages, and retrieval evaluation on pgvector.",
    highlights: [
      "With pgvector and 300-character passages, the expected source appeared in the first five results for 36 of 41 questions (87.8% Hit@5).",
      "Document permissions were part of the application layer, not only the search pipeline.",
    ],
    stack: ["React", "Next.js", "pgvector", "Embeddings", "Ollama", "Gemini"],
    featured: true,
    image: null,
    evidence: {
      kind: "retrieval",
      title: "Example from the retrieval tests",
      body: "When are engineering bonuses paid? On the last Friday of April. Vector search Hit@5 at 300 chars: 36/41.",
    },
    caseStudyHref: "/projects/citedocs",
    links: [
      {
        label: "Open CiteDocs (sign in)",
        href: "https://citedocs.vercel.app/",
        external: true,
      },
      {
        label: "Source code",
        href: "https://github.com/SiddhantaShrestha/citedocs",
        external: true,
      },
    ],
    caseStudy: {
      published: true,
      overview:
        "CiteDocs is a team-document Q&A app I built independently. A question is answered only from passages the signed-in role may read, and every answer shows the passage it came from. The search step is tested on its own against a fixed set of questions, so retrieval quality is measured instead of assumed.",
      glance: [
        { label: "Type", value: "Personal project" },
        { label: "Ownership", value: "Independently developed" },
        { label: "App", value: "Next.js, Prisma" },
        { label: "Data", value: "PostgreSQL, pgvector" },
        { label: "Models", value: "Ollama by default, Gemini optional" },
        { label: "Retrieval test", value: "Hit@5 36/41 at 300 characters" },
      ],
      problem: {
        heading: "Problem and motivation",
        body: "Teams keep answers in documents with different audiences. A shared chat over every file can leak admin-only material to a member, and an answer with no source is hard to trust. CiteDocs treats permissions and citations as part of the application, so the search step never sees what the user is not allowed to read.",
      },
      role: {
        heading: "My contribution",
        body: "I developed CiteDocs independently, from the database to the interface and deployment. The areas below are the parts I implemented.",
      },
      contributions: [
        "Document uploading and processing",
        "Embedding generation and semantic retrieval",
        "Permission-based document access controls",
        "AI question answering with source citations",
        "Backend and database architecture",
        "Frontend interface",
        "Retrieval evaluation and improvements",
        "Application deployment",
      ],
      architecture: {
        summary:
          "A Next.js application on Prisma and PostgreSQL with the pgvector extension. Similarity search is raw SQL against a vector(768) column. Every other query goes through Prisma. Embeddings and answers run on local Ollama models by default, with hosted Gemini as an option.",
        steps: [
          {
            title: "Sign in and membership",
            detail:
              "Email and password sign-in. A user belongs to a team as an admin or a member. Role and team come from the server session on every question, never from the client.",
            tags: ["Admin or member", "Server-side session"],
          },
          {
            title: "Documents and chunks",
            detail:
              "An admin uploads text or PDF and sets visibility to team or admins. The document is split into chunks, and visibility is copied onto every chunk.",
            tags: ["Text or PDF", "team or admins", "300-character chunks"],
          },
          {
            title: "Embeddings",
            detail:
              "Each chunk is embedded and stored in pgvector. Each chunk records the model that embedded it, and asking is refused after a provider switch until the documents are re-indexed.",
            tags: [
              "vector(768)",
              "nomic-embed-text via Ollama",
              "gemini-embedding-001, optional",
            ],
          },
          {
            title: "Permission-filtered search",
            detail:
              "The vector search filters by team and role inside the SQL query. Nearby chunks are never fetched and hidden afterwards. The demo uses an exact scan, with no vector index.",
            tags: ["Filter in SQL", "Exact scan", "Top 5 chunks"],
            badge: "Permission boundary",
          },
          {
            title: "Cited answer",
            detail:
              "The retrieved sentences are numbered. The model returns only a sentence number, and the app prints that exact sentence together with its document, chunk, and a short quote.",
            tags: ["Sentence numbers", "Document and chunk shown"],
          },
        ],
      },
      features: [
        "Two roles on a team, admin and member",
        "Document visibility set to team or admins, enforced in the search query",
        "Answers that cite the document, the chunk, and a short quote",
        "Local-first models, with a hosted Gemini option behind a setting",
        "A repeatable retrieval test over a fixed question set",
        "Seeded demo users so the permission behavior is easy to try",
      ],
      decisions: [
        {
          title: "Filter inside the search, not after it",
          body: "A member must never receive an admins chunk, even when it is the closest match. Fetching nearest chunks and hiding some afterwards leaves the restricted text in the pipeline. The team and role filter runs in the vector query, and a test seeds an admins chunk whose text is the question to check it.",
        },
        {
          title: "No vector index in the demo",
          body: "pgvector can use an HNSW index before the permission filter applies, so a member could get fewer than five rows, or none, when the nearest chunks are admin-only. An exact scan avoids that.",
        },
        {
          title: "Copy the sentence instead of letting the model rewrite it",
          body: "A question about when engineering bonuses are paid retrieved the right chunk, but the local model rewrote the sentence and mixed in other facts. The app now numbers the retrieved sentences, asks the model for a number only, and prints that sentence itself.",
        },
        {
          title: "Choose passage length from measurements",
          body: "Smaller passages helped vector search and larger ones helped keyword search, so 300 characters was kept for the vector-only product. Keyword and hybrid search were measured as comparisons and are not part of what a user gets.",
        },
      ],
      evaluation: {
        title: "Retrieval evaluation",
        metricLabel: "Hit@5",
        definition:
          "Hit@5 counts a question as a hit when the passage that should answer it appears in the top five retrieved results. It scores the search step only. It does not score the wording of the generated answer and it is not a general measure of AI accuracy.",
        sampleSize: 41,
        sampleNote:
          "41 questions, each naming the passage that should be found. 24 filler documents sit on the same team so the right passage competes with other text.",
        config: [
          { label: "Questions", value: "41" },
          { label: "Passage length", value: "300 characters" },
          { label: "Results checked", value: "Top 5" },
          { label: "Competing documents", value: "24 filler documents" },
        ],
        headline: {
          hits: 36,
          label: "Vector search, local embeddings",
          context:
            "The expected passage appeared in the top five results for 36 of 41 questions (87.8%), using 300-character passages and local nomic-embed-text embeddings.",
        },
        methodsCaption:
          "Search methods compared on the same 41 questions at 300-character passages",
        methods: [
          {
            label: "Vector search, local embeddings",
            detail: "What the app uses by default",
            hit1: 20,
            hit5: 36,
            mrr: 0.653,
            shipped: true,
          },
          {
            label: "Vector search, Gemini embeddings",
            detail: "Optional hosted provider",
            hit1: 20,
            hit5: 36,
            mrr: 0.655,
          },
          {
            label: "Hybrid",
            detail:
              "Reciprocal rank fusion of the keyword and vector top-5 lists",
            hit1: 21,
            hit5: 34,
            mrr: 0.642,
          },
          {
            label: "Keyword search",
            detail: "Comparison only",
            hit1: 16,
            hit5: 27,
            mrr: 0.497,
          },
        ],
        passageLength: {
          caption: "Hit@5 by passage length, out of 41 questions",
          series: [
            {
              label: "Vector search",
              points: [
                { passageChars: 300, hit5: 36 },
                { passageChars: 500, hit5: 35 },
                { passageChars: 800, hit5: 33 },
              ],
            },
            {
              label: "Keyword search",
              points: [
                { passageChars: 300, hit5: 27 },
                { passageChars: 500, hit5: 27 },
                { passageChars: 800, hit5: 32 },
              ],
            },
          ],
        },
        checks: [
          "Four extra checks confirm that a member search must not return an admins chunk.",
        ],
        caveats: [
          "With 41 questions, two or three hits move the percentages a lot. Read the gaps between methods as a direction, not a precise ranking.",
          "Hit@5 scores whether the right passage was found. Answer wording is a separate problem, and the sentence-number change above came from a wording failure that retrieval scoring did not catch.",
          "Keyword and hybrid search are measured for comparison. The app searches with vectors only.",
        ],
        source: {
          label: "How the tests were run (README)",
          href: "https://github.com/SiddhantaShrestha/citedocs#how-we-tested",
          external: true,
        },
      },
      figures: [],
      results: [],
    },
  },
  {
    slug: "job-post-automation",
    name: "Job Post Automation",
    category: "AI and workflow automation · n8n and Gemini",
    summary:
      "A team-built vacancy automation workflow: webhook intake, validation, Gemini-assisted captions and posters, then publishing to LinkedIn, Facebook, and Instagram.",
    description:
      "Collaborative AI and workflow automation that turns vacancy webhooks into social hiring posts. The public n8n repository documents the LinkedIn path in detail; the broader team project also publishes to Facebook and Instagram.",
    highlights: [
      "Connected vacancy webhooks, validation, Gemini content generation, and Google Drive logo handling in n8n.",
      "Team workflow publishes hiring posts to LinkedIn, Facebook, and Instagram. The public GitHub export documents the LinkedIn implementation path.",
    ],
    stack: [
      "n8n",
      "Gemini",
      "Google Drive",
      "LinkedIn",
      "Facebook",
      "Instagram",
      "Webhooks",
    ],
    featured: false,
    image: {
      src: "/projects/job-post-automation.png",
      alt: "Job Post Automation workflow diagram",
      width: 1400,
      height: 900,
    },
    evidence: null,
    caseStudyHref: "/projects/job-post-automation",
    links: [
      {
        label: "View workflow diagram",
        href: "/projects/job-post-automation.png",
        external: true,
      },
      {
        label: "GitHub (LinkedIn n8n export)",
        href: "https://github.com/SiddhantaShrestha/n8n-linkedin-job-post-automation",
        external: true,
      },
    ],
    caseStudy: {
      published: true,
      sectionOrder: [
        "overview",
        "problem",
        "role",
        "architecture",
        "features",
        "decisions",
        "screenshots",
        "evidence",
      ],
      galleryLabel: "Diagram",
      galleryTitle: "LinkedIn workflow export",
      overview:
        "AI and workflow automation for hiring posts. A vacancy arrives by webhook, required fields are checked, Gemini helps prepare caption and poster content, and the team workflow publishes to LinkedIn, Facebook, and Instagram. Detailed node-level evidence in the public repository covers the LinkedIn path.",
      glance: [
        { label: "Type", value: "Collaborative AI and automation" },
        { label: "Ownership", value: "Team project" },
        { label: "Engine", value: "n8n, Gemini 2.5 Flash" },
        { label: "Channels", value: "LinkedIn, Facebook, Instagram" },
        {
          label: "Public evidence",
          value: "LinkedIn n8n export and workflow diagram",
        },
      ],
      problem: {
        heading: "Problem and motivation",
        body: "Manual hiring posts repeat the same caption and creative work across channels. Automation keeps intake, generation, and publishing consistent when vacancies arrive as structured payloads.",
      },
      role: {
        heading: "My contribution",
        body: "Developed collaboratively with a team. Public evidence includes the n8n LinkedIn workflow export and README. Broader multi-network publishing (Facebook and Instagram) is confirmed for the team project; those channel implementations are not fully documented in the public LinkedIn-focused repository.",
      },
      contributions: [
        "Webhook vacancy intake and required-field validation",
        "Gemini-assisted caption and poster preparation (public LinkedIn export)",
        "Google Drive brand logo step documented in the public export",
        "LinkedIn publishing path documented in the public n8n repository",
        "Team-scope publishing across LinkedIn, Facebook, and Instagram",
      ],
      architecture: {
        label: "Workflow",
        heading: "How the workflow runs",
        summary:
          "Confirmed team capability: webhook intake, validation, Gemini-assisted generation, and publishing to LinkedIn, Facebook, and Instagram. The five stages below follow the public n8n LinkedIn export. Facebook and Instagram publishing is confirmed at the product level without inventing undocumented API or scheduler details.",
        steps: [
          {
            title: "Authenticated webhook",
            detail:
              "POST JSON vacancy payload. Required fields in the public export include title and link; description, company, location, and employment type are optional helpers.",
            tags: ["Webhook", "JSON vacancy", "Auth required"],
          },
          {
            title: "Validate fields",
            detail:
              "Workflow checks required fields before calling generation steps.",
            tags: ["Required: title, link", "Optional helpers"],
          },
          {
            title: "Gemini-assisted content",
            detail:
              "Public export uses Gemini 2.5 Flash for caption writing and poster image edit prompts.",
            tags: ["Gemini 2.5 Flash", "Caption", "Poster prompt"],
          },
          {
            title: "Brand logo from Google Drive",
            detail:
              "Where supported by the public export, the workflow downloads a brand logo from Google Drive for the poster.",
            tags: ["Google Drive", "Brand logo"],
          },
          {
            title: "Social publishing",
            detail:
              "Team project publishes to LinkedIn, Facebook, and Instagram. The public repository documents LinkedIn OAuth posting. Facebook and Instagram mechanisms are confirmed as project outputs, not reconstructed from missing public exports.",
            tags: [
              "LinkedIn documented",
              "Facebook team scope",
              "Instagram team scope",
            ],
            badge: "Team channels",
          },
        ],
      },
      features: [
        "Webhook-based vacancy intake.",
        "Input validation before generation.",
        "Gemini-assisted caption and poster preparation.",
        "Google Drive logo integration (documented in the public LinkedIn export).",
        "Publishing to LinkedIn, Facebook, and Instagram (team project scope).",
      ],
      decisions: [
        {
          title: "Separate public evidence from full product scope",
          body: "The GitHub n8n export is LinkedIn-specific. Case study copy states Facebook and Instagram as confirmed team publishing targets without inventing node graphs, APIs, or metrics that are not in the public repo.",
        },
        {
          title: "Keep brand assets out of the webhook payload",
          body: "In the public export, the logo comes from Google Drive placeholders so vacancy payloads stay small and credentials stay in n8n.",
        },
      ],
      figures: [
        {
          src: "/projects/job-post-automation.png",
          alt: "Job Post Automation n8n workflow diagram for the documented LinkedIn vacancy-to-post path",
          width: 1400,
          height: 900,
          caption:
            "Exported n8n workflow diagram for the documented LinkedIn vacancy-to-post path. Facebook and Instagram are confirmed team publishing channels; their node-level graphs are not reconstructed here.",
          expandable: true,
        },
      ],
      results: [
        "Team workflow publishes hiring posts across LinkedIn, Facebook, and Instagram.",
        "Public technical artifact: LinkedIn-oriented n8n export and workflow diagram on GitHub.",
      ],
    },
  },
  {
    slug: "research-evaluation-agent",
    name: "Research Evaluation Agent",
    category: "Applied AI · Python and Groq",
    summary:
      "An independently built Python pipeline that retrieves sources, drafts a report, evaluates it, revises when the score is below 8, and checks grounding against retrieved passages.",
    description:
      "Autonomous evaluation loop over research drafts: retrieve, generate, score, revise below threshold, then verify claims against sources. Powered by Groq.",
    highlights: [
      "Below a score of 8, the revision step uses the evaluator’s critique to edit the draft.",
      "Both paths end with a check of the report’s claims against the retrieved passages.",
    ],
    stack: ["Python", "Groq", "Evaluation agents"],
    featured: false,
    image: null,
    evidence: {
      kind: "evaluation",
      title: "When does a draft get revised?",
      body: "Example evaluation score 7/10. Below 8, the revision agent uses the evaluator’s critique to edit the report.",
    },
    caseStudyHref: "/projects/research-evaluation-agent",
    links: [
      {
        label: "Open live demo",
        href: "https://autonomous-research-eval-agent.vercel.app",
        external: true,
      },
      {
        label: "Inspect the pipeline",
        href: "https://github.com/SiddhantaShrestha/autonomous-research-eval-agent/blob/main/src/pipeline.py",
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/SiddhantaShrestha/autonomous-research-eval-agent",
        external: true,
      },
    ],
    caseStudy: {
      overview:
        "An independently developed research evaluation pipeline. It retrieves relevant passages, generates an initial report, evaluates that report against defined criteria, revises when the score falls below 8, and performs grounding checks against the retrieved text.",
      problem: {
        heading: "Problem and motivation",
        body: "Single-pass LLM reports are hard to inspect. Splitting retrieval, generation, evaluation, revision, and grounding makes each stage reviewable and replaceable.",
      },
      role: {
        heading: "My role",
        body: "Independently developed. I designed and implemented the evaluation workflow and supporting pipeline code in the public repository.",
      },
      architecture: {
        summary:
          "Shared orchestration in src/pipeline.py with Groq as the verified LLM provider. Confirmed stages: retrieve → generate → evaluate → revise if below 8 → grounding. Exact user-facing UI framework is unconfirmed and is not claimed here.",
        steps: [
          {
            title: "Retrieve",
            detail:
              "Load local source documents, chunk passages, and rank relevant text for grounding.",
          },
          {
            title: "Generate",
            detail:
              "Produce an initial structured research draft from the retrieved passages.",
          },
          {
            title: "Evaluate",
            detail:
              "Score the draft against defined criteria, including relevance, completeness, clarity, and evidence use.",
          },
          {
            title: "Revise when below 8",
            detail:
              "If the evaluation score falls below the configured threshold of 8, revise the draft using the evaluator critique.",
          },
          {
            title: "Grounding check",
            detail:
              "Verify claims against retrieved passages and record run artifacts for inspection.",
          },
        ],
      },
      features: [
        "Autonomous retrieve → generate → evaluate loop.",
        "Conditional revision below score 8.",
        "Grounding / claim verification against sources.",
        "Groq-backed generation and evaluation steps.",
        "Public Vercel demonstration of the workflow.",
      ],
      decisions: [
        {
          title: "Make evaluation an explicit stage",
          body: "Scoring happens before revision so weak drafts are improved against concrete critique instead of hoping a single generation pass is enough.",
        },
        {
          title: "Keep grounding after revision",
          body: "Both revised and unrevised paths still check claims against retrieved passages so fluency cannot replace source support.",
        },
        {
          title: "Do not over-claim the UI stack",
          body: "Repository docs mention multiple possible UIs. The case study does not name Next.js or Streamlit as the shipped interface until that choice is confirmed. OpenClaw is not part of this project.",
        },
      ],
      figures: [],
      results: [
        "Pipeline behavior (retrieve → generate → evaluate → revise if below 8 → grounding) matches the public pipeline and portfolio evidence card.",
        "Live demo verified responding: https://autonomous-research-eval-agent.vercel.app (HTTP 200 during Phase 4A).",
        "Render API health endpoint responded to GET with status ok after a cold start. It is an operational check, not a user-facing demo, and is not linked as one.",
      ],
    },
  },
  {
    slug: "youtube-chatbot",
    name: "YouTube Chatbot",
    category: "Video Q&A · Streamlit and LangChain",
    summary:
      "Paste a YouTube URL or video ID to summarize a video or ask what the speaker said about a specific topic. The app uses the video’s English captions as its source.",
    description:
      "Streamlit app for summarizing YouTube videos and answering topic questions from English captions.",
    highlights: [
      "Summaries draw on the broader transcript.",
      "For specific questions, the app searches a FAISS index built with Hugging Face embeddings and sends the four closest passages to the model through OpenRouter.",
    ],
    stack: [
      "Streamlit",
      "LangChain",
      "FAISS",
      "Hugging Face embeddings",
      "OpenRouter",
    ],
    featured: false,
    image: {
      src: "/projects/youtube-chatbot.png",
      alt: "YouTube Chatbot’s Streamlit interface with the video URL field, Load video button, and chat input",
      width: 1649,
      height: 942,
    },
    evidence: null,
    caseStudyHref: "/projects/youtube-chatbot",
    links: [
      {
        label: "Try YouTube Chatbot",
        href: "https://youtube-chatbot-using-langchain-bqqidajkj5sc4kcenzlktw.streamlit.app/",
        external: true,
      },
      {
        label: "Source code",
        href: "https://github.com/SiddhantaShrestha/YouTube-Chatbot-using-LangChain",
        external: true,
      },
    ],
    caseStudy: {
      overview:
        "A Streamlit app that loads English YouTube captions into a local FAISS index and answers questions only from that transcript context via OpenRouter.",
      problem: {
        heading: "Problem and motivation",
        body: "Watching full videos to find one statement is slow. Caption-grounded Q&A lets a viewer ask topic questions and get answers limited to what was said.",
      },
      role: {
        heading: "My role",
        body: "Ownership (independent vs collaborative) is not yet confirmed. Public evidence includes the repository, live Streamlit deploy, and portfolio write-up. Role language stays neutral until ownership is verified.",
      },
      architecture: {
        summary:
          "Streamlit UI in app.py. Transcript fetch and RAG helpers in rag.py. Embeddings run locally; chat goes through OpenRouter.",
        steps: [
          {
            title: "Parse video id",
            detail: "Accept a YouTube URL or video id from the UI.",
          },
          {
            title: "Fetch English transcript",
            detail:
              "Load captions through youtube-transcript-api. English only; auto-captions can be noisy.",
          },
          {
            title: "Chunk and embed",
            detail:
              "RecursiveCharacterTextSplitter at 1000 characters with 200 overlap. Embed with sentence-transformers/all-MiniLM-L6-v2.",
          },
          {
            title: "Index in session FAISS",
            detail:
              "Store vectors in a local FAISS index kept for the browser session. Index rebuilds when a new video loads.",
          },
          {
            title: "Retrieve and answer",
            detail:
              "Similarity search with k=4 (verified in rag.py). Send retrieved passages plus the question to ChatOpenAI via OpenRouter. Summaries can use broader transcript context.",
          },
        ],
      },
      features: [
        "Summarize a video from captions.",
        "Ask topic questions grounded in transcript chunks.",
        "Local embeddings; no embedding API required for indexing.",
        "Public Streamlit Community Cloud demonstration.",
      ],
      decisions: [
        {
          title: "English captions only",
          body: "Keeps the first version simple. Multi-language support is listed as future work in the repository.",
        },
        {
          title: "Session-local FAISS",
          body: "Avoids hosting a persistent vector store. Tradeoff: rebuild on each video load; no saved index yet.",
        },
      ],
      figures: [
        {
          src: "/projects/youtube-chatbot.png",
          alt: "YouTube Chatbot’s Streamlit interface with the video URL field, Load video button, and chat input",
          width: 1649,
          height: 942,
          caption:
            "Streamlit UI with video URL field, Load video control, and chat input.",
        },
      ],
      results: [
        "Public Streamlit deploy is linked from the portfolio.",
        "Retriever k=4 matches both portfolio copy and rag.py search_kwargs.",
      ],
    },
  },
  {
    slug: "recipenest",
    name: "RecipeNest",
    category: "Full-stack product · Recipe management",
    summary:
      "An independently built recipe management app with auth, browsing, creation, categories, favorites, an admin dashboard, and eSewa subscriptions.",
    description:
      "Full-stack recipe platform on React, Express, and MongoDB, with eSewa as the payment integration for paid subscriptions.",
    highlights: [
      "Recipe browsing, search, creation, categories, favorites, and an administrative dashboard.",
      "Express backend handles eSewa payment initiation, verification, and transaction status.",
    ],
    stack: ["React", "Express", "MongoDB", "Node.js", "eSewa"],
    featured: false,
    image: {
      src: "/projects/RecipeNest.png",
      alt: "RecipeNest recipe browsing interface",
      width: 1600,
      height: 900,
    },
    evidence: null,
    caseStudyHref: "/projects/recipenest",
    links: [
      {
        label: "Open RecipeNest",
        href: "https://recipenest-nepal.onrender.com/",
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/SiddhantaShrestha/RecipeNest-Nepal",
        external: true,
      },
    ],
    caseStudy: {
      overview:
        "RecipeNest is an independently developed full-stack recipe management application. It covers registration and authentication, recipe browsing and management, favorites, an admin dashboard, and eSewa-paid subscriptions.",
      problem: {
        heading: "Problem and motivation",
        body: "A recipe product needs everyday content workflows plus a local payment path for premium access. RecipeNest combines recipe management features with eSewa subscription handling on an Express backend.",
      },
      role: {
        heading: "My role",
        body: "Independently developed. I built the application across the React frontend, Express API, MongoDB data layer, and eSewa payment integration.",
      },
      architecture: {
        summary:
          "React frontend, Express backend, MongoDB. eSewa routes and UI components exist in source for payment initiate, verify, and status. PayPal appears only as an unused frontend dependency and is not a working integration.",
        steps: [
          {
            title: "Frontend",
            detail:
              "React app for auth, recipe browsing/search, creation and management, categories/filtering, favorites, admin dashboard, and eSewa payment UI.",
          },
          {
            title: "Backend API",
            detail:
              "Express routes for application features and eSewa payment initiation, verification, and transaction status.",
          },
          {
            title: "Data store",
            detail: "MongoDB as the application database.",
          },
        ],
      },
      features: [
        "User registration and authentication.",
        "Recipe browsing and searching.",
        "Recipe creation and management.",
        "Recipe categories and filtering.",
        "Favorites and saved recipes.",
        "Administrative dashboard.",
        "eSewa payment integration for subscriptions.",
      ],
      decisions: [
        {
          title: "Ship eSewa only",
          body: "Working payment integration is eSewa. A PayPal package may appear in frontend dependencies, but it is not treated as an implemented payment path.",
        },
      ],
      figures: [
        {
          src: "/projects/RecipeNest.png",
          alt: "RecipeNest recipe browsing interface",
          width: 1600,
          height: 900,
          caption: "RecipeNest recipe browsing interface.",
        },
      ],
      results: [
        "Live Render deployment and public GitHub repository are linked from the portfolio.",
      ],
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}

export function getSecondaryProjects(): Project[] {
  return projects.filter((project) => !project.featured);
}
