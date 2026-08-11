# Architecture

How the runner is built, and why it is built this way.

**Scope:** this describes the code as it exists. Where the implementation diverges from the original spec, the divergence is called out.

---

## The central constraint

A 60 fps target gives a **16.67 ms budget per frame**. In React Native, the JS thread is the wrong place to spend that budget: every `setState` schedules a React render, reconciliation, and a bridge hop. At 60 fps that is 60 render passes per second for values that change continuously.

The whole architecture follows from avoiding that:

> **Per-frame values never touch React.** They live in Reanimated shared values, are mutated by a worklet on the UI thread, and are read directly by Skia. React only hears about discrete events — a hit, a score change, one FPS sample per second, game over.

Everything below is a consequence of this rule.

---

## Layers

```
App.tsx  ─ state machine: 'loading' → 'orientation' → 'playing'
   │
   ├─ GameLoader            animated intro, calls onFinished
   ├─ OrientationScreen     locks orientation, calls onSelect
   └─ GameScreen
        │
        ├─ useRunnerEngine(width, height)   ← all gameplay lives here
        │     └─ useFrameCallback worklet (UI thread)
        │           ├─ FPS sampling
        │           ├─ obstacle spawn
        │           ├─ obstacle movement + recycling
        │           ├─ AABB collision
        │           └─ flicker feedback
        │
        ├─ SwipeHandler      Fling gestures → engine.moveLane()
        └─ GameCanvas        Skia <Rect>s bound to shared values + HUD
                 │
                 └─ useGameStore (Zustand)  discrete state only
```

**Data flow is one-directional per thread:**

- UI thread: worklet writes shared values → Skia reads them → pixels. No React involved.
- JS thread: worklet calls `runOnJS` on discrete events → Zustand updates → HUD re-renders.

---

## The engine — `src/hooks/useRunnerEngine.ts`

One hook holds the entire game loop. There is no `systems/` directory and no separate collision or obstacle module; those were in the original design but collapsed into the worklet, because splitting them would mean crossing the worklet boundary or allocating per frame.

### Shared values

Created once with `makeMutable` and memoised so they survive re-renders:

| Value | Purpose |
|---|---|
| `heroLane` | 0, 1, 2 — current lane index |
| `heroY` | Animated top-Y of the hero rect |
| `heroOpacity` | Drives the collision flicker |
| `invulnUntil` | Timestamp (ms, game clock) when invulnerability ends |
| `elapsedTime` | Monotonic game clock, survives re-renders |
| `lastUpdateTime` | Frame timestamp of the last accepted update |
| `obstacleX[]`, `obstacleY[]`, `obstacleLane[]`, `obstacleActive[]` | Per-slot obstacle state |
| `spawnAccum`, `fpsAccum`, `fpsFrames` | Accumulators |
| `gameOver` | 1 freezes the simulation |

### The obstacle pool

`OBSTACLE_MAX_ACTIVE` (15) is a **pool size, not a cap**. Fifteen `<Rect>` elements are mounted once by `GameCanvas` and never unmounted. Spawning means finding a slot with `obstacleActive === 0` and setting its position; despawning means setting it back to 0.

`obstacleActive` doubles as the rect's `opacity`, so hiding is free — no conditional rendering, no key churn, no React reconciliation.

**Consequence:** zero allocation per frame, and therefore no GC pressure from the loop. This is what keeps memory flat during long sessions (see [results.md](./results.md)).

**Trade-off:** if all 15 slots are busy, a spawn tick is silently skipped. At the configured speed and interval this cannot happen — obstacles cross the screen faster than they spawn — but changing `OBSTACLE_SPEED` or `OBSTACLE_SPAWN_INTERVAL` can break that assumption.

### The frame loop

```
useFrameCallback(frame):
  1. bootstrap lastUpdateTime on the first frame
  2. elapsed = frame.timestamp - lastUpdateTime
  3. if elapsed < 16.0ms → return          ← throttle
  4. advance elapsedTime by the real delta
  5. FPS: count frames, emit one sample per second via runOnJS
  6. if gameOver → return
  7. spawn: on interval, activate one idle slot in a random lane
  8. for each active obstacle:
       move left by OBSTACLE_SPEED * dt
       off-screen? → deactivate, +10 score
       same lane as hero and not invulnerable? → AABB test on X
  9. flicker: derive heroOpacity from time remaining on invulnUntil
```

Two details worth knowing before touching this:

**The 16.0 ms throttle (step 3).** `useFrameCallback` fires at the display refresh rate, which is 90 Hz or 120 Hz on many devices. Without the throttle, gameplay would run proportionally faster on those screens. The threshold is 16.0 and not 16.67 so that ordinary timing jitter does not cause a frame to be skipped entirely, which produced visible stutter. Movement still uses the real measured delta, so the simulation stays correct either way.

**The collision test only checks X (step 8).** Y overlap is implied: hero and obstacle are both vertically centred in the same lane, and lane membership is already checked with an integer comparison. Testing Y would be redundant work in the hot loop. The hitbox is the hero rect inset by `HERO_HITBOX_PADDING` (10 px) on the X axis, which makes near-misses forgiving.

