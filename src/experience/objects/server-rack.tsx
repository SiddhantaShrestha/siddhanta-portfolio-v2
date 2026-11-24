"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import type { StationPlacement } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";
import {
  useInstances,
  type InstanceSpec,
} from "@/experience/hooks/use-instance-matrices";

type ServerRackProps = { placement: StationPlacement };

const UNIT_COUNT = 5;
const UNIT_PITCH = 0.145;
const FIRST_UNIT_Y = 0.115;
const FRONT_Z = 0.215;

const unitY = (index: number) => FIRST_UNIT_Y + index * UNIT_PITCH;

/** Miniature server rack: the Backend and DevOps station. */
export function ServerRack({ placement }: ServerRackProps) {
  const leds = useRef<InstancedMesh>(null);

  const ledSpecs = useMemo<InstanceSpec[]>(() => {
    const specs: InstanceSpec[] = [];
    for (let unit = 0; unit < UNIT_COUNT; unit++) {
      for (let led = 0; led < 3; led++) {
        const lit = (unit + led) % 4 !== 3;
        specs.push({
          position: [0.11 + led * 0.026, unitY(unit), FRONT_Z + 0.011],
          color: !lit ? "#1b3b52" : led === 2 ? PALETTE.violet : PALETTE.accent,
        });
      }
    }
    return specs;
  }, []);
  useInstances(leds, ledSpecs);

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      {/* Plinth, cabinet and lid */}
      <RoundedBox
        args={[0.5, 0.04, 0.46]}
        radius={0.01}
        smoothness={2}
        position={[0, 0.02, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.45}
          metalness={0.6}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.46, 0.78, 0.42]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.43, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.5}
          metalness={0.55}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 0.025, 0.46]}
        radius={0.01}
        smoothness={2}
        position={[0, 0.8, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metal}
          roughness={0.4}
          metalness={0.7}
        />
      </RoundedBox>

      {/* Front posts */}
      {[-0.205, 0.205].map((x) => (
        <mesh key={x} position={[x, 0.43, FRONT_Z + 0.004]}>
          <boxGeometry args={[0.025, 0.78, 0.024]} />
          <meshStandardMaterial
            color={PALETTE.metal}
            roughness={0.35}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Rack units with a drive bay each */}
      {Array.from({ length: UNIT_COUNT }, (_, unit) => (
        <group key={unit} position={[0, unitY(unit), FRONT_Z]}>
          <mesh>
            <boxGeometry args={[0.37, 0.12, 0.02]} />
            <meshStandardMaterial
              color="#16223b"
              roughness={0.4}
              metalness={0.65}
            />
          </mesh>
          <mesh position={[-0.05, 0, 0.0105]}>
            <boxGeometry args={[0.2, 0.05, 0.004]} />
            <meshStandardMaterial color="#070c17" roughness={0.7} />
          </mesh>
        </group>
      ))}

      <instancedMesh ref={leds} args={[undefined, undefined, UNIT_COUNT * 3]}>
        <boxGeometry args={[0.014, 0.014, 0.006]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  );
}
