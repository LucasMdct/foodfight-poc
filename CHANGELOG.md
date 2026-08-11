# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Because this is a proof of concept and not a published package, the version reflects **POC milestones**, not a public API:

- **MAJOR** — the POC reaches a conclusion, or its verdict changes
- **MINOR** — a gameplay feature or screen is added
- **PATCH** — fixes, refactors, docs, tuning

Entries below 1.0.0 were backfilled from git history on 2026-08-11.

---

## [Unreleased]

### Changed
- Restructured all documentation into a single `docs/` tree with one entry point, removing four duplicated quick-start sections and three duplicated troubleshooting sections.
- Rewrote architecture docs to match the code as it actually is. The previous versions described a `src/systems/` layer, `useGameLoop.ts`, `src/utils/` and separate sprite components that were never built; the real implementation is a single UI-thread worklet in `useRunnerEngine.ts`.
- Unified documentation language to English.
- Reconciled the POC verdict: `PROJECT_SUMMARY.md` claimed 60 fps was validated and the POC approved, which contradicted the measured 30–50 fps recorded elsewhere. The measured result stands.
- Filled in the test-results template with the real ARM device run instead of leaving it blank.

### Added
- `CHANGELOG.md` (this file) with backfilled history.
- `docs/README.md` documentation index.
- `docs/troubleshooting.md` consolidating troubleshooting from three sources.

### Removed
- Seven top-level documentation files, moved to `docs/archive/` for reference.

---

## [1.0.0] — 2026-08-11

POC concluded. Core mechanics validated on real ARM hardware; frame rate confirmed as the limiting factor.

### Added
- `docs/POC-CONCLUSION.md` with device test results and engine recommendations.
- Orientation selection screen (`OrientationScreen`) with portrait/landscape lock via `expo-screen-orientation`.

### Verdict
- Frame rate on mid-range ARM: 30–50 fps against a 60 fps target. This is an engine ceiling, not a defect.
- Collisions, memory stability and input latency all met their criteria.

---

## [0.5.1] — 2026-07-04

### Fixed
- Perceived startup delay: loader animation sped up and the first obstacle now spawns immediately instead of after one full spawn interval.

### Changed
- Extracted inline styles into `App.styles.ts`, `GameCanvas.styles.ts` and `GameLoader.styles.ts`.

---

## [0.5.0] — 2026-07-04

### Added
- Animated loading screen (`GameLoader`) with portal animation, progress bar and burst transition into the game.

---

## [0.4.0] — 2026-07-04

### Added
- Score display in the HUD.

### Changed
- Game Over modal redesigned with an integrated "Play Again" button.

---

## [0.3.0] — 2026-07-04

### Fixed
- Crash when the hero collided with an obstacle.
- Invulnerability window not being respected after a hit.
- Frame timing jitter: the loop now throttles to a ~16 ms threshold.
- Touch input lag on lane changes.
- Score not counting dodged obstacles.

### Added
- ESLint with the Expo flat config and an `npm run lint` script.

---

## [0.2.0] — 2026-07-04

### Added
- Specs and implementation plans for the Game Over UI and the loading screen (now under `docs/specs/` and `docs/plans/`).

---

## [0.1.0] — 2026-07-01

### Added
- Initial POC: Skia canvas with three lanes, UI-thread game loop via `useFrameCallback`, fling-based swipe input, fixed-size obstacle pool, AABB collision with hitbox padding, collision flicker feedback, FPS counter, and a Zustand store for discrete state.

---

## [0.0.1] — 2026-06-27

### Added
- Repository initialised; POC specification drafted (now `docs/specs/poc-runner-skia.md`).
