import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import type { Project } from "@/content/projects";

type CsHeroProps = {
  project: Project;
};

export function CsHero({ project }: CsHeroProps) {
  const [primary, ...others] = project.links;

  return (
    <header className="pt-12 pb-14 sm:pt-16 sm:pb-20">
      <TextLink href="/#projects" className="gap-2" size="lg">
        <ArrowLeft size={14} aria-hidden />
        Back to projects
      </TextLink>

      <p className="mt-12 font-mono text-[0.75rem] tracking-[0.2em] text-violet uppercase">
        {project.category}
      </p>
      <h1 className="font-display mt-5 max-w-5xl text-[3.25rem] leading-[0.98] tracking-tight text-foreground sm:text-7xl lg:text-[6.5rem]">
        {project.name}
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
        {project.summary}
      </p>

      {project.links.length > 0 ? (
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          {primary ? (
            <ButtonLink
              href={primary.href}
              external={primary.external}
              size="lg"
            >
              {primary.label}
              <ArrowUpRight size={16} aria-hidden />
            </ButtonLink>
          ) : null}
          {others.map((link) => (
            <TextLink
              key={link.href}
              href={link.href}
              external={link.external}
              size="lg"
            >
              {link.label}
              <ArrowUpRight size={14} aria-hidden />
            </TextLink>
          ))}
        </div>
      ) : null}
    </header>
  );
}
