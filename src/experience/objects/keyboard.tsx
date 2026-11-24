"use client";

import { ASSETS } from "@/experience/config/assets";
import { KEYBOARD_POSITION, MAT_HEIGHT } from "@/experience/config/layout";
import { preloadModel, useModel } from "@/experience/objects/use-model";

preloadModel(ASSETS.peripherals);

/** Low-profile keyboard and mouse on the desk mat. */
export function Keyboard() {
  const model = useModel(ASSETS.peripherals);

  return (
    <group position={[KEYBOARD_POSITION[0], MAT_HEIGHT, KEYBOARD_POSITION[2]]}>
      <primitive object={model} />
    </group>
  );
}
