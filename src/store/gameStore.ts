import { create } from 'zustand';
import { GameState, GameActions, INITIAL_GAME_STATE } from '../types/game';
import { GAME_CONSTANTS } from '../types/constants';

interface GameStore {
  state: GameState;
  actions: GameActions;
}

export const useGameStore = create<GameStore>((set) => ({
  state: INITIAL_GAME_STATE,

  actions: {
    updateFps: (fps: number) =>
      set((store) => ({ state: { ...store.state, fps } })),

    hitHero: () =>
      set((store) => {
        const health = Math.max(0, store.state.health - GAME_CONSTANTS.COLLISION_DAMAGE);
        return {
          state: {
            ...store.state,
            health,
            isGameOver: health <= 0,
          },
        };
      }),

    incrementScore: (points: number) =>
      set((store) => ({ state: { ...store.state, score: store.state.score + points } })),

    reset: () => set({ state: INITIAL_GAME_STATE }),
  },
}));
