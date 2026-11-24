/**
 * Every file the 3D experience can request. None of these are fetched unless
 * the experience chunk is loaded, and that chunk only loads when 3D is on.
 * Models are built by tools/blender and optimized by tools/assets.
 */
export const ASSETS = {
  desk: "/models/desk.glb",
  monitor: "/models/monitor.glb",
  panel: "/models/panel.glb",
  rack: "/models/rack.glb",
  peripherals: "/models/peripherals.glb",
  monitorScreen: "/textures/monitor-screen.webp",
  panelDisplay: "/textures/panel-display.webp",
} as const;
