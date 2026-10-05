# Puzzling Machines — Development Roadmap

This document breaks [`PLAN.md`](./PLAN.md) into phases. Each phase ends with something runnable and demonstrable. Phase 1 delivers a single fully playable scene; later phases extend the library and scene count until the 5-scene demo is complete.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundations

**Goal:** A Vite + React 19 + R3F project where a ball drops onto a floor under Rapier physics locked to the XY plane, with an orthographic camera and a debug overlay. A spike proves the 2D-in-3D constraints and the conveyor technique before any gameplay is built.

### Features

- [x] **Project scaffold** — Vite 8, TypeScript 6.0 (strict), React 19.3, npm, ESLint 10 + Prettier, Vitest 5, path aliases (`@app`, `@game`, `@shared`, `@test`). TypeScript 7 is not used because typescript-eslint supports `<6.1`.
- [x] **Dependencies pinned** — `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, `@react-three/rapier@^2.2`, `@dimforge/rapier3d-compat@0.19.2` (exactly the version `@react-three/rapier` bundles), `zustand`, `zod`, `leva` (dev, removed in Phase 1), `maath`. Vite `optimizeDeps.exclude: ['@dimforge/rapier3d-compat']`.
- [x] **Folder structure** per PLAN §3.3, with ESLint import-boundary rules (`app ↔ game` only through `GameCanvas`/`bridge`; `game` may not use DOM globals; raw `RigidBody`/colliders only inside `engine/physics`; `shared` framework-free). Rules verified against deliberate violations.
- [x] **`GameCanvas`** — R3F `Canvas` (orthographic, `-Z`), `Suspense` + `<Physics timeStep={1/120} interpolate>`, `computeOrthoFraming` + `FitCamera` fitting a 16×9 bounds rectangle to any viewport aspect.
- [x] **`Body2D` wrapper** — React wrapper with 2D props, planar locks and `jointed` mode. _Replaced in Phase 1 by the imperative `World2D` so game and tests share one step pipeline (PLAN D1)._
- [x] **Materials** — presets (default, ball, bouncy, slippery, belt) with combine rules, mirrored against Rapier's enum in a test.
- [x] **Determinism config** — `determinism.ts`: step, gravity, collider depth, ball radius, speed clamp, minimum wall thickness (tested against max speed × step), documented body-creation order.
- [x] **Headless world factory** — `HeadlessWorld` with snapshot/restore. _Became `World2D.create()` in Phase 1._
- [x] **2D-in-3D spike** — ramp, conveyor, seesaw, sensor and three balls, headless and in the browser (`docs/phase-0-spike*.png`). Planarity over 30 s, determinism and snapshot replay pass. Found and worked around two Rapier issues: rotation locks freeze revolute joints, and friction-only conveyors carry a ball at 2/7 belt speed. **D1 go:** no fallback needed.
- [x] **Debug tooling** — `<Physics debug>` collider overlay and velocity arrows toggled with `` ` ``; drei `Stats` while debug is on (dev); lazy dev-only Leva panel (gravity scale, pause; removed in Phase 1 because gravity tweaks would break game/test parity). Sensor-occupancy markers moved to Phase 1 with the goal sensor.
- [x] **Bundle measurement** — `npm run analyze` treemap; chunk sizes in `docs/PERF.md` (Rapier 842 KB gzip; total ~1.16 MB gzip).
- [x] **Smoke test** — headless ball settles on the ground with `z === 0`.
- [x] **CI** — GitHub Actions: lint, format check, typecheck, test, build.

### Definition of done

A ball drops and settles on a floor at a stable 60 fps; the spike shows a working ramp, conveyor, seesaw, sensor and snapshot reset with all bodies staying in-plane; bundle size is recorded; `npm test` passes in CI.

**Status:** met, except that frame rate was not measured (moved to Phase 1, Scene 1) and snapshot reset is proven headless only (in-game reset remounts the scene; React snapshot reset is a Phase 1 item). CI has not run yet because the repository has no remote.

