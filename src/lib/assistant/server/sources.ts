import "server-only";

import { navItems } from "@/content/navigation";
import { projects } from "@/content/projects";
import { isSafeSourceHref } from "@/lib/assistant/shared/protocol";
import type { SourceLink } from "@/lib/assistant/shared/protocol";

/**
 * The only links the assistant can ever show.
 * Keys come from model markers like [[project:citedocs]] or [[page:lab]].
 * Everything is built from verified portfolio data, never from model text.
 */
export type SourceCatalog = ReadonlyMap<string, SourceLink>;

const PAGE_KEYS = ["lab", "contact", "projects", "about"] as const;

let cached: SourceCatalog | null = null;

export function getSourceCatalog(): SourceCatalog {
  if (cached) return cached;

  const catalog = new Map<string, SourceLink>();

  for (const project of projects) {
    if (!project.caseStudy?.published) continue;
    const link = { label: project.name, href: project.caseStudyHref };
    if (isSafeSourceHref(link.href)) {
      catalog.set(`project:${project.slug}`, link);
    }
  }

  for (const key of PAGE_KEYS) {
    const item = navItems.find((nav) => nav.id === key);
    if (!item) continue;
    const link = { label: item.label, href: item.href };
    if (isSafeSourceHref(link.href)) {
      catalog.set(`page:${key}`, link);
    }
  }

  cached = catalog;
  return catalog;
}

/** Resolve a marker body such as "project:citedocs". Unknown keys return null. */
export function resolveSource(
  key: string,
  catalog: SourceCatalog = getSourceCatalog(),
): SourceLink | null {
  return catalog.get(key) ?? null;
}

export function listSourceKeys(
  catalog: SourceCatalog = getSourceCatalog(),
): string[] {
  return [...catalog.keys()];
}
