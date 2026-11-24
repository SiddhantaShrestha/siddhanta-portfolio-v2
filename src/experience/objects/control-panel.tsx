"use client";

import { useTexture } from "@react-three/drei";
import { ASSETS } from "@/experience/config/assets";
import type { StationPlacement } from "@/experience/config/layout";
import { ScreenSurface } from "@/experience/objects/screen-surface";
import { preloadModel, useModel } from "@/experience/objects/use-model";

preloadModel(ASSETS.panel);
useTexture.preload(ASSETS.panelDisplay);

type ControlPanelProps = { placement: StationPlacement };

/** Automation control panel: the AI Agents and Automation station. */
export function ControlPanel({ placement }: ControlPanelProps) {
  const model = useModel(ASSETS.panel);

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      <primitive object={model} />
      <ScreenSurface model={model} textureUrl={ASSETS.panelDisplay} />
    </group>
  );
}
