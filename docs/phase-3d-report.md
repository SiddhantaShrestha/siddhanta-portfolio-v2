# Phase 3D report: performance, accessibility, production readiness

Branch: `phase-3d-production-readiness`
Scope: existing workstation only. No Phase 4. No deploy.

## Metric kinds (read this first)

| Kind | What it is | What it is not |
| --- | --- | --- |
| Scripted CDP timings | Headless Chrome + PerformanceObservers on a local production build | Real-user INP / field data |
| Lighthouse lab | Single-run local scores (desktop preset + mobile default) | CrUX / RUM |
| Behavior tests | Scripted keyboard, failure injection, context loss | Device farm coverage |

Do not treat scripted long-task or interaction timings as a real-world INP score.

## Root cause of main-thread stalls

Three.js was drawing before shader programs finished linking. That blocked the main thread on `getProgramInfoLog` (GPU process wait).

Fix: keep `frameloop="never"` until `renderer.compileAsync` resolves, then switch to `demand` and invalidate settle frames.

Remaining unavoidable cost: first PMREM / env compile (~220–300 ms desktop) plus 3D chunk module evaluation (~60–70 ms desktop, higher under CPU throttle).

## Code changes

- Gate rendering until shaders compile (`scene-ready.tsx`, `workstation-experience.tsx`).
- Manual `import()` loader with retryable attempts (`experience-loader.tsx`).
- Clear failed GLTF/texture cache entries per URL (`recovery.ts`).
- WebGL context loss: `preventDefault`, remount up to 2 restores, then poster + Try again (`frame-control.tsx`, `workstation-shell.tsx`).
- Dispose shared geometries/materials/textures on unmount (`resource-cleanup.tsx`) to stop renderer listener leaks.
- Focus return to dock on panel close; Escape without page scroll; dock `aria-label` and `data-station` hooks.
- Panel layout: desktop clears the dock, slightly wider; compact sheet taller; hide dock under compact sheet when a station is open.

Preserved: models, shaders, lighting, camera composition, project content, visual design.

## Scripted before / after (local production builds)

Values from CDP harness. One representative run per scenario unless noted as A/B average.

### Desktop, auto 3D on

| | Before | After |
| --- | --- | --- |
| FCP / LCP (ms) | 308 | 324 |
| CLS | 0.0035 | 0.0035 |
| Longest task (ms) | 351 | 368 |
| TBT-like (ms) | 587 | 470 |
| A/B avg longest (5 interleaved) | 402 | 400 |
| A/B avg TBT-like | 690 | 518 |

### Desktop, 4× CPU throttle, auto 3D

| | Before | After |
| --- | --- | --- |
| Longest task (ms) | 1655 | 595 |
| TBT-like (ms) | 2567 | 1821 |

### Mobile viewport, manual 3D on

| | Before | After |
| --- | --- | --- |
| Longest task (ms) | 1592 | 665 |
| TBT-like (ms) | 2197 | 1636 |
| CLS | 0.0003 | 0.0002 |

Main win under throttle and on mobile: the long GPU-sync stall during first draw is gone. Desktop auto still pays a ~300–400 ms compile / PMREM cost.

## Lighthouse lab (after only, localhost:3100)

| | Desktop | Mobile |
| --- | --- | --- |
| Performance | 80 | 84 |
| Accessibility | 100 | 100 |
| Best practices | 96 | 96 |
| SEO | 100 | 100 |
| FCP | 0.2 s | 0.9 s |
| LCP | 0.9 s | 3.7 s |
| TBT | 440 ms | 280 ms |
| CLS | 0.004 | 0 |

No baseline Lighthouse run was kept for comparison. Lab only.

## Behavior / reliability matrix

| Scenario | Result |
| --- | --- |
| Keyboard: Space toggle, Enter station, Escape, Tab / Shift+Tab | Pass; focus returns to dock; no focus trap |
| Mobile tap open / Back / canvas dismiss | Pass; no unintended scroll |
| Offscreen / hidden tab | Draws stop; resume when visible |
| Repeated 3D on/off (20–40 cycles) | Stable; heap ~14–16 MB after cleanup |
| Chunk download blocked | Error + Try again + Reload page; retry recovers after unblock |
| GLB / texture blocked | Error + Try again; retry recovers after clear |
| Load timeout | Error + Try again; retry recovers |
| Slow assets | “Still loading” then reveal when ready |
| Context lost + restored | Remount recovers (≤2); then poster + Try again |
| WebGL unavailable | Poster + disabled switch; no chunk fetch |
| JS off | Static poster links usable |

## Layout

Measured defects fixed: desktop panel overlapping dock; compact sheet covering dock (dock now hidden while open on ≤1023px); narrow panel widened slightly.

Known limit: at ~1024px desktop side panel body is short and scrolls a lot.

## Checks

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` all passed on the Phase 3D tree.

## Known limitations

- First shader / PMREM compile still blocks once per cold start.
- Lab and scripted numbers ≠ real-user INP or field LCP.
- Context auto-restore capped at 2 remounts.
- Lighthouse was run only on the after build.
- Headless SwiftShader / ANGLE path can differ from real GPUs.
