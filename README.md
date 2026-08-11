# Food Fight — Runner POC

Technical proof of concept for an endless runner built with **Expo SDK 56**, **React Native Skia** and **Reanimated**.

**Status:** concluded — see [Results](./docs/results.md)
**Version:** 1.0.0 ([changelog](./CHANGELOG.md))
**Verdict:** core mechanics validated. Frame rate on mid-range ARM hardware settles at **30–50 fps**, below the 60 fps target. Shipping this stack to production would require a different rendering engine.

---

## What this POC answers

One question: *can React Native Skia run the gameplay loop at 60 fps on a mid-range device, before we invest in the full game?*

Five acceptance criteria were defined up front. Four passed, one failed:

| Criterion | Target | Measured | Result |
|---|---|---|---|
| Frame rate | ≥ 55 fps | 30–50 fps | ❌ |
| Swipe latency | < 100 ms | no perceptible lag | ✅ |
| Collision accuracy | no false positives/negatives | accurate | ✅ |
| Memory | stable over 2+ min | stable, no leaks | ✅ |
| Stability | zero crashes | zero after fixes | ✅ |

Full measurement conditions and analysis: [`docs/results.md`](./docs/results.md).

---

## Quick start

Requires Node 20+, and Xcode or Android Studio for native builds.

```bash
npm install
npm run android   # physical device recommended
npm run ios
npm run web       # renders, but NOT valid for perf measurement
```

`npm run lint` runs ESLint (expo flat config).

> Frame-rate numbers are only meaningful on a **physical device with a release build** and the remote JS debugger disabled. Emulators and Metro dev builds are not representative.

---

## How to play

| Input | Effect |
|---|---|
| Swipe up | Hero moves one lane up |
| Swipe down | Hero moves one lane down |
| Hitting an obstacle | −25 health, 1.5 s invulnerability flicker |
| Dodging an obstacle | +10 score |
| Health reaches 0 | Game Over → Play Again |

---

## Project layout

```
App.tsx                     App state machine: loading → orientation → playing
src/
├── components/
│   ├── GameCanvas.tsx      Skia canvas, HUD, Game Over modal
│   ├── GameLoader.tsx      Animated loading screen
│   ├── OrientationScreen.tsx  Portrait/landscape lock
│   └── SwipeHandler.tsx    Fling gestures → lane changes
├── hooks/
│   └── useRunnerEngine.ts  The whole game loop (UI-thread worklet)
├── store/
│   └── gameStore.ts        Zustand: discrete state only
└── types/
    ├── constants.ts        Tunable game constants
    └── game.ts             Game types
```

Design rationale for this shape: [`docs/architecture.md`](./docs/architecture.md).

---

## Documentation

Everything lives in [`docs/`](./docs/README.md). Start there.

| Document | Use it for |
|---|---|
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/architecture.md](./docs/architecture.md) | How the engine works and why |
| [docs/results.md](./docs/results.md) | Measurements, findings, recommendation |
| [docs/testing.md](./docs/testing.md) | Re-running the validation protocol |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | When something breaks |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## Tuning

All knobs live in [`src/types/constants.ts`](./src/types/constants.ts):

```ts
OBSTACLE_SPEED: 300,           // px/s — ↓ easier
OBSTACLE_SPAWN_INTERVAL: 800,  // ms  — ↑ fewer obstacles
OBSTACLE_MAX_ACTIVE: 15,       // pool size — ↓ fewer Skia rects
HERO_HITBOX_PADDING: 10,       // px  — ↑ more forgiving collisions
```

`OBSTACLE_MAX_ACTIVE` is the pool size, not a cap: that many `<Rect>` elements are always mounted and toggled via opacity. Lowering it is the cheapest frame-rate lever.

---

## Out of scope

Deliberately excluded from the POC: real sprites, audio, menus, persistence, backend, level progression, multiple game modes.

---

## License

MIT — see [LICENSE](./LICENSE).
