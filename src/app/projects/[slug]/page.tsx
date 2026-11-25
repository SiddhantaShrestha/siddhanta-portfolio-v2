import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/components/case-study/case-study-page";
import { CaseStudyView } from "@/components/projects/case-study-view";
import { CaseStudyJsonLd } from "@/components/seo/case-study-json-ld";
import { getProjectBySlug, projects } from "@/content/projects";
import { profile } from "@/content/site";
import { getSiteUrl } from "@/lib/env";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found",
    };
  }

  const shareTitle = `${project.name} — ${profile.name}`;

  return {
    title: project.name,
    description: project.summary,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      type: "article",
      title: shareTitle,
      description: project.summary,
      url: `/projects/${project.slug}`,
      siteName: profile.name,
      locale: "en_US",
      authors: [profile.name],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: project.summary,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const published = project.caseStudy?.published === true;

  return (
    <main id="main">
      {published ? (
        <>
          <CaseStudyJsonLd project={project} siteUrl={getSiteUrl()} />
          <CaseStudyPage project={project} />
        </>
      ) : (
        <CaseStudyView project={project} />
      )}
    </main>
  );
}
