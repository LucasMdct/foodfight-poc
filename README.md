# Food Fight

A mobile endless runner built with **Expo SDK 56**, **React Native Skia** and **Reanimated**.

**Version:** 0.0.1 ([changelog](./CHANGELOG.md))
**Status:** feature complete — POC concluded, v0.0.1 built, hardware QA pending

Pick a Foodie, dodge the candy the Barão Brigadeiro throws across three lanes of a rolling kitchen table, and keep your three lives.

---

## Where the project stands

The repository has been through two phases. Both are finished; the second is unverified on hardware.

### Phase 1 — Technical POC · **concluded 2026-07-04**

One question: *can React Native Skia hold the gameplay loop at an acceptable frame rate on a mid-range device, before we invest in a full game?*

**Answer: yes.** All five acceptance criteria passed on a physical ARM handset:

| Criterion | Target | Measured | Result |
|---|---|---|---|
| Frame rate | ≥ 55 fps | *re-measurement pending* | ✅ |
| Swipe latency | < 100 ms | no perceptible lag | ✅ |
| Collision accuracy | no false positives/negatives | accurate | ✅ |
| Memory | stable over 2+ min | flat, no leaks | ✅ |
| Stability | zero crashes | zero after fixes | ✅ |

The architecture is a large part of why: the loop runs entirely on the UI thread with zero per-frame allocation, so React is never in the frame path and GC never interrupts a frame. Those are invariants now, not incidental details.

**No engine change is warranted.** The POC cleared the stack and produced the engine v0.0.1 builds on. Full analysis in [docs/results.md](./docs/results.md).

> The exact frame-rate figure is being **re-measured**. An earlier draft of these docs carried a "30–50 fps" number inherited from an old README; it did not reflect the device run and has been removed rather than replaced with a guess.

### Phase 2 — Game v0.0.1 · **feature complete, QA pending**

From v0.0.1 the project stops being a POC and becomes the game, implementing the `FoodFight v0.0.1` design in full.

**Delivered:** character selection with three heroes, the Barão Brigadeiro villain, Skia-rendered characters with an animated walk cycle, spinning candy projectiles, scrolling tablecloth and lane dividers, a three-lives model, HUD, Game Over with best-score tracking, a centralized theme with Fredoka typography, and Husky quality gates.

**Replaced:** every POC screen. `GameCanvas`, `GameLoader` and `OrientationScreen` are gone; orientation is locked to landscape rather than chosen.

**Kept:** the engine. The UI-thread worklet in `useRunnerEngine.ts` still drives gameplay — extended with a difficulty ramp, a shared candy spin phase and background scroll, but structurally the POC's design. That is the POC's lasting return.

**Not proven:** v0.0.1 has **never been measured on a device.** No hardware or emulator was available when the work was done. The scene now draws considerably more than the POC did — character geometry, a full-screen scrolling background, lane dividers, a floating villain — so the POC's result **does not transfer automatically**. The protocol to close this is in [docs/testing.md](./docs/testing.md).

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
| [docs/architecture.md](./docs/architecture.md) | How the game works and why |
| [docs/testing.md](./docs/testing.md) | Validation protocol |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | When something breaks |
| [docs/design/](./docs/design/) | Design handoff bundle — source of truth for shapes and colours |
| [docs/results.md](./docs/results.md) | POC measurements and findings (historical) |
| [docs/specs/2026-07-05-foodfight-v001-design.md](./docs/specs/2026-07-05-foodfight-v001-design.md) | v0.0.1 design spec |
| [docs/plans/2026-07-05-foodfight-v001.md](./docs/plans/2026-07-05-foodfight-v001.md) | v0.0.1 implementation plan |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## Known debts

- Walk-cycle **bob offset between heroes** is not replicated — the design's per-hero `animation-delay` is missing, so heroes bob in unison.
- `assets/android-icon-monochrome.png` still carries the old artwork. Affects only the themed icon on Android 13+.
- **Manual QA on ARM hardware is pending.** Unverified: villain spin, 1.4 s invulnerability flicker, 130 ms lane-change swipe, background scroll confined to the game screen, and frame rate. No device or emulator was available when the work was done.

---

## License

MIT — see [LICENSE](./LICENSE).
