# 3D assets

All models are original work, built from scratch in Blender with Python
scripts. No third-party models, textures or HDRIs are used.

## Pipeline

1. `tools/blender/build_*.py` build each model with bmesh (beveled edges,
   smooth shading with sharp edges by angle, material variation), bake
   ambient occlusion with Cycles, and export a raw GLB to `assets-src/raw`.
2. `tools/assets/optimize.mjs` runs `@gltf-transform/cli@4.5.1` with Meshopt
   geometry compression and WebP textures. Output goes to `public/models`.
3. `tools/assets/textures.mjs` builds the screen textures in `public/textures`.

Commands (Blender 5.3 must be installed, or set `BLENDER_PATH`):

```
npm run assets            # everything
npm run assets:build      # Blender scripts only (add -- desk rack, --preview)
npm run assets:optimize
npm run assets:textures
```

`assets-src/` (raw GLBs and preview renders) is git-ignored.

Blender 5.3.0 came from the official Blender Foundation package on winget
(manifest and SHA256 verified before install).

## Models

| Model       | Source script          | GLB size | Triangles |
| ----------- | ---------------------- | -------- | --------- |
| desk        | `build_desk.py`        | 73 KB    | 6,564     |
| monitor     | `build_monitor.py`     | 69 KB    | 5,866     |
| peripherals | `build_peripherals.py` | 108 KB   | 8,888     |
| rack        | `build_rack.py`        | 227 KB   | 9,764     |
| panel       | `build_panel.py`       | 175 KB   | 8,378     |

Screen textures: `monitor-screen.webp` (71 KB, the verified RecruitNepal
screenshot from `public/projects/recruitnepal.png`, cover-cropped) and
`panel-display.webp` (7 KB, an abstract status display with no text).

The AI orb is procedural (lathe pedestal, two small shaders). It has no model
file.

## Measured (production build, desktop, headless Chrome with GPU)

- Transfer: about 482 KB for 5 models and 2 textures (compressed).
- Draw calls: 57. Triangles: 63,508 (orb included).
- Texture memory: about 25 MB (mipmaps included).
- Load: assets ready at about 1.1 s, first complete frame at about 1.8 s.
- Steady state: 24 fps ambient, about 7% main thread. Idle when off screen.
- 8 toggles off and on: heap flat, one canvas.
- Nothing from `public/models` or `public/textures` (and no decoder) is
  requested when 3D is off.

Run with `?3dstats` in the URL to print draw calls, triangles and texture
memory to the console and `window.__3dstats`.
