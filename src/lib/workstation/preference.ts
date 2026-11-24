/**
 * Stored 3D preference. Read with useSyncExternalStore so SSR and hydration
 * stay consistent and other tabs stay in sync.
 */
export type ThreeDPreference = "on" | "off";

const STORAGE_KEY = "workstation-3d";
const listeners = new Set<() => void>();

// Used when localStorage is blocked, so the choice still lasts for the session.
let memoryPreference: ThreeDPreference | null = null;

export function getPreference(): ThreeDPreference | null {
  if (memoryPreference) return memoryPreference;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}

export function getServerPreference(): ThreeDPreference | null {
  return null;
}

export function setPreference(value: ThreeDPreference) {
  memoryPreference = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage is unavailable. The in-memory value is enough.
  }
  for (const listener of listeners) listener();
}

export function subscribePreference(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
