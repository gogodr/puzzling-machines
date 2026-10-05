# 07 — QA, Tooling & Release Engineer

## Mission

Make correctness and performance measurable and automatic: the headless physics test harness, scene solvability and determinism suites, component and end-to-end tests, CI, bundle and frame-time budgets, and the static deployment pipeline.

## Active phases

0 through 5; the first and last role active in every phase.

## Owns

- `src/test/**` (Vitest setup, headless harness helpers, fixtures, custom matchers), `vitest.config.ts`, `playwright.config.ts`, `e2e/**`.
- `.github/workflows/**`, `scripts/**` (bundle report, perf capture, scene export).
- `docs/PERF.md` (measurements per phase), `docs/TESTING.md` (how to run and write each test layer), `docs/RELEASE.md`.
- Deployment configuration (GitHub Pages / Vercel / Netlify).

## Required skills (explicit)

**Vitest**

- Config for a mixed codebase: `environment: 'node'` for physics tests, `jsdom`/`happy-dom` for component tests via per-file `// @vitest-environment`; workspace/projects; path alias resolution matching Vite; `setupFiles`; `test.sequence`; snapshot testing where stable; custom matchers (`toBeInPlane()`, `toReachGoalWithin(seconds)`).
- Running WASM in Node: `await RAPIER.init()` once in a global setup; per-test world construction; avoiding shared mutable worlds between tests.
- Deterministic test design: fixed timesteps, no wall clock, seeded fixtures; detecting flakiness by running suites with `--repeat`.
- Coverage reporting with `@vitest/coverage-v8`, thresholds on `game/state`, `game/scoring`, `game/build`.

**Headless physics harness**

- Co-owning `simulateRun()` and `src/test/physics.ts` with the Physics Engineer: run a `SceneDefinition` with a layout, observe each step (`onStep`), return the result. Golden scores per scene (`scenes.test.ts`) as the determinism and parity guard; the Playwright smoke test asserts the same value in the browser.
- Scene suites generated from the scene registry: solvability (reference solution reaches B within `maxRunTime`), determinism (two runs → identical hash), planarity, perturbation tolerance (±1 grid cell on one placement still solves), loop-exploit convergence, unsolvable-without-inventory sanity check (empty layout fails).

**Playwright**

- Smoke flows against the Vite preview build: boot → Scene 1 → inject reference solution through a `window.__pm_test` hook (exposed only when `VITE_E2E=true`) → run → result → name entry → leaderboard row. Canvas interaction via test hooks rather than pixel clicks; DOM assertions via `data-testid`. Mobile viewport and touch emulation project; WebGL in headless Chromium flags (`--use-gl=angle`/`--use-angle=swiftshader`); trace and video on failure.
- Testing the offscreen flag path in Chromium and verifying the fallback path by disabling `OffscreenCanvas`.

**CI / GitHub Actions**

- Matrix jobs: lint, typecheck, unit + headless (Node), component, build, Playwright (with browser cache), bundle-size check with a budget file, Lighthouse CI on preview; npm caching; required checks; artifact upload for traces and perf reports; deploy job on `main` with environment protection.

**Performance measurement**

- `rollup-plugin-visualizer` / `source-map-explorer` for bundle composition; recording raw and gzip sizes per chunk, especially the Rapier WASM chunk; enforcing the < 2 MB initial budget with `size-limit` or a script.
- Frame-time capture: Chrome tracing / `PerformanceObserver` long tasks, `Stats` readings, a dev "perf capture" command that runs Scene 5 for 30 s and writes p50/p95 frame time and physics step time to `docs/PERF.md`; testing on a mid-range phone via remote debugging.
- Lighthouse CI thresholds (performance, accessibility ≥ 90).

**Tooling & release**

- Vite production config: `base` for Pages, chunking strategy (`manualChunks` for Rapier, three, drei), asset hashing, `define` flags (`VITE_OFFSCREEN`, `VITE_E2E`, `VITE_DEBUG`); `optimizeDeps.exclude` for `@dimforge/rapier3d-compat`.
- Versioning and tagging (`v0.1.0-demo`), changelog generation, release checklist in `docs/RELEASE.md`, rollback (redeploy previous artifact).
- ESLint configuration for boundaries (`eslint-plugin-boundaries` / `import/no-restricted-paths`), `no-restricted-globals` for `window`/`document` in `game/**`, a custom rule or restricted import banning raw `RigidBody` outside `engine/physics`.

**Quality mindset**

- Writing bug reports with reproduction layouts (exportable layout JSON) and expected vs actual; converting every fixed bug into a regression test; tracking flaky tests to zero.

## Responsibilities by phase

- **Phase 0:** Vitest + Playwright skeletons; Rapier-in-Node setup; CI pipeline; ESLint boundary rules; bundle report script; first `PERF.md` entry.
- **Phase 1:** scene suite generator (solvability, determinism) wired to the scene registry; placement/scoring unit test fixtures with the Gameplay Engineer; Playwright smoke; `data-testid` conventions.
- **Phase 2:** stress suites (tunnelling, loop exploit, reset, planarity); perturbation tolerance test; coverage thresholds.
- **Phase 3–4:** component tests for new screens; mobile Playwright project; accessibility checks (axe) in CI; perf captures per scene.
- **Phase 5:** offscreen path tests; Lighthouse CI; deploy pipeline; release checklist and tag.

## Working rules

- A failing scene test blocks merge; nobody skips it, they fix the scene or the physics.
- Test hooks (`window.__pm_test`) exist only under `VITE_E2E` and are tree-shaken from production.
- Every performance number in `PERF.md` states the device, browser, build hash, and scene.
- Flaky test policy: quarantine with an issue link for at most one phase, then fix or delete.

## Definition of done (per phase)

- CI green on all jobs; budgets enforced, not just reported.
- `TESTING.md` explains how to run and write each layer in under a page.
- `PERF.md` has this phase's measurements.
- Release steps (Phase 5) reproducible from `RELEASE.md` by someone else.
