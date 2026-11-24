import { workstationStations } from "@/content/lab";

type WorkstationStageProps = {
  /**
   * Phase 3 will honor this preference when mounting WebGL.
   * Phase 2 only documents the control surface.
   */
  prefer3d?: boolean;
};

/**
 * Poster stage for the future 3D workstation.
 * Keeps a stable aspect ratio and accessible station links.
 * Phase 3 can mount a canvas above this poster when WebGL is enabled.
 */
export function WorkstationStage({ prefer3d = true }: WorkstationStageProps) {
  return (
    <div
      className="workstation-stage aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[16/10]"
      data-workstation-stage
      data-prefer-3d={prefer3d ? "true" : "false"}
      data-state="poster"
      aria-label="Developer workstation preview. Interactive 3D arrives in a later phase."
    >
      <div className="workstation-scan" aria-hidden />

      <div className="relative z-10 flex h-full flex-col p-4 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-accent uppercase">
              Workstation
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Interactive 3D scene reserved. Stations below are live navigation
              today.
            </p>
          </div>
          <p className="hidden font-mono text-[0.65rem] tracking-[0.16em] text-violet uppercase sm:block">
            Phase 3 ready
          </p>
        </div>

        <div className="relative mt-4 min-h-0 flex-1">
          <svg
            viewBox="0 0 960 560"
            className="h-full w-full"
            aria-hidden="true"
            focusable="false"
          >
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                d="M80 430 H880"
                className="text-line-strong"
                opacity="0.9"
              />
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

        <ul className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
          {workstationStations.map((station) => (
            <li key={station.id}>
              <a
                href={station.href}
                className="flex min-h-12 flex-col justify-center border border-line bg-surface/70 px-3 transition-colors hover:border-accent focus-visible:border-accent"
              >
                <span className="text-sm text-foreground">{station.label}</span>
                <span className="text-xs text-muted">
                  {station.description}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-3 hidden font-mono text-[0.65rem] tracking-wide text-muted sm:block">
          Prefer 3D: {prefer3d ? "on" : "off"} · user toggle arrives with the
          scene
        </p>
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
