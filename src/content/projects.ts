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
};

export const projects: Project[] = [
  {
    slug: "recruit-nepal",
    name: "Recruit Nepal",
    category: "Professional work · Full-stack developer",
    summary:
      "Recruit Nepal connects candidates and employers across Nepal. As of November 2026, the platform has 7,597 unique users.",
    description:
      "Hiring software that connects candidates and employers across Nepal. Work included CV processing with Azure AI Document Intelligence, job listings, candidate workflows, and recruiter dashboards.",
    highlights: [
      "Worked with Azure AI Document Intelligence to extract information from CVs and refined the prompts used in recruitment workflows.",
      "Built job listings, candidate workflows and recruiter dashboards with React and Next.js, and connected them to REST APIs using Node.js and Express.",
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
  },
  {
    slug: "citedocs",
    name: "CiteDocs",
    category: "Personal project · AI document search",
    summary:
      "A Q&A app that searches documents a teammate has permission to read and cites the passage behind each answer.",
    description:
      "Document Q&A with permission-aware search and cited passages. Retrieval was tested by passage length using pgvector.",
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
  },
  {
    slug: "job-post-automation",
    name: "Job Post Automation",
    category: "Workflow automation · n8n and Gemini",
    summary:
      "A vacancy arrives by webhook. The workflow checks the required fields, uses Gemini to write a caption and generate a poster with the company logo from Google Drive, then sends both to LinkedIn.",
    description:
      "n8n workflow that turns vacancy webhooks into LinkedIn hiring posts with Gemini-written captions and branded posters.",
    highlights: [
      "Connected vacancy webhooks, Gemini, Google Drive, and LinkedIn in n8n.",
      "Published to Recruit Nepal’s LinkedIn page through this workflow.",
    ],
    stack: ["n8n", "Gemini", "Google Drive", "LinkedIn", "Webhooks"],
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
        label: "GitHub",
        href: "https://github.com/SiddhantaShrestha/n8n-linkedin-job-post-automation",
        external: true,
      },
    ],
  },
  {
    slug: "research-evaluation-agent",
    name: "Research Evaluation Agent",
    category: "Applied AI · Python and Groq",
    summary:
      "A Python pipeline that drafts research reports from source documents. An evaluator scores each draft on relevance, completeness, clarity, and use of evidence.",
    description:
      "Python pipeline that drafts research reports, scores them, and revises drafts that fall below the quality threshold.",
    highlights: [
      "Below a score of 8, the revision agent uses the evaluator’s critique to edit the report.",
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
  },
  {
    slug: "recipenest",
    name: "RecipeNest",
    category: "Full-stack product · Payments",
    summary:
      "A recipe platform with paid subscriptions through eSewa. The Express backend handles payment initiation, verification, and transaction status.",
    description:
      "Recipe platform with eSewa subscription payments handled by an Express backend.",
    highlights: [
      "Express backend handles payment initiation, verification, and transaction status.",
    ],
    stack: ["Express", "eSewa", "Node.js"],
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
