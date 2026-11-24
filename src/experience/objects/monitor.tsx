"use client";

import { useTexture } from "@react-three/drei";
import { ASSETS } from "@/experience/config/assets";
import { MAT_HEIGHT, type StationPlacement } from "@/experience/config/layout";
import { ScreenSurface } from "@/experience/objects/screen-surface";
import { preloadModel, useModel } from "@/experience/objects/use-model";

preloadModel(ASSETS.monitor);
useTexture.preload(ASSETS.monitorScreen);

type MonitorProps = { placement: StationPlacement };

/** Ultrawide monitor showing the verified RecruitNepal screenshot. */
export function Monitor({ placement }: MonitorProps) {
  const model = useModel(ASSETS.monitor);

  return (
    <group
      position={[placement.position[0], MAT_HEIGHT, placement.position[2]]}
      rotation-y={placement.rotationY}
    >
      <primitive object={model} />
      <ScreenSurface
        model={model}
        textureUrl={ASSETS.monitorScreen}
        brightness={0.82}
      />
    </group>
  );
}
