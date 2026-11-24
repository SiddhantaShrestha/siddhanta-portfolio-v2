"use client";

import dynamic from "next/dynamic";
import type { ExperienceProps } from "@/lib/workstation/types";

/**
 * The only file allowed to import from src/experience (see eslint.config.mjs).
 * ssr: false keeps three.js out of the server render and out of the initial
 * client bundle. The chunk is requested only when this component mounts.
 */
const WorkstationExperience = dynamic(
  () => import("@/experience/workstation-experience"),
  { ssr: false },
);

export function ExperienceLoader(props: ExperienceProps) {
  return <WorkstationExperience {...props} />;
}
