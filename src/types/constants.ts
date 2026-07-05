import theme from '../theme/tokens';

export const GAME_CONSTANTS = {
  LANE_COUNT: 3,
  HERO_X_RATIO: 0.09, // hero left = 0.09 * width
  HERO_WIDTH: 96,
  HERO_HEIGHT: 120,
  HERO_HITBOX_PADDING: 18, // from design collision math
  HERO_LANE_TRANSITION_DURATION: 130, // ms (design: 130ms lane switch)
  CANDY_SIZE: 52,
  CANDY_BASE_SPEED: 340, // px/s
  CANDY_SPEED_RAMP_MAX: 260,
  CANDY_SPEED_RAMP_RATE: 0.006,
  SPAWN_INTERVAL: 900, // ms
  SPAWN_INTERVAL_MIN: 420,
  SPAWN_INTERVAL_RAMP_RATE: 0.004,
  OBSTACLE_MAX_ACTIVE: 8, // design pool size
  INVULN_DURATION: 1400, // ms
  SCORE_PER_DODGE: 10,
  TARGET_FPS: 60,
  FRAME_TIME_MS: 1000 / 60,
  COLORS: theme.colors,

  // legacy — remover na Task 9 (usado apenas por src/hooks/useRunnerEngine.ts, será reescrito)
  OBSTACLE_WIDTH: 40,
  OBSTACLE_HEIGHT: 60,
  OBSTACLE_SPEED: 300,
  OBSTACLE_SPAWN_INTERVAL: 800,
  HERO_STARTING_X: 50,
  COLLISION_FLICKER_DURATION: 1500,
  COLLISION_FLICKER_COUNT: 4,
};
