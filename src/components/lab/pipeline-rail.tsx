import type { LabStage } from "@/content/lab-workflows/types";
import { cn } from "@/lib/cn";

type PipelineRailProps = {
  stages: LabStage[];
  activeIndex: number;
  maxReachableStageIndex: number;
  onSelect: (index: number) => void;
};

export function PipelineRail({
  stages,
  activeIndex,
  maxReachableStageIndex,
  onSelect,
}: PipelineRailProps) {
  return (
    <ol
      className="grid grid-cols-5 gap-1 sm:gap-2"
      aria-label="Workflow stages"
    >
      {stages.map((stage, index) => {
        const locked = index > maxReachableStageIndex;
        const active = index === activeIndex;
        const complete = index < activeIndex && !locked;

        return (
          <li key={stage.id} className="relative min-w-0">
            {index < stages.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-5 right-[-0.35rem] left-[calc(50%+1.1rem)] h-px sm:right-[-0.45rem] sm:left-[calc(50%+1.25rem)]",
                  index < maxReachableStageIndex ? "bg-line-strong" : "bg-line",
                )}
              />
            ) : null}
            <button
              type="button"
              aria-current={active ? "step" : undefined}
              aria-label={
                locked
                  ? `${stage.title}, locked for this scenario`
                  : stage.title
              }
              onClick={() => onSelect(index)}
              className={cn(
                "relative z-10 flex w-full min-w-0 flex-col items-center gap-2 px-1 py-2 text-center transition-colors hover:text-foreground",
                locked ? "opacity-55" : null,
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center border font-mono text-[0.7rem] tracking-wide",
                  active &&
                    "border-accent bg-accent/15 text-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
                  !active &&
                    complete &&
                    "border-accent/40 bg-accent/5 text-accent",
                  !active &&
                    !complete &&
                    !locked &&
                    "border-line-strong bg-surface text-muted",
                  locked && "border-line bg-background text-muted",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-[0.65rem] leading-snug sm:text-[0.7rem]",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                {stage.title}
              </span>
              {locked ? (
                <span className="font-mono text-[0.55rem] tracking-[0.12em] text-violet uppercase">
                  Locked
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
