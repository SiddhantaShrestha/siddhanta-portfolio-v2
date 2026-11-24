import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { FIT_BOUNDS } from "@/experience/config/layout";

/**
 * Cinematic three-quarter view. The camera sits to the left and slightly
 * above the desk so the orb and control panel read first, the monitor stays
 * central and the rack closes the composition on the right.
 */
export const CAMERA = {
  fov: 30,
  /**
   * Where the stations may sit, in view coordinates from -1 (bottom) to 1
   * (top). The intro text sits at the top and the station dock at the bottom,
   * so the content is kept between them.
   */
  safe: {
    wide: { x: 0.93, top: 0.8, bottom: -0.56 },
    portrait: { x: 0.94, top: 0.84, bottom: -0.5 },
  },
  /** Pointer parallax is small on purpose. Radians at the screen edge. */
  parallax: { yaw: MathUtils.degToRad(3.5), pitch: MathUtils.degToRad(1.6) },
} as const;

/** Orientation per layout. Tall stages look down more to use the height. */
function orientation(aspect: number) {
  const tall = MathUtils.clamp((1.3 - aspect) / 0.5, 0, 1);
  return {
    azimuth: MathUtils.degToRad(-19 - 3 * tall),
    elevation: MathUtils.degToRad(17 + 9 * tall),
  };
}

const CORNERS: Vector3[] = FIT_BOUNDS.flatMap(({ min, max }) => {
  const points: Vector3[] = [];
  for (const x of [min[0], max[0]])
    for (const y of [min[1], max[1]])
      for (const z of [min[2], max[2]]) points.push(new Vector3(x, y, z));
  return points;
});

const toCamera = new Vector3();
const right = new Vector3();
const up = new Vector3();
const forward = new Vector3();
const center = new Vector3();
const UP = new Vector3(0, 1, 0);
const scratch = new Vector3();

/**
 * Places the camera so every fit box is inside the safe area.
 * The target is the middle of the projected boxes, and the distance is the
 * smallest one that keeps every corner inside the view.
 * px and py are pointer offsets in the range -1 to 1.
 */
export function applyCameraPose(
  camera: PerspectiveCamera,
  aspect: number,
  px: number,
  py: number,
) {
  const base = orientation(aspect);
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

  // Extents of all corners along the camera axes.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const corner of CORNERS) {
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

  const safe = aspect < 1 ? CAMERA.safe.portrait : CAMERA.safe.wide;
  const halfHeight = (safe.top - safe.bottom) / 2;
  const centerY = (safe.top + safe.bottom) / 2;
  const tanHalf = Math.tan(MathUtils.degToRad(camera.fov) / 2);
  let distance = 0;
  for (const corner of CORNERS) {
    scratch.copy(corner).sub(center);
    const x = Math.abs(scratch.dot(right));
    const y = Math.abs(scratch.dot(up));
    const toward = scratch.dot(toCamera);
    const need = Math.max(
      x / (tanHalf * aspect * safe.x),
      y / (tanHalf * halfHeight),
    );
    distance = Math.max(distance, need + toward);
  }

  // Look slightly below the content so it sits inside the safe band.
  center.addScaledVector(up, -centerY * distance * tanHalf);
  camera.position.copy(center).addScaledVector(toCamera, distance);
  camera.lookAt(center);
}
