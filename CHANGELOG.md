# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project has **two version tracks**, because it changed identity partway through:

- **POC track (0.0.1 → 1.0.0)** — the technical proof of concept, concluded 2026-08-11. Versions marked POC milestones: MAJOR for a change of verdict, MINOR for a feature, PATCH for fixes and docs.
- **Game track (from 0.0.1)** — the actual game, starting over at 0.0.1 with the `FoodFight v0.0.1` design. Numbering restarts deliberately; a game release is not a continuation of a POC release.

Entries are ordered newest first regardless of track, and each is labelled. Entries below 1.0.0 on the POC track were backfilled from git history on 2026-08-11.

---

## [Unreleased]

### Changed
- Rewrote `docs/architecture.md`, `docs/testing.md` and `docs/troubleshooting.md` for v0.0.1. They previously described the POC: the wrong pool size, no difficulty ramp, a health bar instead of three lives, and components that no longer exist.
- Moved the design handoff bundle from `design-completo-foodfight-game/` at the repo root to `docs/design/`, updating references in `eslint.config.js`, `src/render/foodie/palette.ts`, and the v0.0.1 spec and plan.
- Recorded in `AGENTS.md` that `docs/design/` is the source of truth for shapes and colours, and that visual changes start there.

### Changed (documentation restructure, POC track)
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

## [0.0.1] — 2026-07-05 — *game track*

The project stops being a POC and becomes the game, implementing the `FoodFight v0.0.1` design in full.

### Added
- Character selection screen with three heroes — Alface, Feijão, Arroz — each starting with 3 lives.
- Barão Brigadeiro as the villain, throwing candy across the lanes.
- Foodie characters rendered in Skia with an animated walk cycle.
- Spinning candy projectiles (lollipop, gumdrop, donut).
- Scrolling tablecloth background and dashed lane dividers.
- Gameplay screen with an extended engine and a HUD showing lives, score and hero name.
- Game Over modal with score, best score, replay and switch-hero actions.
- Centralized theme (`src/theme`) with design tokens, `ThemeProvider` and UI scaling.
- Fredoka font loading via `@expo-google-fonts/fredoka`.
- Skia animation primitives: swing, bob, spin.
- On-brand app icon and landscape app configuration.
- Husky hooks — lint-staged with Prettier on commit, `tsc` plus lint on push.
- Design spec and implementation plan under `docs/specs/` and `docs/plans/`.

### Changed
- Three-lives state model replaces the POC's health bar.
- Screen flow is now Loading → Select → Game → Game Over.
- Orientation is locked to landscape; the portrait/landscape selection screen is gone.
- Loading screen is themed and on-brand, replacing the POC `GameLoader`.
- Expo bumped to ~56.0.14, `eslint-config-expo` aligned to ~56.0.4.

### Removed
- POC screens: `GameCanvas`, `GameLoader`, `OrientationScreen`.

### Fixed
- Foodie arm counter-phase, Alface leg shape, villain timing and palette.
- `SelectScreen` and `GameOverModal` made responsive to viewport height.
- Non-deprecated Skia path API used in `LaneDividers`.
- Android adaptive icon uses a cream background colour instead of a stale background image.

### Known debts
- Per-hero walk-cycle bob offset from the design is not replicated; heroes bob in unison.
- `assets/android-icon-monochrome.png` still uses the old artwork (Android 13+ themed icon only).
- Manual QA on ARM hardware is pending — villain spin, 1.4 s invulnerability flicker, 130 ms lane-change swipe, background scroll scoping, and frame rate are all unverified.

---

## [1.0.0] — 2026-08-11 — *POC track*

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
