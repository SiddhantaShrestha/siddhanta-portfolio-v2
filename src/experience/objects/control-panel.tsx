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

type ControlPanelProps = { placement: StationPlacement };

const TOP_Y = 0.03; // top surface of the tilted slab, in slab space

const BUTTON_COLORS = [
  PALETTE.accent,
  PALETTE.accent,
  PALETTE.violet,
  "#1b3b52",
  PALETTE.accent,
  "#1b3b52",
  PALETTE.violet,
  PALETTE.accent,
  "#1b3b52",
  PALETTE.accent,
  PALETTE.accent,
  PALETTE.violet,
];

/** Automation control panel: the AI Agents and Automation station. */
export function ControlPanel({ placement }: ControlPanelProps) {
  const buttons = useRef<InstancedMesh>(null);

  const buttonSpecs = useMemo<InstanceSpec[]>(
    () =>
      BUTTON_COLORS.map((color, index) => ({
        position: [
          -0.3 + (index % 4) * 0.075,
          TOP_Y + 0.007,
          -0.1 + Math.floor(index / 4) * 0.075,
        ],
        color,
      })),
    [],
  );
  useInstances(buttons, buttonSpecs);

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      {/* Plinth */}
      <RoundedBox
        args={[0.8, 0.05, 0.44]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.025, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.5}
          metalness={0.5}
        />
      </RoundedBox>

      {/* Tilted control surface */}
      <group position={[0, 0.1, 0.02]} rotation-x={0.2}>
        <RoundedBox args={[0.78, 0.06, 0.4]} radius={0.014} smoothness={3}>
          <meshStandardMaterial
            color={PALETTE.metal}
            roughness={0.42}
            metalness={0.55}
          />
        </RoundedBox>

        <instancedMesh
          ref={buttons}
          args={[undefined, undefined, BUTTON_COLORS.length]}
        >
          <cylinderGeometry args={[0.026, 0.026, 0.014, 20]} />
          <meshBasicMaterial />
        </instancedMesh>

        {/* Small status display */}
        <mesh position={[0.2, TOP_Y + 0.002, -0.1]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.28, 0.1]} />
          <meshBasicMaterial color="#0f3a54" />
        </mesh>
        <mesh position={[0.2, TOP_Y + 0.003, -0.1]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.2, 0.012]} />
          <meshBasicMaterial color={PALETTE.accent} />
        </mesh>

        {/* Three sliders */}
        {[0.12, 0.2, 0.28].map((x, index) => (
          <group key={x} position={[x, TOP_Y, 0.08]}>
            <mesh position={[0, 0.002, 0]}>
              <boxGeometry args={[0.012, 0.004, 0.16]} />
              <meshStandardMaterial color={PALETTE.metalDark} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.01, (index - 1) * 0.045]}>
              <boxGeometry args={[0.034, 0.016, 0.02]} />
              <meshStandardMaterial
                color="#0f1a2e"
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
