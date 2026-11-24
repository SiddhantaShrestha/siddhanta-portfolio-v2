"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { Material, Mesh, Texture } from "three";

const TEXTURE_KEYS = [
  "map",
  "aoMap",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "envMap",
] as const;

/** Bytes for one texture on the GPU, with a full mip chain (about +33%). */
function textureBytes(texture: Texture): number {
  const image = texture.image as
    { width?: number; height?: number } | undefined;
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  return Math.round(width * height * 4 * (texture.generateMipmaps ? 1.33 : 1));
}

/**
 * Developer diagnostics. Does nothing unless the page URL has ?3dstats.
 * Reports draw calls, triangles and texture memory of the last frame to
 * window.__3dstats and the console. Never shipped to normal visitors.
 */
export function StatsProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const frames = useRef(0);
  const enabled = useRef<boolean | null>(null);

  useFrame((state) => {
    if (enabled.current === null) {
      enabled.current = new URLSearchParams(window.location.search).has(
        "3dstats",
      );
      // The loop is on demand, so ask for enough frames to reach the report.
      if (enabled.current) invalidate(40);
    }
    if (!enabled.current) return;
    frames.current += 1;
    // Wait until the scene has been shown, then do one clean main render so
    // helper passes (environment, contact shadows) do not skew the numbers.
    if (frames.current !== 8) return;
    gl.info.reset();
    gl.render(scene, state.camera);

    const seen = new Set<Texture>();
    scene.traverse((object) => {
      const mesh = object as Mesh;
      const materials = (
        Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      ) as Material[];
      for (const material of materials) {
        if (!material) continue;
        for (const key of TEXTURE_KEYS) {
          const texture = (material as unknown as Record<string, unknown>)[
            key
          ] as Texture | null | undefined;
          if (texture && texture.image) seen.add(texture);
        }
      }
    });
    let bytes = 0;
    for (const texture of seen) bytes += textureBytes(texture);

    const { render, memory } = gl.info;
    const stats = {
      drawCalls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
      materialTextures: seen.size,
      materialTextureMB: +(bytes / 1024 / 1024).toFixed(1),
    };
    (window as unknown as { __3dstats?: unknown }).__3dstats = stats;
    console.info("[3dstats]", JSON.stringify(stats));
  });

  return null;
}
