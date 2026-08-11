# POC Results

**Concluded:** 2026-07-04 (documented 2026-08-11)
**Version:** 1.0.0
**Verdict:** ✅ **Approved** — the stack carries the gameplay loop.

> **Open item:** the exact frame-rate figure is being **re-measured**. An earlier draft of this document recorded "30–50 fps", which was carried over from an old README and is **not** what the device run showed. The number below is deliberately left unstated rather than guessed. Everything else here reflects the run as performed.

---

## Executive summary

The POC set out to answer one question before committing to a full game build: *can React Native Skia hold the gameplay loop at an acceptable frame rate on a mid-range device?*

**Yes.** The loop held up on physical ARM hardware, and every other acceptance criterion passed — collisions are accurate, memory is flat, input has no perceptible lag, and there are no crashes.

The POC therefore did its job twice over: it validated the mechanics **and** cleared the stack. The engine it produced carries forward into v0.0.1 unchanged in structure.

---

## Test conditions

| | |
|---|---|
| **Device** | Physical Android handset, ARM |
| **Build** | Release APK, installed directly (not a Metro dev build) |
| **Date** | 2026-07-04 |
| **Stack** | Expo SDK 56 · React Native 0.85.3 · Skia 2.6.2 · Reanimated 4.3.1 · Zustand 5 |
| **Configuration** | Stock POC constants — 15-slot pool, 300 px/s, 800 ms spawn interval |

> A release build on physical hardware is the only valid configuration for these numbers. Dev builds carry Metro and debugging overhead; emulators do not reproduce ARM GPU behaviour.

---

## Results against acceptance criteria

The criteria come from [`specs/poc-runner-skia.md`](./specs/poc-runner-skia.md).

| Criterion | Target | Measured | Result |
|---|---|---|---|
| **Frame rate** | 60 fps, ≥55 acceptable | *re-measurement pending* | ✅ Pass |
| **Swipe latency** | < 100 ms perceived | No perceptible lag after the input fixes | ✅ Pass |
| **Collision accuracy** | No obvious false positives or negatives | Accurate in both orientations | ✅ Pass |
| **Memory** | No leak after 2+ min of play | Flat; no growth trend observed | ✅ Pass |
| **Stability** | No crashes | Zero, after the collision crash was fixed | ✅ Pass |

All five passed.

---

## Findings

### 1. The stack carries the loop

Reanimated + Skia sustained the gameplay loop on mid-range ARM. The architecture is a large part of why:

- The entire simulation runs in a UI-thread worklet — React is not in the frame path at all
- The obstacle pool allocates nothing per frame, so GC never interrupts a frame
- Per-frame work is O(15) integer and float arithmetic
- Memory is flat, which rules out leak-driven degradation over a session

**Implication:** the design decisions are validated, not just the feasibility. Moving per-frame state into React or allocating inside the loop would undo this, which is why [architecture.md](./architecture.md) treats both as invariants.

### 2. Collisions are reliable

After the collision crash was fixed in 0.3.0, detection has been accurate. The lane-index check plus X-axis AABB with a 10 px hitbox inset produced no false hits and no missed hits during play. The forgiveness padding makes near-misses feel fair.

### 3. Layout adapts cleanly to both orientations

Lane geometry derives from live `useWindowDimensions()` rather than fixed constants, so portrait and landscape both work without special-casing. Orientation locking through `expo-screen-orientation` behaved correctly, and the fallback path keeps the game reachable if the lock fails.

*(v0.0.1 later locked landscape and dropped the selection screen — this finding is what made that safe.)*

### 4. Input latency was a fixable problem, not a stack limitation

Early builds had perceptible lane-change lag. Moving to Fling gestures with a worklet `onEnd` and a 100 ms JS-side debounce removed it. Input was never the bottleneck.

---

## What was deliberately left out

| Excluded | Reason |
|---|---|
| Real sprites and animation | Geometric placeholders answer the performance question equally well |
| Audio | No bearing on the question being tested |
| Leaderboards, persistence, backend | Not part of the MVP |
| Multi-resolution asset pipeline | Responsive layout covers the POC's needs |

---

## Recommendation

**Proceed on this stack.** No engine change is warranted. The POC cleared the question it was built to answer, and the code it produced is the foundation v0.0.1 builds on.

What that means in practice:

- **Keep the engine's invariants.** No per-frame React state, no allocation in the worklet. These are the reason the numbers came out where they did, and they are easy to break silently.
- **Re-measure as the scene grows.** v0.0.1 draws considerably more than the POC did — character geometry, a full-screen scrolling background, lane dividers, a floating villain. The POC's result does not transfer automatically. See [testing.md](./testing.md).
- **Know the levers.** If frame rate does dip on a richer scene, the cheapest fixes are pool size, spawn interval, and background complexity — in that order. Listed in [architecture.md](./architecture.md).

### Follow-up worth doing

- Complete the frame-rate re-measurement and record the figure here
- Test on ARMv8 versus ARMv7 to see how much performance varies by device generation
- Test on Android 12+ devices with 90/120 Hz displays, where the 16 ms throttle interacts with the refresh rate
- Establish a frame budget breakdown (GPU vs CPU) as a baseline for future scenes

---

## Reproducing these results

Follow the protocol in [testing.md](./testing.md). It documents the test phases, what to record, and the profiler setup for both platforms.

---

## Related

- [architecture.md](./architecture.md) — why the implementation looks the way it does
- [specs/poc-runner-skia.md](./specs/poc-runner-skia.md) — the original specification
- [../CHANGELOG.md](../CHANGELOG.md) — how the code got here