### Risks / notes

- If the spike shows Z drift, off-plane contacts or joint wobble that `Body2D` cannot contain, switch to `@dimforge/rapier2d-compat` with an in-house hook layer (PLAN D1 fallback) before Phase 1.
- Rapier forbids reading body state inside filter/step hooks ("Rust aliasing"); cache state in `useBeforePhysicsStep`.
- Keep `game/**` free of `window`/`document` from the first commit — retrofitting is costly.

---

## Phase 1 — Vertical Slice: Scene 1 "First Steps"

**Goal:** One complete, playable scene with the full loop: build → run → result → leaderboard. Three contraptions. This is the single-scenario milestone.

### Features

**Scene system**

- [x] `SceneDefinition` zod schema (`scenes/schema.ts`): bounds, statics, fixed contraptions, build zones, start, goal rect, inventory (with per-scene params), run limits, reference solution. Cross-checks: start/goal inside bounds, reference solution within inventory. `defineScene` validates at module load.
- [x] Scene instantiation — `Simulation` builds statics, fixed contraptions, placed contraptions and the ball from data (replaces the planned `loadScene()`; the goal is a geometric rect check rather than a sensor, see run mode).
- [x] **Scene 1 data** (`scenes/01-first-steps.ts`) — tilted start shelf top-left, goal cup bottom-right behind a wall too tall to roll over; inventory 2 ramps, 1 conveyor, 1 trampoline. Without parts the ball stalls against the cup wall.
- [x] Shared scene catalogue (`shared/scenes.ts`) for the app, tested against the game registry.

**Contraption framework**

- [x] `ContraptionDefinition` (pure: type, name, `flippable`, `defaultParams`, `footprint`, `build(world, placed, params)` returning an optional `beforeStep`), registry, `PlacedContraption` / `Layout` zod schemas in `shared/layout.ts`. Views live in a separate React registry (`contraptions/views.tsx`).
- [x] **Single step pipeline** — `Simulation.beforeStep / afterStep` run identically from `<Physics>` callbacks (`SimulationRunner`) and headless (`simulateRun`); both worlds use the same `SOLVER` settings. Browser and headless scores match exactly (Scene 1 reference: 297 in 7.36 s after scoring v2), pinned as a golden test.
- [x] Contraption lifecycle — bodies created in deterministic order on the first step of each run; `<Physics key={runId}>` gives every run a fresh world, so Reset is exact without snapshots (snapshot reset dropped; it is no longer needed).
- [x] **Ramp** — fixed rotatable cuboid; param: length.
- [x] **Conveyor Belt** — `stepConveyor` (treadmill + grip); params: length, speed; flip reverses; carries along its own angle; animated belt marks driven by sim time.
- [x] **Trampoline** — fixed cuboid, `bouncy` material. _Squash animation moved to Phase 4 (juice)._
- [x] Behaviour tests (`contraptions.test.ts`).

**Build mode**

- [x] In-canvas **Inventory Tray** (meshes + drei `Text`): icon, name, remaining count, greyed when empty or not in build mode.
- [x] Drag from tray into world; drag placed items; grid snap 0.25; rotate 15° (`R` / `Shift+R` / gizmo), flip (`F` / gizmo, flippable only), delete (`Del` / `Backspace` / gizmo); `Esc` cancels a drag. Pointer capture keeps drags alive off-canvas.
- [x] **Placement validation** (`build/placement.ts`, SAT on oriented boxes) — build zones, statics, fixed and placed contraptions, start clearance, goal; green/red ghost; invalid drops discard (from tray) or snap back (move). Rotations that would collide are refused.
- [x] Selection outline and gizmo (rotate ⟲/⟳, flip, delete) above the selected part; build zones shaded in build mode.
- [x] Layout autosaved per scene (app-side, `localStorage`, zod-validated) and restored on reload; the game re-validates restored layouts against the scene.

