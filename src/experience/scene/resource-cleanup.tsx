"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Texture, type Material, type Mesh } from "three";

type Disposable = { dispose: () => void };

/**
 * Releases the models' GPU resources when the canvas goes away.
 *
 * Models and textures are cached by URL, so a second visit to 3D (the switch
 * turned off and on) reuses the same geometry and material objects. Every
 * renderer adds a "dispose" listener to each material, geometry and texture it
 * draws, and that listener keeps the renderer, its compiled programs and its
 * uniform locations alive. Without this, each on/off cycle leaves one more
 * renderer behind (about 0.3 MB of JavaScript heap and a pile of dead shader
 * programs). Disposing the shared objects fires the listeners, which removes
 * them. The objects stay valid and are uploaded again on the next mount.
 *
 * The list is taken when the models are in the scene, because they may already
 * be detached by the time the cleanup runs. Mount this next to the models,
 * inside the same Suspense boundary.
 */
export function ResourceCleanup() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const disposables = new Set<Disposable>();

    scene.traverse((object) => {
      const mesh = object as Partial<Mesh>;
      if (mesh.geometry) disposables.add(mesh.geometry);
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const material of materials as Material[]) {
        disposables.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof Texture) disposables.add(value);
        }
      }
    });

    return () => {
      for (const item of disposables) {
        try {
          item.dispose();
        } catch {
          // Already released with the renderer. Nothing to do.
        }
      }
    };
  }, [scene]);

  return null;
}
