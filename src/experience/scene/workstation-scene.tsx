"use client";

import { useState } from "react";
import type { StationId } from "@/content/lab";
import { STATION_PLACEMENT } from "@/experience/config/layout";
import { AiOrb } from "@/experience/objects/ai-orb";
import { ControlPanel } from "@/experience/objects/control-panel";
import { Desk } from "@/experience/objects/desk";
import { Keyboard } from "@/experience/objects/keyboard";
import { Monitor } from "@/experience/objects/monitor";
import { ServerRack } from "@/experience/objects/server-rack";
import { StationHit } from "@/experience/objects/station-hit";

type WorkstationSceneProps = {
  animate: boolean;
  selectedStation: StationId | null;
  onSelectStation: (station: StationId | null) => void;
};

/**
 * The four stations plus desk and keyboard. Hit boxes sit inside each
 * placement group so selection does not depend on Meshopt mesh raycasts.
 */
export function WorkstationScene({
  animate,
  selectedStation,
  onSelectStation,
}: WorkstationSceneProps) {
  const [hovered, setHovered] = useState<StationId | null>(null);

  return (
    <group>
      {/* Soft ground plane for depth. Not interactive. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -0.001, 0.05]}
        receiveShadow={false}
        raycast={() => null}
      >
        <planeGeometry args={[6.5, 3.2]} />
        <meshBasicMaterial color="#050914" transparent opacity={0.55} />
      </mesh>

      <Desk />
      <Keyboard />

      <group
        position={[...STATION_PLACEMENT.monitor.position]}
        rotation-y={STATION_PLACEMENT.monitor.rotationY}
      >
        <Monitor placement={{ position: [0, 0, 0], rotationY: 0 }} />
        <StationHit
          id="monitor"
          onSelect={onSelectStation}
          onHoverChange={setHovered}
        />
      </group>

      <group
        position={[...STATION_PLACEMENT.orb.position]}
        rotation-y={STATION_PLACEMENT.orb.rotationY}
      >
        <AiOrb
          placement={{ position: [0, 0, 0], rotationY: 0 }}
          animate={animate}
          intensify={hovered === "orb" || selectedStation === "orb"}
        />
        <StationHit
          id="orb"
          onSelect={onSelectStation}
          onHoverChange={setHovered}
        />
      </group>

      <group
        position={[...STATION_PLACEMENT.panel.position]}
        rotation-y={STATION_PLACEMENT.panel.rotationY}
      >
        <ControlPanel placement={{ position: [0, 0, 0], rotationY: 0 }} />
        <StationHit
          id="panel"
          onSelect={onSelectStation}
          onHoverChange={setHovered}
        />
      </group>

      <group
        position={[...STATION_PLACEMENT.rack.position]}
        rotation-y={STATION_PLACEMENT.rack.rotationY}
      >
        <ServerRack placement={{ position: [0, 0, 0], rotationY: 0 }} />
        <StationHit
          id="rack"
          onSelect={onSelectStation}
          onHoverChange={setHovered}
        />
      </group>
    </group>
  );
}
