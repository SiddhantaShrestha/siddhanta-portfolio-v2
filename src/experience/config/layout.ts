import type { StationId } from "@/content/lab";

/**
 * Scene units are meters. +y is up, +z points toward the viewer.
 * The desk top sits at y = 0.
 *
 * Every station is one self-contained component that takes a position and
 * rotation. Models come from tools/blender, with their origin on the desk
 * plane, so this table and the camera framing stay the same when a model is
 * refined.
 */
export type StationPlacement = {
  position: readonly [number, number, number];
  rotationY: number;
};

export const STATION_PLACEMENT = {
  monitor: { position: [0, 0, -0.42], rotationY: 0 },
  orb: { position: [-1.5, 0, -0.18], rotationY: 0.2 },
  panel: { position: [-1.02, 0, 0.5], rotationY: 0.32 },
  rack: { position: [1.5, 0, -0.1], rotationY: -0.38 },
} as const satisfies Record<StationId, StationPlacement>;

export const KEYBOARD_POSITION = [0.05, 0, 0.5] as const;

/** Thickness of the desk mat. Monitor and keyboard sit on top of it. */
export const MAT_HEIGHT = 0.0105;

export type Bounds = {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
};

/**
 * Padded world-space boxes around what must always be visible. The camera
 * fits these boxes with a safe margin at every stage aspect ratio. The desk
 * is left out on purpose, it may run past the edges of the frame.
 */
export const FIT_BOUNDS: readonly Bounds[] = [
  // Monitor
  { min: [-0.82, 0, -0.62], max: [0.82, 1.26, -0.22] },
  // AI orb with its rings and glow
  { min: [-1.9, 0, -0.56], max: [-1.1, 0.96, 0.2] },
  // Control panel
  { min: [-1.42, 0, 0.1], max: [-0.62, 0.28, 0.9] },
  // Server rack
  { min: [1.22, 0, -0.38], max: [1.78, 0.84, 0.2] },
];

/**
 * Local-space hit boxes (centered on the station group origin). Sized so
 * neighboring stations do not overlap in world space from the overview.
 */
export const HIT_BOX: Record<
  StationId,
  {
    center: readonly [number, number, number];
    size: readonly [number, number, number];
  }
> = {
  monitor: { center: [0, 0.7, 0.02], size: [1.55, 1.15, 0.42] },
  orb: { center: [0, 0.48, 0], size: [0.72, 0.98, 0.72] },
  panel: { center: [0, 0.12, 0.02], size: [0.78, 0.28, 0.48] },
  rack: { center: [0, 0.42, 0], size: [0.48, 0.86, 0.46] },
};

/**
 * World-space boxes used when the camera focuses one station. Slightly
 * tighter than the overview fit boxes so the move feels intentional.
 * Larger boxes pull the camera back (panel and orb need more air).
 */
export const FOCUS_BOUNDS: Record<StationId, Bounds> = {
  monitor: { min: [-0.78, 0.02, -0.6], max: [0.78, 1.24, -0.16] },
  orb: { min: [-2.02, -0.02, -0.58], max: [-0.98, 1.05, 0.28] },
  panel: { min: [-1.62, -0.06, -0.08], max: [-0.4, 0.48, 1.08] },
  rack: { min: [1.16, -0.02, -0.42], max: [1.84, 0.92, 0.26] },
};

/** Extra distance after the fit, so dense stations are not cropped. */
export const FOCUS_PULLBACK: Record<StationId, number> = {
  monitor: 1.04,
  orb: 1.16,
  panel: 1.36,
  rack: 1.12,
};
