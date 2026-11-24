"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Object3D,
  Vector2,
  type Group,
  type InstancedMesh,
  type ShaderMaterial,
} from "three";
import type { StationPlacement } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";
import {
  CORE_FRAGMENT,
  CORE_VERTEX,
  HALO_FRAGMENT,
  HALO_VERTEX,
  SHELL_FRAGMENT,
  SHELL_VERTEX,
} from "@/experience/objects/orb-shaders";

type AiOrbProps = {
  placement: StationPlacement;
  /** Swirl and ring motion. Off in calm mode and on the light tier. */
  animate: boolean;
};

const ORB_Y = 0.6;
const SHELL_RADIUS = 0.27;
const CORE_RADIUS = 0.15;

/** Profile of the pedestal as [radius, height] pairs, bottom to top. */
const PEDESTAL_PROFILE: [number, number][] = [
  [0, 0],
  [0.27, 0],
  [0.285, 0.008],
  [0.285, 0.028],
  [0.262, 0.042],
  [0.21, 0.05],
  [0.13, 0.068],
  [0.075, 0.12],
  [0.058, 0.2],
  [0.062, 0.27],
  [0.115, 0.312],
  [0.15, 0.332],
  [0.142, 0.344],
  [0.1, 0.338],
  [0, 0.336],
];

const BEADS = 18;

function advanceTime(material: ShaderMaterial, delta: number) {
  const time = material.uniforms.uTime;
  if (time) time.value += delta;
}

type BeadsProps = { radius: number; size: number; color: string };

/** Small spheres spaced around a ring, drawn as one instanced mesh. */
function Beads({ radius, size, color }: BeadsProps) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const helper = new Object3D();
    for (let i = 0; i < BEADS; i++) {
      const angle = (i / BEADS) * Math.PI * 2;
      helper.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0,
      );
      helper.updateMatrix();
      target.setMatrixAt(i, helper.matrix);
    }
    target.instanceMatrix.needsUpdate = true;
  }, [radius]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BEADS]}>
      <sphereGeometry args={[size, 12, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

/** AI orb on a pedestal: the AI Engineering station. */
export function AiOrb({ placement, animate }: AiOrbProps) {
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const core = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      shell: {
        uTint: { value: new Color("#0a2a42") },
        uRim: { value: new Color(PALETTE.accent) },
      },
      core: {
        uTime: { value: 0 },
        uA: { value: new Color(PALETTE.accent) },
        uB: { value: new Color(PALETTE.violet) },
      },
      halo: {
        uColor: { value: new Color(PALETTE.accent) },
        uStrength: { value: 0.55 },
      },
    }),
    [],
  );

  const pedestalPoints = useMemo(
    () => PEDESTAL_PROFILE.map(([x, y]) => new Vector2(x, y)),
    [],
  );

  useFrame((_, delta) => {
    if (!animate) return;
    if (core.current) advanceTime(core.current, delta);
    if (ringA.current) ringA.current.rotation.z += delta * 0.35;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.22;
  });

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      {/* Pedestal: a lathe profile in dark metal with thin glowing rings. */}
      <mesh>
        <latheGeometry args={[pedestalPoints, 64]} />
        <meshStandardMaterial
          color="#232d46"
          metalness={0.85}
          roughness={0.34}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.034, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.245, 0.0035, 8, 96]} />
        <meshBasicMaterial color={PALETTE.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.145, 0.003, 8, 64]} />
        <meshBasicMaterial color={PALETTE.violet} toneMapped={false} />
      </mesh>

      <group position={[0, ORB_Y, 0]}>
        {/* Core: opaque swirl. */}
        <mesh>
          <sphereGeometry args={[CORE_RADIUS, 48, 32]} />
          <shaderMaterial
            ref={core}
            vertexShader={CORE_VERTEX}
            fragmentShader={CORE_FRAGMENT}
            uniforms={uniforms.core}
            toneMapped={false}
          />
        </mesh>

        {/* Glass shell: transparent fresnel, drawn after the core. */}
        <mesh renderOrder={3}>
          <sphereGeometry args={[SHELL_RADIUS, 64, 40]} />
          <shaderMaterial
            vertexShader={SHELL_VERTEX}
            fragmentShader={SHELL_FRAGMENT}
            uniforms={uniforms.shell}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Orbit rings with bead markers. */}
        <group rotation={[Math.PI / 2 - 0.25, 0.2, 0]}>
          <group ref={ringA}>
            <mesh>
              <torusGeometry args={[0.34, 0.0085, 12, 128]} />
              <meshStandardMaterial
                color="#7d8aa8"
                metalness={1}
                roughness={0.28}
              />
            </mesh>
            <Beads radius={0.34} size={0.0145} color={PALETTE.accent} />
          </group>
        </group>
        <group rotation={[1.05, 0.35, 0.5]}>
          <group ref={ringB}>
            <mesh>
              <torusGeometry args={[0.4, 0.0055, 10, 128]} />
              <meshBasicMaterial color={PALETTE.violet} toneMapped={false} />
            </mesh>
            <Beads radius={0.4} size={0.01} color="#c9c1ff" />
          </group>
        </group>

        {/* Soft glow behind the orb, always facing the camera. */}
        <Billboard renderOrder={-1}>
          <mesh>
            <planeGeometry args={[1.2, 1.2]} />
            <shaderMaterial
              vertexShader={HALO_VERTEX}
              fragmentShader={HALO_FRAGMENT}
              uniforms={uniforms.halo}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
        </Billboard>

        <pointLight
          color={PALETTE.accent}
          intensity={0.3}
          distance={1.4}
          decay={2}
        />
      </group>
    </group>
  );
}
