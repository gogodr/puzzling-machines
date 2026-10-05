# Scene authoring

How to add a playable scene that the solvability tests will accept.

## Units and snap

- 1 world unit = 1 metre. A typical scene is about 16 × 9.
- The ball radius is `0.25`. Static walls must be at least `MIN_WALL_THICKNESS` (`0.2`).
- Placement snaps to a **0.25** grid and **15°** rotations. Every reference-solution position and angle must already be snapped (`snapPoint` / `snapAngle`), or the player cannot recreate it.
- `validatePlacement` rejects overlap with statics, other parts, the start clearance, the goal, and anything outside `buildZones`. Touching edges is usually legal; overlapping is not.
- The tall **footprint** used for placement is often larger than the visible colliders (elevators, fans, slings). Leave a gap between a part and nearby statics even if the bodies would not collide.

## File checklist

1. Add `src/game/scenes/0N-name.ts` and export it through `defineScene(...)`.
2. Register it in `src/game/scenes/registry.ts` **before** the sandbox.
3. Add `{ id, name, blurb }` to `SCENE_CATALOG` in `src/shared/scenes.ts` (same `id` and `name`).
4. Pin the golden score in `src/game/scenes/scenes.test.ts` after a headless run.
5. Empty layout must fail; the reference layout must succeed, be deterministic, and be order-independent.

`defineScene` already checks: start and goal inside `bounds`, reference types in the inventory, reference counts within inventory limits.

## Scene data

| Field               | Notes                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bounds`            | Camera framing and out-of-bounds fail (plus a 1 m margin).                                                                                                           |
| `statics`           | Walls, floors, shelves, cups. Fixed; the player cannot move them.                                                                                                    |
| `fixed`             | Pre-placed contraptions that are already part of the machine.                                                                                                        |
| `buildZones`        | Axis-aligned rects. The whole footprint must sit inside one zone.                                                                                                    |
| `start`             | Ball centre. Keep a 0.5 m clearance so a drop cannot trap the spawn.                                                                                                 |
| `goal`              | Ball centre must stay inside for 0.3 s.                                                                                                                              |
| `inventory`         | `{ type, count, params? }`. `count: 0` is unlimited. Tray copies inherit `params`.                                                                                   |
| `limits`            | `maxRunTime` and `stallSeconds`.                                                                                                                                     |
| `referenceSolution` | A legal, snapped layout that reaches the goal. Used by tests and the 3-fail hint.                                                                                    |
| `dev`               | `true` hides the scene from the production catalogue (sandbox).                                                                                                      |
| `theme`             | `workshop`, `attic`, `rooftops`, `clocktower` or `factory`. Sets the colours of statics, build zones and the goal (`render/themes.ts`).                              |
| `backdrop`          | Optional scene id whose background image to borrow (the sandbox uses `first-steps`). Defaults to the scene's own `public/assets/bg/<id>.webp`; see [ART.md](ART.md). |

The simulation uses **placed `params`**, not inventory defaults. Put the same overrides on the reference items that the tray would apply (e.g. `{ height: 6, speed: 2 }` on the Up the Wall elevator).

## Designing a solvable reference

Author the **geometry** so the intended part can do its job. Fighting a flat floor is slower than cutting a well or shortening a roof.

- **Empty must fail.** A pit with no floor (`outOfBounds`) or a cup wall the ball cannot roll over (`stalled`) are both fine.
- **Give the ball a reason to move.** A slight tilt on the start shelf (`angle: -0.12`) starts the roll; a perfectly flat floor never will.
- **Board from above, not into a curb.** A trampoline, elevator lip, or landing shelf that sticks up in the roll path hits the ball on the **side** and bounces it backwards. Drop the ball onto the top face, or bury the approach so the top is flush.
- **Fans have a solid housing.** The stream is local `+X` from the housing face. An upward fan sitting on the floor is a wall; offset the housing out of the path and let the stream intersect the ball.
- **Sling / catapult stems sit below the pocket.** If the stem is on the runway the ball never reaches the pocket. Leave a hole or place the launcher just past the roof end so the stem hangs in empty space.
- **Elevator footprint is `height + 0.5` tall.** It cannot overlap the floor or the landing. Put the lift in a well, platform slightly below the approach ledge, and tip toward a landing that starts just past the footprint.
- **Spinner blades** at the top of an unflipped wheel move toward `+X`. A wheel sitting on a roof hits the ball with the wrong face; hang it off the edge or flip it.
- **Pendulums push the way they swing.** An unflipped pendulum is released toward `+X`; a flipped one starts on the other side and swings back. In Clockwork the ball rests on a flat ledge and the bob has to meet it near the bottom of the arc: a hit high in the swing lifts the ball and often knocks it the wrong way. Test a band of positions, not one, so the puzzle is not pixel-precise (Clockwork accepts 4–5 neighbouring grid spots in each orientation).
- **The ball must clear a lift onto a landing.** Where an elevator's tipped edge ends lower than the landing it serves, the ball stalls against the lip. Raise the lift (Grand Finale: `height: 7.5`) until the tipped platform is level with or above the landing.
- **Wide scenes need more than one route.** Grand Finale is checked with its reference (the high road over the wall) and with a single-ramp low road through the pit and tunnel, so a later geometry change cannot quietly close one of them.

Tune with a short-lived `simulateRun` loop that prints the ball path every 0.3 s. Do not leave that file in the repo. When the reference succeeds twice with the same score, pin it.

```ts
const result = await simulateRun(scene, scene.referenceSolution)
// result.outcome.kind === 'success'
// result.score → GOLDEN_SCORES[scene.id]
```

## Adding the scene to the app

Production scenes appear on Scene Select in catalogue order. A scene unlocks when the previous one has a recorded completion (`pm.progress.v1`). Dev-only scenes stay in `DEV_SCENE_CATALOG` and are always offered in development.

## Inventory for the shipped scenes

| Scene        | Teaches                            | Inventory                                                                                                                                                                                  |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Steps  | Place, rotate, run                 | 2 ramps, conveyor, trampoline                                                                                                                                                              |
| Up the Wall  | Going up                           | Elevator, fan, trampoline, ramp                                                                                                                                                            |
| The Gap      | Launching                          | Sling, catapult, spinner, 2 ramps                                                                                                                                                          |
| Clockwork    | Timing a push from a resting start | Pendulum, seesaw, dominoes, conveyor (lift is fixed)                                                                                                                                       |
| Grand Finale | Choosing a route                   | Full catalogue: 3 ramps, 2 each of conveyor, trampoline, fan, spinner, dominoes, funnel, pipe and bend; 1 each of seesaw, pendulum, catapult, sling and elevator (belt and lift are fixed) |

## Golden scores

| Scene        | Reference                                            | Score                             |
| ------------ | ---------------------------------------------------- | --------------------------------- |
| First Steps  | two ramps and a conveyor                             | 297                               |
| Up the Wall  | elevator                                             | 246                               |
| The Gap      | sling over the gap                                   | 169                               |
| Clockwork    | flipped pendulum, conveyor to the shelf              | 298                               |
| Grand Finale | high road: two conveyors and two ramps over the wall | 356 (low road with one ramp: 482) |
