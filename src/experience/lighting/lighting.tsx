"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { PALETTE } from "@/experience/config/palette";
import { QUALITY } from "@/experience/config/quality";
import type { ExperienceTier } from "@/lib/workstation/types";

type LightingProps = { tier: ExperienceTier };

/**
 * Cinematic setup with four jobs:
 * - a strong, soft key from the front right, above (the softbox in the
 *   environment gives broad highlights on glass and metal)
 * - a cyan rim from behind the orb side, so edges separate from the dark
 * - a restrained violet accent from low right
 * - a gentle sky fill so shadow sides keep some shape
 *
 * The environment is built from Lightformers, so nothing is fetched. Shadows
 * are baked once (frames={1}). There are no real-time shadow maps.
 */
export function Lighting({ tier }: LightingProps) {
  const quality = QUALITY[tier];

  return (
    <>
      <hemisphereLight args={["#32476f", PALETTE.background, 0.6]} />

      {/* Key */}
      <directionalLight
        position={[3.0, 4.6, 3.6]}
        intensity={2.5}
        color="#e3eeff"
      />
      {/* Cool fill from the front left, low and weak. */}
      <directionalLight
        position={[-3.4, 1.4, 3.6]}
        intensity={0.55}
        color="#8fb2ff"
      />
      {/* Rim */}
      <directionalLight
        position={[-3.4, 2.2, -3.2]}
        intensity={1.5}
        color={PALETTE.accent}
      />
      {/* Violet accent, restrained */}
      <directionalLight
        position={[3.8, 0.9, -2.4]}
        intensity={0.7}
        color={PALETTE.violet}
      />

      <Environment
        frames={1}
        resolution={quality.environmentResolution}
        environmentIntensity={0.75}
      >
        {/* Large softbox above and in front: the main source of highlights. */}
        <Lightformer
          form="rect"
          intensity={2.8}
          color="#dbe9ff"
          position={[1, 5, 2]}
          rotation-x={Math.PI / 2}
          scale={[9, 5, 1]}
        />
        {/* Low front strip, soft reflections on the desk top and the glass. */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#b8cdf5"
          position={[0, 1.2, 6]}
          scale={[8, 1.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.7}
          color={PALETTE.accent}
          position={[-5, 1.5, -1]}
          rotation-y={Math.PI / 2}
          scale={[5, 1.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color={PALETTE.violet}
          position={[5, 1, -2]}
          rotation-y={-Math.PI / 2}
          scale={[4, 1.4, 1]}
        />
      </Environment>

      <ContactShadows
        position={[0, 0.002, 0.05]}
        scale={[4.4, 1.9]}
        far={1.4}
        blur={2.2}
        opacity={0.75}
        color="#02040a"
        frames={1}
        resolution={quality.shadowResolution}
      />
    </>
  );
}
