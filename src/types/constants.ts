export const GAME_CONSTANTS = {
  // Screen dimensions (approximate, will be adjusted to device)
  SCREEN_WIDTH: 400,
  SCREEN_HEIGHT: 800,

  // Lane configuration
  LANES: {
    TOP: 'top',
    MIDDLE: 'middle',
    BOTTOM: 'bottom',
  },

  LANE_HEIGHT: 150,
  LANE_Y_POSITIONS: {
    top: 100,
    middle: 300,
    bottom: 500,
  } as Record<'top' | 'middle' | 'bottom', number>,

  // Hero configuration
  HERO_WIDTH: 50,
  HERO_HEIGHT: 60,
  HERO_STARTING_X: 50,
  HERO_HITBOX_PADDING: 10,
  HERO_LANE_TRANSITION_DURATION: 100, // ms

  // Obstacle configuration
  OBSTACLE_WIDTH: 40,
  OBSTACLE_HEIGHT: 60,
  OBSTACLE_SPEED: 300, // pixels per second
  OBSTACLE_SPAWN_INTERVAL: 800, // ms
  OBSTACLE_MAX_ACTIVE: 15, // prevent too many at once

  // Collision feedback
  COLLISION_FLICKER_DURATION: 1500, // ms
  COLLISION_FLICKER_COUNT: 4,
  COLLISION_DAMAGE: 25, // health reduction

  // Colors
  COLORS: {
    HERO: '#FF6B6B',
    OBSTACLE: '#4ECDC4',
    LANE_BG: 'rgba(200, 200, 200, 0.15)',
    CANVAS_BG: '#FFFFFF',
    TEXT: '#000000',
  },

  // Performance targets
  TARGET_FPS: 60,
  FRAME_TIME_MS: 1000 / 60, // ~16.67ms
};
