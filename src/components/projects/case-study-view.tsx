import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/project-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { TechList } from "@/components/ui/tech-list";
import { TextLink } from "@/components/ui/text-link";
import type { Project } from "@/content/projects";

type CaseStudyViewProps = {
  project: Project;
};

export function CaseStudyView({ project }: CaseStudyViewProps) {
  return (
    <article className="section-shell py-14 sm:py-20">
      <TextLink href="/#projects" className="gap-2">
        <ArrowLeft size={14} aria-hidden />
        Back to projects
      </TextLink>

      <p className="mt-10 font-mono text-[0.7rem] tracking-[0.18em] text-violet uppercase">
        {project.category}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {project.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {project.description}
      </p>

      <p className="mt-6 max-w-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        This is a Phase 2 case study stub. Full write-ups arrive in Phase 4.
        Everything below is verified from the current portfolio.
      </p>

      <div className="mt-10 max-w-4xl">
        <ProjectVisual project={project} priority />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <h2 className="text-xl text-foreground">What was built</h2>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-muted">
            {project.highlights.map((item) => (
              <li key={item} className="border-l border-line pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl text-foreground">Stack</h2>
          <div className="mt-4">
            <TechList items={project.stack} />
          </div>
          <div className="mt-8 flex flex-col items-start gap-3">
            {project.links.map((link) => (
              <ButtonLink
                key={link.href}
                href={link.href}
                external={link.external}
                variant="secondary"
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </ButtonLink>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
