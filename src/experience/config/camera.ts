import { MathUtils, PerspectiveCamera, Vector3 } from "three";

/**
 * Cinematic three-quarter view. The camera sits to the left and slightly
 * above the desk so the orb and control panel read first, the monitor stays
 * central and the rack closes the composition on the right.
 */
export const CAMERA = {
  fov: 30,
  target: new Vector3(0, 0.46, 0.05),
  azimuth: MathUtils.degToRad(-19),
  elevation: MathUtils.degToRad(17),
  /** The four stations plus a small margin must fit inside this box. */
  framing: { width: 4.5, height: 2.35 },
  /** Pointer parallax is small on purpose. Radians at the screen edge. */
  parallax: { yaw: MathUtils.degToRad(3.5), pitch: MathUtils.degToRad(1.6) },
} as const;

const offset = new Vector3();

/**
 * Distance that keeps the framing box inside the view for any stage aspect
 * ratio (4:5, 16:11 and 16:10 today).
 */
export function getFitDistance(fovDegrees: number, aspect: number): number {
  const halfFov = MathUtils.degToRad(fovDegrees) / 2;
  const fitWidth = CAMERA.framing.width / 2 / (Math.tan(halfFov) * aspect);
  const fitHeight = CAMERA.framing.height / 2 / Math.tan(halfFov);
  return Math.max(fitWidth, fitHeight);
}

/**
 * Places the camera on a sphere around the target.
 * px and py are pointer offsets in the range -1 to 1.
 */
export function applyCameraPose(
  camera: PerspectiveCamera,
  aspect: number,
  px: number,
  py: number,
) {
  const distance = getFitDistance(camera.fov, aspect);
  const azimuth = CAMERA.azimuth + px * CAMERA.parallax.yaw;
  const elevation = CAMERA.elevation - py * CAMERA.parallax.pitch;

  offset.set(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  camera.position.copy(CAMERA.target).addScaledVector(offset, distance);
  camera.lookAt(CAMERA.target);
}
