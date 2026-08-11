# POC Results

**Concluded:** 2026-07-04 (documented 2026-08-11)
**Version:** 1.0.0
**Verdict:** mechanics validated, frame rate target not met on mid-range ARM.

---

## Executive summary

The POC set out to answer one question before committing to a full game build: *can React Native Skia hold 60 fps for this gameplay loop on a mid-range device?*

**It cannot, on the hardware tested.** Frame rate settled at 30–50 fps against a ≥55 fps acceptance bar. Every other criterion passed — collisions are accurate, memory is flat, input has no perceptible lag, and there are no crashes.

This is an engine ceiling, not a defect in the implementation. The loop already runs entirely on the UI thread with zero per-frame allocation; the remaining cost is in the Skia/Reanimated render path on this class of hardware. Recovering the missing frames means changing the rendering stack, not tuning this code.

**The POC succeeded at its actual job:** it produced this answer cheaply, before the full build was funded.

---

## Test conditions

| | |
|---|---|
| **Device** | Physical Android handset, ARM |
| **Build** | Release APK, installed directly (not a Metro dev build) |
| **Date** | 2026-07-04 |
| **Stack** | Expo SDK 56 · React Native 0.85.3 · Skia 2.6.2 · Reanimated 4.3.1 · Zustand 5 |
| **Configuration** | Stock `GAME_CONSTANTS` — 15-slot pool, 300 px/s, 800 ms spawn interval |

> A release build on physical hardware is the only valid configuration for these numbers. Dev builds carry Metro and debugging overhead; emulators do not reproduce ARM GPU behaviour.

---

## Results against acceptance criteria

The criteria come from [`specs/poc-runner-skia.md`](./specs/poc-runner-skia.md).

| Criterion | Target | Measured | Result |
|---|---|---|---|
| **Frame rate** | 60 fps, ≥55 acceptable | 30–50 fps | ❌ **Fail** |
| **Swipe latency** | < 100 ms perceived | No perceptible lag after the input fixes | ✅ Pass |
| **Collision accuracy** | No obvious false positives or negatives | Accurate in both orientations | ✅ Pass |
| **Memory** | No leak after 2+ min of play | Flat; no growth trend observed | ✅ Pass |
| **Stability** | No crashes | Zero, after the collision crash was fixed | ✅ Pass |

Four of five passed. The one that failed is the one the POC was built to test.

---

## Findings

### 1. Frame rate is an engine ceiling

Reanimated + Skia cannot sustain 60 fps for this workload on mid-range ARM. What rules out an implementation defect:

- The entire simulation runs in a UI-thread worklet — React is not in the frame path at all
- The obstacle pool allocates nothing per frame, so GC is not the cause
- Per-frame work is O(15) integer and float arithmetic
- Memory is flat, which rules out leak-driven degradation

What remains is the cost of the render path itself. Optimising within this stack would mean rewriting the renderer, which is outside the POC's scope by definition.

**Implication:** the game is playable and demonstrable, but not store-ready at this frame rate.

### 2. Collisions are reliable

After the collision crash was fixed in 0.3.0, detection has been accurate. The lane-index check plus X-axis AABB with a 10 px hitbox inset produced no false hits and no missed hits during play. The forgiveness padding makes near-misses feel fair.

### 3. Layout adapts cleanly to both orientations

Lane geometry derives from live `useWindowDimensions()` rather than fixed constants, so portrait and landscape both work without special-casing. Orientation locking through `expo-screen-orientation` behaved correctly, and the fallback path keeps the game reachable if the lock fails.

### 4. Input latency was a fixable problem, not a stack limitation

Early builds had perceptible lane-change lag. Moving to Fling gestures with a worklet `onEnd` and a 100 ms JS-side debounce removed it. Input was never the bottleneck.

---

## What was deliberately left out

| Excluded | Reason |
|---|---|
| Advanced performance optimisation | Would mean rewriting the render layer — outside POC scope |
| Real sprites and animation | Geometric placeholders answer the performance question equally well |
| Audio | No bearing on the question being tested |
| Leaderboards, persistence, backend | Not part of the MVP |
| Multi-resolution asset pipeline | Responsive layout covers the POC's needs |

---

## Recommendation

The POC has done its job. Going further requires an architectural decision about the rendering engine, not more work on this codebase.

### Option A — Change engine *(recommended if productising)*

Godot with an Expo export, a custom WebGL renderer, or a native C++ game loop.

**Why:** it addresses the actual finding. React Native Skia is excellent for animated UI; a continuously-simulated game loop at 60 fps on mid-range hardware is past what it does well.

**Cost:** new stack, new expertise, most of this code does not carry over. The design decisions in [architecture.md](./architecture.md) do.

### Option B — Narrow the scope and stay on this stack

Fewer simultaneous obstacles, smaller canvas, lower spawn rate, simpler lane rendering.

**Why:** fastest path to something shippable. Reaches the target by reducing what has to be drawn.

**Cost:** a visually thinner game, and the ceiling is still there — it has just been moved.

### Option C — Accept 30–50 fps

Viable for a demo, a portfolio piece, or an internal prototype. Not for a store release.

### Before deciding — recommended follow-up

- Test on ARMv8 versus ARMv7 to see how much the ceiling varies by device generation
- Test on Android 12+ devices with 90/120 Hz displays, where the 16 ms throttle interacts with the refresh rate
- Establish a frame budget breakdown (GPU vs CPU) to confirm the render path is the cost centre

---

## Reproducing these results

Follow the protocol in [testing.md](./testing.md). It documents the three test phases, what to record, and the profiler setup for both platforms.

---

## Related

- [architecture.md](./architecture.md) — why the implementation looks the way it does
- [specs/poc-runner-skia.md](./specs/poc-runner-skia.md) — the original specification
- [../CHANGELOG.md](../CHANGELOG.md) — how the code got here
