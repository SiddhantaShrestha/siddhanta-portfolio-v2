"use client";

import { ASSETS } from "@/experience/config/assets";
import { preloadModel, useModel } from "@/experience/objects/use-model";

preloadModel(ASSETS.desk);

/** Desk, desk mat, notebook and pen. Top surface is at y = 0. */
export function Desk() {
  const model = useModel(ASSETS.desk);
  return <primitive object={model} />;
}