**Run mode**

- [x] One in-canvas button: RUN / STOP / EDIT; `Space` toggles.
- [x] Mode machine `build → running → result → build` in the game store (`state/gameStore.ts`, tested).
- [x] Win: ball centre inside the goal rect for ≥ 0.3 s.
- [x] Fail: more than 1 m outside bounds, `maxRunTime`, or stall (`|v| < 0.3` for `stallSeconds`).
- [x] Reset = remount the physics world; layout data is never mutated by the simulation. After the outcome the machine keeps running visually; scoring stops.

**Scoring v1**

- [x] `ScoreTracker` — `(K_TIME + K_SPEED·|v|)·dt` while `|v| > 0.3` (K_TIME 10, K_SPEED 4); ×1.5 on success; failed runs score 0 but show their motion points.
- [x] Live score and run time in the tray (~10 Hz); final score on the result panel.
- [x] Determinism tests: same layout twice → identical result; layout order does not matter.

**Leaderboard v1**

- [x] `LeaderboardRepository` interface + `LocalLeaderboardRepository` (zod-validated, versioned key, top 10, ties keep the earlier entry ahead).
- [x] DOM **Result panel** (success/fail reason, score, breakdown, keep building).
- [x] DOM **Name entry** (3–8 of letters, digits, space, `-`, `_`; remembered), shown only when the score qualifies; the board appears with the new row highlighted.
- [x] DOM **Leaderboard panel** from the header.

**Bridge**

- [x] `GameBridge` (`shared/bridge`) with an in-memory transport. App → game: `loadScene`, `backToBuild`, `key`, `setDebug`, `setSettings`. Game → app: `ready`, `sceneLoaded`, `layoutChanged`, `modeChanged`, `runEnded`, `requestExit`. Messages are structured-clone safe for the Phase 5 worker transport.

**Tests**

- [x] Headless **solvability tests** per scene: empty layout fails, reference solution is grid/rotation reachable, legal, succeeds with the golden score, deterministic, order independent.
- [x] Unit tests: geometry and placement, snapping, scoring, store (drag/drop, inventory, rotate/flip/delete, mode machine, saved-layout sanitising), storage (leaderboard, names, layouts, corrupt data).
- [x] **Playwright smoke** (`e2e/scene1.spec.ts`): real mouse drags place the reference solution, `Space` runs it, the score matches the golden value, a name is saved, and the leaderboard and layout survive a reload. Local runs use installed Edge; CI installs Chromium.

### Definition of done

A new player can open the app, solve Scene 1 by placing ramps and a conveyor, see a score, enter a name, and find themselves on the leaderboard. Works with mouse and touch. All tests green.

**Status:** met for mouse and keyboard, verified end to end in Edge (screenshots `docs/phase-1-*.png`) and by the Playwright smoke test. Touch uses the same pointer events and the canvas sets `touch-action: none`, but it has not been tried on a real device. Frame rate on real hardware is still unmeasured: headless software rendering gives 36 fps at 1600×900 (lower bound, see `PERF.md`).

### Risks / notes

- Spend real time on the drag/snap/rotate feel; it is the whole game's UX.
- The conveyor's grip constant (`CONVEYOR_GRIP`) and belt friction need tuning against the feel of Scene 1. Track rapier.js PR #360 (contact modification) for the proper implementation.
- Frame-time measurement starts here (Scene 1 on the reference laptop and phone, recorded in `PERF.md`).

---

## Phase 2 — Contraption Library & Scoring v2

**Goal:** Grow the catalogue to ≥ 10 contraptions with distinct physics and visuals, harden the simulation, and finish the scoring model. Still only Scene 1 shipped, but a dev "sandbox scene" exercises every contraption.

### Features

**New contraptions** (each with definition, physics, view, behaviour test)

