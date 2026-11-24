"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/** Frames that must render after shaders are compiled before we reveal. */
const SETTLE_FRAMES = 2;

type SceneReadyProps = { onReady: () => void };

/**
 * Reports "ready" only when the whole scene can be shown.
 *
 * This component sits inside the same Suspense boundary as the models, so it
 * only mounts once every model and texture has loaded. The Canvas starts with
 * frameloop="never", so nothing is drawn while the shaders link. It then waits
 * for compileAsync, switches to on-demand rendering, renders a couple of frames (the environment and the
 * contact shadows are drawn on the first one) and only after that tells the
 * shell to fade the canvas in. Until then the poster stays on screen, so there
 * is never a blank frame or a half built model.
 */
export function SceneReady({ onReady }: SceneReadyProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  const compiled = useRef(false);
  const frames = useRef(0);
  const reported = useRef(false);

  useEffect(() => {
    let cancelled = false;
    performance.mark("3d-assets-loaded");

    gl.compileAsync(scene, camera)
      .catch(() => {
        // Not critical. The first render compiles whatever is missing.
      })
      .finally(() => {
        if (cancelled) return;
        performance.mark("3d-shaders-compiled");
        compiled.current = true;
        // The canvas starts with frameloop="never". Drawing before the
        // programs are linked makes WebGL block the main thread until the GPU
        // process finishes linking, so the first frame waits for compileAsync.
        setFrameloop("demand");
        invalidate(SETTLE_FRAMES + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, invalidate, setFrameloop]);

  useFrame(() => {
    if (!compiled.current || reported.current) return;
    frames.current += 1;
    if (frames.current < SETTLE_FRAMES) return;
    reported.current = true;
    // Wait for the browser to present the frame that was just rendered.
    requestAnimationFrame(() => {
      performance.mark("3d-first-complete-frame");
      onReady();
    });
  });

  return null;
}
