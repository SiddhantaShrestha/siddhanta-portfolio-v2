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

type Bounds = {
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
  { min: [-0.88, 0, -0.66], max: [0.88, 1.3, -0.2] },
  // AI orb with its rings and glow
  { min: [-1.95, 0, -0.62], max: [-1.05, 0.98, 0.26] },
  // Control panel
  { min: [-1.5, 0, 0.05], max: [-0.55, 0.3, 0.96] },
  // Server rack
  { min: [1.2, 0, -0.42], max: [1.8, 0.85, 0.24] },
];