- [x] **Fan** — sensor; occupants from `dynamicBodiesIn` in `beforeStep`; acceleration falloff along the stream; flip reverses; spinning blades and streaks in the view.
- [x] **Catapult** — position-based kinematic arm (`setNextKinematicRotation`); arms when the ball is in the cup (geometric test — a sensor on a still kinematic body is unreliable); cooldown/reset; params: power, sweep.
- [x] **Sling** — pocket captures the ball, pulls back, releases with an impulse; `holdsBall` during the stretch; params: power.
- [x] **Elevator** — kinematic platform (`setNextKinematicTranslation`); trigger-on-load, then tip at the top; `holdsBall` while riding; params: height, speed.
- [x] **Spinner / Paddle Wheel** — velocity-based kinematic body with constant `angvel`; flip reverses; params: radius, speed, blades.
- [x] **Seesaw** — `jointed` plank on `addRevoluteJoint` with angle limits; view reads the plank pose.
- [x] **Pendulum** — `jointed` bob on a revolute joint; starts raised; flip mirrors the start side.
- [x] **Dominoes** — row of dynamic tiles in one `build()`; each tile has its own pose-reading view; one inventory item.
- [x] **Funnel / Bucket** — two wall segments, gap wide enough for the ball.
- [x] **Pipe (straight & curved)** — `pipe` and `pipeCurve`; slippery walls; bend is a quarter-circle.

**Scoring v2**

- [x] Touch bonuses (`B_TOUCH` 15, decay 0.5) with a 0.2 s gap so rolling jitter is one touch. Repeats converge.
- [x] Stall-timer suspension while `holdsBall()` is true (elevator, sling, catapult cup).
- [x] Result breakdown: time in motion, distance, motion points, parts touched, touch bonus, multiplier.
- [x] First Steps golden score re-pinned at **297** (was 218) after touch bonuses. Same value in the browser and headless.

**Simulation hardening**

- [x] Tunnelling test: max-speed ball vs `MIN_WALL_THICKNESS` does not pass through (CCD on).
- [x] Loop exploit test: conveyors + fan cycle → timeout, bonus stays below the geometric series cap, score 0.
- [x] Reset test in Playwright: run → edit → run again → identical golden score.
- [x] 2D-lock test: one of every contraption in the sandbox for 20 s, all bodies stay in-plane.

**Dev tooling**

- [x] **Sandbox scene** (dev catalogue only, `dev: true`) with unlimited inventory (`count: 0`) of every contraption. Scene picker + wrapping tray.
- [ ] Contraption param editor for tuning defaults (dev only; edits apply on the next Run so parity holds).
- [x] "Copy layout" in the header (dev) writes the current layout JSON to the clipboard.

### Definition of done

Every contraption has a passing behaviour test and feels right in the sandbox; scoring breakdown is understandable; no tunnelling in stress tests.

**Status:** catalogue, scoring v2, sandbox and hardening tests are in. The live param editor is still open; "Copy layout" covers the export path. Scene 1's golden score changed from 218 to 297 because touch bonuses now apply — existing local leaderboards from Phase 1 will look low by comparison.

---

## Phase 3 — Scenes 2 & 3, Navigation, Progression

**Goal:** Expand from one scene to three with a proper menu flow and per-scene leaderboards.

### Features

**Scenes**

- [x] **Scene 2 "Up the Wall"** — attic well; goal on a high landing; inventory elevator, fan, trampoline, ramp. Reference solution + solvability test (golden **246**).
- [x] **Scene 3 "The Gap"** — two rooftops; wide chasm; inventory sling, catapult, spinner, ramps. Reference solution + solvability test (golden **169**).
- [x] Scene authoring guide (`docs/SCENE_AUTHORING.md`): units, checklist, how to add a reference solution.

**Navigation & progression**

