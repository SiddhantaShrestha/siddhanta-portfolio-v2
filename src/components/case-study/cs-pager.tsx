import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { projects } from "@/content/projects";

type CsPagerProps = {
  slug: string;
};

/** Previous and next case study, in portfolio order. */
export function CsPager({ slug }: CsPagerProps) {
  const index = projects.findIndex((project) => project.slug === slug);

  if (index === -1) {
    return null;
  }

  const previous = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="More case studies"
      className="grid border-t border-line sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={previous.caseStudyHref}
          className="group flex flex-col gap-2 py-10 transition-colors hover:text-accent sm:pr-8"
        >
          <span className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase">
            <ArrowLeft size={14} aria-hidden />
            Previous case study
          </span>
          <span className="text-2xl tracking-tight text-foreground group-hover:text-accent">
            {previous.name}
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={next.caseStudyHref}
          className="group flex flex-col gap-2 border-t border-line py-10 transition-colors hover:text-accent sm:items-end sm:border-t-0 sm:border-l sm:pl-8 sm:text-right"
        >
          <span className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase">
            Next case study
            <ArrowRight size={14} aria-hidden />
          </span>
          <span className="text-2xl tracking-tight text-foreground group-hover:text-accent">
            {next.name}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
