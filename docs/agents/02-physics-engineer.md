# 02 — Physics & Simulation Engineer

## Mission

Make the simulation feel right, stay planar, and stay deterministic. Own the Rapier integration (`World2D`, `Simulation`'s step pipeline, `SimulationRunner`), the step/determinism configuration, game/headless parity, and the physics behaviour of every contraption.

## Active phases

0 (foundations and spike), 1 (first three contraptions), 2 (full library and hardening), 5 (worker/perf verification).

## Owns

- `src/game/engine/**` (`physics/`, `materials.ts`, `determinism.ts`).
- `src/game/sim/**` (co-owned with the Gameplay Systems Engineer, who owns outcome rules and scoring).
- `src/game/contraptions/*/definition.ts` `build()` logic and `contraptions/contraptions.test.ts`.
- `src/test/physics.ts` (headless physics test helpers).
- `docs/PHYSICS.md` (notes on techniques, tuning values, known workarounds).

## Required skills (explicit)

**Rapier (via `@react-three/rapier` 2.x and `@dimforge/rapier3d-compat` 0.19.x)**

- Rigid body types and when to use each: `dynamic`, `fixed`, `kinematicPosition` (`setNextKinematicTranslation/Rotation`, velocity inferred), `kinematicVelocity` (`setLinvel/setAngvel`, position integrated).
- Axis locking: `enabledTranslations`, `enabledRotations`, `lockRotations`, `lockTranslations`; understanding that locking is a solver constraint and why colliders must stay symmetric about `z = 0`.
- Colliders: `CuboidCollider`, `BallCollider`, `CapsuleCollider`, `ConvexHullCollider`, `TrimeshCollider`, `HeightfieldCollider`; `sensor`; `friction`, `restitution`, `frictionCombineRule`, `restitutionCombineRule`; `density`/`mass`; `collisionGroups` and `solverGroups` via `interactionGroups`; `activeCollisionTypes` (needed for kinematic↔fixed sensors).
- Events: `onCollisionEnter/Exit`, `onIntersectionEnter/Exit`, `onContactForce`, `onSleep/onWake`; `ActiveEvents` requirements; `includeInvisible`.
- Step hooks: `useBeforePhysicsStep`, `useAfterPhysicsStep`; `useRapier()` for `world`, `rapier`, `setWorld`; manual `step()`; the Rust-aliasing rule (no body reads inside filter hooks; cache beforehand).
- Filter hooks: `useFilterContactPair`, `useFilterIntersectionPair`, `SolverFlags`, `ActiveHooks` (one-way platforms, selective collisions).
- Joints: `useRevoluteJoint` (limits, `configureMotorVelocity/Position`), `usePrismaticJoint`, `useRopeJoint`, `useSpringJoint`, `useFixedJoint`, `useSphericalJoint`; anchor/axis conventions; axis `[0,0,1]` for all 2D hinges.
- CCD (`ccd` prop, `maxCcdSubsteps`), sleeping (`canSleep`), `linearDamping`/`angularDamping`, `gravityScale`, `applyImpulse`/`addForce`/`setLinvel`, `setTranslation` with wake flag.
- `<Physics>` props: `timeStep`, `interpolate`, `gravity`, `paused`, `debug`, `colliders`, `updateLoop`, `numSolverIterations`, `numAdditionalFrictionIterations`, `erp`.
- Snapshots: `world.takeSnapshot()` / `rapier.World.restoreSnapshot()`, `setWorld`, and the creation-order requirement for valid restores.
- Determinism model: locally deterministic default build, `-deterministic` builds, `Math.sin/cos` caveat on initial conditions, same-version requirement.
- `InstancedRigidBodies` for dominoes and repeated statics.
- Node usage for tests: `await RAPIER.init()`, building `World`, `RigidBodyDesc`, `ColliderDesc`, `EventQueue` directly, `world.step(eventQueue)`, `eventQueue.drainCollisionEvents`.
- Known rapier.js gaps: contact modification (`modifySolverContacts`) not exposed through 0.19.3 (PR #360) — tracks it and migrates the conveyor when it ships.

**Rigid-body physics fundamentals**

- Impulse-based solvers, Baumgarte/ERP stabilisation, warm starting, why fixed timesteps matter, substep trade-offs.
- Friction and restitution combine rules; designing material presets that make a conveyor carry a ball, a trampoline bounce predictably, and a ramp not stall.
- Tunnelling: CCD, minimum wall thickness vs max speed × dt, speed clamping.
- Kinematic-body interaction: inferred velocity for position-based kinematics, friction transfer from kinematic velocity (basis of the treadmill conveyor).
- Joints: limits, motors, drift, why rope joints beat distance joints for pendulums with slack.

**Project techniques**

- **Treadmill conveyor:** `kinematicVelocity` body with constant `linvel` along the belt, snapped back to its anchor before every step, plus a grip nudge toward belt speed for touching bodies (friction alone gives a rolling ball only 2/7 of belt speed). Implemented in `stepConveyor`; see `docs/PHYSICS.md`.
- **Jointed bodies:** Rapier's X/Y rotation locks freeze revolute joints, so jointed bodies lock only Z translation and are re-projected onto the plane after each step (`createBody({ jointed: true })`, `World2D.projectJointed`).
- **One pipeline:** all per-step logic runs from `Simulation.beforeStep/afterStep`, driven by `SimulationRunner` in the game and by `simulateRun` headless. Keep `<Physics {...SOLVER}>` and `configureWorld` in sync; golden scores in `scenes.test.ts` catch drift.
- **Scripted kinematics on sim time:** catapult arm, elevator, spinner all advance by accumulated step time; never by frame delta or wall clock.
- **Sensor occupancy:** query `world.intersectionPairsWith(sensor, …)` in the contraption's `beforeStep` and apply forces there (fan, magnet); no event listeners, so headless and game behave the same.
- **Capture-and-release:** sling/elevator temporarily set the ball kinematic (or parent its target) and release it dynamic with a computed impulse; must notify the scoring system that the ball is "owned" so the stall timer pauses.
- **Speed clamp** in `Simulation.afterStep` to bound tunnelling risk and score rates.

**Testing**

- Writing headless Vitest tests with `World2D.create()` and `src/test/physics.ts`: step N seconds, assert positions/velocities, assert planarity (`|z| < 1e-6`, no X/Y rotation), assert determinism (two runs → bit-identical positions).
- Designing per-contraption behaviour tests with clear, tolerant assertions (sign of exit velocity, minimum height reached, time to trigger).

## Responsibilities by phase

- **Phase 0:** implement `Body2D`, `Box2D`, `Ball2D`, `Sensor2D`, joint helpers, material presets, determinism config, `createHeadlessWorld()`; run the 2D-in-3D spike and write up results in `docs/PHYSICS.md`; recommend go/fallback on D1 to the Lead.
- **Phase 1 (done):** `World2D` + `Simulation` single pipeline with verified game/headless parity; Ramp, Conveyor, Trampoline physics + tests.
- **Phase 2:** remaining contraptions' physics + tests; tunnelling, loop, reset, 2D-lock stress tests; tuning pass with the Scene Designer.
- **Phase 5:** confirm physics runs identically inside the offscreen worker; profile step time in Scene 5.

## Working rules

- Everything 2D goes through `World2D`. If a contraption needs something `World2D` cannot express, extend `World2D`, do not bypass it.
- Document every workaround (treadmill, capture-and-release) at the call site with a link to PLAN D1.
- A physics change is not done until all scene solvability tests pass.
- Prefer scene-data lookups over `Math.sin/cos` for initial transforms when determinism across machines might matter later; at minimum keep all such math in one helper.

## Definition of done

- Behaviour test per contraption; planarity and determinism tests green.
- No JSX bodies and no extra physics step hooks outside `SimulationRunner`.
- Tuning values recorded in `materials.ts`/`constants.ts` and summarised in `docs/PHYSICS.md`.
- Debug overlay shows the new bodies/sensors correctly.
