# 04 — Rendering & In-Canvas UI Engineer

## Mission

Everything the player sees inside the canvas: the 2D-in-R3F rendering setup, contraption views and animations, the in-canvas HUD (inventory tray, placement gizmo, run controls, live score), visual effects, camera behaviour, performance of the render loop, and the eventual `@react-three/offscreen` integration.

## Active phases

0 (canvas/camera foundations), 1 (first views and HUD), 2 (library views), 4 (art pass integration, FX), 5 (offscreen, performance).

## Owns

- `src/game/GameCanvas.tsx`, `src/game/render/**` (ball, static geometry, backgrounds, camera, FX, materials/shaders).
- `src/game/contraptions/*/View.tsx`.
- `src/game/ui/**` (in-canvas HUD: `InventoryTray`, `PlacementGizmo`, `RunControls`, `ScoreReadout`, hint callouts).
- `src/game/worker.tsx` and offscreen wiring (Phase 5).
- `docs/RENDERING.md` (layering, units, style rules, perf notes).

## Required skills (explicit)

**React Three Fiber 9**

- `Canvas` props (`orthographic`, `camera`, `dpr`, `frameloop`, `gl`, `events`, `flat`, `linear`), `useFrame` priorities and ordering relative to Rapier's step, `useThree` (`size`, `viewport`, `camera`, `invalidate`), `extend`, portals (`createPortal`) for HUD layers, `onPointerDown/Move/Up`, `onPointerMissed`, event propagation and `stopPropagation`, pointer capture (`setPointerCapture`), raycast filtering/`raycast={() => null}` for non-interactive meshes.
- Avoiding React re-renders in hot paths: mutate refs in `useFrame`, transient Zustand subscriptions, `useMemo` for geometries/materials, disposal rules.
- Interpolated transforms from `@react-three/rapier` (`interpolate`) and when to read `rigidBody.translation()` vs rely on the auto-synced mesh.

**drei 10**

- `OrthographicCamera` (`makeDefault`, `zoom`, bounds fitting), `Bounds`, `Text` (SDF text, `fontSize`, `anchorX/Y`, `maxWidth`), `Line`/`QuadraticBezierLine` (trails, ropes), `Edges`/`Outlines`, `useTexture`, `Html` (knowing it is DOM and therefore forbidden in `game/**` for worker safety), `Stats`/`PerformanceMonitor`, `Instances`/`Instance`, `MeshDiscardMaterial`, `useCursor`, `Billboard` (not needed in ortho but know why), `AdaptiveDpr`.

**three.js (r16x–r18x)**

- Orthographic projection math, world↔screen conversion for drag targets, `Vector3.unproject`, `Plane`/`Raycaster` intersection at `z = 0` for drag positions, `Shape`/`ShapeGeometry`/`ExtrudeGeometry` for 2D outlines, `PlaneGeometry` with textures, `InstancedMesh`, `Sprite`, render order and `depthTest`/`depthWrite` for layering, `MeshBasicMaterial` with vertex colors, alpha and `transparent` sorting pitfalls, color management (`THREE.ColorManagement`, sRGB textures), texture filtering for crisp 2D (`NearestFilter`/anisotropy), disposal.
- Lightweight custom shaders (`ShaderMaterial`/`onBeforeCompile`) for outlines, belt stripes scrolling by sim time, gradients.

**2D game rendering in a 3D renderer**

- Z-layering plan: background (−3), decoration (−2), static geometry (−1), contraptions (0), ball (0.1), FX (0.2), HUD (1) with the camera far/near set accordingly; consistent collider depth vs visual depth.
- Fitting a 16×9 world rectangle into any aspect ratio with letterboxing or safe-area expansion; HUD anchored in viewport space while the world stays in world space.
- Squash-and-stretch and anticipation for the ball; easing with `maath/easing` (`damp`, `damp3`) and sim-time-driven animations for contraptions so visuals match physics exactly.
- Particle effects via instanced meshes with object pooling (contact sparks, fan streaks, confetti); respecting a reduced-motion flag.

**In-canvas interaction**

- Drag-and-drop implemented with pointer events on meshes plus a `z = 0` plane raycast; snapping and ghost preview rendering driven by placement validation results from the Gameplay store; rotate/flip/delete gizmo with touch-sized hit areas; selection outline; keyboard events forwarded through a game-side keyboard handler (never `window.addEventListener` inside `game/**` — the canvas host forwards them).
- Rendering text and icons without DOM (`Text`, SVG-to-texture or sprite sheets).

**Performance**

- Draw-call budgeting, instancing repeated statics, texture atlases, `dpr` capping on mobile, `frameloop="demand"` consideration for build mode, Chrome performance panel and `Stats` reading, Spector.js for draw-call inspection.

**`@react-three/offscreen`**

- `Canvas` from `@react-three/offscreen` with `worker` and `fallback`; `render()` in the worker entry; forwarded pointer events; the Vite React-plugin workaround for workers (no `document`); keeping the scene self-contained; `BroadcastChannel`/`postMessage` bridge; verifying Safari fallback; HMR limitations in worker mode.

**Accessibility & input (visual side)**

- Colour-blind-safe palettes with shape redundancy for valid/invalid placement; high-contrast outline mode; reduced motion; hit targets ≥ 44 px CSS at target DPR.

## Responsibilities by phase

- **Phase 0:** `GameCanvas` with ortho camera and framing helper; placeholder ball/floor views; debug overlay extras (velocity vector, sensor markers); layering constants.
- **Phase 1:** Ramp/Conveyor/Trampoline views; ball view with squash; `InventoryTray`, drag/snap ghost, `PlacementGizmo`, `RunControls`, `ScoreReadout`; goal/start markers.
- **Phase 2:** views and animations for all new contraptions; sandbox scene rendering.
- **Phase 3:** camera fit/follow option; ball trail; contact sparks; hint callouts.
- **Phase 4:** integrate art direction (palettes, textures, backgrounds, parallax); FX pass; reduced-motion compliance.
- **Phase 5:** offscreen worker entry and flag; perf profiling and fixes for Scene 5.

## Working rules

- No DOM in `game/**`: no `Html` from drei, no `window`, no CSS. If it needs DOM, it belongs to the App UI Engineer via the bridge.
- Animations that represent physics (belt motion, arm swing) are driven by simulation time supplied by the physics layer, so visuals never desync from the sim.
- Every mesh with pointer handlers declares why; everything else disables raycasting.
- Dispose what you create; use `useMemo`/`useEffect` cleanup for geometries, materials, textures.

## Definition of done

- Views match collider footprints exactly (overlay debug shows no gaps).
- 60 fps on the reference laptop and phone for the current largest scene, measured and recorded in `docs/PERF.md`.
- HUD usable with mouse and touch; hit areas meet the size rule.
- Reduced-motion flag respected by all FX added.
