"use client";

import { useEffect, useId, useRef } from "react";
import type { StationId } from "@/content/lab";
import { getStationPanel, PANEL_SIDE } from "@/content/stations";
import { cn } from "@/lib/cn";

function shorten(text: string, max: number) {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const at = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, at > 40 ? at : max - 1)}…`;
}

type StationPanelProps = {
  station: StationId;
  compact: boolean;
  onClose: () => void;
};

/**
 * Accessible HTML panel for a selected station. Sits outside the canvas.
 * Desktop: compact side card on the free half of the stage.
 * Smaller screens: bottom sheet so the 3D object stays visible above it.
 */
export function StationPanel({ station, compact, onClose }: StationPanelProps) {
  const content = getStationPanel(station);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const side = PANEL_SIDE[station];

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [station]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-station-panel
      data-side={side}
      data-compact={compact ? "true" : "false"}
      className={cn(
        "pointer-events-auto absolute z-20 flex flex-col border border-line bg-navy/94 text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm",
        compact
          ? "inset-x-3 bottom-3 max-h-[44%] rounded-md"
          : side === "left"
            ? "top-[4.75rem] bottom-[5.1rem] left-3 w-[min(15rem,32%)] rounded-md"
            : "top-[4.75rem] bottom-[5.1rem] right-3 w-[min(15rem,32%)] rounded-md",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[0.62rem] tracking-[0.2em] text-accent uppercase">
            {content.eyebrow}
          </p>
          <h2
            id={titleId}
            className="mt-1 text-[0.95rem] leading-snug tracking-tight text-foreground"
          >
            {content.title}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="shrink-0 border border-line px-2.5 py-1.5 font-mono text-[0.65rem] tracking-wide text-muted transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        >
          Back
          <span className="sr-only"> to overview</span>
        </button>
      </div>

      <div className="station-panel-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2.5">
        <p className="text-[0.8125rem] leading-6 text-foreground/70">
          {shorten(content.body, 130)}
        </p>

        {content.projects.length > 0 ? (
          <ul className="space-y-2">
            {content.projects.map((project) => (
              <li key={project.slug}>
                <a
                  href={project.href}
                  className="block border border-transparent border-l-accent/70 py-0.5 pl-2.5 transition-colors hover:border-l-accent focus-visible:border-l-accent"
                >
                  <span className="block text-[0.8125rem] leading-snug font-medium tracking-tight text-foreground">
                    {project.name}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] leading-5 text-foreground/60">
                    {shorten(project.summary, 68)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {content.notes.length > 0 ? (
          <ul className="space-y-1.5 border-t border-line pt-2.5">
            {content.notes.map((note) => (
              <li key={note} className="text-[0.7rem] leading-5 text-muted">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="border-t border-line px-3.5 py-2.5">
        <a
          href={content.sectionHref}
          className="inline-flex min-h-9 items-center font-mono text-[0.68rem] tracking-[0.14em] text-accent uppercase underline-offset-4 hover:underline focus-visible:underline"
        >
          {content.sectionLabel}
        </a>
      </div>
    </aside>
  );
}
