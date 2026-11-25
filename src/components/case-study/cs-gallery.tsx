import { CsExpandableFigure } from "@/components/case-study/cs-expandable-figure";
import type { CaseStudyFigure } from "@/content/projects";
import { cn } from "@/lib/cn";

type CsGalleryProps = {
  figures: CaseStudyFigure[];
  /**
   * "stack" shows each figure full width (better for product screenshots).
   * "grid" pairs figures from md up. Default grid keeps CiteDocs-safe behavior
   * when a multi-image gallery is added later.
   */
  layout?: "grid" | "stack";
};

/** Captioned screenshots. The page omits the section when there are none. */
export function CsGallery({ figures, layout = "grid" }: CsGalleryProps) {
  const stack = layout === "stack" || figures.length === 1;

  return (
    <div
      className={cn(
        "grid gap-12 sm:gap-14",
        !stack && figures.length > 1 && "md:grid-cols-2 md:gap-10",
      )}
    >
      {figures.map((figure, index) => (
        <div
          key={figure.src}
          className={cn(
            !stack &&
              index === 0 &&
              figures.length % 2 === 1 &&
              "md:col-span-2",
          )}
        >
          <CsExpandableFigure
            figure={figure}
            prominent={stack}
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
