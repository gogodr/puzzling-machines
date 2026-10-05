# 00 — Shared Conventions (all roles)

Every role follows these rules. Profiles add to them; they never override them.

## Source of truth

- [`PLAN.md`](../PLAN.md) holds the design and the numbered technical decisions (D1–D5). [`ROADMAP.md`](../ROADMAP.md) holds the phased feature list.
- If work reveals that a decision is wrong, stop, write the proposed change as an edit to `PLAN.md` (new or amended decision with rationale), and get it accepted by the Lead before building on it. Decisions do not live in chat.
- When a roadmap item is completed, tick its checkbox in `ROADMAP.md` in the same change.

## Architecture boundaries (enforced by ESLint)

- `src/app/**` — DOM-side React. May import `@shared/**` and, from the game, only `@game/GameCanvas`. Owns all storage.
- `src/game/**` — DOM-free. Never references `window`, `document`, `localStorage`, CSS modules, or DOM event APIs. Must run unchanged inside a Web Worker (PLAN D2).
- `src/shared/**` — pure TypeScript: types, math, ids, constants. No React, no three, no Rapier.
- `app ↔ game` communication goes through `GameBridge` messages only. Adding a message type requires updating `shared/bridge/messages.ts` and both transports.

## Physics rules (PLAN D1, D3)

- Bodies are created only by plain TypeScript through `World2D` (in a contraption's `build()` or in `Simulation`). JSX bodies (`<RigidBody>`, collider components) are a lint error everywhere.
- Per-step logic lives in a contraption's `beforeStep` or in `Simulation`; never add `useBeforePhysicsStep` / `useAfterPhysicsStep` anywhere except `SimulationRunner`. This is what keeps game and headless tests identical.
- Z translation and X/Y rotation are always locked (jointed bodies: Z translation only, plus plane projection); colliders are symmetric about `z = 0`.
- `<Physics timeStep={TIME_STEP} {...SOLVER}>` — never `"vary"`, never different solver settings from `configureWorld`. Anything time-based inside the simulation uses simulation time (`Simulation.time`), never `Date.now()` or frame delta.
- Body creation order is deterministic: scene statics → fixed contraptions → placed contraptions sorted by id → ball.
- Views read body poses in `useFrame`; they never write to bodies.
- Any change to physics constants, materials, or contraption behaviour must keep all scene solvability tests green. A changed golden score must be called out in the handoff.

## Code standards

- TypeScript strict; no `any` without a comment explaining why. Prefer discriminated unions for messages, modes, and outcomes.
- Functional React components, hooks at top level, no class components.
- One contraption per folder: `definition.ts` (pure: params, footprint, `build()`) and `<Name>View.tsx`. Registered in `contraptions/registry.ts` and `contraptions/views.tsx`; behaviour tests in `contraptions/contraptions.test.ts`.
- Zustand stores expose actions, not setters; components never mutate store state directly.
- Tunables live next to the code that owns them (`determinism.ts`, `materials.ts`, `ScoreTracker.ts`, contraption `defaultParams`), as named exported constants.
- Comments explain _why_, not _what_. Document non-obvious physics workarounds (e.g. the treadmill conveyor) at the point of use with a link to the relevant PLAN decision.
- Units: 1 world unit = 1 metre; angles in radians internally, degrees only at the UI edge.

## Testing

- Every behaviour change ships with a test at the appropriate layer (PLAN §3.7). Physics behaviour tests use `World2D.create()` with the helpers in `src/test/physics.ts`; scene tests use `simulateRun()`.
- Tests are deterministic: fixed seeds, fixed timesteps, no wall-clock dependence.
- `npm run lint && npm run typecheck && npm test` must pass before a handoff; run `npm run e2e` for any change to input, UI or the bridge.

## Git & handoff

- Branch per roadmap item or small cluster: `phase-1/placement-validation`.
- Conventional commits: `feat(contraptions): add conveyor treadmill physics`.
- Each handoff ends with a short note: what was done, what was verified (commands run, tests added), what was left out and why, any files touched outside the role's ownership, and open questions for the Lead.
- Temporary spikes and scripts live outside the repository or are deleted before handoff.

## Vocabulary

| Term               | Meaning                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Scene              | A level: static geometry, fixed contraptions, start A, goal B, inventory, limits, reference solution |
| Contraption        | A placeable or fixed machine part with definition, physics behaviour, and view                       |
| Layout             | The set of `PlacedContraption`s the player has placed in a scene                                     |
| Run                | One simulation from Run press to success/fail                                                        |
| Reference solution | A layout shipped with a scene that is known to reach B; used by tests and hints                      |
| Treadmill          | The conveyor technique: velocity-based kinematic body with per-step translation reset, plus grip     |
