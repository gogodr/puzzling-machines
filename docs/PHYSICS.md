# Physics Notes

Owner: Physics & Simulation Engineer. Techniques, tuning values and known engine quirks. Decisions live in [`PLAN.md`](./PLAN.md) (D1, D3).

## Setup

- `@react-three/rapier` 2.2.0 bundling `@dimforge/rapier3d-compat` **0.19.2**. Game code imports the same package directly (`World2D`); keep the direct dependency pinned to the exact version `@react-three/rapier` uses (`npm ls @dimforge/rapier3d-compat` must show it deduped), or tests and game simulate different engines.
- `TIME_STEP = 1/120`, gravity `-9.81`, collider depth `1`, ball radius `0.25`, max ball speed `20`, solver settings `SOLVER` (`src/game/engine/determinism.ts`).

## One simulation, two drivers

Every body is created imperatively by plain TypeScript; React never creates physics bodies.

- **`World2D`** (`engine/physics/world2d.ts`) wraps any Rapier world and creates planar bodies, colliders and joints. `World2D.create()` makes a standalone world for tests; in the game it wraps the world owned by `<Physics>`.
- **`Simulation`** (`sim/Simulation.ts`) builds a run from scene data and a layout: statics, then fixed contraptions, then placed contraptions sorted by id, then the ball. It owns the per-step pipeline:
  - `beforeStep()`: every contraption's `beforeStep` in creation order (conveyors).
  - `world.step()`.
  - `afterStep()`: plane projection of jointed bodies, ball speed clamp, scoring sample, outcome checks (goal held 0.3 s, out of bounds + 1 m margin, stall, time cap).
- **Game driver:** `SimulationRunner` registers one `useBeforePhysicsStep` and one `useAfterPhysicsStep` inside `<Physics key={runId}>`, which steps with a fixed `TIME_STEP` accumulator. The simulation is created on the first step (StrictMode-safe). Each Run remounts `<Physics>`, so every run starts from a fresh world; Reset is exact by construction and no snapshot is needed.
- **Headless driver:** `simulateRun(scene, layout)` (`sim/simulateRun.ts`) calls `beforeStep → world.step → afterStep` until an outcome.
- **Parity:** both worlds get identical settings: `<Physics {...SOLVER}>` props in the game, `configureWorld` (same `SOLVER` constants) headless. Verified: Scene 1's reference solution scores **297 in 7.36 s** both in the browser and in `simulateRun`; `scenes.test.ts` pins this as a golden score.
- After the outcome, contraptions and plane projection keep running (the result screen shows a coherent machine) but scoring and the run clock stop.
- **Rendering:** meshes read body poses in `useFrame`; there is no interpolation. At 60 Hz display each frame advances exactly two 120 Hz steps, so motion is even.

## Phase 0 spike results (2D-in-3D)

Verified headless in `src/game/engine/physics/world2d.test.ts`; the browser spike screenshots are `phase-0-spike*.png` (the spike scene itself was removed in Phase 1).

| Check                                                                | Result                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| Free bodies with planar locks stay in-plane (30 s, all spike bodies) | Pass: max abs Z and X/Y quaternion components below 1e-6  |
| Ball settles on ground                                               | Pass                                                      |
| Determinism (two runs, 10 s)                                         | Pass: bit-identical positions and rotations               |
| Snapshot take/restore replays identically                            | Pass (headless). Not used by the game; see "Two drivers". |
| Debug overlay                                                        | Pass (browser)                                            |
| Revolute joint with planar rotation locks                            | **Fail** → workaround below                               |
| Conveyor by friction alone                                           | **Insufficient** → workaround below                       |

**Go decision for D1:** Rapier-as-2D is viable with the two workarounds below; no fallback to `rapier2d-compat` needed.

## Known quirks and workarounds

### Rotation locks freeze revolute joints

Locking X/Y rotation (`enabledRotations(false, false, true)`) on a dynamic body attached by a revolute joint makes the hinge almost immovable (seesaw tilts 0.0013 rad instead of 0.36 rad in 1 s). Locking only Z translation lets the hinge work. Contacts are unaffected: a tipping domino behaves identically with or without the rotation lock.

Without the rotation lock the hinge alone does not hold the body planar under contact load (0.14 off-axis quaternion component over 30 s). Therefore:

