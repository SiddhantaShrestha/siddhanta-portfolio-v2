import type { Project } from "@/content/projects";
import { caseStudyJsonLd } from "@/lib/structured-data";

type CaseStudyJsonLdProps = {
  project: Project;
  siteUrl: string;
};

export function CaseStudyJsonLd({ project, siteUrl }: CaseStudyJsonLdProps) {
  const json = JSON.stringify(caseStudyJsonLd(project, siteUrl)).replace(
    /</g,
    "\\u003c",
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
