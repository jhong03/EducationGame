import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, LevelProgress } from './types'

/**
 * The game store — the persisted spine of progress. Only the four GameState
 * fields survive a refresh (via `partialize`); transient play state (the
 * current question, the in-attempt streak) lives in the PlayScreen, not here,
 * so the store stays a clean record of "what has this child earned".
 *
 * Safe-failure rule holds here too: no action ever removes a star, relocks a
 * level, or lowers a streak. Progress only moves forward.
 */

interface GameActions {
  /** +1 star for a correct answer. */
  awardStar: () => void
  /** Record a level attempt's streak, keeping the best ever seen. */
  recordStreak: (levelId: string, streak: number) => void
  /** Mark a level cleared and unlock the next trail position. */
  clearLevel: (levelId: string, order: number, streak: number) => void
  /** Mute toggle (persisted so the choice survives a refresh). */
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  /** Wipe all progress back to the start (used by the reset control / tests). */
  reset: () => void
}

export type GameStore = GameState & GameActions

const initialState: GameState = {
  unlockedOrder: 1, // the first level is always open
  stars: 0,
  progress: {},
  muted: false,
}

function bumpBest(
  progress: Record<string, LevelProgress>,
  levelId: string,
  streak: number,
  cleared: boolean,
): Record<string, LevelProgress> {
  const prev = progress[levelId]
  return {
    ...progress,
    [levelId]: {
      cleared: cleared || (prev?.cleared ?? false),
      bestStreak: Math.max(streak, prev?.bestStreak ?? 0),
    },
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      awardStar: () => set((s) => ({ stars: s.stars + 1 })),

      recordStreak: (levelId, streak) =>
        set((s) => ({ progress: bumpBest(s.progress, levelId, streak, false) })),

      clearLevel: (levelId, order, streak) =>
        set((s) => ({
          unlockedOrder: Math.max(s.unlockedOrder, order + 1),
          progress: bumpBest(s.progress, levelId, streak, true),
        })),

      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'number-meadow/v1',
      version: 1,
      // Persist only the earned progress, never transient action closures.
      partialize: (s): GameState => ({
        unlockedOrder: s.unlockedOrder,
        stars: s.stars,
        progress: s.progress,
        muted: s.muted,
      }),
    },
  ),
)

// ---- Selectors (pure reads over the store) --------------------------------

/** Is this trail position reachable? */
export function isUnlocked(order: number, unlockedOrder: number): boolean {
  return order <= unlockedOrder
}

/** Has this level been cleared at least once? */
export function hasCleared(
  progress: Record<string, LevelProgress>,
  levelId: string,
): boolean {
  return progress[levelId]?.cleared ?? false
}
