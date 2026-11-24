"use client";

import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type { InstancedMesh } from "three";
import { KEYBOARD_POSITION } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";
import {
  useInstances,
  type InstanceSpec,
} from "@/experience/hooks/use-instance-matrices";

const KEY_Y = 0.03;
const COLUMN_PITCH = 0.0438;
const ROW_PITCH = 0.036;

function buildKeySpecs(): InstanceSpec[] {
  const specs: InstanceSpec[] = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 14; col++) {
      specs.push({
        position: [(col - 6.5) * COLUMN_PITCH, KEY_Y, (row - 2) * ROW_PITCH],
        color: col === 0 || col === 13 ? "#0f1a30" : "#1a2744",
      });
    }
  }

  // Bottom row: three keys, a wide space bar, three keys.
  const bottomZ = 2 * ROW_PITCH;
  for (const x of [-0.26, -0.216, -0.172, 0.172, 0.216, 0.26]) {
    specs.push({ position: [x, KEY_Y, bottomZ], color: "#0f1a30" });
  }
  specs.push({
    position: [0, KEY_Y, bottomZ],
    scale: [6, 1, 1],
    color: "#1a2744",
  });

  return specs;
}

const KEY_SPECS = buildKeySpecs();

/** Low-profile keyboard in front of the monitor. */
export function Keyboard() {
  const keys = useRef<InstancedMesh>(null);
  useInstances(keys, KEY_SPECS);

  return (
    <group position={[...KEYBOARD_POSITION]} rotation-x={0.04}>
      <RoundedBox
        args={[0.64, 0.024, 0.22]}
        radius={0.008}
        smoothness={2}
        position={[0, 0.012, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.45}
          metalness={0.5}
        />
      </RoundedBox>
      <instancedMesh ref={keys} args={[undefined, undefined, KEY_SPECS.length]}>
        <boxGeometry args={[0.036, 0.012, 0.03]} />
        <meshStandardMaterial roughness={0.5} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}
