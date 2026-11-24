"use client";

import type { StationId } from "@/content/lab";
import { workstationStations } from "@/content/lab";
import { cn } from "@/lib/cn";

type StationDockProps = {
  /** When true, dock items select stations instead of navigating. */
  interactive: boolean;
  selectedStation: StationId | null;
  onSelect: (station: StationId) => void;
};

/**
 * Station list under the stage. In poster mode the items are section links.
 * In the live 3D view they select a station without scrolling the page.
 */
export function StationDock({
  interactive,
  selectedStation,
  onSelect,
}: StationDockProps) {
  return (
    <ul
      data-station-dock
      className="pointer-events-auto mt-3 grid grid-cols-2 gap-1.5 sm:hidden"
    >
      {workstationStations.map((station) => {
        const selected = selectedStation === station.id;
        const className = cn(
          "station-dock-item flex min-h-11 w-full flex-col justify-center border px-3 text-left transition-colors",
          selected
            ? "border-accent/80 bg-accent/10 text-foreground"
            : "border-line/70 bg-transparent text-foreground hover:border-accent/60 hover:bg-accent/5",
        );

        if (interactive) {
          return (
            <li key={station.id}>
              <button
                type="button"
                className={className}
                aria-pressed={selected}
                onClick={() => onSelect(station.id)}
              >
                <span className="font-mono text-[0.65rem] tracking-[0.14em] text-accent uppercase">
                  {station.label}
                </span>
                <span data-station-desc className="text-xs text-muted">
                  {station.description}
                </span>
              </button>
            </li>
          );
        }

        return (
          <li key={station.id}>
            <a href={station.href} className={className}>
              <span className="text-sm text-foreground">{station.label}</span>
              <span data-station-desc className="text-xs text-muted">
                {station.description}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
