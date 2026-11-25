import type { CSSProperties } from "react";
import type { CaseStudyArchStep } from "@/content/projects";
import { cn } from "@/lib/cn";

type CsArchitectureProps = {
  summary: string;
  steps: CaseStudyArchStep[];
};

/**
 * Architecture flow built from verified steps only.
 *
 * - Below xl: a vertical rail. From md up each stage uses two columns so the
 *   title and the explanation stay at a comfortable line length.
 * - From xl: a horizontal flow with a connecting line between stage nodes.
 *
 * It is a semantic ordered list. Nodes and connectors are decorative.
 */
export function CsArchitecture({ summary, steps }: CsArchitectureProps) {
  const horizontal = steps.length >= 3 && steps.length <= 5;
  const columns = { "--stage-count": steps.length } as CSSProperties;

  return (
    <div>
      <p className="max-w-3xl text-base leading-8 text-muted sm:text-[1.0625rem]">
        {summary}
      </p>

      {steps.length > 0 ? (
        <ol
          className={cn(
            "mt-12 grid",
            horizontal
              ? "xl:[grid-template-columns:repeat(var(--stage-count),minmax(0,1fr))] xl:gap-x-8"
              : null,
          )}
          style={columns}
          aria-label="Architecture flow, in order"
        >
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isBoundary = Boolean(step.badge);

            return (
              <li
                key={step.title}
                className={cn(
                  "relative pb-12 pl-9 last:pb-0",
                  horizontal ? "xl:pb-0 xl:pl-0 xl:pt-12" : null,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[0.4rem] left-0 size-3 border bg-background",
                    isBoundary ? "border-violet bg-violet/30" : "border-accent",
                    horizontal ? "xl:top-0" : null,
                  )}
                />
                {isLast ? null : (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[1.2rem] -bottom-[0.35rem] left-[0.34rem] w-px bg-line-strong",
                      horizontal
                        ? "xl:top-[0.34rem] xl:right-[-2rem] xl:bottom-auto xl:left-5 xl:h-px xl:w-auto"
                        : null,
                    )}
                  />
                )}

                <div
                  className={cn(
                    "md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10",
                    horizontal ? "xl:block" : null,
                  )}
                >
                  <div className={horizontal ? "xl:min-h-[6.5rem]" : undefined}>
                    <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
                      Stage {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 text-lg leading-snug font-medium text-foreground">
                      {step.title}
                    </h3>
                    {step.badge ? (
                      <p className="mt-3 inline-block border border-violet/50 px-2 py-0.5 font-mono text-[0.62rem] tracking-[0.14em] text-violet uppercase">
                        {step.badge}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "mt-3 md:mt-0",
                      horizontal ? "xl:mt-3" : null,
                    )}
                  >
                    <p className="max-w-xl text-[0.9rem] leading-7 text-muted xl:text-[0.84rem] xl:leading-6">
                      {step.detail}
                    </p>
                    {step.tags && step.tags.length > 0 ? (
                      <ul
                        className="mt-4 flex flex-wrap gap-1.5 xl:flex-col xl:items-start"
                        aria-label={`${step.title} details`}
                      >
                        {step.tags.map((tag) => (
                          <li
                            key={tag}
                            className="border border-line bg-surface/70 px-2 py-0.5 font-mono text-[0.65rem] tracking-wide text-foreground/80"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
