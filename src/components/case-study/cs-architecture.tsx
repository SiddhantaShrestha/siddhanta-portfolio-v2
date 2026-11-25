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
 * - Below 2xl: a vertical rail. From md up each stage uses two columns so the
 *   title and the explanation stay at a comfortable line length.
 * - From 2xl: a horizontal flow with a connecting line and arrow between
 *   stage nodes.
 * - A step with a `badge` is a boundary stage. It gets a violet node, a
 *   tinted panel and a badge so it stands apart from the other stages.
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
              ? "2xl:[grid-template-columns:repeat(var(--stage-count),minmax(0,1fr))] 2xl:gap-x-10"
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
                  "relative pb-10 pl-9 last:pb-0",
                  horizontal ? "2xl:pb-0 2xl:pl-0 2xl:pt-12" : null,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 size-3 border",
                    isBoundary
                      ? "top-[1.4rem] border-violet bg-violet sm:top-[1.65rem]"
                      : "top-[0.45rem] border-accent bg-background",
                    horizontal ? "2xl:top-0" : null,
                  )}
                />
                {isLast ? null : (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-[0.35rem] left-[0.34rem] w-px bg-line-strong",
                      isBoundary
                        ? "top-[2.2rem] sm:top-[2.45rem]"
                        : "top-[1.25rem]",
                      horizontal
                        ? "2xl:top-[0.34rem] 2xl:right-[-2.5rem] 2xl:bottom-auto 2xl:left-5 2xl:h-px 2xl:w-auto 2xl:after:absolute 2xl:after:top-1/2 2xl:after:right-0 2xl:after:size-[7px] 2xl:after:-translate-y-1/2 2xl:after:rotate-45 2xl:after:border-t 2xl:after:border-r 2xl:after:border-foreground/40"
                        : null,
                    )}
                  />
                )}

                <div
                  className={cn(
                    horizontal
                      ? "2xl:-mx-3 2xl:block 2xl:border 2xl:p-3"
                      : null,
                    isBoundary
                      ? "border border-violet/35 bg-violet/[0.07] p-4 sm:p-5"
                      : horizontal
                        ? "2xl:border-transparent"
                        : null,
                  )}
                >
                  <div
                    className={cn(
                      "md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10",
                      horizontal ? "2xl:block" : null,
                    )}
                  >
                    <div
                      className={horizontal ? "2xl:min-h-[7.5rem]" : undefined}
                    >
                      <p
                        className={cn(
                          "font-mono text-[0.75rem] tracking-[0.18em] uppercase",
                          isBoundary ? "text-violet" : "text-accent",
                        )}
                      >
                        Stage {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 text-xl leading-snug font-medium text-balance text-foreground 2xl:text-[1.1875rem]">
                        {step.title}
                      </h3>
                      {step.badge ? (
                        <p className="mt-3 inline-block border border-violet/60 bg-violet/15 px-2 py-1 font-mono text-[0.75rem] leading-none tracking-[0.06em] whitespace-nowrap text-violet uppercase">
                          {step.badge}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        "mt-3 md:mt-0",
                        horizontal ? "2xl:mt-4" : null,
                      )}
                    >
                      <p className="max-w-xl text-[0.9375rem] leading-[1.7] text-muted">
                        {step.detail}
                      </p>
                      {step.tags && step.tags.length > 0 ? (
                        <ul
                          className="mt-5 flex flex-wrap gap-2 2xl:flex-col 2xl:items-start"
                          aria-label={`${step.title} details`}
                        >
                          {step.tags.map((tag) => (
                            <li
                              key={tag}
                              className="max-w-full border border-line bg-surface/70 px-2 py-1 font-mono text-[0.75rem] leading-snug tracking-wide break-words text-foreground/85"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
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
