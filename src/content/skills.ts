export type SkillGroup = {
  id: string;
  title: string;
  items: Array<{
    name: string;
    usedIn: string[];
  }>;
};

/**
 * Only technologies verified on the current portfolio.
 * No DevOps group until tools are confirmed.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend",
    items: [
      { name: "React", usedIn: ["Recruit Nepal", "CiteDocs"] },
      { name: "Next.js", usedIn: ["Recruit Nepal", "CiteDocs"] },
      { name: "Tailwind CSS", usedIn: ["Recruit Nepal"] },
      { name: "shadcn/ui", usedIn: ["Recruit Nepal"] },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    items: [
      { name: "Node.js", usedIn: ["Recruit Nepal", "RecipeNest"] },
      { name: "Express", usedIn: ["Recruit Nepal", "RecipeNest"] },
      { name: "REST APIs", usedIn: ["Recruit Nepal"] },
      { name: "Python", usedIn: ["Research Evaluation Agent"] },
    ],
  },
  {
    id: "ai",
    title: "AI",
    items: [
      {
        name: "Azure AI Document Intelligence",
        usedIn: ["Recruit Nepal"],
      },
      { name: "Embeddings and semantic search", usedIn: ["CiteDocs"] },
      { name: "Ollama", usedIn: ["CiteDocs"] },
      { name: "Gemini", usedIn: ["CiteDocs", "Job Post Automation"] },
      { name: "Groq", usedIn: ["Research Evaluation Agent"] },
      { name: "LangChain", usedIn: ["YouTube Chatbot"] },
      { name: "Hugging Face embeddings", usedIn: ["YouTube Chatbot"] },
      { name: "OpenRouter", usedIn: ["YouTube Chatbot"] },
    ],
  },
  {
    id: "automation",
    title: "Automation",
    items: [
      { name: "n8n", usedIn: ["Job Post Automation"] },
      { name: "Webhooks", usedIn: ["Job Post Automation"] },
      {
        name: "Google Drive and LinkedIn integrations",
        usedIn: ["Job Post Automation"],
      },
    ],
  },
  {
    id: "databases",
    title: "Databases",
    items: [
      { name: "pgvector", usedIn: ["CiteDocs"] },
      { name: "FAISS", usedIn: ["YouTube Chatbot"] },
    ],
  },
  {
    id: "cloud",
    title: "Cloud and deployment",
    items: [
      { name: "Azure AI", usedIn: ["Recruit Nepal"] },
      { name: "Vercel", usedIn: ["CiteDocs"] },
      { name: "Render", usedIn: ["RecipeNest"] },
      { name: "Streamlit Community Cloud", usedIn: ["YouTube Chatbot"] },
    ],
  },
];
