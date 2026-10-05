# Performance Measurements

Every entry states build, scene and how it was measured. Budget (PLAN §3.8): initial load < 2 MB, 60 fps on target hardware.

## Phase 0 — bundle (production build, `npm run build`, Vite 8.3.2)

| Chunk                                                       | Raw          | Gzip          |
| ----------------------------------------------------------- | ------------ | ------------- |
| `rapier` (`@dimforge/rapier3d-compat`, base64-inlined WASM) | 2,237 KB     | 842 KB        |
| `three` (three, three-stdlib, @react-three/*)               | 948 KB       | 254 KB        |
| `react` (react, react-dom, scheduler)                       | 207 KB       | 64 KB         |
| `index` (app + game code)                                   | 9 KB         | 3 KB          |
| CSS + HTML + runtime                                        | 2 KB         | 1 KB          |
| **Total**                                                   | **3,403 KB** | **~1,164 KB** |

- Measured against the transfer budget (gzip), Phase 0 uses ~58% of 2 MB, with Rapier alone at ~42%. PLAN's earlier estimate of ~1.5 MB raw for Rapier was low.
- Chunks are split with Rolldown `codeSplitting.groups` in `vite.config.ts` so vendor chunks cache across deploys.
- Interactive treemap: `npm run analyze` → `dist/stats.html`.

## Phase 1 — bundle (Scene 1 playable)

| Chunk                                     | Raw          | Gzip          | Change vs Phase 0            |
| ----------------------------------------- | ------------ | ------------- | ---------------------------- |
| `rapier`                                  | 2,237 KB     | 842 KB        | —                            |
| `three` (now includes drei `Text`/troika) | 1,062 KB     | 295 KB        | +41 KB gzip (text rendering) |
| `react`                                   | 207 KB       | 64 KB         | —                            |
| `index` (app + game + zod + zustand)      | 128 KB       | 39 KB         | +36 KB gzip                  |
| CSS + HTML + runtime                      | 4 KB         | 2 KB          |                              |
| **Total**                                 | **3,638 KB** | **~1,242 KB** | 62% of the 2 MB budget       |

- Leva was removed in Phase 1.
- drei `Text` loads its default font (Roboto) from a CDN at runtime. The art pass (Phase 4) should self-host a font so the game works offline and in a worker without network access.

## Phase 1 — frame rate

| Build      | Scene                     | Environment                                           | Result                    |
| ---------- | ------------------------- | ----------------------------------------------------- | ------------------------- |
| production | First Steps, during a run | headless Edge, SwiftShader (software WebGL), 1600×900 | **36 fps** (rAF over 3 s) |

- This is a worst-case lower bound: SwiftShader renders on the CPU. Real-GPU measurements on the reference laptop and phone are still to do.
- Below 60 fps the simulation is still correct: the fixed-step accumulator runs more 1/120 s steps per frame, so scores do not depend on frame rate.
