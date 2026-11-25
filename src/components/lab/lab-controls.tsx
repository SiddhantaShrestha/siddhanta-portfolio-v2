import { cn } from "@/lib/cn";

type LabControlsProps = {
  canPrev: boolean;
  canNext: boolean;
  blockedAtValidation: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
};

export function LabControls({
  canPrev,
  canNext,
  blockedAtValidation,
  onPrev,
  onNext,
  onReset,
}: LabControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className={controlClass(!canPrev)}
      >
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={controlClass(!canNext)}
        title={
          blockedAtValidation
            ? "Validation blocked later stages for this scenario"
            : undefined
        }
      >
        Next
      </button>
      <button
        type="button"
        onClick={onReset}
        className="ml-auto min-h-11 border border-line bg-surface/60 px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        Reset
      </button>
    </div>
  );
}

function controlClass(disabled: boolean) {
  return cn(
    "min-h-11 border px-4 text-sm tracking-wide transition-colors",
    disabled
      ? "cursor-not-allowed border-line bg-background text-muted/50"
      : "border-accent/40 bg-accent/10 text-foreground hover:border-accent hover:bg-accent/15",
  );
}
