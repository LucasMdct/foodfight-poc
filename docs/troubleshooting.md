# Troubleshooting

Symptom → cause → fix. Consolidated from the pre-restructure docs and from what actually went wrong during the POC.

---

## Setup

### App will not start / Metro errors on launch

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

If it still fails, the native side is stale:

```bash
npx expo prebuild --clean
npm run android   # or: npm run ios
```

### Skia or Reanimated module not found

Both need a native rebuild — they cannot be hot-loaded into an existing binary. After installing or upgrading either:

```bash
npx expo prebuild --clean && npm run android
```

Reanimated also requires `react-native-worklets` (pinned at 0.8.3) and its Babel plugin. Check `babel.config.js` if worklets throw at runtime.

### `pod install` fails on iOS

`/ios` is gitignored and regenerated. Delete it and re-run `npx expo prebuild`.

---

## Performance

### Frame rate below 55

**First, rule out the measurement.** These invalidate any reading:

- Remote JS debugging enabled → shake device → *Disable Remote JS Debugging*
- Dev build instead of release
- Emulator instead of physical device
- Device thermally throttled or below 30% battery

If the reading is valid, the levers in order of effect:

1. Lower `OBSTACLE_MAX_ACTIVE` (15 → 10) — removes draw calls directly, biggest win
2. Raise `OBSTACLE_SPAWN_INTERVAL` (800 → 1000 ms) — fewer moving rects at once
3. Lower `OBSTACLE_SPEED` — fewer obstacles on screen simultaneously
4. Simplify lane rendering in `GameCanvas` — five static rects repaint every frame

If none of that helps: 30–50 fps on mid-range ARM is the documented ceiling of this stack, not a bug. See [results.md](./results.md).

### Frame rate degrades over time

Different problem from a low but flat frame rate. Check the pool is recycling — `obstacleActive[i]` must return to 0 when an obstacle exits left. Confirm with `adb shell dumpsys meminfo <package>` over several minutes; sawtooth or rising memory means allocation somewhere in the frame path.

### Game runs too fast or too slow

The 16.0 ms throttle in `useRunnerEngine` normalises high-refresh displays (90/120 Hz) down to ~60 updates per second. If it is removed or the threshold is changed, gameplay speed becomes display-dependent.

Movement uses the real measured delta, so *correctness* survives a changed threshold; only the update cadence shifts.

---

## Input

### Swipes not registering

- `GestureHandlerRootView` must wrap the whole tree in `App.tsx`. Without it, gestures silently never fire.
- Gesture Handler needs a native rebuild after install: `npx expo prebuild --clean`.
- Fling is a **discrete** gesture. A slow drag will not trigger it — the motion has to be a flick.

### Only every other swipe works

Working as designed. `SwipeHandler` debounces at 100 ms so one physical flick cannot register twice. Rapid repeated flicks inside that window collapse into one.

### Swipes feel laggy

Almost always the remote debugger. Disable it and re-measure. If lag persists in a release build, log timestamps in `handleSwipe` and when `heroY` settles to find which side is slow.

### Hero does not move at game over

Intended. `moveLane` returns early when `gameOver.value === 1`.

---

## Gameplay

### Collisions register when they should not

Check `HERO_HITBOX_PADDING`. It insets the hero hitbox on the X axis — raising it makes collisions more forgiving, lowering it makes them stricter.

Only the X axis is tested; Y overlap is implied by the lane-index check. If lane geometry is ever changed so that hero and obstacle are no longer both centred in their lane, that assumption breaks and a Y test becomes necessary. See [architecture.md](./architecture.md).

### Collisions never register

- Is the hero invulnerable? A hit grants 1.5 s of immunity, visible as the flicker.
- Do lane indices agree? Both `heroLane` and `obstacleLane` are 0-based, top to bottom.

### Obstacles stop spawning

All 15 pool slots are occupied, so the spawn tick finds nothing free and skips silently. Happens only after tuning — raise `OBSTACLE_SPEED` so obstacles clear the screen faster, or raise `OBSTACLE_SPAWN_INTERVAL`.

### Obstacles remain on screen after "Play Again"

Reset is two calls and both are required:

```ts
engine.reset();   // clears the pool, recentres hero — UI thread
actions.reset();  // restores score/health/isGameOver — store
```

Calling only `actions.reset()` restores the HUD while leaving obstacles mid-flight.

### Score not incrementing

Score is awarded for **dodging** — 10 points when an obstacle exits the left edge while active. An obstacle that hits the hero still exits and still scores; the penalty is the health loss.

---

## Layout

### Lanes misaligned after rotation

Lane height derives from `useWindowDimensions()`, which updates on rotation. If the layout is stale, something is reading `GAME_CONSTANTS.SCREEN_HEIGHT` or `LANE_Y_POSITIONS` instead — those are dead leftovers and must not be used for geometry.

### Orientation lock does nothing

`OrientationScreen` catches lock failures and proceeds to the game anyway, logging a warning, so a rejected lock never blocks play. Check the console for `Failed to lock orientation`. Some devices and some Android system settings ignore programmatic locks entirely.

---

## Still stuck

1. [architecture.md](./architecture.md) — the loop's invariants, and what breaks when they are violated
2. [results.md](./results.md) — what "normal" measured like on real hardware
3. [testing.md](./testing.md) — how to measure properly before concluding anything
