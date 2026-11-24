"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { PALETTE } from "@/experience/config/palette";
import { QUALITY } from "@/experience/config/quality";
import type { ExperienceTier } from "@/lib/workstation/types";

type LightingProps = { tier: ExperienceTier };

/**
 * Three directional lights, one soft hemisphere fill and a procedural
 * environment built from Lightformers. Nothing is fetched from the network.
 * Shadows are baked once (frames={1}). There are no real-time shadow maps.
 */
export function Lighting({ tier }: LightingProps) {
  const quality = QUALITY[tier];

  return (
    <>
      <hemisphereLight args={["#2a3d63", PALETTE.background, 0.9]} />

      {/* Key: cool white from the front right, above. */}
      <directionalLight
        position={[3.2, 4.4, 3.4]}
        intensity={2.6}
        color="#d6e6ff"
      />
      {/* Rim: cyan from behind the orb side, separates objects from the dark. */}
      <directionalLight
        position={[-3.4, 2.4, -3]}
        intensity={2.4}
        color={PALETTE.accent}
      />
      {/* Fill: violet from low right, keeps shadow sides from going flat. */}
      <directionalLight
        position={[3.6, 0.8, -1.6]}
        intensity={1.3}
        color={PALETTE.violet}
      />

      <Environment
        frames={1}
        resolution={quality.environmentResolution}
        environmentIntensity={0.9}
      >
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#dbe9ff"
          position={[0, 5, 1]}
          rotation-x={Math.PI / 2}
          scale={[8, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color={PALETTE.accent}
          position={[-5, 1.5, 0]}
          rotation-y={Math.PI / 2}
          scale={[5, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color={PALETTE.violet}
          position={[5, 1, -1]}
          rotation-y={-Math.PI / 2}
          scale={[5, 2, 1]}
        />
      </Environment>

      <ContactShadows
        position={[0, 0.002, 0.05]}
        scale={[4.4, 1.9]}
        far={1.4}
        blur={2.6}
        opacity={0.6}
        color="#02040a"
        frames={1}
        resolution={quality.shadowResolution}
      />
    </>
  );
}
