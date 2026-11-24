"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const AMBIENT_FPS = 24;

type FrameControlProps = {
  active: boolean;
  /** Request frames at a steady rate for ambient motion. */
  ambient: boolean;
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
 * - Reports WebGL context loss so the shell can return to the poster.
 *
 * The "ready" signal lives in scene-ready.tsx, because it must wait for the
 * models to load.
 */
export function FrameControl({ active, ambient, onFail }: FrameControlProps) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!active) return;
    invalidate();
    if (!ambient) return;

    const timer = window.setInterval(invalidate, 1000 / AMBIENT_FPS);
    return () => window.clearInterval(timer);
  }, [active, ambient, invalidate]);

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
