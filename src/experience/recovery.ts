import { useGLTF, useTexture } from "@react-three/drei";
import { ASSETS } from "@/experience/config/assets";

const MODELS = [
  ASSETS.desk,
  ASSETS.monitor,
  ASSETS.panel,
  ASSETS.rack,
  ASSETS.peripherals,
];
const TEXTURES = [ASSETS.monitorScreen, ASSETS.panelDisplay];

/**
 * Forgets every model and texture result, including failed ones.
 *
 * drei caches loader results by URL, and that includes a rejected request. A
 * retry after a failed download would otherwise throw the old error again
 * without going to the network. The cache key is the loader plus one URL, so
 * each URL has to be cleared on its own.
 */
export function clearExperienceCaches() {
  for (const url of MODELS) useGLTF.clear(url);
  for (const url of TEXTURES) useTexture.clear(url);
}
