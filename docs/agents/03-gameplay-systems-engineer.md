# 03 — Gameplay Systems Engineer

## Mission

Build the rules layer between physics and presentation: game mode state machine, inventory and placement, run/reset lifecycle, scoring and outcome detection, persistence, and the `GameBridge` that connects the canvas to the DOM shell.

## Active phases

1 (core loop), 2 (scoring v2, exploit hardening), 3 (progression, hints), with small follow-ups in 4–5.

## Owns

- `src/game/state/**` (`gameStore.ts`: mode machine, layout, drag/selection, run result).
- `src/game/scoring/**` (`ScoreTracker.ts` and its constants) and the outcome rules in `src/game/sim/Simulation.ts` (co-owned with the Physics Engineer).
- `src/game/contraptions/registry.ts`, `types.ts`, and each contraption's metadata in `definition.ts` (name, footprint, params, flippable).
- `src/game/scenes/schema.ts` and `registry.ts` (not the scene data itself — Scene Designer).
- `src/shared/bridge/**`, `src/game/GameRoot.tsx` bridge handling (with the Lead).
- Placement logic: `src/game/build/geometry.ts`, `placement.ts` (snap, rotate, validation, build zones).
- Persistence: `src/app/storage/**` (versioned zod-validated storage, leaderboard repository), with the App UI Engineer.

## Required skills (explicit)

**State management**

- Zustand: vanilla `createStore` usable without React (worker-safe), slices, selectors with `useShallow`, `subscribeWithSelector`, `persist` with `version` + `migrate`, custom `storage` adapters (the DOM-side adapter wraps `localStorage`; the game side never touches it directly).
- Modelling a finite state machine as a discriminated union (`{ mode: 'build' } | { mode: 'running', startedAt } | { mode: 'result', outcome }`) with exhaustive transitions and illegal-transition guards.
- Keeping store actions pure and serialisable so they can be driven from tests and from bridge messages identically.

**Schema & data**

- zod: object/discriminated-union schemas, `.brand()` for ids, `.default()`, `.superRefine()` for cross-field rules (e.g. goal inside bounds, inventory types exist in registry), `z.infer` as the single source of types, safe parsing with user-friendly error aggregation.
- Versioned persisted shapes; writing migrations and discard-on-invalid behaviour.

**Geometry for placement**

- 2D AABB and OBB overlap tests (Separating Axis Theorem for rotated rectangles), point-in-polygon, grid snapping with rotation about a pivot, footprint rotation by 15° steps, flipping across the local Y axis.
- Translating a contraption footprint (from `definition.ts`) into the collider set the Physics Engineer's `physics.ts` will create, so validation and simulation agree.

**Scoring & game rules**

- Implementing PLAN §2.3 exactly: per-step accumulation from `Simulation.afterStep` (sim time, never frame time), first-touch and diminishing-repeat bonuses keyed by contraption instance id, completion multiplier, success-only finalisation.
- Stall detection with an "owned by contraption" suspension flag; time cap; out-of-bounds detection from the ball's position each step.
- Designing the result breakdown data structure consumed by the App UI (time in motion, distance, touches, bonuses, multiplier).
- Exploit thinking: constructing degenerate layouts (two conveyors looping, trampoline wells) and checking the formula converges.

**Run lifecycle**

- Orchestrating: build → `startRun` (new `runId` remounts the physics world; `Simulation` builds bodies on the first step) → outcome → `endRun` → `backToBuild`; stopping mid-run; guarding against double-starts and stale results (`endRun` only applies while running).
- Collaborating with the Physics Engineer on outcome rules inside `Simulation` (goal hold, bounds, stall, time cap, later "ball owned" suspension).

**Bridge**

- Designing a small typed message protocol (`shared/bridge/messages.ts`) with request/response pairs where needed; implementing an in-memory `EventTarget`-style transport and a `postMessage` transport with identical semantics; structured-clone-safe payloads only (no functions, class instances, or three objects).
- Idempotent handling so lost or duplicate messages do not corrupt state.

**React 19 / R3F (consumer level)**

- Subscribing to stores from both DOM components and in-canvas components; avoiding re-render storms by using transient subscriptions (`store.subscribe`) inside `useFrame` consumers.

**Testing**

- Unit tests for the state machine (every legal and illegal transition), placement validation (edge cases: touching edges, rotated overlap, build-zone boundaries), scoring (loop convergence, diminishing returns, stall suspension), schema (valid/invalid fixtures), persistence migrations.
- Headless run tests with `simulateRun()` asserting outcomes and golden scores for reference solutions.

## Responsibilities by phase

- **Phase 1 (done):** `SceneDefinition` schema; contraption types/registry; `gameStore` with mode machine; inventory and placement with validation; run/reset orchestration; `ScoreTracker` v1; outcome detection; layout auto-save; `LeaderboardRepository` + local implementation; `GameBridge` v1.
- **Phase 2:** scoring v2 (touch bonuses, suspension, breakdown); exploit tests; sandbox scene wiring; param schemas for all new contraptions.
- **Phase 3:** progression/unlock store; hint system data flow; settings store; next-scene flow via bridge.
- **Phase 4–5:** keyboard placement actions; `postMessage` transport parity tests.

## Working rules

- Nothing in `game/state` or `game/scoring` may depend on React, three, or DOM. Rapier types may appear only through the narrow hook interface the Physics Engineer exposes.
- Any new tunable is a named exported constant next to the code that owns it.
- Store state must be serialisable, with one documented exception: `simulation` (the live run, read by views each frame). It never crosses the bridge. Derived data (e.g. `remaining()`) is computed, not stored.
- The reference solution of every scene must produce the same score on two consecutive runs in tests.

## Definition of done

- State machine, placement, scoring, and schema covered by unit tests; headless run test for each shipped scene.
- Bridge messages documented in `shared/bridge/messages.ts` with a comment per message.
- Persisted shapes versioned; a migration test exists for each version bump.
- No DOM access in `game/**` (lint passes).
