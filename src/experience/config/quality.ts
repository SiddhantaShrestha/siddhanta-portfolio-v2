import type { ExperienceTier } from "@/lib/workstation/types";

type QualityConfig = {
  /** Min and max device pixel ratio passed to the Canvas. */
  dpr: [number, number];
  antialias: boolean;
  environmentResolution: number;
  shadowResolution: number;
};

export const QUALITY: Record<ExperienceTier, QualityConfig> = {
  full: {
    dpr: [1, 1.75],
    antialias: true,
    environmentResolution: 256,
    shadowResolution: 512,
  },
  light: {
    dpr: [1, 1.25],
    antialias: true,
    environmentResolution: 128,
    shadowResolution: 256,
  },
};
