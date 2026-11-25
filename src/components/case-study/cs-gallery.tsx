import Image from "next/image";
import type { CaseStudyFigure } from "@/content/projects";
import { cn } from "@/lib/cn";

type CsGalleryProps = {
  figures: CaseStudyFigure[];
};

/** Captioned screenshots. The page omits the section when there are none. */
export function CsGallery({ figures }: CsGalleryProps) {
  return (
    <div className={cn("grid gap-10", figures.length > 1 && "md:grid-cols-2")}>
      {figures.map((figure, index) => (
        <figure
          key={figure.src}
          className={cn(
            index === 0 && figures.length % 2 === 1 && "md:col-span-2",
          )}
        >
          <div className="overflow-hidden border border-line bg-surface">
            <Image
              src={figure.src}
              alt={figure.alt}
              width={figure.width}
              height={figure.height}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1072px"
            />
          </div>
          <figcaption className="mt-3 max-w-2xl text-[0.9375rem] leading-6 text-muted">
            {figure.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
