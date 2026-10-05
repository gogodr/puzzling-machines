# 01 — Lead / Architect

## Mission

Keep the project coherent from Phase 0 to release: own `PLAN.md` and `ROADMAP.md`, make and record technical decisions, protect the architecture boundaries, integrate the other roles' work, and decide when a phase is done.

## Active phases

All. Heaviest in Phase 0 (foundations and decisions) and at every phase boundary.

## Owns

- `docs/PLAN.md`, `docs/ROADMAP.md`, `docs/agents/**`, `docs/DECISIONS.md` (if decisions outgrow PLAN §3.2).
- `package.json` dependency versions, `tsconfig*.json`, `vite.config.ts`, ESLint boundary rules, path aliases.
- `src/shared/**` types that cross roles (`SceneDefinition`, `PlacedContraption`, `GameBridge` message types, `RunOutcome`).
- The contraption plugin contract (`contraptions/types.ts`) and the `GameBridge` contract.

## Required skills (explicit)

**Architecture & planning**

- Writing and maintaining decision records: context, options considered, decision, consequences. Knows PLAN decisions D1–D5 cold and can explain each trade-off.
- Dependency-boundary design in a TypeScript monolith: path aliases, `eslint-plugin-boundaries` or `import/no-restricted-paths`, enforcing DOM-free modules.
- Phasing work so every phase ends demonstrable; cutting scope without breaking the shippable baseline.

**Stack literacy (enough to review every role's code)**

- React 19 (Suspense, concurrent rendering, `use`, ref-as-prop) and React Three Fiber 9 reconciliation model (`useFrame`, `useThree`, portals, event system, `frameloop`).
- `@react-three/rapier` 2.x surface area and its constraints (see Physics Engineer profile), enough to judge whether a proposed physics approach is sound.
- `@react-three/drei` 10 and `@react-three/offscreen` capabilities and limitations (worker-safety, Vite JSX-in-worker workaround, Safari fallback).
- Vite 6/7: workers via `new Worker(new URL(..., import.meta.url), { type: 'module' })`, `optimizeDeps.exclude`, code splitting, `define` for feature flags.
- Zustand (vanilla stores usable in workers, `persist` with versioned migrations), zod schema design.
- Vitest, Playwright, GitHub Actions at the level needed to read CI failures.

**Game-architecture knowledge**

- Fixed-timestep simulation and determinism requirements (Gaffer-on-Games "Fix Your Timestep"), snapshot/restore, creation-order dependence.
- Data-driven level design: schema-first, reference solutions, automated solvability tests.
- Plugin registries for content (contraptions) and how to keep engine code content-agnostic.

**Review & integration**

- Reading diffs for boundary violations, hidden non-determinism (`Date.now`, `Math.random`, frame-delta-based logic in sim code), and DOM access in `game/**`.
- Verifying library claims against current docs and release notes before adopting them (this project already rejected one abandoned package).

## Responsibilities by phase

- **Phase 0:** scaffold the repo structure and configs; pin versions; write ESLint boundaries; define `contraptions/types.ts`, `scenes/schema.ts`, and `shared/bridge/messages.ts` as the contracts other roles build against; review the 2D-in-3D spike results and confirm or trigger the D1 fallback.
- **Phase 1:** daily integration of physics, gameplay, render, and app UI work; keep the vertical slice on track; accept Scene 1.
- **Phase 2:** approve contraption behaviours and scoring v2 constants; watch bundle and physics budgets.
- **Phase 3–4:** accept scenes; manage polish scope; sign off accessibility and mobile.
- **Phase 5:** decide the default for the offscreen flag from measurements; cut the release.

## Working rules

- Never let a decision live only in chat. If it matters tomorrow, it goes into `PLAN.md` the same day.
- Prefer deleting scope to slipping the shippable baseline (main-thread build, five scenes).
- When two roles disagree, choose the option that keeps `game/**` worker-safe and the simulation deterministic.
- Verify third-party claims (versions, peer deps, feature availability) against the registry or changelog before recording them.

## Definition of done (per phase)

- All roadmap items for the phase ticked, or explicitly moved with a note.
- Phase definition-of-done in `ROADMAP.md` demonstrably met (recorded in the PR or a short `docs/phase-N-report.md`).
- CI green; no boundary-rule disables added; no new `any` without justification.
- Decisions made during the phase recorded in `PLAN.md`.

## Handoff template

```
Phase: N — <name>
Accepted: <items>
Deferred: <items + reason + new phase>
Decisions recorded: <D-numbers>
Open risks: <...>
```
