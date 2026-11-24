import { RoundedBox } from "@react-three/drei";
import { DESK } from "@/experience/config/layout";
import { PALETTE } from "@/experience/config/palette";

/** Desk slab, two panel legs and a desk mat. Top surface is at y = 0. */
export function Desk() {
  const { width, depth, thickness, legHeight } = DESK;
  const legX = width / 2 - 0.4;

  return (
    <group>
      <RoundedBox
        args={[width, thickness, depth]}
        radius={0.022}
        smoothness={3}
        position={[0, -thickness / 2, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.desk}
          roughness={0.5}
          metalness={0.15}
        />
      </RoundedBox>

      {[-legX, legX].map((x) => (
        <RoundedBox
          key={x}
          args={[0.07, legHeight, depth * 0.8]}
          radius={0.015}
          smoothness={2}
          position={[x, -thickness - legHeight / 2, 0]}
        >
          <meshStandardMaterial
            color={PALETTE.metalDark}
            roughness={0.55}
            metalness={0.4}
          />
        </RoundedBox>
      ))}

      <RoundedBox
        args={[1.5, 0.01, 1.2]}
        radius={0.004}
        smoothness={2}
        position={[0.1, 0.005, 0]}
      >
        <meshStandardMaterial
          color={PALETTE.deskMat}
          roughness={0.92}
          metalness={0}
        />
      </RoundedBox>
    </group>
  );
}
