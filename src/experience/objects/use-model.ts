"use client";

import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

/**
 * Loads one optimized GLB. The decoder for Meshopt compression is bundled
 * with three-stdlib, so passing false for Draco keeps drei from fetching a
 * decoder from a CDN. Results are cached by URL.
 */
export function useModel(url: string): Group {
  return useGLTF(url, false).scene;
}

/** Starts a model download at module load, before the scene mounts. */
export function preloadModel(url: string) {
  useGLTF.preload(url, false);
}
