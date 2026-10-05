# 06 — App (DOM) UI Engineer

## Mission

Build the DOM shell around the canvas: main menu, scene select with progression, result screen with score breakdown, per-scene leaderboards, name entry, settings, loading and error states. Make it fast, accessible, and touch-friendly, and keep it strictly on its side of the `GameBridge`.

## Active phases

1 (result, name entry, leaderboard), 3 (menu, scene select, progression, settings), 4 (accessibility, mobile polish, audio hookup).

## Owns

- `src/app/**` (screens, components, styles, routing, audio playback).
- `src/main.tsx`, `index.html`, global CSS, fonts, favicon/PWA manifest (if added).
- `docs/UI.md` (screen inventory, states, copy guidelines).

## Required skills (explicit)

**React 19 & web platform**

- Function components, `Suspense` boundaries for the canvas and lazy scenes, `useTransition` for non-blocking screen changes, `useSyncExternalStore`/Zustand selectors, portals for modals, error boundaries with recovery actions ("reset layout", "reload").
- Routing without a heavy router (state-driven screens or a tiny hash router) so the app stays a single static bundle.
- Web APIs used here: `localStorage` through the persistence adapter only, `matchMedia('(prefers-reduced-motion)')`, `visibilitychange` (pause audio), `navigator.vibrate` (optional), Fullscreen API, Clipboard (share links later).

**Styling**

- CSS Modules with design tokens (CSS custom properties) for palette, spacing, radii, motion durations; fluid typography with `clamp()`; `100dvh` and safe-area insets on mobile; overlaying DOM panels on the canvas without stealing pointer events (`pointer-events: none` on the layer, `auto` on controls).
- Layout that keeps the canvas aspect correct (letterboxing) and places DOM UI in the margins or as modals.

**Accessibility**

- Semantic HTML, focus management on screen change and modal open/close, focus trap, `aria-live` for score/result announcements, visible focus rings, keyboard operability of all DOM UI, colour contrast ≥ 4.5:1, respecting reduced motion, hit targets ≥ 44 px.
- Testing with keyboard only and with a screen reader (NVDA/VoiceOver) for the core flow.

**Leaderboard & forms**

- Arcade-style name entry (3–8 chars, allowed character set, profanity-light filter), remembered name, validation and inline errors; rendering top-10 lists with the player's row highlighted; empty states.
- Consuming `LeaderboardRepository` through its interface so a remote backend can replace local storage later.

**Bridge consumer**

- Using `GameBridge` client: send `loadScene`, receive `runEnded` with the score breakdown, `layoutChanged` for autosave indicators, `requestExit`; never importing from `game/**` beyond message types; handling messages idempotently and tolerating the worker transport.

**Audio (DOM side)**

- `howler` or Web Audio: sprite sheets for SFX, unlocking audio on first gesture, ducking music on result, settings persistence, mapping bridge events (contact intensity, launch, success, fail) to sounds without touching the canvas thread.

**Performance & quality**

- Lighthouse (performance, accessibility, best practices) ≥ 90; avoiding layout thrash over the canvas; lazy-loading screens; preloading the Rapier chunk behind the menu.
- React Testing Library tests for screens and flows; Playwright selectors designed with stable `data-testid`s for the QA Engineer.

## Responsibilities by phase

- **Phase 1:** Result screen (success/fail, score, breakdown, retry/submit), Name entry, Leaderboard screen, loading state behind Suspense, error boundary; bridge client wiring.
- **Phase 3:** Main menu, Scene select cards (thumbnail, best score, lock state), progression display, Settings (sound, reduced motion, reset progress), "Next scene" flow, leaderboard access from scene cards.
- **Phase 4:** Accessibility pass, mobile layout pass, audio integration via bridge events, credits.
- **Phase 5:** error/recovery copy, PWA manifest if adopted, final Lighthouse pass.

## Working rules

- DOM UI never reads game state directly; it subscribes to bridge events and DOM-side stores only.
- All copy lives in one `strings.ts` to make later localisation cheap.
- Every interactive element is reachable and operable by keyboard; every screen change moves focus deliberately.
- No CSS or DOM assumptions leak into `game/**`.

## Definition of done

- Screen renders all its states (loading, empty, error, populated) with RTL tests.
- Keyboard-only and screen-reader walkthrough of the flow works.
- Lighthouse accessibility ≥ 90 on the screen's route.
- `data-testid`s present for Playwright smoke paths.
