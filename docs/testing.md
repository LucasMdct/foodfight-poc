# Testing Guide

The validation protocol used to produce [results.md](./results.md). Follow it to reproduce those numbers or to re-test after changing the stack.

There is no automated test suite in this POC — validation is manual and device-based, because the question being answered (frame rate on real hardware) cannot be answered any other way.

---

## Before you start

Frame-rate numbers are only valid under these conditions:

- **Physical device.** Emulators do not reproduce ARM GPU behaviour.
- **Release build.** `npx expo run:android --variant release` or an installed APK. Dev builds carry Metro and instrumentation overhead.
- **Remote JS debugging off.** It alone can halve the frame rate.
- **Airplane mode** for the baseline phase, so background network activity does not pollute the measurement.
- **Battery above 30%** and not thermally throttled. Run the device cool.

Record the device model, OS version, build type and the `GAME_CONSTANTS` values in use. Numbers without those are not comparable to anything.

---

## Phase 1 — Baseline (5 min)

**Question:** is the render loop stable with no player input?

1. Launch the app, pass the loader and orientation screens.
2. Do not touch the screen. Let it run 5 minutes.
3. Watch the FPS readout in the HUD (top right, amber below 55).

| Record | Target |
|---|---|
| Average FPS | ≥ 55 |
| Minimum FPS | ≥ 50 |
| Memory at start / end | growth < 5 MB |
| Crashes | 0 |

A stable-but-low frame rate here points at the render path. A frame rate that *degrades* over time points at a leak — check the pool is recycling.

---

## Phase 2 — Gameplay (10 min)

**Question:** do the mechanics work, and does input hold up?

### 2.1 Lane changes

- Swipe up from middle → hero moves to top
- Swipe down from middle → hero moves to bottom
- Swipe up while already at top → nothing happens
- Swipe down while already at bottom → nothing happens
- The transition is smooth, roughly 100 ms

### 2.2 Input latency

Target: under 100 ms perceived. Two ways to check:

- **By feel:** swipe rapidly and repeatedly. Any perceptible gap between gesture and movement is a failure. This is a real measurement — 100 ms is roughly the threshold of perception for direct manipulation.
- **Instrumented:** log `Date.now()` in `SwipeHandler.handleSwipe` and again when `heroY` settles, and compare.

Remember the 100 ms debounce in `SwipeHandler`: two flicks inside that window collapse into one by design, and that is not a bug.

### 2.3 Obstacles

- Spawn from the right edge at roughly the configured interval
- Move left at a constant speed
- Disappear at the left edge
- Never accumulate off-screen

Watch for a spawn *gap* — if all 15 pool slots are busy, that tick is silently skipped. At stock constants this should not occur; if it does after tuning, either the speed is too low or the interval too short.

### 2.4 Collisions

- Overlap in the same lane registers a hit
- Passing in a different lane never registers
- Hero flickers for ~1.5 s and cannot be hit again during it
- Health drops by 25 per hit; four hits ends the run
- Dodging an obstacle adds 10 to the score

Test edge cases specifically: clip the leading and trailing edge of an obstacle. The 10 px hitbox inset means grazes should *not* count.

---

## Phase 3 — Stress (5 min minimum)

**Question:** does anything degrade over a full session?

1. Play continuously until Game Over, at least 2 minutes.
2. Hit "Play Again" and play at least one more full run.

| Record | Target |
|---|---|
| Run duration | ≥ 2 min |
| Average FPS during play | ≥ 55 |
| Minimum FPS | ≥ 50 |
| Memory growth | < 50 MB |
| Crashes | 0 |
| Jank / stutter | none sustained |

The second run matters: it exercises `engine.reset()` plus `actions.reset()` together. Obstacles left on screen after a reset means one of the two was skipped.

---

## Phase 4 — Profiling (only if a phase failed)

### Android

```bash
adb shell dumpsys meminfo <package>          # memory snapshot
adb shell dumpsys gfxinfo <package>          # frame timing histogram
```

Android Studio → Profiler for CPU/GPU/memory over time.

| Metric | Target |
|---|---|
| CPU average | < 80% |
| GPU average | < 85% |
| Dropped frames | 0 |
| GC pauses | minimal |

### iOS

Xcode → Product → Profile → **Metal System Trace**.

| Metric | Target |
|---|---|
| GPU average | < 85% |
| Frame time | ~16.67 ms |
| Missed frames | 0 |

### Interpreting it

- **GPU pegged, CPU low** → render path is the bottleneck. This is what was observed. Reduce draw calls before anything else.
- **CPU pegged** → look at the worklet. It should be trivially cheap; if it is not, something React-side is running per frame.
- **Sawtooth memory** → allocation in the loop. The pool exists to prevent this.

---

## Recording results

Copy this into a new dated file under `docs/` and fill it in:

```markdown
# Test Run — YYYY-MM-DD

**Device:** model, SoC, RAM
**OS:** version
**Build:** release / dev
**Constants:** POOL=__ SPEED=__ INTERVAL=__
**Tester:**

| Criterion | Target | Measured | Result |
|---|---|---|---|
| Frame rate | ≥55 fps | | |
| Swipe latency | <100 ms | | |
| Collision accuracy | no false +/- | | |
| Memory | <50 MB / 2 min | | |
| Stability | 0 crashes | | |

**Verdict:** approved / rejected / conditional
**Notes:**
```

Then add a `CHANGELOG.md` entry if the run changes the POC's conclusions.

---

## Known-good reference

The 2026-07-04 run on physical ARM hardware: 30–50 fps, everything else passing. Full write-up in [results.md](./results.md). Compare against that before concluding a regression.
