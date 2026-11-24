"use client";

import { cn } from "@/lib/cn";

type ThreeDSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

/** Accessible on/off switch for the 3D scene. */
export function ThreeDSwitch({
  checked,
  disabled,
  onToggle,
}: ThreeDSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="3D scene"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-9 items-center gap-2.5 rounded-full border border-line-strong bg-surface/80 px-3 font-mono text-[0.65rem] tracking-[0.16em] uppercase transition-colors pointer-coarse:min-h-11",
        "hover:border-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong",
        checked ? "text-accent" : "text-muted",
      )}
    >
      <span aria-hidden>3D</span>
      <span
        aria-hidden
        className={cn(
          "relative h-4 w-7 rounded-full border transition-colors",
          checked
            ? "border-accent bg-accent/25"
            : "border-line-strong bg-background/60",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 left-0.5 size-2.5 -translate-y-1/2 rounded-full transition-transform motion-reduce:transition-none",
            checked ? "translate-x-3 bg-accent" : "translate-x-0 bg-muted",
          )}
        />
      </span>
      <span className="sr-only">{checked ? "On" : "Off"}</span>
    </button>
  );
}
