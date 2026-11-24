import { RoundedBox } from "@react-three/drei";
import type { StationPlacement } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";

type MonitorProps = { placement: StationPlacement };

const PANEL_WIDTH = 1.58;
const PANEL_HEIGHT = 0.92;
const PANEL_Y = 0.82;
const FRONT_Z = 0.0225;

// Blockout screen content: a sidebar and a few content rows.
const SCREEN_BARS = [
  { x: -0.56, y: 0, w: 0.3, h: 0.72, color: "#0f3a54" },
  { x: 0.12, y: 0.26, w: 0.9, h: 0.1, color: "#1b6f8c" },
  { x: 0.12, y: 0.06, w: 0.9, h: 0.24, color: "#134a63" },
  { x: -0.06, y: -0.22, w: 0.44, h: 0.16, color: "#134a63" },
  { x: 0.4, y: -0.22, w: 0.44, h: 0.16, color: "#2a2f66" },
] as const;

/** Large monitor: the Full Stack Projects station. */
export function Monitor({ placement }: MonitorProps) {
  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY}>
      {/* Base and neck */}
      <RoundedBox
        args={[0.58, 0.025, 0.34]}
        radius={0.01}
        smoothness={2}
        position={[0, 0.0125, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metal}
          roughness={0.4}
          metalness={0.7}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.1, 0.36, 0.05]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.2, -0.05]}
      >
        <meshStandardMaterial
          color={PALETTE.metal}
          roughness={0.4}
          metalness={0.7}
        />
      </RoundedBox>

      {/* Bezel */}
      <RoundedBox
        args={[PANEL_WIDTH, PANEL_HEIGHT, 0.045]}
        radius={0.014}
        smoothness={3}
        position={[0, PANEL_Y, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.metalDark}
          roughness={0.35}
          metalness={0.6}
        />
      </RoundedBox>

      {/* Screen (unlit so it reads as emissive) */}
      <mesh position={[0, PANEL_Y, FRONT_Z + 0.001]}>
        <planeGeometry args={[PANEL_WIDTH - 0.08, PANEL_HEIGHT - 0.08]} />
        <meshBasicMaterial color={PALETTE.screen} />
      </mesh>
      {SCREEN_BARS.map((bar, index) => (
        <mesh key={index} position={[bar.x, PANEL_Y + bar.y, FRONT_Z + 0.002]}>
          <planeGeometry args={[bar.w, bar.h]} />
          <meshBasicMaterial color={bar.color} />
        </mesh>
      ))}
    </group>
  );
}
