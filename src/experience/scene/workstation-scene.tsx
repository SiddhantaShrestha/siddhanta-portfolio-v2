"use client";

import { STATION_PLACEMENT } from "@/experience/config/layout";
import { AiOrb } from "@/experience/objects/ai-orb";
import { ControlPanel } from "@/experience/objects/control-panel";
import { Desk } from "@/experience/objects/desk";
import { Keyboard } from "@/experience/objects/keyboard";
import { Monitor } from "@/experience/objects/monitor";
import { ServerRack } from "@/experience/objects/server-rack";

type WorkstationSceneProps = { animate: boolean };

/**
 * The four stations plus desk and keyboard. Each object is independent and
 * takes its placement from config/layout.ts, so a blockout can be replaced
 * by a GLB model without touching the scene, camera or lighting.
 */
export function WorkstationScene({ animate }: WorkstationSceneProps) {
  return (
    <group>
      <Desk />
      <Keyboard />
      <Monitor placement={STATION_PLACEMENT.monitor} />
      <AiOrb placement={STATION_PLACEMENT.orb} animate={animate} />
      <ControlPanel placement={STATION_PLACEMENT.panel} />
      <ServerRack placement={STATION_PLACEMENT.rack} />
    </group>
  );
}
