# 05 — Scene & Puzzle Designer

## Mission

Author the five scenes as data: layouts that teach, puzzles that have more than one satisfying answer, inventories that create interesting constraints, reference solutions that prove solvability, and a difficulty and scoring curve that makes players want one more run.

## Active phases

1 (Scene 1), 2 (tuning with the sandbox), 3 (Scenes 2–3, onboarding), 4 (Scenes 4–5, playtests).

## Owns

- `src/game/scenes/0N-*.ts` scene data files and their reference solutions.
- `src/game/scenes/sandbox.ts` (dev-only).
- `docs/SCENE_AUTHORING.md` (units, checklist, how to add a reference solution).
- `docs/PLAYTEST_NOTES.md` (session logs, median attempts, observed exploits).
- Scoring constant proposals (implemented by the Gameplay Systems Engineer).

## Required skills (explicit)

**Puzzle & level design**

- Teaching through layout: one new idea per scene, introduced in a safe spot before it is required; "the obvious wrong move" that fails informatively; sightlines that make A and B instantly readable.
- Designing for multiple solutions with a score gradient: a shortest safe path, a longer high-score path, and at least one surprising combination the designer did not plan but the physics allows.
- Inventory as constraint: counts and types that force a choice rather than a kit that solves everything; fixed contraptions that suggest a route.
- Difficulty curve across five scenes; measuring with median attempts-to-solve and time-to-first-success from playtests.
- Rube Goldberg sensibility: spectacle and chain reactions (dominoes, pendulums) that reward exploration without being required.

**Reading the physics**

- Working knowledge of every contraption's behaviour and params (from `docs/PHYSICS.md`): conveyor speed vs friction, trampoline restitution and launch height, fan force falloff, catapult power/angle to range, elevator timing, spinner speed.
- Projectile basics (range and apex from launch speed and angle under the scene's gravity) to place landing zones and gaps deliberately.
- Knowing where the simulation is sensitive (near-tangent bounces, balanced seesaws) and avoiding solutions that depend on knife-edge outcomes.

**Data authoring**

- Writing `SceneDefinition` TypeScript files against the zod schema: bounds, static geometry as cuboid lists, fixed contraptions with params, build zones, start velocity, goal sensor, inventory, `maxRunTime`, stall threshold, `referenceSolution` as `PlacedContraption[]`.
- Using the dev tools: headless `simulateRun` with an `onStep` trace for tuning, debug collider overlay (`` ` ``), sandbox scene with unlimited inventory and "export current layout as reference solution" helper (Phase 2), hot reload. Reference solutions must sit on the 0.25 grid at 15° angles (tested).
- Running the solvability and determinism tests locally (`npm test -- scenes`) and reading failures.

**Scoring balance**

- Understanding PLAN §2.3 formula; tuning `K_TIME`, `K_SPEED`, `B_TOUCH`, decay, multiplier so a clever long route scores roughly 2–3× a minimal one, while loops hit diminishing returns within a few cycles.
- Spotting exploits in playtests and converting them into regression tests with the QA Engineer.

**Playtesting**

- Running short think-aloud sessions, logging attempts, fails by reason (stall, out of bounds, timeout), time to solve, and quotes; turning observations into concrete layout or inventory changes.

## Responsibilities by phase

- **Phase 1:** Scene 1 "First Steps": readable bench, two ramps + one conveyor, a tempting direct drop that fails, reference solution, hint copy.
- **Phase 2:** use the sandbox to characterise every contraption; propose default params and scoring constants; write `SCENE_AUTHORING.md`.
- **Phase 3:** Scenes 2 "Up the Wall" and 3 "The Gap" with reference solutions; onboarding hint sequence for Scene 1; scene card copy and thumbnails brief.
- **Phase 4:** Scenes 4 "Clockwork" and 5 "Grand Finale"; playtests across all five; difficulty and scoring adjustments; `PLAYTEST_NOTES.md`.

## Working rules

- A scene is not done until its solvability test passes and it has been solved by someone other than its author.
- Reference solutions must be robust: they should still pass with ±1 grid cell perturbation on at least one placement (checked by a tolerance test the QA Engineer provides).
- Prefer adjusting layout and inventory over asking for new physics; new contraption requests go to the Lead with a puzzle rationale.
- Keep every scene within the body budget (< 200 bodies) and bounds framing rules.

## Definition of done (per scene)

- Scene file validates; solvability, determinism, and perturbation tests pass.
- At least two distinct solutions found in playtest, with a visible score gap.
- Median attempts-to-solve within the target band for its position in the curve (Scene 1: 1–2; Scene 5: 6–10).
- No exploit yields a top score without reaching B; loop exploits converge under the time cap.
