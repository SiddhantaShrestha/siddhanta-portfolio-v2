import { useLayoutEffect, type RefObject } from "react";
import { Color, Object3D, type InstancedMesh } from "three";

export type InstanceSpec = {
  position: readonly [number, number, number];
  scale?: readonly [number, number, number];
  color?: string;
};

const dummy = new Object3D();
const tint = new Color();

/**
 * Writes transforms (and optional per-instance colors) into an InstancedMesh.
 * The mesh and its geometry and material are owned by React Three Fiber, so
 * nothing needs disposing here.
 */
export function useInstances(
  ref: RefObject<InstancedMesh | null>,
  specs: readonly InstanceSpec[],
) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    specs.forEach((spec, index) => {
      dummy.position.set(...spec.position);
      dummy.scale.set(...(spec.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      if (spec.color) mesh.setColorAt(index, tint.set(spec.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [ref, specs]);
}
