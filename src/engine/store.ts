import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Level, LevelProgress, PaceId } from './types'

// The engine stores the currency as an opaque id; content/currency.ts owns
// the list and rendering falls back to the default for unknown ids, so the
// engine needs no content import (dependency direction stays engine ← content).
const DEFAULT_CURRENCY = 'USD'

/**
 * The game store — the persisted spine of progress. Only the GameState fields
 * survive a refresh (via `partialize`); transient play state (the current
 * question, the in-attempt streak) lives in the PlayScreen, not here, so the
 * store stays a clean record of "what has this child earned".
 *
 * There is deliberately NO stored unlock state: which levels are open is
 * derived from `progress` by the selectors below, so re-shaping content
 * (categories, new levels) never needs a data migration for children.
 *
 * Safe-failure rule holds here too: no action ever removes a star, relocks a
 * level, or lowers a streak. Progress only moves forward.
 */

interface GameActions {
  /** +1 star for a correct answer. */
  awardStar: () => void
  /** Record a level attempt's streak, keeping the best ever seen. */
  recordStreak: (levelId: string, streak: number) => void
  /** Mark a level cleared (the next level in its category derives as open). */
  clearLevel: (levelId: string, streak: number) => void
  /** Mute toggle (persisted so the choice survives a refresh). */
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  /** Set the learning-pace profile from the grown-ups quiz. */
  setPace: (pace: PaceId) => void
  /** Set the child's age (first-launch gate / grown-ups panel). */
  setAge: (age: number) => void
  /** Set the family's currency (grown-ups panel). */
  setCurrency: (currency: string) => void
  /** Record a sprint result — kept only if it beats the level's best. */
  recordSprintScore: (levelId: string, score: number) => void
  /**
   * Mark levels cleared via the placement check (one demonstrated answer
   * each). Never downgrades a level that was already earned, and never
   * awards stars — placement grants position, not rewards.
   */
  placeLevels: (levelIds: readonly string[]) => void
  /** Wipe all progress back to the start (used by the reset control / tests). */
  reset: () => void
}

export type GameStore = GameState & GameActions

const initialState: GameState = {
  stars: 0,
  progress: {},
  muted: false,
  pace: null,
  age: null,
  currency: DEFAULT_CURRENCY,
  bestScores: {},
}

const PACES: readonly PaceId[] = ['gentle', 'steady', 'eager']

/**
 * v1 persisted a global `unlockedOrder` for the single linear trail; v2 derives
 * unlock from `progress`, so migrating just keeps the earned fields (level ids
 * are unchanged, so cleared levels keep counting). Wired as `migrate:` below.
 */
export function migratePersistedState(persisted: unknown): GameState {
  const s = (persisted ?? {}) as Partial<GameState>
  return {
    stars: typeof s.stars === 'number' ? s.stars : 0,
    progress: s.progress ?? {},
    muted: s.muted === true,
    pace: s.pace && PACES.includes(s.pace) ? s.pace : null,
    // Only a plausible child age survives; anything else re-asks the gate.
    age:
      typeof s.age === 'number' && Number.isInteger(s.age) && s.age >= 4 && s.age <= 12
        ? s.age
        : null,
    // Opaque id; unknown values fall back at render time.
    currency: typeof s.currency === 'string' && s.currency ? s.currency : DEFAULT_CURRENCY,
    // Keep only well-formed numeric bests.
    bestScores: Object.fromEntries(
      Object.entries(s.bestScores ?? {}).filter(
        ([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
      ),
    ),
  }
}

function bumpBest(
  progress: Record<string, LevelProgress>,
  levelId: string,
  streak: number,
  cleared: boolean,
): Record<string, LevelProgress> {
  const prev = progress[levelId]
  const next: LevelProgress = {
    cleared: cleared || (prev?.cleared ?? false),
    bestStreak: Math.max(streak, prev?.bestStreak ?? 0),
  }
  // Real mastery erases "placed" provenance; short of that, keep it.
  if (!cleared && prev?.placed) next.placed = true
  return { ...progress, [levelId]: next }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      awardStar: () => set((s) => ({ stars: s.stars + 1 })),

      recordStreak: (levelId, streak) =>
        set((s) => ({ progress: bumpBest(s.progress, levelId, streak, false) })),

      clearLevel: (levelId, streak) =>
        set((s) => ({ progress: bumpBest(s.progress, levelId, streak, true) })),

      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),

      setPace: (pace) => set({ pace }),

      setAge: (age) => set({ age }),

      setCurrency: (currency) => set({ currency }),

      recordSprintScore: (levelId, score) =>
        set((s) => {
          const best = s.bestScores[levelId] ?? 0
          if (score <= best) return s // forward-only, like all earned things
          return { bestScores: { ...s.bestScores, [levelId]: score } }
        }),

      placeLevels: (levelIds) =>
        set((s) => {
          const progress = { ...s.progress }
          for (const id of levelIds) {
            const prev = progress[id]
            if (prev?.cleared) continue // earned beats placed — never overwrite
            progress[id] = {
              cleared: true,
              bestStreak: prev?.bestStreak ?? 0,
              placed: true,
            }
          }
          return { progress }
        }),

      // Reset wipes the CHILD's progress AND the age (a fresh start is often
      // a different child — the age gate re-asks, and placement re-offers).
      // Pace, mute and currency describe the household/device, so they survive.
      reset: () =>
        set((s) => ({
          ...initialState,
          pace: s.pace,
          muted: s.muted,
          currency: s.currency,
        })),
    }),
    {
      name: 'number-meadow/v1', // storage key — keep stable so old saves load
      version: 2, // v2: dropped `unlockedOrder` (unlock is derived now)
      migrate: migratePersistedState,
      // Persist only the earned progress + settings, never action closures.
      partialize: (s): GameState => ({
        stars: s.stars,
        progress: s.progress,
        muted: s.muted,
        pace: s.pace,
        age: s.age,
        currency: s.currency,
        bestScores: s.bestScores,
      }),
    },
  ),
)

// ---- Selectors (pure reads over the store) --------------------------------

/** Has this level been cleared at least once? */
export function hasCleared(
  progress: Record<string, LevelProgress>,
  levelId: string,
): boolean {
  return progress[levelId]?.cleared ?? false
}

/**
 * The furthest playable in-category order: one past the consecutive run of
 * cleared levels at the start. `levels` must be one category's levels, sorted
 * by order (content/levelsInCategory guarantees this).
 */
export function unlockedUpTo(
  levels: readonly Level[],
  progress: Record<string, LevelProgress>,
): number {
  let cleared = 0
  for (const l of levels) {
    if (hasCleared(progress, l.id)) cleared++
    else break
  }
  return cleared + 1
}

/** A category's sprint high score: the sum of its levels' bests. */
export function categorySprintScore(
  levels: readonly Level[],
  bestScores: Record<string, number>,
): number {
  return levels.reduce((sum, l) => sum + (bestScores[l.id] ?? 0), 0)
}

/**
 * Is this level reachable, given its category's levels? A cleared level is
 * ALWAYS open (never re-locks — even if a future content update inserts a new
 * uncleared level before it); otherwise it must sit within the cleared prefix
 * plus one.
 */
export function isLevelUnlocked(
  level: Level,
  categoryLevels: readonly Level[],
  progress: Record<string, LevelProgress>,
): boolean {
  return (
    hasCleared(progress, level.id) ||
    level.order <= unlockedUpTo(categoryLevels, progress)
  )
}
