# Puzzling Machines — Project Plan

> A 2D physics puzzle game about finishing incomplete Rube Goldberg machines.
> Web-based, built on React Three Fiber. Demo scope: 5 hand-crafted scenes.

Companion documents: [`ROADMAP.md`](./ROADMAP.md) breaks this plan into phases and features; [`agents/`](./agents/README.md) defines the development roles and the skills each requires.

---

## 1. Vision

Each scene presents an **incomplete Rube Goldberg machine**. A ball starts at **point A** and must reach **point B**. The fixed parts of the machine are already in place; the gaps must be filled by the player using a limited **inventory of contraptions** (ramps, conveyor belts, fans, catapults, elevators, slings, …).

The player places contraptions, presses **Run**, and watches. If the ball reaches B, the run succeeds. The **score grows while the ball is in motion**, so longer, more elaborate journeys score higher than the shortest solution. Each scene keeps a small **leaderboard**.

Design pillars:

1. **Readable physics.** Everything that happens should be explainable by watching. No hidden randomness; the same layout always produces the same run.
2. **Tinkering is the fun.** Fast build → run → reset loop (under one second to restart). Failure is cheap and informative.
3. **Reward creativity, not just completion.** Scoring favors travel distance, time in motion, and variety of contraptions touched, with safeguards against infinite loops.
4. **Small, finished, polished.** Five scenes that feel complete beat twenty that feel rough.

---

## 2. Gameplay Overview

### 2.1 Core loop

```
Scene Select ─▶ Build Mode ─▶ Run Mode ─▶ Result ─▶ (retry | next scene | leaderboard)
                   ▲              │
                   └──── Reset ◀──┘
```

- **Build Mode.** Physics paused. The player drags contraptions from the inventory tray into the build area, moves/rotates/flips/removes them. Placement is free-form with grid snapping; overlapping static geometry or other contraptions is rejected with visual feedback. A ghost preview of the ball path is _not_ shown (discovery is the point).
- **Run Mode.** Physics simulates with a fixed timestep. The HUD shows the live score and elapsed time. The player can **Reset** at any time to return to Build Mode with the layout intact.
- **Result.** Triggered when the ball enters the goal sensor (**success**), or when it leaves the world bounds / stalls / exceeds the time limit (**fail**). On success the player can submit their score to the scene's leaderboard.

### 2.2 Scene anatomy

Every scene is data (TypeScript/JSON, validated with a schema) describing:

| Element                | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Bounds**             | The visible world rectangle and the camera framing. Leaving the bounds ends the run.  |
| **Static geometry**    | Walls, floors, shelves, fixed ramps. Immutable.                                       |
| **Fixed contraptions** | Pre-placed, non-editable contraptions that are "already part of the machine".         |
| **Build zones**        | One or more rectangles where placement is allowed (optional; default = whole bounds). |
| **Start (A)**          | Ball spawn position and optional initial velocity.                                    |
| **Goal (B)**           | Sensor region (e.g. a bucket, a bell, a cup).                                         |
| **Inventory**          | List of `{ contraptionType, count, lockedParams? }`.                                  |
| **Run limits**         | Max run time, stall threshold.                                                        |
| **Reference solution** | A known-good placement, used by automated solvability tests and the hint system.      |

### 2.3 Scoring

Score is accumulated per physics tick while the ball is "in motion":

```
moving        = |v| > V_MIN                       (e.g. 0.5 m/s)
tickScore     = moving ? (K_TIME + K_SPEED * |v|) * dt : 0
touchBonus    = first contact with a contraption instance → +B_TOUCH
                repeat contacts with the same instance   → +B_TOUCH * decay^n   (diminishing)
finalScore    = success ? round((Σ tickScore + Σ touchBonus) * completionMultiplier) : 0
```

Rules and safeguards:

