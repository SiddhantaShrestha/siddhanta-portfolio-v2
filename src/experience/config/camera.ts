import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { StationId } from "@/content/lab";
import { PANEL_SIDE } from "@/content/stations";
import {
  FIT_BOUNDS,
  FOCUS_BOUNDS,
  FOCUS_PULLBACK,
  type Bounds,
} from "@/experience/config/layout";

export type SafeBand = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/**
 * Cinematic three-quarter view. The camera sits to the left and slightly
 * above the desk so the orb and control panel read first, the monitor stays
 * central and the rack closes the composition on the right.
 */
export const CAMERA = {
  fov: 30,
  /** Overview: fill more of the stage between the header and the dock. */
  overviewSafe: {
    wide: { left: -0.94, right: 0.94, top: 0.86, bottom: -0.62 },
    portrait: { left: -0.94, right: 0.94, top: 0.88, bottom: -0.54 },
  },
  /**
   * Focus: leave room for the HTML panel. Desktop leaves ~34% on the panel
   * side. Portrait leaves the bottom third for the sheet.
   */
  focusSafe: {
    wide: {
      // Keep ~42% of the frame free for the HTML panel so object and card
      // do not compete for the same pixels.
      leftPanel: { left: -0.18, right: 0.94, top: 0.86, bottom: -0.58 },
      rightPanel: { left: -0.94, right: 0.18, top: 0.86, bottom: -0.58 },
    },
    portrait: { left: -0.94, right: 0.94, top: 0.9, bottom: -0.1 },
  },
  focusDuration: 0.9,
  /** Pointer parallax is small on purpose. Radians at the screen edge. */
  parallax: { yaw: MathUtils.degToRad(3.5), pitch: MathUtils.degToRad(1.6) },
} as const;

/** Orientation per layout. Tall stages look down more to use the height. */
export function orientation(aspect: number) {
  const tall = MathUtils.clamp((1.3 - aspect) / 0.5, 0, 1);
  return {
    azimuth: MathUtils.degToRad(-19 - 3 * tall),
    elevation: MathUtils.degToRad(17 + 9 * tall),
  };
}

/** Small azimuth nudge so a focused station faces the free half of the frame. */
function focusOrientation(aspect: number, station: StationId) {
  const base = orientation(aspect);
  if (aspect < 1) {
    return {
      azimuth: base.azimuth,
      elevation: base.elevation + MathUtils.degToRad(2),
    };
  }
  const side = PANEL_SIDE[station];
  const byStation = {
    monitor: side === "right" ? 5 : -5,
    orb: 9,
    panel: 7,
    rack: -10,
  } as const;
  return {
    azimuth: base.azimuth + MathUtils.degToRad(byStation[station]),
    elevation: base.elevation,
  };
}

function cornersOf(bounds: readonly Bounds[]): Vector3[] {
  const points: Vector3[] = [];
  for (const { min, max } of bounds) {
    for (const x of [min[0], max[0]])
      for (const y of [min[1], max[1]])
        for (const z of [min[2], max[2]]) points.push(new Vector3(x, y, z));
  }
  return points;
}

const OVERVIEW_CORNERS = cornersOf(FIT_BOUNDS);
const FOCUS_CORNERS: Record<StationId, Vector3[]> = {
  monitor: cornersOf([FOCUS_BOUNDS.monitor]),
  orb: cornersOf([FOCUS_BOUNDS.orb]),
  panel: cornersOf([FOCUS_BOUNDS.panel]),
  rack: cornersOf([FOCUS_BOUNDS.rack]),
};

const toCamera = new Vector3();
const right = new Vector3();
const up = new Vector3();
const forward = new Vector3();
const center = new Vector3();
const UP = new Vector3(0, 1, 0);
const scratch = new Vector3();

export type CameraPoseParams = {
  aspect: number;
  px?: number;
  py?: number;
  station?: StationId | null;
  /** When true, use the portrait focus band (bottom sheet). */
  compactPanel?: boolean;
};

function resolveSafe(params: CameraPoseParams): SafeBand {
  const { aspect, station, compactPanel } = params;
  if (!station) {
    return aspect < 1 ? CAMERA.overviewSafe.portrait : CAMERA.overviewSafe.wide;
  }
  if (compactPanel || aspect < 1) {
    return CAMERA.focusSafe.portrait;
  }
  return PANEL_SIDE[station] === "left"
    ? CAMERA.focusSafe.wide.leftPanel
    : CAMERA.focusSafe.wide.rightPanel;
}

/**
 * Places the camera so the given bounds sit inside the safe band.
 * Overview uses every station. Focus uses one station and leaves space for
 * the HTML panel on the opposite side.
 */
export function applyCameraPose(
  camera: PerspectiveCamera,
  params: CameraPoseParams,
) {
  const aspect = params.aspect;
  const px = params.px ?? 0;
  const py = params.py ?? 0;
  const station = params.station ?? null;

  const base = station
    ? focusOrientation(aspect, station)
    : orientation(aspect);
  const azimuth = base.azimuth + px * CAMERA.parallax.yaw;
  const elevation = base.elevation - py * CAMERA.parallax.pitch;

  toCamera.set(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  forward.copy(toCamera).negate();
  right.crossVectors(forward, UP).normalize();
  up.crossVectors(right, forward).normalize();

  const corners = station ? FOCUS_CORNERS[station] : OVERVIEW_CORNERS;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    const x = corner.dot(right);
    const y = corner.dot(up);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  center.set(0, 0, 0).addScaledVector(right, midX).addScaledVector(up, midY);

  const safe = resolveSafe(params);
  const halfWidth = (safe.right - safe.left) / 2;
  const halfHeight = (safe.top - safe.bottom) / 2;
  const centerX = (safe.left + safe.right) / 2;
  const centerY = (safe.top + safe.bottom) / 2;
  const tanHalf = Math.tan(MathUtils.degToRad(camera.fov) / 2);

  let distance = 0;
  for (const corner of corners) {
    scratch.copy(corner).sub(center);
    const x = Math.abs(scratch.dot(right));
    const y = Math.abs(scratch.dot(up));
    const toward = scratch.dot(toCamera);
    const need = Math.max(
      x / (tanHalf * aspect * halfWidth),
      y / (tanHalf * halfHeight),
    );
    distance = Math.max(distance, need + toward);
  }

  if (station) {
    distance *= FOCUS_PULLBACK[station];
  }

  // Shift the look target so content sits inside the asymmetric safe band.
  center.addScaledVector(right, -centerX * distance * tanHalf * aspect);
  center.addScaledVector(up, -centerY * distance * tanHalf);
  camera.position.copy(center).addScaledVector(toCamera, distance);
  camera.lookAt(center);
}
