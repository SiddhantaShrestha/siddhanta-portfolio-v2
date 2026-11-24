"use client";

import { useCursor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useState } from "react";
import type { StationId } from "@/content/lab";
import { HIT_BOX } from "@/experience/config/layout";

type StationHitProps = {
  id: StationId;
  onSelect: (id: StationId) => void;
  onHoverChange?: (id: StationId | null) => void;
};

/**
 * Invisible box that receives pointer events for one station.
 * Sized in layout.ts so neighboring stations do not overlap.
 */
export function StationHit({ id, onSelect, onHoverChange }: StationHitProps) {
  const invalidate = useThree((state) => state.invalidate);
  const [hovered, setHovered] = useState(false);
  const box = HIT_BOX[id];

  useCursor(hovered, "pointer", "auto");

  return (
    <group position={box.center}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          onHoverChange?.(id);
          invalidate();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          onHoverChange?.(null);
          invalidate();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(id);
        }}
      >
        <boxGeometry args={[...box.size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
