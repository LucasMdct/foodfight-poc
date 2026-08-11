# Food Fight

A mobile endless runner built with **Expo SDK 56**, **React Native Skia** and **Reanimated**.

**Version:** 0.0.1 ([changelog](./CHANGELOG.md))
**Status:** feature branch — manual QA on ARM hardware pending

Pick a Foodie, dodge the candy the Barão Brigadeiro throws across three lanes of a rolling kitchen table, and keep your three lives.

---

## History

This repository started as a **technical POC** answering one question: can React Native Skia hold 60 fps for this gameplay loop on mid-range hardware? It concluded at 30–50 fps on physical ARM — mechanics validated, frame rate below target. Full write-up in [docs/results.md](./docs/results.md).

**From v0.0.1 the project stops being that POC** and becomes the full implementation of the `FoodFight v0.0.1` design. The POC's screens were replaced wholesale: themed loading screen, character selection, locked landscape orientation, centralized theme, Fredoka typography.

The POC's engine work survives — the UI-thread worklet loop in `useRunnerEngine.ts` is still what drives gameplay. See [docs/architecture.md](./docs/architecture.md).

---

## The game

| | |
|---|---|
| **Heroes** | Alface, Feijão, Arroz — pick one, each starts with 3 lives |
| **Villain** | Barão Brigadeiro, throwing candy from the far side of the table |
| **Projectiles** | Lollipop, gumdrop, donut — falling across 3 lanes |
| **Input** | Swipe up / down to change lane |
| **Scoring** | Points for dodging; best score persists across runs |
| **Loss** | Losing all 3 lives ends the run |
| **Screens** | Loading → Select → Game → Game Over (play again or switch hero) |
| **Orientation** | Landscape, locked |

---

## Quick start

Requires Node 20+, and Xcode or Android Studio for native builds.

```bash
npm install
npm run android   # physical device recommended
npm run ios
npm run web       # renders, but NOT valid for perf measurement
```

`npm run lint` runs ESLint. Husky hooks run lint-staged with Prettier on commit, and `tsc` plus lint on push.

> Frame-rate numbers are only meaningful on a **physical device with a release build** and the remote JS debugger disabled. Emulators and Metro dev builds are not representative.

---

## Project layout

```
App.tsx                       Font loading, landscape lock, screen flow
src/
├── screens/
│   ├── LoadingScreen.tsx     Themed intro
│   ├── SelectScreen.tsx      Character selection
│   ├── GameScreen.tsx        Skia scene, HUD, gameplay
│   └── GameOverModal.tsx     Score, best, replay / switch hero
├── render/
│   ├── foodie/               Hero and villain characters, walk cycle, palette
│   ├── candies/              Projectile rendering
│   ├── scenario/             Tablecloth scroll, lane dividers
│   └── anim.ts               Skia animation primitives (swing, bob, spin)
├── hud/                      Lives, score, hero name
├── theme/                    Design tokens, ThemeProvider, UI scaling
├── hooks/
│   └── useRunnerEngine.ts    Game loop (UI-thread worklet)
├── components/
│   └── SwipeHandler.tsx      Fling gestures → lane changes
├── store/gameStore.ts        Zustand: screen flow, lives, score, best
└── types/                    Game types and tunable constants
```

Design rationale for the engine: [docs/architecture.md](./docs/architecture.md).

---

## Documentation

Everything lives in [`docs/`](./docs/README.md). Start there.

| Document | Use it for |
|---|---|
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/architecture.md](./docs/architecture.md) | How the engine works and why |
| [docs/results.md](./docs/results.md) | POC measurements and findings |
| [docs/testing.md](./docs/testing.md) | Validation protocol |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | When something breaks |
| [docs/specs/2026-07-05-foodfight-v001-design.md](./docs/specs/2026-07-05-foodfight-v001-design.md) | v0.0.1 design spec |
| [docs/plans/2026-07-05-foodfight-v001.md](./docs/plans/2026-07-05-foodfight-v001.md) | v0.0.1 implementation plan |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

> **Note:** `docs/architecture.md`, `testing.md` and `troubleshooting.md` still describe the POC baseline. They are accurate about the engine loop, which did not change, but not about the screen structure v0.0.1 introduced. Updating them is outstanding work on this branch.

---

## Known debts

- Walk-cycle **bob offset between heroes** is not replicated — the design's per-hero `animation-delay` is missing, so heroes bob in unison.
- `assets/android-icon-monochrome.png` still carries the old artwork. Affects only the themed icon on Android 13+.
- **Manual QA on ARM hardware is pending.** Unverified: villain spin, 1.4 s invulnerability flicker, 130 ms lane-change swipe, background scroll confined to the game screen, and frame rate. No device or emulator was available when the work was done.

---

## License

MIT — see [LICENSE](./LICENSE).
