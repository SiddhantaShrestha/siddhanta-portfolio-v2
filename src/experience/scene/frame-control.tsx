"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

const AMBIENT_FPS = 24;

type FrameControlProps = {
  active: boolean;
  /** Request frames at a steady rate for ambient motion. */
  ambient: boolean;
  onReady: () => void;
  onFail: () => void;
};

/**
 * Frame lifecycle for a demand-driven canvas.
 *
 * - Nothing renders unless something calls invalidate().
 * - While active and ambient motion is on, a timer asks for 24 frames a second.
 * - When the stage leaves the viewport or the tab is hidden, the timer stops
 *   and the loop goes fully idle. Becoming active again renders one frame
 *   immediately.
 * - Reports the first rendered frame so the shell can reveal the canvas.
 * - Reports WebGL context loss so the shell can return to the poster.
 */
export function FrameControl({
  active,
  ambient,
  onReady,
  onFail,
}: FrameControlProps) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    onReady();
  });

  useEffect(() => {
    if (!active) return;
    invalidate();
    if (!ambient) return;

    const timer = window.setInterval(invalidate, 1000 / AMBIENT_FPS);
    return () => window.clearInterval(timer);
  }, [active, ambient, invalidate]);

  // Compile shaders in parallel (KHR_parallel_shader_compile) instead of
  // blocking the main thread inside the first render call.
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    gl.compileAsync(scene, camera).catch(() => {
      // Not critical. The first render compiles whatever is missing.
    });
  }, [gl, scene, camera]);

  useEffect(() => {
    function onLost(event: Event) {
      event.preventDefault();
      onFail();
    }
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [canvas, onFail]);

  return null;
}
