import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
// Same breakpoint where the hero shows the large two-column stage.
const DESKTOP_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

function subscribeMedia(query: string, listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

const subscribeReducedMotion = (listener: () => void) =>
  subscribeMedia(REDUCED_MOTION_QUERY, listener);
const subscribeDesktop = (listener: () => void) =>
  subscribeMedia(DESKTOP_QUERY, listener);

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function useIsDesktopDevice(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

type NetworkInformationLike = EventTarget & { saveData?: boolean };
type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

function getConnection() {
  return (navigator as NavigatorWithConnection).connection;
}

export function useSaveData(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const connection = getConnection();
      connection?.addEventListener("change", listener);
      return () => connection?.removeEventListener("change", listener);
    },
    () => getConnection()?.saveData === true,
    () => false,
  );
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    (listener) => {
      document.addEventListener("visibilitychange", listener);
      return () => document.removeEventListener("visibilitychange", listener);
    },
    () => !document.hidden,
    () => true,
  );
}

let webglSupport: boolean | undefined;

/**
 * One-time probe. Uses failIfMajorPerformanceCaveat so software renderers
 * count as unsupported and keep the poster.
 */
function detectWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    webglSupport = context !== null;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const subscribeNever = () => () => {};

/** null on the server and during hydration, then true or false. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribeNever,
    detectWebGL,
    () => null,
  );
}