**Invulnerability** is a timestamp comparison, not a boolean plus a timer — `now >= invulnUntil`. No timer to cancel, no state to desynchronise, and it is naturally correct across pauses and resets.

### Bridges to React

Exactly three `runOnJS` calls exist, and each is rate-limited by construction:

| Call | Frequency |
|---|---|
| `applyFps` | once per second |
| `applyHit` | at most once per 1.5 s (invulnerability window) |
| `applyScore` | once per obstacle dodged |

---

## State — `src/store/gameStore.ts`

Zustand holds only what the HUD renders:

```ts
GameState = { score, health, isGameOver, fps }
```

Hero position, obstacle positions and flicker phase are deliberately **not** here. Putting them in the store is the single easiest way to destroy the frame rate.

`hitHero` subtracts `COLLISION_DAMAGE` (25) and sets `isGameOver` when health reaches 0 — four hits ends a run.

**Zustand over Context:** Context re-renders every consumer on every change. Zustand's selector subscriptions mean the HUD re-renders and nothing else does.

---

## Rendering — `src/components/GameCanvas.tsx`

The Skia tree is static. It mounts:

- 3 lane background rects + 2 divider rects
- 1 hero rect, with `y` and `opacity` bound to shared values
- 15 obstacle rects, with `x`, `y` and `opacity` bound to shared values

Skia reads shared values directly, so mutating one repaints without a React render. The rect count never changes during play.

The HUD (health, score, FPS) and the Game Over modal are ordinary React Native views layered above the canvas, driven by Zustand. FPS text turns amber below 55.

---

## Input — `src/components/SwipeHandler.tsx`

Two `Gesture.Fling()` detectors — one for `Directions.UP`, one for `Directions.DOWN` — combined with `Gesture.Race`. Two gestures rather than one because Fling's `onEnd` payload does not carry the direction that triggered it.

`onEnd` is a worklet, so it hands the direction to JS via `runOnJS`. A 100 ms debounce on the JS side prevents one physical flick from registering twice.

`moveLane` clamps to `[0, 2]`, ignores no-op moves, and animates `heroY` with `withTiming` over `HERO_LANE_TRANSITION_DURATION` (100 ms).

**Trade-off:** Fling is a discrete gesture, so the hero cannot be dragged continuously between lanes. That matches the three-lane design and gives the cheapest possible input path.

---

## App state machine — `App.tsx`

```
'loading'  ──GameLoader.onFinished──▶  'orientation'
'orientation' ──OrientationScreen.onSelect──▶  'playing'
```

`OrientationScreen` locks orientation via `expo-screen-orientation` and falls through to `'playing'` even if the lock throws, so a permission failure cannot strand the user on the selection screen.

`GameScreen` reads `useWindowDimensions()` and passes width/height into the engine. Lane height is `screenHeight / 3`, computed from live dimensions rather than the constants, which is what makes both orientations work.

> **Note:** `GAME_CONSTANTS.SCREEN_WIDTH`, `SCREEN_HEIGHT`, `LANE_HEIGHT` and `LANE_Y_POSITIONS` are leftovers from the initial implementation and are no longer read by the engine. Real dimensions come from `useWindowDimensions`.

**Reset** is two calls: `engine.reset()` clears the pool and recentres the hero on the UI thread; `actions.reset()` restores the store. Both are required — resetting only the store would leave obstacles mid-screen.

---

## Decisions, in short

| Decision | Reason | Cost |
|---|---|---|
| Game loop in a UI-thread worklet | Removes React from the frame budget entirely | Logic must be worklet-safe; harder to unit test |
| Fixed obstacle pool | Zero per-frame allocation, no GC pauses | Spawns are dropped if the pool saturates |
| `opacity` for visibility | Avoids mount/unmount churn in the Skia tree | Hidden rects still cost a draw call |
| Zustand for discrete state only | Selector subscriptions, no tree-wide re-renders | Two sources of truth to keep straight |
| AABB collision, X axis only | Cheapest test that is correct given lane checks | Assumes rects centred in lanes |
| Timestamp-based invulnerability | No timers to cancel or desynchronise | Depends on the monotonic game clock |
| `withTiming` for lane transitions | Runs on the UI thread, does not block the loop | — |
| Fling gestures over pan | Lowest-latency path for discrete lane changes | No continuous drag |

---

## Where the frame rate actually goes

Measured on mid-range ARM: 30–50 fps. The loop itself is O(n) over 15 slots with no allocation, which is not the bottleneck. The cost is in the Skia/Reanimated rendering path per frame on this hardware class. See [results.md](./results.md) for the full analysis and the engine options if this is ever productised.

Cheapest levers, in order:

1. Lower `OBSTACLE_MAX_ACTIVE` — directly removes draw calls
2. Raise `OBSTACLE_SPAWN_INTERVAL` — fewer simultaneous moving rects
3. Simplify lane backgrounds — five static rects repainted every frame

---

## References

- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Reanimated — shared values](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#shared-value)
- [Reanimated — `useFrameCallback`](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback)
- [Gesture Handler — Fling](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/fling-gesture)
- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/)
- [Game Programming Patterns — Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
