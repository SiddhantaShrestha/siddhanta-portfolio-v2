"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

const AMBIENT_FPS = 24;

type FrameControlProps = {
  active: boolean;
  /** Request frames at a steady rate for ambient motion. */
  ambient: boolean;
  /** The browser took the WebGL context away. It may still give it back. */
  onContextLost: () => void;
  /** The browser returned the context. The shell decides what to do next. */
  onContextRestored: () => void;
};

/**
 * Frame lifecycle for a demand-driven canvas.
 *
 * - Nothing renders unless something calls invalidate().
 * - While active and ambient motion is on, a timer asks for 24 frames a second.
 * - When the stage leaves the viewport or the tab is hidden, the timer stops
 *   and the loop goes fully idle. Becoming active again renders one frame
 *   immediately.
 * - Reports WebGL context loss and restoration. Calling preventDefault() on
 *   the loss event is what allows the browser to restore the context later.
 *   While the context is lost no frames are requested.
 *
 * The "ready" signal lives in scene-ready.tsx, because it must wait for the
 * models to load.
 */
export function FrameControl({
  active,
  ambient,
  onContextLost,
  onContextRestored,
}: FrameControlProps) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const lost = useRef(false);

  useEffect(() => {
    if (!active || lost.current) return;
    invalidate();
    if (!ambient) return;

    const timer = window.setInterval(() => {
      if (!lost.current) invalidate();
    }, 1000 / AMBIENT_FPS);
    return () => window.clearInterval(timer);
  }, [active, ambient, invalidate]);

  useEffect(() => {
    function onLost(event: Event) {
      event.preventDefault();
      lost.current = true;
      onContextLost();
    }
    function onRestored() {
      lost.current = false;
      onContextRestored();
    }
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [canvas, onContextLost, onContextRestored]);

  return null;
}
