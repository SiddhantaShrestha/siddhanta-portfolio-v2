"use client";

import { useTexture } from "@react-three/drei";
import { useLayoutEffect } from "react";
import { SRGBColorSpace, type Group, type Mesh, type Texture } from "three";

type ScreenSurfaceProps = {
  /** The model that contains a mesh named "Screen" with 0..1 UVs. */
  model: Group;
  textureUrl: string;
  /** Multiplies the texture. Below 1 keeps bright pages from glaring. */
  brightness?: number;
};

function prepareScreenTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  // glTF UVs have their origin at the top left, so the image is not flipped.
  texture.flipY = false;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
}

function hideMesh(mesh: Mesh) {
  mesh.visible = false;
}

/**
 * Replaces the model's Screen mesh with the real screen texture.
 *
 * The screen is unlit and skips tone mapping, so it reads as a light source
 * and keeps the screenshot colors true. A faint mirror-like layer on top
 * picks up the soft boxes in the environment, which gives it glass.
 */
export function ScreenSurface({
  model,
  textureUrl,
  brightness = 1,
}: ScreenSurfaceProps) {
  const map = useTexture(textureUrl);
  const source = model.getObjectByName("Screen") as Mesh | undefined;

  useLayoutEffect(() => {
    prepareScreenTexture(map);
  }, [map]);

  useLayoutEffect(() => {
    if (source) hideMesh(source);
  }, [source]);

  if (!source) return null;

  // Mesh quantization (from the optimizer) stores part of the mesh size in
  // the node transform, so the replacement must copy it.
  const transform = {
    position: source.position,
    quaternion: source.quaternion,
    scale: source.scale,
  };

  return (
    <>
      <mesh geometry={source.geometry} {...transform}>
        <meshBasicMaterial
          map={map}
          color={[brightness, brightness, brightness]}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={source.geometry} renderOrder={2} {...transform}>
        <meshStandardMaterial
          color="#000000"
          metalness={1}
          roughness={0.05}
          transparent
          opacity={0.2}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </>
  );
}
