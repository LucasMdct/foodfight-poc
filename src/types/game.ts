export type Lane = 'top' | 'middle' | 'bottom';

// Lane index used on the UI thread (0 = top, 1 = middle, 2 = bottom).
export const LANE_ORDER: Lane[] = ['top', 'middle', 'bottom'];

/**
 * Discrete game state kept in React/Zustand. Per-frame values (hero position,
 * obstacle positions, collision flicker) live in Reanimated shared values on the
 * UI thread — see useRunnerEngine — so gameplay does NOT re-render React.
 */
export interface GameState {
  score: number;
  health: number;
  isGameOver: boolean;
  fps: number;
}

export interface GameActions {
  updateFps: (fps: number) => void;
  hitHero: () => void;
  incrementScore: (points: number) => void;
  reset: () => void;
}

export const INITIAL_GAME_STATE: GameState = {
  score: 0,
  health: 100,
  isGameOver: false,
  fps: 60,
};
