# Agent Profiles — Puzzling Machines

This folder defines the roles used to develop Puzzling Machines. Each profile is written so it can be handed to an AI agent (or a human) as a self-contained brief: mission, ownership, the explicit skills required, project-specific rules, and the definition of done for that role's work.

All profiles assume the reader has read [`../PLAN.md`](../PLAN.md) and [`../ROADMAP.md`](../ROADMAP.md) and follows [`00-shared-conventions.md`](./00-shared-conventions.md).

## Roles

| #   | Profile                                                         | Mission                                                                                 | Primary phases |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| 00  | [Shared conventions](./00-shared-conventions.md)                | Rules every role follows                                                                | All            |
| 01  | [Lead / Architect](./01-lead-architect.md)                      | Owns the plan, decisions, boundaries, integration and reviews                           | All            |
| 02  | [Physics & Simulation Engineer](./02-physics-engineer.md)       | `World2D`, step pipeline, determinism, contraption physics behaviours, game/test parity | 0, 1, 2, 5     |
| 03  | [Gameplay Systems Engineer](./03-gameplay-systems-engineer.md)  | Game state machine, placement, run/reset, scoring, persistence, `GameBridge`            | 1, 2, 3        |
| 04  | [Rendering & In-Canvas UI Engineer](./04-render-ui-engineer.md) | R3F/drei rendering, contraption views, in-canvas HUD, FX, camera, offscreen             | 0, 1, 2, 4, 5  |
| 05  | [Scene & Puzzle Designer](./05-scene-designer.md)               | Scene data, reference solutions, inventory and difficulty, scoring balance              | 1, 3, 4        |
| 06  | [App (DOM) UI Engineer](./06-app-ui-engineer.md)                | Menus, scene select, result, leaderboard, name entry, settings, accessibility           | 1, 3, 4        |
| 07  | [QA, Tooling & Release Engineer](./07-qa-tooling-engineer.md)   | Vitest/Playwright harnesses, CI, performance measurement, bundle budget, deploy         | 0 → 5          |
| 08  | [Art & Audio Director](./08-art-audio.md)                       | Visual identity, sprites/textures, animation guidelines, SFX and music                  | 4              |

## How to use a profile

When delegating work, start the brief with the role, the phase, and the roadmap items in scope, for example:

> Act as the **Physics & Simulation Engineer** (`docs/agents/02-physics-engineer.md`). Phase 2. Implement the Fan contraption (definition, `build()` with `beforeStep`, view, behaviour test) as described in `ROADMAP.md` Phase 2. Follow `00-shared-conventions.md`.

A role may touch files outside its ownership only to make a change the task requires; it must say so in the handoff note. Disagreements about scope or design go to the Lead / Architect, who updates `PLAN.md` rather than letting decisions live in chat.

## Role interaction map

```
                 ┌──────────────────────┐
                 │   Lead / Architect   │  owns PLAN.md, ROADMAP.md, decisions
                 └──────────┬───────────┘
        ┌───────────────────┼───────────────────────┐
        ▼                   ▼                       ▼
┌───────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│   Physics &   │◀▶│  Gameplay Systems   │◀▶│  Render & Canvas UI  │
│  Simulation   │  │ (state, score, bridge)│ │  (views, HUD, FX)   │
└───────┬───────┘  └──────────┬──────────┘  └──────────┬───────────┘
        │                     │  GameBridge            │
        ▼                     ▼                        ▼
┌───────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│ Scene & Puzzle│  │   App (DOM) UI      │  │    Art & Audio       │
│   Designer    │  │ (menus, leaderboard)│  │                      │
└───────────────┘  └─────────────────────┘  └──────────────────────┘
        └───────────────────┬───────────────────────┘
                            ▼
                 ┌──────────────────────┐
                 │ QA, Tooling, Release │  harnesses, CI, perf, deploy
                 └──────────────────────┘
```
