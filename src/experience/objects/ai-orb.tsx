"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { MeshStandardMaterial } from "three";
import type { StationPlacement } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";

type AiOrbProps = {
  placement: StationPlacement;
  /** Gentle core pulse. Off in calm mode and on the light tier. */
  animate: boolean;
};

const ORB_Y = 0.6;

/** AI orb on a pedestal: the AI Engineering station. */
export function AiOrb({ placement, animate }: AiOrbProps) {
  const coreMaterial = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const material = coreMaterial.current;
    if (!animate || !material) return;
    material.emissiveIntensity = 1.6 + Math.sin(clock.elapsedTime * 1.5) * 0.4;
  });

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.23, 0.26, 0.05, 48]} />
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.35}
          metalness={0.75}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.18, 24]} />
        <meshStandardMaterial
          color={PALETTE.metal}
          roughness={0.35}
          metalness={0.8}
        />
      </mesh>

      {/* Glass shell and inner core */}
      <mesh position={[0, ORB_Y, 0]}>
        <sphereGeometry args={[0.27, 48, 32]} />
        <meshPhysicalMaterial
          color="#10304a"
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, ORB_Y, 0]}>
        <sphereGeometry args={[0.13, 32, 24]} />
        <meshStandardMaterial
          ref={coreMaterial}
          color="#06222b"
          emissive={PALETTE.accent}
          emissiveIntensity={1.6}
          roughness={0.4}
        />
      </mesh>

      {/* Two rings around the orb */}
      <mesh position={[0, ORB_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.33, 0.01, 12, 96]} />
        <meshStandardMaterial
          color={PALETTE.metal}
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[0, ORB_Y, 0]} rotation={[1.0, 0.2, 0.5]}>
        <torusGeometry args={[0.38, 0.007, 12, 96]} />
        <meshStandardMaterial
          color={PALETTE.violet}
          emissive={PALETTE.violet}
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      <pointLight
        position={[0, ORB_Y, 0]}
        color={PALETTE.accent}
        intensity={1.6}
        distance={1.8}
        decay={2}
      />
    </group>
  );
}
