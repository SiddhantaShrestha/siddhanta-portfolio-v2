/**
 * Plain TypeScript types shared by the client shell and the 3D experience.
 * Nothing here may import three.js, React Three Fiber or Drei.
 */

/** "full" is the desktop tier. "light" is for phones, tablets and Save-Data. */
export type ExperienceTier = "full" | "light";

export type ExperienceProps = {
  /** True while the stage is on screen and the tab is visible. */
  active: boolean;
  tier: ExperienceTier;
  /** Reduced motion: render a still view, no parallax, no ambient motion. */
  calm: boolean;
  /** Called once, after the first frame has been rendered. */
  onReady: () => void;
  /** Called when the scene cannot continue, for example on WebGL context loss. */
  onFail: () => void;
};
