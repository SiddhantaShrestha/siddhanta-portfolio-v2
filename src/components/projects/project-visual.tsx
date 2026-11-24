import Image from "next/image";
import type { Project } from "@/content/projects";

type ProjectVisualProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectVisual({
  project,
  priority = false,
}: ProjectVisualProps) {
  if (project.image) {
    return (
      <div className="overflow-hidden border border-line bg-surface">
        <Image
          src={project.image.src}
          alt={project.image.alt}
          width={project.image.width}
          height={project.image.height}
          priority={priority}
          className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  if (project.evidence) {
    return (
      <div className="flex min-h-56 flex-col justify-between border border-line bg-surface-raised p-6 sm:min-h-72 sm:p-8">
        <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
          Evidence
        </p>
        <div>
          <p className="text-lg text-foreground">{project.evidence.title}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {project.evidence.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-56 place-items-center border border-line bg-surface text-sm text-muted">
      Visual reserved
    </div>
  );
}
