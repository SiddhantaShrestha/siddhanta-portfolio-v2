import type { StationId } from "@/content/lab";

/**
 * Scene units are roughly meters. +y is up, +z points toward the viewer.
 * The desk top sits at y = 0.
 *
 * Every station is one self-contained component that takes a position and
 * rotation. Replacing a blockout with a GLB model later only changes that one
 * component. This table and the camera framing stay the same.
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

export const DESK = {
  width: 4.2,
  depth: 1.7,
  thickness: 0.07,
  legHeight: 0.62,
} as const;

export const KEYBOARD_POSITION = [0.05, 0, 0.5] as const;
