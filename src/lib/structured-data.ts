import type { Project } from "@/content/projects";
import { profile } from "@/content/site";

export function personJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.jobTitle,
    description: profile.description,
    url: siteUrl,
    email: profile.email,
    telephone: profile.phoneHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lalitpur",
      addressCountry: "NP",
    },
    sameAs: [
      profile.social.github,
      profile.social.linkedin,
      profile.social.currentPortfolio,
    ],
  };
}

/**
 * Structured data for a published case study page. Uses public project
 * fields only: name, summary, stack, and the page URL.
 */
export function caseStudyJsonLd(project: Project, siteUrl: string) {
  const pageUrl = `${siteUrl}/projects/${project.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#case-study`,
        name: `${project.name} case study`,
        headline: project.name,
        description: project.summary,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        inLanguage: "en",
        keywords: project.stack.join(", "),
        author: {
          "@type": "Person",
          name: profile.name,
          url: siteUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: `${siteUrl}/#projects`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}
