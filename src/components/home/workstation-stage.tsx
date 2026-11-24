import { WorkstationShell } from "@/components/workstation/workstation-shell";
import { workstationStations } from "@/content/lab";

/**
 * Hero workstation. The intro copy and SVG poster are server-rendered.
 * WorkstationShell (client) wraps them, loads 3D when allowed, and owns the
 * interactive station dock and information panels.
 */
export function WorkstationStage() {
  return <WorkstationShell header={<StageHeader />} poster={<PosterArt />} />;
}

function StageHeader() {
  return (
    <div>
      <p className="font-mono text-[0.65rem] tracking-[0.2em] text-accent uppercase">
        Workstation
      </p>
      <p
        data-stage-hint
        className="mt-2 max-w-xs text-sm text-muted sm:max-w-sm"
      >
        Pick a station to explore that part of the portfolio.
      </p>
    </div>
  );
}

function PosterArt() {
  return (
    <div data-poster-art className="absolute inset-0">
      <svg
        viewBox="0 0 960 560"
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M80 430 H880" className="text-line-strong" opacity="0.9" />
          <path
            d="M120 430 L180 300 H780 L840 430"
            className="text-line"
            opacity="0.7"
          />
          <rect
            x="300"
            y="120"
            width="360"
            height="210"
            rx="4"
            className="text-line-strong"
          />
          <rect
            x="318"
            y="138"
            width="324"
            height="160"
            rx="2"
            className="text-line"
            opacity="0.7"
          />
          <path
            d="M430 330 H530 V360 H430 Z"
            className="text-line"
            opacity="0.8"
          />
          <circle cx="220" cy="250" r="42" className="text-line-strong" />
          <circle
            cx="220"
            cy="250"
            r="22"
            className="text-accent"
            opacity="0.7"
          />
          <rect
            x="120"
            y="340"
            width="150"
            height="70"
            rx="4"
            className="text-line-strong"
          />
          <path
            d="M140 360 H250 M140 378 H220 M140 396 H235"
            className="text-accent"
            opacity="0.55"
          />
          <rect
            x="760"
            y="250"
            width="90"
            height="160"
            rx="3"
            className="text-line-strong"
          />
          <path
            d="M775 275 H835 M775 300 H835 M775 325 H835 M775 350 H835 M775 375 H820"
            className="text-violet"
            opacity="0.7"
          />
        </g>

        {workstationStations.map((station) => {
          const geometry = stationGeometry[station.id];
          return (
            <text
              key={station.id}
              className="fill-muted"
              x={geometry.labelX}
              y={geometry.labelY}
              fontSize="14"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {station.label}
            </text>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {workstationStations.map((station) => {
          const geometry = stationGeometry[station.id];
          return (
            <a
              key={station.id}
              href={station.href}
              className="station-link pointer-events-auto absolute border border-transparent focus-visible:border-accent"
              style={{
                left: `${(geometry.x / 960) * 100}%`,
                top: `${(geometry.y / 560) * 100}%`,
                width: `${(geometry.width / 960) * 100}%`,
                height: `${(geometry.height / 560) * 100}%`,
              }}
              aria-label={`${station.label}: ${station.description}`}
            >
              <span className="sr-only">
                {station.label}: {station.description}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

const stationGeometry = {
  monitor: {
    x: 292,
    y: 112,
    width: 376,
    height: 230,
    labelX: 318,
    labelY: 108,
  },
  orb: {
    x: 168,
    y: 198,
    width: 104,
    height: 104,
    labelX: 168,
    labelY: 190,
  },
  panel: {
    x: 112,
    y: 332,
    width: 166,
    height: 86,
    labelX: 120,
    labelY: 326,
  },
  rack: {
    x: 748,
    y: 240,
    width: 114,
    height: 180,
    labelX: 748,
    labelY: 232,
  },
} as const;
