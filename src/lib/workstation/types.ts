/**
 * Plain TypeScript types shared by the client shell and the 3D experience.
 * Nothing here may import three.js, React Three Fiber or Drei.
 */

import type { StationId } from "@/content/lab";

/** "full" is the desktop tier. "light" is for phones, tablets and Save-Data. */
export type ExperienceTier = "full" | "light";

export type ExperienceProps = {
  /** True while the stage is on screen and the tab is visible. */
  active: boolean;
  tier: ExperienceTier;
  /** Reduced motion: render a still view, no parallax, no ambient motion. */
  calm: boolean;
  /** Station the visitor has selected, or null for the overview. */
  selectedStation: StationId | null;
  /** True when the HTML panel uses the compact / bottom-sheet layout. */
  compactPanel: boolean;
  /** Called when a 3D hit target is clicked. */
  onSelectStation: (station: StationId | null) => void;
  /** Called once, after the first complete frame has been rendered. */
  onReady: () => void;
  /** Called when the scene cannot continue, for example on WebGL context loss. */
  onFail: () => void;
};
