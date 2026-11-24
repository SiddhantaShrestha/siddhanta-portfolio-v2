"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { StationId } from "@/content/lab";
import { applyCameraPose, CAMERA } from "@/experience/config/camera";

type CameraRigProps = {
  /** Pointer parallax. Off in calm mode, light tier, and while focused. */
  parallax: boolean;
  /** Snap instead of tweening when reduced motion is on. */
  calm: boolean;
  selectedStation: StationId | null;
  compactPanel: boolean;
};

type FocusBlend = {
  /** 0 = overview, 1 = focused station. */
  amount: number;
};

const overviewPos = new Vector3();
const focusPos = new Vector3();
const overviewQuat = new Quaternion();
const focusQuat = new Quaternion();
const scratchCam = new PerspectiveCamera();

/**
 * Owns the camera pose. Overview and focus poses are blended with a short
 * gsap tween. The loop stays on demand: each tween tick asks for a frame.
 */
export function CameraRig({
  parallax,
  calm,
  selectedStation,
  compactPanel,
}: CameraRigProps) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);

  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });
  const blend = useRef<FocusBlend>({ amount: selectedStation ? 1 : 0 });
  const focusStation = useRef<StationId | null>(selectedStation);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!parallax || selectedStation) {
      pointerTarget.current.x = 0;
      pointerTarget.current.y = 0;
      invalidate();
      return;
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointerTarget.current.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.current.y =
        ((event.clientY - rect.top) / rect.height) * 2 - 1;
      invalidate();
    }

    function onLeave() {
      pointerTarget.current.x = 0;
      pointerTarget.current.y = 0;
      invalidate();
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [canvas, invalidate, parallax, selectedStation]);

  useEffect(() => {
    tweenRef.current?.kill();

    const goal = selectedStation ? 1 : 0;
    if (selectedStation) focusStation.current = selectedStation;

    if (calm) {
      blend.current.amount = goal;
      if (!selectedStation) focusStation.current = null;
      invalidate();
      return;
    }

    tweenRef.current = gsap.to(blend.current, {
      amount: goal,
      duration: CAMERA.focusDuration,
      ease: "power2.inOut",
      onUpdate: () => invalidate(),
      onComplete: () => {
        if (!selectedStation) focusStation.current = null;
        invalidate();
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [selectedStation, calm, invalidate]);

  useFrame((state, delta) => {
    const { camera, size } = state;
    if (!(camera instanceof PerspectiveCamera)) return;
    if (size.width === 0 || size.height === 0) return;

    const pose = pointerCurrent.current;
    const goal = pointerTarget.current;
    pose.x = MathUtils.damp(pose.x, goal.x, 4, delta);
    pose.y = MathUtils.damp(pose.y, goal.y, 4, delta);

    const amount = blend.current.amount;
    const aspect = size.width / size.height;
    const station = focusStation.current;

    scratchCam.copy(camera);
    applyCameraPose(scratchCam, {
      aspect,
      px: pose.x,
      py: pose.y,
      station: null,
    });
    overviewPos.copy(scratchCam.position);
    overviewQuat.copy(scratchCam.quaternion);

    if (station && amount > 0) {
      applyCameraPose(scratchCam, {
        aspect,
        px: 0,
        py: 0,
        station,
        compactPanel,
      });
      focusPos.copy(scratchCam.position);
      focusQuat.copy(scratchCam.quaternion);

      camera.position.lerpVectors(overviewPos, focusPos, amount);
      camera.quaternion.slerpQuaternions(overviewQuat, focusQuat, amount);
    } else {
      camera.position.copy(overviewPos);
      camera.quaternion.copy(overviewQuat);
    }

    if (
      Math.abs(pose.x - goal.x) > 0.001 ||
      Math.abs(pose.y - goal.y) > 0.001
    ) {
      invalidate();
    }
  });

  return null;
}
