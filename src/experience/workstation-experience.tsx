"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { AgXToneMapping } from "three";
import { CAMERA } from "@/experience/config/camera";
import { QUALITY } from "@/experience/config/quality";
import { Lighting } from "@/experience/lighting/lighting";
import { CameraRig } from "@/experience/scene/camera-rig";
import { FrameControl } from "@/experience/scene/frame-control";
import { SceneReady } from "@/experience/scene/scene-ready";
import { StatsProbe } from "@/experience/scene/stats-probe";
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
        // AgX keeps saturated blues from clipping into electric colors.
        toneMapping: AgXToneMapping,
        toneMappingExposure: 1.15,
      }}
      style={{ touchAction: "pan-y" }}
    >
      <Suspense fallback={null}>
        <Lighting tier={tier} />
        <WorkstationScene animate={animated} />
        <SceneReady onReady={onReady} />
      </Suspense>
      <StatsProbe />
      <CameraRig parallax={animated} />
      <FrameControl active={active} ambient={animated} onFail={onFail} />
    </Canvas>
  );
}
