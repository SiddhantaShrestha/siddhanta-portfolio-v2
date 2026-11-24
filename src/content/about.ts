export const aboutCopy = {
  heading: "About",
  body: "I’m pursuing an MSc in IT in Artificial Intelligence at Islington College. My work spans the application and the AI behind it. On CiteDocs, that meant building document permissions and testing whether search found the right passage. Before moving into development, I worked in customer success and led a recruitment CRM project from planning to its first release.",
} as const;

export type ExperienceRole = {
  title: string;
  organization: string;
  period: string;
  location: string;
  points: string[];
};

export const experience: ExperienceRole[] = [
  {
    title: "Full Stack Developer",
    organization: "Intern Nepal / Recruit Nepal",
    period: "Jun 2025 – present",
    location: "Lalitpur, Nepal",
    points: [
      "Built job listings, candidate workflows, and recruiter dashboards with React, Next.js, Tailwind CSS, and shadcn/ui for Recruit Nepal, a platform with 7,597 unique users as of November 2026.",
      "Developed and integrated the Node.js and Express REST APIs behind candidate and recruiter workflows.",
      "Worked with Azure AI Document Intelligence to extract information from CVs and refined prompts used in AI-assisted recruitment.",
    ],
  },
  {
    title: "Frontend and Project Tech Support Intern",
    organization: "Intern Nepal / Recruit Nepal",
    period: "Jul 2024 – Jan 2025",
    location: "Lalitpur, Nepal",
    points: [
      "Led a six-month recruitment CRM project from planning through delivery of its first working version.",
      "Tracked tasks and ownership in Trello throughout each sprint, from planning through the team retrospective.",
      "Maintained the project charter and meeting reports to keep developers and non-technical stakeholders aligned on decisions.",
    ],
  },
  {
    title: "Customer Success Representative",
    organization: "ING Skill Academy",
    period: "Sep 2023 – Feb 2024",
    location: "Kathmandu, Nepal",
    points: [
      "Guided customers through onboarding and answered questions as they started using the service.",
      "Collected customer feedback and shared it with internal teams to inform service improvements and retention efforts.",
    ],
  },
];
