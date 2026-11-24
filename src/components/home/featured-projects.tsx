import { ProjectCard } from "@/components/projects/project-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFeaturedProjects, getSecondaryProjects } from "@/content/projects";

export function FeaturedProjects() {
  const featured = getFeaturedProjects();
  const secondary = getSecondaryProjects();

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="scroll-mt-24"
    >
      <div className="section-shell pt-16 pb-4 sm:pt-20">
        <SectionHeading
          index="01"
          title="Selected work"
          titleId="projects-heading"
          description="Verified projects from the current portfolio. Recruit Nepal and CiteDocs lead. The rest stay easy to reach."
        />
      </div>

      <div className="section-shell">
        {featured.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            featured
            reverse={index % 2 === 1}
            priority={index === 0}
          />
        ))}
      </div>

      <div className="section-shell border-t border-line pt-10 pb-6">
        <h3 className="font-mono text-[0.7rem] tracking-[0.18em] text-muted uppercase">
          More work
        </h3>
        <div className="mt-2">
          {secondary.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
