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
};

/** One verified architecture / pipeline step. No speculative diagrams. */
export type CaseStudyArchStep = {
  title: string;
  detail: string;
};

export type CaseStudyDecision = {
  title: string;
  body: string;
};

/**
 * Optional case study detail. Homepage cards ignore this object.
 * Omit or leave fields undefined when evidence is missing.
 * Phase 4B will render these sections; Phase 4A only stores verified draft copy.
 */
export type ProjectCaseStudy = {
  overview?: string;
  problem?: CaseStudySection;
  role?: CaseStudySection;
  architecture?: {
    summary: string;
    steps: CaseStudyArchStep[];
  };
  features?: string[];
  decisions?: CaseStudyDecision[];
  figures?: CaseStudyFigure[];
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
      "Built and integrated Node.js and Express APIs, and worked with Azure AI Document Intelligence for CV extraction and prompt refinement in recruitment flows.",
    ],
    stack: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "shadcn/ui",
      "Node.js",
      "Express",
      "Azure AI Document Intelligence",
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
      overview:
        "Recruit Nepal is a hiring platform that connects candidates and employers across Nepal. It is one of my major professional engineering projects as a Full Stack Developer. The product is built collaboratively; this write-up covers the breadth of my contributions across frontend, backend, and AI features without claiming sole ownership of every module.",
      problem: {
        heading: "Problem and motivation",
        body: "Hiring teams needed shared workflows for jobs, applications, review, and matching. Structured CV data and AI-assisted steps had to fit into recruiter tools without forcing manual re-entry from PDFs.",
      },
      role: {
        heading: "My role",
        body: "Full Stack Developer at Intern Nepal / Recruit Nepal (Jun 2025–present), after an earlier intern period (Jul 2024–Jan 2025). I have worked extensively across almost every major part of the platform: employer dashboards and interfaces; backend APIs and integrations; AI-powered CV extraction; candidate search and matching; recruiter workflows; application tracking and management; relevant Intern Nepal CRM development and integrations; and broader frontend and backend platform work. The platform is developed with a team. I do not claim to be the sole developer or to have personally implemented every individual feature.",
      },
      architecture: {
        summary:
          "Public portfolio and experience copy describe a React/Next.js client with Node.js/Express REST APIs and Azure AI Document Intelligence for CV processing. Internal infrastructure diagrams are not public, so steps below stay at the contribution layer rather than private ops detail.",
        steps: [
          {
            title: "Employer and recruiter clients",
            detail:
              "Employer dashboards, recruiter workflows, and related UI built with React, Next.js, Tailwind CSS, and shadcn/ui.",
          },
          {
            title: "APIs and integrations",
            detail:
              "Node.js and Express REST APIs and integrations behind candidate, recruiter, and application workflows.",
          },
          {
            title: "AI CV extraction",
            detail:
              "Azure AI Document Intelligence extracts structured information from CVs; prompts are refined for AI-assisted recruitment steps.",
          },
          {
            title: "Search, matching, and tracking",
            detail:
              "Candidate search and matching capabilities plus application tracking and management surfaces used in day-to-day hiring.",
          },
          {
            title: "CRM-related work",
            detail:
              "Relevant Intern Nepal CRM development and integrations connected to the broader recruitment product line.",
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
            "Applicant review dashboard on the test server using demo applicant rows. Recruiters can review AI suggestions and update hiring stages. Not a production screenshot; no real candidate personal data visible in this export.",
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
      overview:
        "CiteDocs is an independently developed team-document Q&A app. Questions are answered only from chunks the signed-in role may read, and each answer cites the supporting passage.",
      problem: {
        heading: "Problem and motivation",
        body: "Teams need answers grounded in their own documents without leaking admin-only material to members. Chat over a shared corpus fails when visibility differs by role.",
      },
      role: {
        heading: "My role",
        body: "Independently developed. I implemented document uploading and processing; embedding generation and semantic retrieval; permission-based document access controls; AI question answering with source citations; backend and database architecture; the frontend interface; retrieval evaluation and improvements; and application deployment.",
      },
      architecture: {
        summary:
          "Next.js App Router with Prisma and Postgres/pgvector. Embeddings and answers default to local Ollama; optional hosted Gemini. Similarity search uses raw SQL against vector(768); other queries use Prisma.",
        steps: [
          {
            title: "Auth and membership",
            detail:
              "Email/password auth. Users belong to a team as admin or member. Role and team are read from the server session on each ask.",
          },
          {
            title: "Documents and chunks",
            detail:
              "Upload text or PDF. Visibility is team or admins, copied onto every chunk at upload. Chunks default to 300 characters with a small overlap.",
          },
          {
            title: "Embeddings",
            detail:
              "Default Ollama nomic-embed-text into vector(768). Hosted path uses gemini-embedding-001 truncated to 768. Chunks store the embedding model name; mismatched providers refuse ask until re-index.",
          },
          {
            title: "Permission-filtered retrieval",
            detail:
              "Vector search filters by team and role in SQL. No post-fetch hiding. Exact scan in the demo (no HNSW) so permission filters are not undermined by approximate neighbors.",
          },
          {
            title: "Answer with citations",
            detail:
              "Top-5 chunks by default. The app numbers sentences in retrieved chunks, asks the model for a sentence number, and prints that exact sentence to avoid model rewrites mixing facts.",
          },
        ],
      },
      features: [
        "Document upload and processing.",
        "Embedding generation and semantic retrieval.",
        "Permission-based document access (team vs admins).",
        "AI answers with source citations.",
        "Retrieval evaluation suite and iterative improvements.",
        "Deployed demo application.",
      ],
      decisions: [
        {
          title: "Filter permissions inside vector search",
          body: "Members must never retrieve admins chunks even when those chunks are nearest. Search applies team and role filters in SQL instead of fetching neighbors and hiding them afterward.",
        },
        {
          title: "No vector index in the demo",
          body: "HNSW can return fewer than top-k rows after a permission filter. An exact scan keeps evaluation and the permission demo predictable.",
        },
        {
          title: "Sentence-number copy for answers",
          body: "After retrieval found the right bonus-payment chunk, the chat model still rewrote and mixed facts. Numbering sentences and copying the chosen sentence fixed that failure mode.",
        },
        {
          title: "Chunk size chosen from Hit@5 tests",
          body: "300-character passages scored best for local vector Hit@5 (36/41). Larger chunks helped keyword search but hurt vector Hit@5 and MRR. The product ask path uses vectors only; keyword and hybrid remain comparison methods.",
        },
      ],
      figures: [],
      results: [
        "Retrieval evaluation (not a general answer-accuracy score): with 300-character passages, vector search placed the expected source in the top five results for 36 of 41 questions (87.8% Hit@5). Hit@1 was 20/41 (48.8%); MRR 0.653.",
        "Keyword Hit@5 at 300 characters: 27/41. Hybrid Hit@5: 34/41. Gemini embeddings tied local vectors on Hit@5 (36/41) in the same suite.",
        "Automated permission check: a member ask never returns a seeded admins chunk even when that chunk text matches the question.",
        "Product screenshots remain pending. The live demo requires sign-in; Phase 4A keeps the existing evidence panel rather than fabricating UI captures.",
      ],
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
      overview:
        "AI and workflow automation for hiring posts. A vacancy arrives by webhook, required fields are checked, Gemini helps prepare caption and poster content, and the team workflow publishes to LinkedIn, Facebook, and Instagram. Detailed node-level evidence in the public repository covers the LinkedIn path.",
      problem: {
        heading: "Problem and motivation",
        body: "Manual hiring posts repeat the same caption and creative work across channels. Automation keeps intake, generation, and publishing consistent when vacancies arrive as structured payloads.",
      },
      role: {
        heading: "My role",
        body: "Developed collaboratively with a team. Public evidence includes the n8n LinkedIn workflow export and README. Broader multi-network publishing (Facebook and Instagram) is confirmed for the team project; those channel implementations are not fully documented in the public LinkedIn-focused repository.",
      },
      architecture: {
        summary:
          "Confirmed team capability: webhook intake, validation, Gemini-assisted generation, and publishing to LinkedIn, Facebook, and Instagram. Structured steps below follow the public n8n LinkedIn export. Facebook and Instagram publishing is confirmed at the product level without inventing undocumented API or scheduler details.",
        steps: [
          {
            title: "Authenticated webhook",
            detail:
              "POST JSON vacancy payload. Required fields in the public export include title and link; description, company, location, and employment type are optional helpers.",
          },
          {
            title: "Validate fields",
            detail:
              "Workflow checks required fields before calling generation steps.",
          },
          {
            title: "Gemini-assisted content",
            detail:
              "Public export uses Gemini 2.5 Flash for caption writing and poster image edit prompts.",
          },
          {
            title: "Brand logo from Google Drive",
            detail:
              "Where supported by the public export, the workflow downloads a brand logo from Google Drive for the poster.",
          },
          {
            title: "Social publishing",
            detail:
              "Team project publishes to LinkedIn, Facebook, and Instagram. The public repository documents LinkedIn OAuth posting. Facebook and Instagram mechanisms are confirmed as project outputs, not reconstructed from missing public exports.",
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
          alt: "Job Post Automation workflow diagram",
          width: 1400,
          height: 900,
          caption:
            "Exported n8n workflow diagram for the documented LinkedIn vacancy-to-post path.",
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