- Bodies attached by joints are created with `createBody({ jointed: true })`: Z translation locked, all rotations free.
- After every step, `World2D.projectJointed()` (called by `Simulation.afterStep`) removes X/Y rotation and spin from jointed bodies, keeping the Z angle and Z spin.
- A regression test ("known Rapier behaviour") asserts the bug still exists. When it starts failing after a Rapier upgrade, the workaround can be removed.

### Long-arm revolute joints are unstable

A small, round body hinged far from its centre (the pendulum bob: radius 0.3, arm 1.6) blows up under a revolute joint. It swings normally for about 0.3 s, then jumps around its circle, and the arm stretched to almost 300 m within 10 s. The hinge's angular locks fight the bob's tiny inertia. A sphere does not need those locks, so the pendulum uses `World2D.addPinJoint` instead: a spherical joint plus the Z translation lock is exactly a planar pin. The bob then keeps its 1.6 m arm and a steady period of about 2.6 s. The seesaw keeps its revolute joint because its plank is hinged at its own centre and needs angle limits.

### Conveyors: treadmill + grip

A ball resting on a moving belt is driven by friction to only **2/7 of belt speed**; the rest of the friction impulse goes into spin (solid sphere, no rolling resistance in Rapier). Real conveyors are no better for balls, but the game needs belts that carry.

`stepConveyor` (`src/game/engine/physics/treadmill.ts`), called from the conveyor's `beforeStep`:

1. **Treadmill:** velocity-based kinematic body, constant `linvel` along the belt angle (reversed when flipped), translation snapped back to its anchor.
2. **Grip:** for every dynamic body with an active contact on the belt surface, close `CONVEYOR_GRIP = 0.15` of the gap between its along-belt speed and the belt speed. A resting ball reaches ~belt speed within about 0.1 s.

Replace both with tangent-velocity contact modification once rapier.js exposes `modifySolverContacts` (PR dimforge/rapier.js#360).

## Contraption tuning

| Contraption | Shape / motion                                          | Material / notes           | Defaults                      |
| ----------- | ------------------------------------------------------- | -------------------------- | ----------------------------- |
| Ramp        | fixed box, 0.2 thick                                    | `default`                  | length 3                      |
| Conveyor    | kinematic treadmill + grip                              | `belt`                     | length 3, speed 2 m/s         |
| Trampoline  | fixed box, 0.25 thick                                   | `bouncy`                   | width 1.5                     |
| Fan         | fixed housing + stream sensor; accel falloff            | pushes every mass the same | range 3, strength 18          |
| Spinner     | kinematicVelocity, snapped to anchor, constant `angvel` | flip reverses              | radius 0.9, speed 3, blades 4 |
| Seesaw      | `jointed` plank, revolute limits                        |                            | length 3, limit 25°           |
| Pendulum    | `jointed` bob on a pin joint, starts raised             | `heavy` (density 8)        | length 1.6, swing 45°         |
| Dominoes    | N dynamic tiles                                         |                            | count 5                       |
| Funnel      | two wall segments, gap 0.7                              |                            | width 2, height 1.2           |
| Pipe / Bend | wall segments, slippery                                 | `slippery`                 | length 3 / radius 1.3         |
| Catapult    | kinematicPosition arm; geometric cup test (see below)   |                            | power 8, sweep 45°            |
| Sling       | captures ball, impulse on release; `holdsBall`          |                            | power 9                       |
| Elevator    | kinematicPosition platform, tip at top; `holdsBall`     |                            | height 3, speed 1.5           |

Behaviour tests: `contraptions/contraptions.test.ts`.

### Catapult cup detection

A sensor collider on a **still** kinematic-position body does not reliably report the ball (`intersectionPairsWith` stays empty until the arm has moved). The catapult therefore arms when the ball centre is within 0.4 m of the rest cup, and still uses the sensor once the arm is swinging. Sensors set `ActiveCollisionTypes.ALL` so kinematic cups can see the ball at all.

## Scoring v2

`B_TOUCH = 15`, `TOUCH_DECAY = 0.5`, `TOUCH_GAP = 0.2` s. First Steps reference score is **297** (motion + touch bonuses, ×1.5). Failed runs still show motion and bonus points but total 0.

## Notes

- Rapier logs `using deprecated parameters for the initialization function` from inside `@react-three/rapier`/`RAPIER.init()`; harmless. three.js logs a `THREE.Clock` deprecation from R3F; harmless.