- **Only successful runs score.** Failed runs show the "would-be" score greyed out, as motivation.
- **Stall detection.** If `|v| < V_MIN` for longer than `STALL_SECONDS` (e.g. 3 s) the run fails. Elevators/catapults that intentionally hold the ball must reset the stall timer while they own the ball.
- **Time cap.** Each scene has a `maxRunTime` (e.g. 90 s). Reaching it fails the run. This bounds infinite-loop exploits.
- **Diminishing touch bonus.** Cycling the ball through the same two contraptions forever yields rapidly decreasing bonuses, so loops are tolerated but not optimal.
- **Deterministic.** Same layout → same score. Required for a fair leaderboard.

Constants live with the tracker (`scoring/ScoreTracker.ts`) and are balanced with headless `simulateRun` sweeps, which reproduce in-game scores exactly. Phase 1 values: `V_MIN` 0.3 m/s, `K_TIME` 10, `K_SPEED` 4, completion ×1.5, stall 3 s.

### 2.4 Leaderboards

- One leaderboard per scene, top 10 entries: `{ name, score, runTime, contraptionsUsed, date }`.
- **Demo:** persisted in `localStorage` by the app (`LocalLeaderboardRepository`, zod-validated). Arcade-style 3–8 character name entry when a score qualifies, remembered afterwards.
- **Stretch:** a tiny remote backend (e.g. Supabase table or Cloudflare Worker + KV) behind the same `LeaderboardRepository` interface, so swapping storage does not touch UI code.

### 2.5 Contraption catalogue

Contraptions are the heart of the game. Each one is a self-contained module: **definition** (id, display name, icon, default params, footprint), **physics behaviour** (bodies, colliders, joints, per-step logic), and **view** (R3F component). Physics is plain TypeScript: `build()` creates bodies through `World2D` (see D1), so contraption code reads as 2D even though Rapier is a 3D engine, and runs headless unchanged.

