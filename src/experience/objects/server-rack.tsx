"use client";

import { ASSETS } from "@/experience/config/assets";
import type { StationPlacement } from "@/experience/config/layout";
import { preloadModel, useModel } from "@/experience/objects/use-model";

preloadModel(ASSETS.rack);

type ServerRackProps = { placement: StationPlacement };

/** Miniature server rack: the Backend and DevOps station. */
export function ServerRack({ placement }: ServerRackProps) {
  const model = useModel(ASSETS.rack);

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      <primitive object={model} />
    </group>
  );
}
