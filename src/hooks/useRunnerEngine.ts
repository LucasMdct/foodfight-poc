import { useCallback, useEffect, useMemo } from 'react';
import {
  makeMutable,
  withTiming,
  runOnJS,
  useFrameCallback,
  type SharedValue,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { GAME_CONSTANTS } from '../types/constants';
import { useSpin } from '../render/anim';

const POOL_SIZE = GAME_CONSTANTS.OBSTACLE_MAX_ACTIVE;
const LANE_COUNT = 3;

// Visual-only blink count for the invuln flicker. Not a gameplay-balance
// constant (unlike INVULN_DURATION), so it lives here rather than in
// GAME_CONSTANTS — it only ever affects how the flicker looks.
const FLICKER_BLINKS = 4;

export interface RunnerEngine {
  // Static hero X (lane movement is vertical only). Derived from screen width.
  heroX: number;
  heroY: SharedValue<number>;
  heroOpacity: SharedValue<number>;
  // Per-slot candy state (fixed-size pool → React renders the Groups once).
  // Candy *type* is NOT tracked here: it's fixed per slot index
  // (['lolli','candy','donut'][i % 3]), so the GameScreen derives it from `i`
  // directly and no shared value / re-render is needed for it.
  obstacleX: SharedValue<number>[];
  obstacleY: SharedValue<number>[];
  obstacleActive: SharedValue<number>[]; // 1 = visible, 0 = hidden (also drives opacity)
  poolSize: number;
  // Shared spin phase reused by every candy instance (one animation, not N).
  candySpin: SharedValue<number>;
  // Tablecloth scroll offset (0..-88, loops every 900ms); frozen while paused.
  scrollX: SharedValue<number>;
  // Called from the swipe handler (JS thread).
  moveLane: (direction: -1 | 1) => void;
  // Called to clear the field and recenter the hero for a fresh match.
  reset: () => void;
}

/**
 * Runner engine: runs the whole gameplay loop on the UI thread via
 * useFrameCallback, mutating Reanimated shared values that Skia reads directly.
 * No React re-render happens per frame — Zustand only receives discrete events
 * (a hit, game over, and one FPS sample per second).
 */
export const useRunnerEngine = (screenWidth: number, screenHeight: number): RunnerEngine => {
  const laneHeight = screenHeight / LANE_COUNT;
  const heroX = screenWidth * GAME_CONSTANTS.HERO_X_RATIO;

  // Top-Y of a rect of the given height, vertically centered in a lane.
  const heroTopY = useCallback(
    (lane: number) => lane * laneHeight + (laneHeight - GAME_CONSTANTS.HERO_HEIGHT) / 2,
    [laneHeight]
  );

  // --- Shared values (created once; live for the app session) ---------------
  const heroLane = useMemo(() => makeMutable(1), []); // 0..2, middle by default
  const heroY = useMemo(() => makeMutable(heroTopY(1)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const heroOpacity = useMemo(() => makeMutable(1), []);
  const invulnUntil = useMemo(() => makeMutable(0), []); // UI-clock ms until flicker ends
  const elapsedTime = useMemo(() => makeMutable(0), []); // Monotonic time in ms that survives re-renders
  const lastUpdateTime = useMemo(() => makeMutable(0), []); // Track when the last 60fps frame update ran
  const scrollX = useMemo(() => makeMutable(0), []); // Tablecloth loop offset, 0..-88

  const obstacleX = useMemo(
    () => Array.from({ length: POOL_SIZE }, () => makeMutable(-GAME_CONSTANTS.CANDY_SIZE)),
    []
  );
  const obstacleY = useMemo(
    () => Array.from({ length: POOL_SIZE }, () => makeMutable(0)),
    []
  );
  const obstacleLane = useMemo(
    () => Array.from({ length: POOL_SIZE }, () => makeMutable(0)),
    []
  );
  const obstacleActive = useMemo(
    () => Array.from({ length: POOL_SIZE }, () => makeMutable(0)),
    []
  );

  // All candies share a single spin phase (one withRepeat animation, not N).
  const candySpin = useSpin(900);

  const spawnAccum = useMemo(() => makeMutable(GAME_CONSTANTS.SPAWN_INTERVAL), []);
  const fpsAccum = useMemo(() => makeMutable(0), []);
  const fpsFrames = useMemo(() => makeMutable(0), []);
  // 1 when the store's screen is 'over' — freezes the whole loop (spawn,
  // movement, scroll) below. The engine only ever mounts while screen is
  // 'game' or 'over' (see GameScreen/App.tsx), so gating on this flag is
  // equivalent to gating on `screen === 'game'`.
  const gameOver = useMemo(() => makeMutable(0), []);

  // --- Bridges back to React (called at most once/sec or per discrete event) -
  const applyHit = useCallback(() => {
    useGameStore.getState().actions.hitHero();
  }, []);
  const applyFps = useCallback((fps: number) => {
    useGameStore.getState().actions.updateFps(fps);
  }, []);
  const applyScore = useCallback((points: number) => {
    useGameStore.getState().actions.incrementScore(points);
  }, []);

  // Keep the UI-thread game-over flag in sync with the store.
  const isGameOver = useGameStore((s) => s.state.screen === 'over');
  useEffect(() => {
    gameOver.value = isGameOver ? 1 : 0;
  }, [isGameOver, gameOver]);

  // --- Public actions (JS thread) -------------------------------------------
  const moveLane = useCallback(
    (direction: -1 | 1) => {
      if (gameOver.value === 1) return;
      const next = Math.min(LANE_COUNT - 1, Math.max(0, heroLane.value + direction));
      if (next === heroLane.value) return;
      heroLane.value = next;
      // 130ms lane switch (design spec).
      heroY.value = withTiming(heroTopY(next), {
        duration: GAME_CONSTANTS.HERO_LANE_TRANSITION_DURATION,
      });
    },
    [heroLane, heroY, heroTopY, gameOver]
  );

  const reset = useCallback(() => {
    for (let i = 0; i < POOL_SIZE; i++) {
      obstacleActive[i].value = 0;
      obstacleX[i].value = -GAME_CONSTANTS.CANDY_SIZE;
    }
    heroLane.value = 1;
    heroY.value = heroTopY(1);
    heroOpacity.value = 1;
    invulnUntil.value = 0;
    elapsedTime.value = 0;
    lastUpdateTime.value = 0;
    spawnAccum.value = GAME_CONSTANTS.SPAWN_INTERVAL;
    scrollX.value = 0;
  }, [
    obstacleActive,
    obstacleX,
    heroLane,
    heroY,
    heroOpacity,
    invulnUntil,
    elapsedTime,
    lastUpdateTime,
    spawnAccum,
    scrollX,
    heroTopY,
  ]);

  // --- The frame loop (UI thread worklet) -----------------------------------
  // Constants captured by value so the worklet stays self-contained.
  const CANDY_SIZE = GAME_CONSTANTS.CANDY_SIZE;
  const CANDY_BASE_SPEED = GAME_CONSTANTS.CANDY_BASE_SPEED;
  const CANDY_SPEED_RAMP_MAX = GAME_CONSTANTS.CANDY_SPEED_RAMP_MAX;
  const CANDY_SPEED_RAMP_RATE = GAME_CONSTANTS.CANDY_SPEED_RAMP_RATE;
  const SPAWN_INTERVAL = GAME_CONSTANTS.SPAWN_INTERVAL;
  const SPAWN_INTERVAL_MIN = GAME_CONSTANTS.SPAWN_INTERVAL_MIN;
  const SPAWN_INTERVAL_RAMP_RATE = GAME_CONSTANTS.SPAWN_INTERVAL_RAMP_RATE;
  const HERO_W = GAME_CONSTANTS.HERO_WIDTH;
  const PAD = GAME_CONSTANTS.HERO_HITBOX_PADDING;
  const INVULN_DURATION = GAME_CONSTANTS.INVULN_DURATION;

  useFrameCallback((frame) => {
    'worklet';
    const timestamp = frame.timestamp;

    // Initialize lastUpdateTime if it is 0 or on callback initialization
    if (frame.timeSincePreviousFrame === null || lastUpdateTime.value === 0) {
      lastUpdateTime.value = timestamp;
    }

    const elapsed = timestamp - lastUpdateTime.value;

    // Throttle to 60 FPS (~16.0ms threshold to prevent timing jitter skips)
    if (elapsed < 16.0 && frame.timeSincePreviousFrame !== null) {
      return;
    }

    const dtMs = elapsed > 0 ? elapsed : GAME_CONSTANTS.FRAME_TIME_MS;
    lastUpdateTime.value = timestamp;

    elapsedTime.value += dtMs;
    const now = elapsedTime.value;

    // --- FPS: sample once per second, then hand one value to React ----------
    fpsFrames.value += 1;
    fpsAccum.value += dtMs;
    if (fpsAccum.value >= 1000) {
      const fps = Math.round((fpsFrames.value * 1000) / fpsAccum.value);
      runOnJS(applyFps)(fps);
      fpsFrames.value = 0;
      fpsAccum.value = 0;
    }

    // Gate: everything below (spawn, movement, scroll) freezes on game over.
    if (gameOver.value === 1) return;

    const dt = dtMs / 1000; // seconds

    // --- Tablecloth scroll: 88px loop every 900ms, paused above -------------
    scrollX.value = -((now / 900) % 1) * 88;

    // --- Difficulty ramp: candies speed up and spawn faster over time -------
    const speed = CANDY_BASE_SPEED + Math.min(CANDY_SPEED_RAMP_MAX, now * CANDY_SPEED_RAMP_RATE);
    const interval = Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL - now * SPAWN_INTERVAL_RAMP_RATE);

    // --- Spawn: activate an idle slot on interval ---------------------------
    spawnAccum.value += dtMs;
    if (spawnAccum.value >= interval) {
      spawnAccum.value = 0;
      for (let i = 0; i < POOL_SIZE; i++) {
        if (obstacleActive[i].value === 0) {
          const lane = Math.floor(Math.random() * LANE_COUNT);
          obstacleLane[i].value = lane;
          obstacleX[i].value = screenWidth;
          obstacleY[i].value = lane * laneHeight + (laneHeight - CANDY_SIZE) / 2;
          obstacleActive[i].value = 1;
          break;
        }
      }
    }

    // --- Move, recycle off-screen, and check collision ----------------------
    const canBeHit = now >= invulnUntil.value;
    const heroLeft = heroX + PAD;
    const heroRight = heroX + HERO_W - PAD;

    for (let i = 0; i < POOL_SIZE; i++) {
      if (obstacleActive[i].value === 0) continue;

      const x = obstacleX[i].value - speed * dt;
      obstacleX[i].value = x;

      if (x + CANDY_SIZE < 0) {
        obstacleActive[i].value = 0; // recycle: no allocation, no leak
        runOnJS(applyScore)(GAME_CONSTANTS.SCORE_PER_DODGE);
        continue;
      }

      if (canBeHit && obstacleLane[i].value === heroLane.value) {
        // Same lane → an X-axis overlap is a hit (Y always overlaps in-lane).
        if (heroLeft < x + CANDY_SIZE && heroRight > x) {
          invulnUntil.value = now + INVULN_DURATION;
          runOnJS(applyHit)();
        }
      }
    }

    // --- Collision flicker feedback ------------------------------------------
    if (now < invulnUntil.value) {
      const half = INVULN_DURATION / (FLICKER_BLINKS * 2);
      const phase = Math.floor((invulnUntil.value - now) / half) % 2;
      heroOpacity.value = phase === 0 ? 1 : 0.3;
    } else {
      heroOpacity.value = 1;
    }
  });

  return {
    heroX,
    heroY,
    heroOpacity,
    obstacleX,
    obstacleY,
    obstacleActive,
    poolSize: POOL_SIZE,
    candySpin,
    scrollX,
    moveLane,
    reset,
  };
};