| Contraption                  | Physics implementation (Rapier via `@react-three/rapier`)                                                                                                                                                                                                                                                                               | Role in puzzles                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Ramp / Slide**             | Fixed body with a cuboid collider (or several for curves); rotatable about Z.                                                                                                                                                                                                                                                           | Redirect, accelerate.                            |
| **Conveyor Belt**            | Velocity-based kinematic cuboid with constant `linvel`; translation reset to its anchor before every step ("treadmill"), plus a grip nudge toward belt speed for touching bodies (`stepConveyor`). Direction & speed params. Migrates to `modifySolverContacts` tangent velocity once rapier.js exposes contact modification (PR #360). | Carry horizontally, against slopes.              |
| **Trampoline / Bumper**      | Fixed cuboid with high restitution and `Max` restitution combine rule.                                                                                                                                                                                                                                                                  | Bounce, gain height.                             |
| **Fan**                      | Sensor cuboid (occupants from `world.intersectionPairsWith` each step); applies force to occupants with distance falloff.                                                                                                                                                                                                               | Push, lift, hold.                                |
| **Catapult**                 | Position-based kinematic arm driven by `setNextKinematicRotation` on a sim-time curve; sensor cup detects the ball and triggers the swing; ball flung physically.                                                                                                                                                                       | Cross gaps, big arcs.                            |
| **Sling**                    | Sensor pocket captures the ball (ball set kinematic and parented to the pocket's path for the stretch), then re-enabled dynamic with an impulse along the sling's facing.                                                                                                                                                               | Precise launches.                                |
| **Elevator / Lift**          | Position-based kinematic platform moved with `setNextKinematicTranslation` between two points. Modes: loop, or trigger when the ball lands (sensor).                                                                                                                                                                                    | Vertical transport.                              |
| **Spinner / Paddle Wheel**   | Velocity-based kinematic body with constant `angvel` about Z.                                                                                                                                                                                                                                                                           | Flick, redirect, timing.                         |
| **Seesaw**                   | `jointed` dynamic plank on `World2D.addRevoluteJoint` with angle limits.                                                                                                                                                                                                                                                                | Weight-based redirect, timing.                   |
| **Pendulum / Wrecking Ball** | `jointed` dynamic ball on a rope or revolute joint to a fixed anchor.                                                                                                                                                                                                                                                                   | Knock the ball, timing.                          |
| **Dominoes**                 | Row of dynamic cuboids built together, drawn with one instanced mesh.                                                                                                                                                                                                                                                                   | Chain reactions, purely for score and spectacle. |
| **Funnel / Bucket**          | Fixed V-shaped cuboids.                                                                                                                                                                                                                                                                                                                 | Catch and center.                                |
| **Pipe / Tube**              | Fixed cuboids forming a channel; curved variants from segments.                                                                                                                                                                                                                                                                         | Guide, hide the ball briefly.                    |
| **Magnet** (later)           | Sensor region applying an attractor force.                                                                                                                                                                                                                                                                                              | Pull across gaps.                                |
| **Portal pair** (later)      | Linked sensors; `setTranslation` preserving `linvel`.                                                                                                                                                                                                                                                                                   | Spectacle, long travel.                          |
| **Switch & Gate** (later)    | Sensor toggles a kinematic door.                                                                                                                                                                                                                                                                                                        | Order-dependent puzzles.                         |

The first vertical slice ships **Ramp, Conveyor Belt, Trampoline**. The remainder arrive in the library expansion phase (see roadmap).

### 2.6 The five scenes

| #   | Working title    | Theme                 | Teaches                                                            | Key inventory                        |
| --- | ---------------- | --------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| 1   | **First Steps**  | Workshop bench        | Build/run loop, ramps, conveyors                                   | 2 ramps, 1 conveyor, 1 trampoline    |
| 2   | **Up the Wall**  | Attic with shelves    | Going up: fans, elevators, trampolines                             | Fan, elevator, trampoline, ramp      |
| 3   | **The Gap**      | Garden / two rooftops | Launching: catapult, sling, spinner                                | Catapult, sling, spinner, ramps      |
| 4   | **Clockwork**    | Clock tower interior  | Timing: pendulum, seesaw, dominoes, moving platforms               | Pendulum, seesaw, dominoes, conveyor |
| 5   | **Grand Finale** | Factory floor         | Everything; large space, generous inventory, highest score ceiling | Full catalogue, larger counts        |

Each scene must pass an automated **solvability test** (reference solution reaches B headlessly) before it is considered done.

---

## 3. Technical Approach

### 3.1 Stack

| Concern                   | Choice                                                                                                        | Notes                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Build tool                | **Vite** + **TypeScript**                                                                                     | Fast dev loop, first-class worker support (`new Worker(new URL(...))`).         |
| UI framework              | **React 19**                                                                                                  | Required by Fiber 9.                                                            |
| 3D/2D renderer            | **@react-three/fiber 9.x**                                                                                    | Orthographic camera, Z-locked; everything is rendered as flat meshes.           |
| Helpers                   | **@react-three/drei 10.x**                                                                                    | `OrthographicCamera`, `Text`, `Line`, `Edges`, `useTexture`, `Stats`, `Bounds`. |
| Physics                   | **@react-three/rapier 2.x** (Rapier WASM via `@dimforge/rapier3d-compat`) + in-house `World2D` / `Simulation` | 3D engine constrained to the XY plane. See decision D1 below.                   |
| Off-main-thread rendering | **@react-three/offscreen** (opt-in, phase 5)                                                                  | See decision D2 below.                                                          |
| State                     | **Zustand** (vanilla store)                                                                                   | Game store. Framework-agnostic, works inside a worker.                          |
| Schema validation         | **zod**                                                                                                       | Scene files, saved layouts and leaderboards are validated at load time.         |
| Dev tuning                | Headless `simulateRun` + debug overlay                                                                        | Leva was dropped in Phase 1: live physics tweaks would break game/test parity.  |
| Animation                 | **maath** (easing/damp), optionally `@react-spring/three`                                                     | Lightweight transitions for UI and contraption motion.                          |
| Audio                     | **howler** (or Web Audio directly)                                                                            | SFX for contacts, launches, success/fail. Phase 4.                              |
| Tests                     | **Vitest** (unit + headless physics), **Playwright** (smoke)                                                  | Scene solvability tests run on every CI build.                                  |
| Lint/format               | ESLint + Prettier                                                                                             | Standard.                                                                       |
| Hosting                   | Static (GitHub Pages / Vercel / Netlify)                                                                      | No backend for the demo.                                                        |

### 3.2 Key technical decisions

**D1 — Use `@react-three/rapier` (3D engine locked to the XY plane) instead of `@react-three/p2` or an in-house `p2-es` wrapper.**

_Why not `@react-three/p2`:_ pmndrs/use-p2 last published v0.0.6 in February 2022 and targets Fiber 7 / React 17. It does not resolve against Fiber 9 / React 19 / drei 10 and is unmaintained.

_Why not `p2-es` directly:_ the engine is a true 2D engine with native surface velocity, but it is dormant (last release 1.2.3, Nov 2023, 23 open issues), its Gauss-Seidel solver needs tuning to avoid jitter in stacks and joints, and we would own the hook layer, body↔mesh sync, stepping loop, and debug renderer ourselves.

_Why `@react-three/rapier`:_ v2.2.0 (Nov 2025) targets exactly our stack (`@react-three/fiber ^9`, `react ^19`), is actively maintained, and already provides what we would otherwise write: a fixed-timestep accumulator with render interpolation, `useBeforePhysicsStep`/`useAfterPhysicsStep`, sensors with `onIntersectionEnter/Exit`, `onContactForce`, collision groups and filter hooks, per-body CCD, a one-prop debug renderer, `InstancedRigidBodies`, joint hooks (revolute with motors, prismatic, rope, spring, fixed), and world snapshots for an exact, instant Reset. Rapier's solver handles stacking (dominoes), thin walls (CCD) and motorised joints noticeably better than p2. `@react-three/offscreen` explicitly lists Rapier as working inside the worker.

_Accepted costs:_

- **3D as 2D.** There is no `@react-three/rapier2d`. Every body goes through our `World2D` wrapper, which locks Z translation and X/Y rotation, keeps all colliders symmetric about `z = 0` with a common depth, and takes 2D arguments (`position: [x,y]`, `angle`). Joint axes are always `[0,0,1]`. Under these constraints the simulation is planar in practice (Phase 0 spike, `PHYSICS.md`).
- **One simulation, no JSX bodies (Phase 1 amendment).** Bodies are created imperatively by plain TypeScript (`World2D`, contraption `build()`, `Simulation`), never with `<RigidBody>`. `<Physics>` still owns the world, the fixed-step loop and the debug renderer; one `SimulationRunner` hooks `Simulation.beforeStep/afterStep` into its step callbacks, while tests call the same methods around `world.step()`. This was chosen over Phase 0's React `Body2D` because hook order across many components cannot be guaranteed to match a headless harness, and solvability tests are only meaningful if both run identical code. Cost: we read body poses in `useFrame` ourselves and skip `@react-three/rapier`'s interpolation (at 120 Hz physics this is smooth on 60 Hz displays).
- **Conveyor belts.** Rapier core supports contact modification (tangent velocity) but the JS bindings do not expose it yet (rapier.js PR #360 open; nothing through 0.19.3). Belts use a "treadmill" (velocity-based kinematic body, translation reset each step) plus a "grip" nudge toward belt speed for touching bodies, because friction alone carries a rolling ball at only 2/7 of belt speed (Phase 0 finding, `PHYSICS.md`). Both migrate to `modifySolverContacts` when it ships.
- **Joints.** Rapier's X/Y rotation locks freeze revolute joints (Phase 0 finding). Bodies attached by joints lock only Z translation and are re-projected onto the plane after every step (`createBody({ jointed: true })`, `PHYSICS.md`).
- **Bundle size.** `@dimforge/rapier3d-compat` inlines the WASM as base64: 2.2 MB raw, 842 KB gzipped (measured in Phase 0, `PERF.md`). The whole Phase 0 build is ~1.16 MB gzipped, so it fits the 2 MB budget but Rapier is the largest item; it ships as its own cacheable chunk, and scenes, textures and audio are code-split and lazy-loaded.
- **Rust aliasing rule.** Body state cannot be read inside Rapier's filter hooks; contraption logic runs in `beforeStep`, outside `world.step()`.
- **Vite config.** `optimizeDeps.exclude: ['@dimforge/rapier3d-compat']` is required or `RAPIER.init()` can hang in dev.

_Determinism:_ Rapier's docs state the WASM build is cross-platform deterministic for identical initial conditions; the package README is more conservative (default build "locally deterministic", `-deterministic` builds guaranteed). Local determinism is all the demo needs (local leaderboards, solvability tests). If a remote leaderboard with server-side re-simulation is ever built, alias `@dimforge/rapier3d-compat` → `@dimforge/rapier3d-deterministic-compat` with a package-manager override.

_Fallback:_ if the Phase 0 spike reveals a blocking problem with the 2D lock, the fallback is `@dimforge/rapier2d-compat` with an in-house hook layer (true 2D, same engine quality, same conveyor gap), not p2-es.

**D2 — Treat `@react-three/offscreen` as an opt-in enhancement, not a dependency of the design.**
The package is explicitly experimental, Safari lacks OffscreenCanvas + WebGL (it falls back to the main thread), and Vite needs workarounds for JSX in workers. The game must be complete and shippable on the main thread. To make the later switch cheap, we constrain the architecture from day one:

- Everything under `src/game/**` is **DOM-free** (no `window`, `document`, CSS-in-JS, or DOM event listeners).
- All in-game interaction (inventory tray, place/rotate/delete, Run/Reset buttons, live score) is rendered **inside the canvas** using meshes and drei `Text`, so gameplay never needs to cross the thread boundary.
- DOM UI (main menu, scene select, result modal, leaderboard, name entry) talks to the game through a tiny typed **`GameBridge`** (`shared/bridge/messages.ts`: `loadScene`, `backToBuild`, `key`, `setDebug` → game; `ready`, `sceneLoaded`, `layoutChanged`, `modeChanged`, `runEnded` → app). Main-thread implementation is an in-memory emitter; the worker implementation is `postMessage`. Nothing else may cross. The game owns no storage: the app persists layouts and leaderboards.
- Phase 5 swaps `Canvas` import from `@react-three/fiber` to `@react-three/offscreen` behind a feature flag with the main-thread scene as `fallback`.

**D3 — Fixed-timestep, deterministic simulation.**
`<Physics timeStep={1/120}>` steps the world with an accumulator (never `"vary"`) and capped catch-up per frame; solver settings come from one `SOLVER` constant shared with headless worlds. The ball has `canSleep={false}` and `ccd`; maximum speed is clamped in `Simulation.afterStep`. Scripted contraptions (catapult arm, elevator) advance by simulation time, not wall time. Bodies are created in a fixed, data-driven order (scene statics, then fixed contraptions, then placed contraptions sorted by id, then the ball) because Rapier's determinism depends on creation order. Result: a given layout always yields the same run and score (verified identical between browser and headless), which the leaderboard and solvability tests rely on, and which later enables replays/share links from layout data alone.

**Reset** rebuilds from data: every Run remounts `<Physics key={runId}>`, so each run starts in a fresh world built from the layout. This is exact by construction and fast at our scene sizes, so world snapshots are not needed.

**D4 — Contraptions as plugins.**
A registry maps `contraptionType → definition` (pure: params, footprint, `build()` returning an optional `beforeStep`), and a separate view registry maps it to a React `View`. Scenes reference types by id. Adding a contraption means adding one folder and one registry line; no scene or engine code changes.

**D5 — Scenes as data with a reference solution.**
Scenes are declarative, schema-validated files that also carry a known-good solution. A Vitest suite instantiates the headless physics world, applies the solution, runs the simulation, and asserts the goal is reached under the time limit. Every engine or contraption change is checked against all scenes.

### 3.3 Architecture

```
src/
├─ main.tsx                     # DOM entry
├─ app/                         # DOM-side UI (React DOM)
│  ├─ App.tsx                   # bridge owner, keyboard capture, header, overlays
│  ├─ screens/                  # ResultPanel, LeaderboardPanel (later: MainMenu, SceneSelect)
│  └─ storage/                  # zod-validated localStorage: leaderboard repository, layouts, player name
├─ game/                        # DOM-free. Runs on main thread or inside a worker.
│  ├─ GameCanvas.tsx            # Canvas + per-instance game store
│  ├─ GameRoot.tsx              # bridge handling, scene composition, <Physics key={runId}>
│  ├─ engine/
│  │  ├─ physics/               # World2D (planar bodies, joints, solver config), plane projection, treadmill, speed clamp
│  │  ├─ materials.ts           # Friction/restitution presets & combine rules
│  │  └─ determinism.ts         # Step, gravity, SOLVER settings, sizes, speed limits
│  ├─ contraptions/
│  │  ├─ registry.ts  types.ts  # type → pure definition
│  │  ├─ views.tsx              # type → React view
│  │  └─ ramp/  conveyor/  trampoline/  (fan/  catapult/ ...)
│  │     ├─ definition.ts       # params, footprint, build() → { beforeStep? }
│  │     └─ *View.tsx           # R3F mesh component
│  ├─ scenes/                   # schema.ts (zod), registry.ts, 01-first-steps.ts ...
│  ├─ sim/                      # Simulation (step pipeline, outcomes), SimulationRunner, simulateRun
│  ├─ scoring/                  # ScoreTracker + constants
│  ├─ build/                    # geometry (SAT), placement rules, placed items, ghost, gizmo
│  ├─ state/                    # gameStore (vanilla Zustand), React context
│  ├─ ui/                       # In-canvas tray, run controls, interaction plane, key handling
│  └─ render/                   # Ball, statics, camera framing, palette, placeholders
├─ shared/                      # Framework-free: math, layout schema, run results, scene catalogue, bridge
└─ test/                        # Headless physics helpers
e2e/                            # Playwright smoke tests
```

Dependency rule: `app → shared`, `game → shared`, `app ↔ game` **only** via `bridge`. Enforced with an ESLint import-boundary rule.

### 3.4 Rendering approach (2D in a 3D renderer)

- `OrthographicCamera` looking down `-Z`; all bodies live on `z = 0`, with small `z` offsets for layering (background, static, contraptions, ball, HUD).
- World unit = 1 meter; typical scene ≈ 16 × 9 units. Camera frames the scene bounds using drei `Bounds` or manual zoom from the viewport aspect.
- Visual style: flat colors with dark outlines (drei `Edges` or an outline shader), soft gradient backgrounds, simple squash/stretch on the ball, dust/spark particles on contacts. Placeholder geometry first (boxes, circles, lines); hand-drawn or SVG textures in the polish phase.
- Physics debug overlay (`<Physics debug>` collider wireframes plus our own velocity vector and sensor-occupancy markers) toggled with a hotkey in dev.

### 3.5 Input

- Pointer (mouse/touch) via R3F events on canvas objects: drag from tray, drag placed items, tap to select.
- Keyboard: `R` rotate, `F` flip, `Delete` remove, `Space` run/reset, `Esc` deselect. Captured on the canvas element and forwarded as game messages, so the same path works from a worker.
- Touch-friendly hit areas and an on-canvas rotate/flip/delete gizmo for selected contraptions.

### 3.6 Persistence

- `localStorage`, owned by the app (`app/storage`): leaderboards, last layout per scene (so a reload does not lose work), player name, unlocked scenes (`pm.progress.v1`) and settings (sound, reduced motion, camera follow). The game receives saved layouts in `loadScene` and re-validates them against the scene.
- All persisted structures are versioned and validated with zod on load; invalid data is discarded, not crashed on.

### 3.7 Testing strategy

| Layer            | Tool                                                                            | What                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit             | Vitest                                                                          | Scoring formulas, stall detection, schema validation, registry, placement validation.                                                                                                                                                                                                                                                                          |
| Headless physics | Vitest + `@dimforge/rapier3d-compat` (runs in Node after `await RAPIER.init()`) | A headless world factory mirrors what `<Physics>` builds, without React. Each contraption has a behaviour test (ball enters conveyor → exits with expected velocity sign, etc.). Each scene has a solvability test using its reference solution. Determinism test: two runs → identical score. 2D-lock test: no body ever leaves `z = 0` or rotates about X/Y. |
| Component        | Vitest + React Testing Library                                                  | DOM screens (menu, leaderboard, name entry).                                                                                                                                                                                                                                                                                                                   |
| E2E smoke        | Playwright                                                                      | App boots, scene 1 loads, reference solution placed via test hook, run succeeds, score appears on leaderboard.                                                                                                                                                                                                                                                 |

### 3.8 Performance budget

- 60 fps on a mid-range laptop and a recent mid-range phone with the largest scene (Scene 5).
- Physics step < 2 ms/frame; < 200 bodies in any scene.
- Initial load < 2 MB (code-split scenes and heavy textures; lazy-load audio). The Rapier WASM payload is the largest single item; it is loaded once behind the main-menu Suspense boundary.

---

## 4. Risks & Mitigations

| Risk                                                                      | Impact                           | Mitigation                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-three/offscreen` instability or Vite worker friction              | Could sink time late             | Opt-in behind a flag; main-thread build is the shipping baseline (D2).                                                                                            |
| 3D engine used as 2D leaks (drift in Z, off-plane contacts, joint wobble) | Unfair or confusing physics      | `Body2D` wrapper is the only way to create bodies; colliders symmetric about `z = 0`; Phase 0 spike + automated 2D-lock test; fallback to `rapier2d-compat` (D1). |
| Conveyor "treadmill" workaround feels wrong or jitters                    | Core contraption is unconvincing | Phase 0 spike validates it; tune friction; migrate to `modifySolverContacts` when rapier.js exposes it.                                                           |
| Rapier WASM payload vs load budget                                        | Slow first load on mobile        | Measure in Phase 0; code-split everything else; show a loading screen behind Suspense.                                                                            |
| Physics tunnelling (fast ball passing through thin walls)                 | Broken runs, unfair fails        | CCD on the ball, min wall thickness, speed clamp, 1/120 s step.                                                                                                   |
| Non-determinism across browsers (float differences)                       | Leaderboard disputes             | Same engine, same step, fixed creation order; local leaderboards in the demo; `-deterministic` build if a remote leaderboard is added.                            |
| Infinite-loop score exploits                                              | Degenerate top scores            | Time cap, diminishing touch bonuses, stall detection.                                                                                                             |
| Scenes become unsolvable after a contraption tweak                        | Silent regressions               | Automated solvability tests on every change (D5).                                                                                                                 |
| Scope creep in contraption catalogue                                      | Demo never ships                 | Vertical slice with 3 contraptions first; the catalogue grows only as scenes require.                                                                             |
| Drag-and-drop UX in canvas on touch                                       | Frustrating mobile play          | Large hit targets, on-canvas gizmo, test on a phone from Phase 1.                                                                                                 |

---

## 5. Definition of Done (demo)

- Five scenes, each with an automated solvability test and a hand-tested fun factor.
- Full loop: menu → scene select → build → run → result → leaderboard → next scene.
- Deterministic scoring; per-scene local leaderboards; name entry.
- At least 10 contraptions in the library.
- Runs at 60 fps on target hardware; works on desktop and touch.
- Deployed as a static site with a public URL.
- README with controls and a short "how it works" for the physics/scoring.

See [`ROADMAP.md`](./ROADMAP.md) for the phased breakdown.
