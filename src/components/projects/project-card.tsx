import { ArrowUpRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/project-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { TechList } from "@/components/ui/tech-list";
import { TextLink } from "@/components/ui/text-link";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/cn";

type ProjectCardProps = {
  project: Project;
  featured?: boolean;
  reverse?: boolean;
  priority?: boolean;
};

export function ProjectCard({
  project,
  featured = false,
  reverse = false,
  priority = false,
}: ProjectCardProps) {
  return (
    <article
      className={cn(
        "group border-t border-line py-10 sm:py-14",
        featured && "lg:py-16",
      )}
      data-reveal
    >
      <div
        className={cn(
          "grid gap-8 lg:items-center",
          featured
            ? "lg:grid-cols-[1.05fr_0.95fr] lg:gap-12"
            : "md:grid-cols-[0.9fr_1.1fr] md:gap-10",
          reverse && featured && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
            {project.category}
          </p>
          <h3
            className={cn(
              "mt-3 tracking-tight text-foreground",
              featured
                ? "text-3xl sm:text-4xl lg:text-5xl"
                : "text-2xl sm:text-3xl",
            )}
          >
            {project.name}
          </h3>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            {project.summary}
          </p>
          <div className="mt-6">
            <TechList items={project.stack} />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ButtonLink href={project.caseStudyHref} variant="secondary">
              Read case study
            </ButtonLink>
            {project.links.map((link) => (
              <TextLink
                key={link.href}
                href={link.href}
                external={link.external}
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </TextLink>
            ))}
          </div>
        </div>

        <ProjectVisual project={project} priority={priority} />
      </div>
    </article>
  );
}