- [x] DOM **Main Menu** (Play, Leaderboards, Settings, Credits).
- [x] DOM **Scene Select** — cards with thumbnail, best score, lock state.
- [x] Progression: a scene unlocks after the previous one is completed (dev setting to unlock all).
- [x] "Next scene" from Result screen.
- [x] Per-scene leaderboard view from Scene Select, the play header, and Result.

**Onboarding**

- [x] Scene 1 guided hints (tap-to-dismiss callouts: drag a ramp, rotate, press Run).
- [x] Optional hint after 3 fails: highlight the reference solution's first placement.

**UX polish**

- [x] Camera: fit-to-bounds on load, optional subtle follow on the ball during run (toggle in settings).
- [x] Ball trail (drei `Line`, fading), contact sparks.
- [x] Settings: sound on/off (stub for Phase 4 audio), reduced motion, reset progress.

### Definition of done

Three scenes playable in sequence from the menu; each has a leaderboard; progression persists across reloads.

**Status:** met. The app opens on the main menu; Scene 2 and 3 stay locked until the previous scene is completed (or the dev unlock-all setting is on). Golden scores: First Steps 297, Up the Wall 246, The Gap 169. Sound is stored but silent until Phase 4.

---

## Phase 4 — Scenes 4 & 5, Art, Audio, Accessibility

**Goal:** Complete the 5-scene demo and make it look and sound finished.

### Features

**Scenes**

- [x] **Scene 4 "Clockwork"** — clock tower. The ball starts at rest on a flat ledge; a pendulum has to knock it onto a fixed lift, and a conveyor carries it to the goal shelf. Seesaw and dominoes are also in the tray for players who want to experiment. Reference solution + golden test (298).
- [x] **Scene 5 "Grand Finale"** — factory; largest bounds (24 × 13), full catalogue, fixed belt and lift. Two tested routes: the reference high road over the dividing wall (356) and a one-ramp low road through the pit and tunnel (482). _Performance profiling is tracked in Phase 5._

**Art pass** (Qwen-Image generations packed into one atlas; see [ART.md](ART.md))

- [x] Visual identity: a palette per scene theme for statics, build zones and goal; flat shapes with outlines and a top highlight; painted backdrops per scene with gentle parallax.
- [x] Contraption sprites from a single 2048×1392 WebP atlas (26 frames); idle motion for fan blades, belt stripes and the spinner; pose swaps for trampoline squash, sling pull and the goal flag.
- [x] Ball squash/stretch along the impact direction, confetti and a celebrating flag on success, a dust puff on failure, sparks on hard hits.
- [x] Tray icons from the part sprites (single representative sprite for tall parts), scene-card thumbnails, main-menu key art.

**Audio** (files are produced externally from the [AUDIO.md](AUDIO.md) brief and dropped into `public/audio/`)

- [x] SFX wiring: wood/metal impacts with pitch and volume by impact strength, conveyor and fan loops (placed or fixed parts), catapult/sling launch, trampoline, spinner, elevator, build cues (place/rotate/remove/invalid) emitted by the game, success, fail, UI clicks.
- [x] Background music per scene and for menus, crossfaded, ducked while the result panel is open.
- [x] Audio runs on the DOM side driven by bridge messages (`sfx`, `modeChanged.ambience`, `runEnded`), so it stays worker-compatible. Missing files are skipped silently.

**Accessibility & input**

- [x] Full keyboard placement: focus the board, `Tab`/`Shift+Tab` cycle the tray (and leave it at either end), `Enter` places the part at the nearest free spot, arrows nudge (Shift = 4 cells), `R`/`F`/`Delete`. The tray cursor appears only for keyboard focus and is announced through a live region.
- [x] Reduced-motion mode: no squash/stretch, sparks, confetti, puff or camera follow.
- [x] Placement feedback uses shape as well as colour (corner brackets for valid, a cross for invalid; selection is an outline, not a fill). _A formal colour-blindness simulation pass has not been done._
- [ ] Touch: pointer events drive all building and the canvas sets `touch-action: none`, so drags do not scroll or zoom the page. _Not yet tested on a real phone or tablet; tray sizing on small screens is unverified._

