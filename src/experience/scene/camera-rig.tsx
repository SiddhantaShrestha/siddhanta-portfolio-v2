"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera } from "three";
import { applyCameraPose } from "@/experience/config/camera";

type CameraRigProps = {
  /** Pointer parallax. Turned off for calm mode and the light tier. */
  parallax: boolean;
};

/**
 * Owns the camera pose. The pose is re-applied on every rendered frame, so
 * resizes (which trigger a render) refit the framing automatically.
 * The frame loop is on demand: the rig only asks for another frame while the
 * parallax is still moving.
 */
export function CameraRig({ parallax }: CameraRigProps) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Touch and pen input never drive parallax, only a fine mouse does.
    if (!parallax) {
      target.current.x = 0;
      target.current.y = 0;
      invalidate();
      return;
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      target.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      target.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      invalidate();
    }

    function onLeave() {
      target.current.x = 0;
      target.current.y = 0;
      invalidate();
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [canvas, invalidate, parallax]);

  // Read camera and size from the frame state, not from React state. On a
  // demand loop the frame that follows a resize can run before React has
  // re-rendered this component, which would apply the pose with a stale size.
  useFrame((state, delta) => {
    const { camera, size } = state;
    if (!(camera instanceof PerspectiveCamera)) return;
    if (size.width === 0 || size.height === 0) return;

    const pose = current.current;
    const goal = target.current;
    pose.x = MathUtils.damp(pose.x, goal.x, 4, delta);
    pose.y = MathUtils.damp(pose.y, goal.y, 4, delta);

    applyCameraPose(camera, size.width / size.height, pose.x, pose.y);
    if (
      Math.abs(pose.x - goal.x) > 0.001 ||
      Math.abs(pose.y - goal.y) > 0.001
    ) {
      invalidate();
    }
  });

  return null;
}
