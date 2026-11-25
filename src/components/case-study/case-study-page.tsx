import { CsArchitecture } from "@/components/case-study/cs-architecture";
import { CsContribution } from "@/components/case-study/cs-contribution";
import { CsDecisions } from "@/components/case-study/cs-decisions";
import { CsEvaluation } from "@/components/case-study/cs-evaluation";
import { CsFeatureList } from "@/components/case-study/cs-feature-list";
import { CsGallery } from "@/components/case-study/cs-gallery";
import { CsHero } from "@/components/case-study/cs-hero";
import { CsLinksStack } from "@/components/case-study/cs-links-stack";
import { CsOverview } from "@/components/case-study/cs-overview";
import { CsPager } from "@/components/case-study/cs-pager";
import { CsProse } from "@/components/case-study/cs-prose";
import { CsResults } from "@/components/case-study/cs-results";
import { CsSection } from "@/components/case-study/cs-section";
import {
  DEFAULT_CASE_STUDY_SECTION_ORDER,
  type CaseStudySectionId,
  type Project,
} from "@/content/projects";

type CaseStudyPageProps = {
  project: Project;
};

type SectionSpec = {
  id: CaseStudySectionId;
  label: string;
  title: string;
  wide?: boolean;
  content: React.ReactNode;
};

/**
 * Orders built sections. Listed ids come first; any remaining content appends
 * in the default CiteDocs order. Unknown ids in `preferred` are ignored.
 */
function orderSections(
  sections: SectionSpec[],
  preferred?: CaseStudySectionId[],
): SectionSpec[] {
  if (!preferred || preferred.length === 0) {
    return sections;
  }

  const byId = new Map(sections.map((section) => [section.id, section]));
  const ordered: SectionSpec[] = [];

  for (const id of preferred) {
    const section = byId.get(id);
    if (!section) continue;
    ordered.push(section);
    byId.delete(id);
  }

  for (const id of DEFAULT_CASE_STUDY_SECTION_ORDER) {
    const section = byId.get(id);
    if (!section) continue;
    ordered.push(section);
    byId.delete(id);
  }

  return ordered;
}

/**
 * Builds the list of sections that have verified content. A section with no
 * data is left out, so projects without metrics, screenshots, or detailed
 * architecture still render cleanly.
 */
function buildSections(project: Project): SectionSpec[] {
  const study = project.caseStudy;
  const sections: SectionSpec[] = [];

  if (!study) {
    return sections;
  }

  if (study.overview) {
    sections.push({
      id: "overview",
      label: "Overview",
      title: `What ${project.name} is`,
      content: <CsOverview overview={study.overview} glance={study.glance} />,
    });
  }

  if (study.problem) {
    sections.push({
      id: "problem",
      label: "Problem",
      title: study.problem.heading,
      content: <CsProse>{study.problem.body}</CsProse>,
    });
  }

  if (study.role) {
    sections.push({
      id: "role",
      label: "Role",
      title: study.role.heading,
      content: (
        <CsContribution
          body={study.role.body}
          contributions={study.contributions}
        />
      ),
    });
  }

  if (study.architecture && study.architecture.steps.length > 0) {
    sections.push({
      id: "architecture",
      label: study.architecture.label ?? "Architecture",
      title: study.architecture.heading ?? "How it is built",
      wide: true,
      content: (
        <CsArchitecture
          summary={study.architecture.summary}
          steps={study.architecture.steps}
        />
      ),
    });
  }

  if (study.features && study.features.length > 0) {
    sections.push({
      id: "features",
      label: "Features",
      title: "Key features",
      content: <CsFeatureList features={study.features} />,
    });
  }

  if (study.decisions && study.decisions.length > 0) {
    sections.push({
      id: "decisions",
      label: "Decisions",
      title: "Engineering decisions and challenges",
      wide: true,
      content: <CsDecisions decisions={study.decisions} />,
    });
  }

  if (study.figures && study.figures.length > 0) {
    sections.push({
      id: "screenshots",
      label: study.galleryLabel ?? "Screenshots",
      title: study.galleryTitle ?? "The product in use",
      wide: true,
      content: (
        <CsGallery
          figures={study.figures}
          layout={study.galleryLayout ?? "grid"}
        />
      ),
    });
  }

  if (study.evaluation) {
    sections.push({
      id: "evidence",
      label: "Evidence",
      title: "Technical evidence and results",
      wide: true,
      content: <CsEvaluation evaluation={study.evaluation} />,
    });
  } else if (project.evidence || (study.results && study.results.length > 0)) {
    sections.push({
      id: "evidence",
      label: "Evidence",
      title: "Technical evidence and results",
      content: (
        <CsResults evidence={project.evidence} results={study.results ?? []} />
      ),
    });
  }

  return orderSections(sections, study.sectionOrder);
}

/** Case study layout. Server rendered; expandable figures use a small client island. */
export function CaseStudyPage({ project }: CaseStudyPageProps) {
  const sections = buildSections(project);

  return (
    <article className="section-shell">
      <CsHero project={project} />

      {sections.map((section, index) => (
        <CsSection
          key={section.id}
          id={section.id}
          index={String(index + 1).padStart(2, "0")}
          label={section.label}
          title={section.title}
          wide={section.wide}
        >
          {section.content}
        </CsSection>
      ))}

      <CsSection
        id="stack"
        index={String(sections.length + 1).padStart(2, "0")}
        label="Stack"
        title="Technology and links"
      >
        <CsLinksStack stack={project.stack} links={project.links} />
      </CsSection>

      <CsPager slug={project.slug} />
    </article>
  );
}