**Content QA**

- [ ] Playtest sessions on each scene; difficulty curve adjustments; record median attempts to solve. _Needs human testers._

### Definition of done

Five scenes complete with final art and audio; playable end-to-end on desktop and mobile; solvability tests pass for all scenes.

**Status:** met on desktop. All five scenes are playable in sequence with generated art; solvability and golden tests pass for every scene (First Steps 297, Up the Wall 246, The Gap 169, Clockwork 298, Grand Finale 356). Audio is fully wired and waits for the ElevenLabs files listed in `AUDIO.md`. Still open: real-device touch testing and human playtests. Screenshots: `docs/screenshots/`.

---

## Phase 5 — Performance, Offscreen Rendering, Release

**Goal:** Ship the demo. Add `@react-three/offscreen` as an opt-in worker renderer, profile, and deploy.

### Features

**Offscreen rendering (opt-in)**

- [ ] Worker entry (`game/worker.tsx`) calling `render(<GameRoot/>)` from `@react-three/offscreen`; `Canvas` import switched behind a `VITE_OFFSCREEN` flag with main-thread `<GameRoot/>` as `fallback`.
- [ ] `GameBridge` worker transport (`postMessage`); audio and DOM screens unaffected.
- [ ] Vite worker configuration for JSX; verify HMR behaviour; document limitations.
- [ ] Verify Safari fallback path and that pointer events are forwarded correctly in Chrome/Firefox.
- [ ] Measure main-thread frame time with and without the worker; keep the flag default to whichever is better on target hardware.

**Performance**

- [ ] Profile Scene 5: physics step time, draw calls, GC pressure; object pooling for particles; instanced meshes for repeated static tiles.
- [ ] Code-split scenes and lazy-load textures/audio; initial bundle budget < 2 MB.
- [ ] Lighthouse pass.

**Release**

- [ ] Error boundary + friendly "something went wrong, reset layout" recovery.
- [ ] Versioned persisted state with migration/discard.
- [ ] Static deploy (GitHub Pages / Vercel) via CI on `main`.
- [ ] README: controls, how scoring works, how to add a scene/contraption, credits.
- [ ] Tag `v0.1.0-demo`.

### Definition of done

Public URL, 60 fps on target hardware, offscreen mode available behind a flag with a working fallback, docs complete.

---

## Stretch / Post-demo Backlog

- [ ] **Remote leaderboard** — `LeaderboardRepository` backed by Supabase or a Cloudflare Worker; basic anti-cheat by re-simulating submitted layouts server-side (possible thanks to determinism).
- [ ] **Replays & share links** — encode the layout in the URL; anyone can watch the run.
- [ ] **Level editor** — in-browser scene authoring that exports the `SceneDefinition`.
- [ ] **More contraptions** — magnet, portal pair, switch & gate, balloon, rope bridge.
- [ ] **Daily challenge** — a seeded scene variant with its own 24 h leaderboard.
- [ ] **Multiple balls / cargo** — different masses and sizes.
- [ ] **PWA** — installable, offline play.

---

## Milestone summary

| Phase | Scenes shipped | Contraptions | Headline                                        |
| ----- | -------------- | ------------ | ----------------------------------------------- |
| 0     | 0              | 0            | Ball drops on a floor                           |
| 1     | 1              | 3            | Fully playable single scenario with leaderboard |
| 2     | 1 (+ sandbox)  | ≥ 10         | Library and scoring complete                    |
| 3     | 3              | ≥ 10         | Menu, progression, onboarding                   |
| 4     | 5              | ≥ 10         | Final art, audio, accessibility                 |
| 5     | 5              | ≥ 10         | Offscreen opt-in, performance, public release   |
