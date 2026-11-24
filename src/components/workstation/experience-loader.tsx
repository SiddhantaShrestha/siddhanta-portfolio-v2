"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { ExperienceProps } from "@/lib/workstation/types";

/**
 * The only file allowed to import from src/experience (see eslint.config.mjs).
 *
 * The experience is loaded with a dynamic import, so three.js stays out of the
 * server render and out of the initial client bundle. The chunk is requested
 * only when this component mounts, and this component is only mounted on the
 * client.
 *
 * The import is made by hand, not with next/dynamic or React.lazy, because
 * both remember a rejected import forever. Here every attempt calls import()
 * again, and a failure is rethrown during render so the error boundary above
 * handles it like any other 3D failure. Whether the bundler makes a fresh
 * request for a chunk that failed once depends on its runtime, so the shell
 * also offers a page reload.
 */
type Experience = ComponentType<ExperienceProps>;

type ExperienceLoaderProps = ExperienceProps & {
  /** Increases on every retry so a new import() is made. */
  attempt: number;
};

export function ExperienceLoader({ attempt, ...props }: ExperienceLoaderProps) {
  const [Experience, setExperience] = useState<Experience | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    import("@/experience/workstation-experience").then(
      (module) => {
        if (!cancelled) setExperience(() => module.default);
      },
      (reason: unknown) => {
        if (!cancelled) setError(reason ?? new Error("3D chunk failed"));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) throw error;
  return Experience ? <Experience {...props} /> : null;
}

/**
 * Clears cached model and texture results, failed ones included, before a
 * retry. Safe to call when the experience chunk never loaded.
 */
export async function resetExperienceCaches() {
  try {
    const { clearExperienceCaches } = await import("@/experience/recovery");
    clearExperienceCaches();
  } catch {
    // The chunk itself is unavailable. The retry will report it again.
  }
}
