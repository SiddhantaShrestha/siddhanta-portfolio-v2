"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CAMERA } from "@/experience/config/camera";
import { QUALITY } from "@/experience/config/quality";
import { Lighting } from "@/experience/lighting/lighting";
import { CameraRig } from "@/experience/scene/camera-rig";
import { FrameControl } from "@/experience/scene/frame-control";
import { WorkstationScene } from "@/experience/scene/workstation-scene";
import type { ExperienceProps } from "@/lib/workstation/types";

/**
 * Entry point of the 3D experience. It is the only module the rest of the app
 * loads, and only through components/workstation/experience-loader.tsx.
 */
export default function WorkstationExperience({
  active,
  tier,
  calm,
  onReady,
  onFail,
}: ExperienceProps) {
  const quality = QUALITY[tier];
  // Motion that needs a steady frame rate only runs on the full tier.
  const animated = !calm && tier === "full";

  return (
    <Canvas
      frameloop="demand"
      dpr={quality.dpr}
      camera={{ fov: CAMERA.fov, near: 1, far: 40 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ touchAction: "pan-y" }}
    >
      <Suspense fallback={null}>
        <Lighting tier={tier} />
        <WorkstationScene animate={animated} />
      </Suspense>
      <CameraRig parallax={animated} />
      <FrameControl
        active={active}
        ambient={animated}
        onReady={onReady}
        onFail={onFail}
      />
    </Canvas>
  );
}
