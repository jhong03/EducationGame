import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Level, LevelProgress, PaceId, WalletCurrency } from './types'

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
  /** Count one mastery-mode answer toward the level's lifetime accuracy. */
  recordAnswer: (levelId: string, correct: boolean) => void
  /** Mark a level cleared (the next level in its category derives as open). */
  clearLevel: (levelId: string, streak: number) => void
  /** Mute toggle (persisted so the choice survives a refresh). */
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  /** Set the learning-pace profile from the grown-ups quiz. */
  setPace: (pace: PaceId) => void
  /** Set the child's age (first-launch gate / grown-ups panel). */
  setAge: (age: number) => void
  /** Set the child's name (name screen / grown-ups panel). '' clears it. */
  setName: (name: string | null) => void
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
  /** Grant diamonds (the skill currency) — forward-only; ignores n ≤ 0. */
  awardDiamonds: (n: number) => void
  /**
   * Buy one of a catalogue item if the matching wallet can afford it. The
   * caller passes price + currency (the store stays content-agnostic).
   * Returns whether the purchase went through. Never lets a balance go
   * negative and never touches the lifetime "earned" totals.
   */
  buyItem: (itemId: string, currency: WalletCurrency, price: number) => boolean
  /** Place an owned (unplaced) item into a plot slot; swaps any occupant out. */
  placeItem: (slot: number, itemId: string) => void
  /** Clear a plot slot (the item returns to the tray — nothing is ever lost). */
  removeItem: (slot: number) => void
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
  name: null,
  currency: DEFAULT_CURRENCY,
  bestScores: {},
  diamonds: 0,
  starsSpent: 0,
  diamondsSpent: 0,
  owned: {},
  garden: {},
}

/** One write path for names: trimmed, capped, empty → null. */
export function sanitizeName(raw: string | null): string | null {
  const trimmed = (raw ?? '').trim().slice(0, 20)
  return trimmed ? trimmed : null
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
    name: typeof s.name === 'string' ? sanitizeName(s.name) : null,
    // Opaque id; unknown values fall back at render time. (A retired
    // `voiceId` field from the voiced era is simply not carried forward.)
    currency: typeof s.currency === 'string' && s.currency ? s.currency : DEFAULT_CURRENCY,
    // Keep only well-formed numeric bests.
    bestScores: Object.fromEntries(
      Object.entries(s.bestScores ?? {}).filter(
        ([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
      ),
    ),
    // Garden economy (added v3). Old saves default to an empty garden; the
    // earned/spent totals validate to sane non-negative numbers.
    diamonds: coerceCount(s.diamonds),
    starsSpent: coerceCount(s.starsSpent),
    diamondsSpent: coerceCount(s.diamondsSpent),
    owned: Object.fromEntries(
      Object.entries(s.owned ?? {}).filter(
        ([, v]) => typeof v === 'number' && Number.isInteger(v) && v > 0,
      ),
    ),
    garden: Object.fromEntries(
      Object.entries(s.garden ?? {}).filter(([, v]) => typeof v === 'string'),
    ),
  }
}

/** A persisted non-negative counter, or 0 for anything malformed. */
function coerceCount(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
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
  // The lifetime answer counters always ride along.
  if (prev?.attempts !== undefined) next.attempts = prev.attempts
  if (prev?.correct !== undefined) next.correct = prev.correct
  return { ...progress, [levelId]: next }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      awardStar: () => set((s) => ({ stars: s.stars + 1 })),

      recordStreak: (levelId, streak) =>
        set((s) => ({ progress: bumpBest(s.progress, levelId, streak, false) })),

      recordAnswer: (levelId, correct) =>
        set((s) => {
          const prev = s.progress[levelId]
          const next: LevelProgress = {
            cleared: prev?.cleared ?? false,
            bestStreak: prev?.bestStreak ?? 0,
            ...(prev?.placed ? { placed: true } : {}),
            attempts: (prev?.attempts ?? 0) + 1,
            correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
          }
          return { progress: { ...s.progress, [levelId]: next } }
        }),

      clearLevel: (levelId, streak) =>
        set((s) => ({ progress: bumpBest(s.progress, levelId, streak, true) })),

      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),

      setPace: (pace) => set({ pace }),

      setAge: (age) => set({ age }),

      setName: (name) => set({ name: sanitizeName(name) }),

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
              ...(prev?.attempts !== undefined ? { attempts: prev.attempts } : {}),
              ...(prev?.correct !== undefined ? { correct: prev.correct } : {}),
            }
          }
          return { progress }
        }),

      awardDiamonds: (n) => set((s) => (n > 0 ? { diamonds: s.diamonds + n } : s)),

      buyItem: (itemId, currency, price) => {
        let ok = false
        set((s) => {
          if (!(price > 0)) return s
          const balance = currency === 'star' ? starBalance(s) : diamondBalance(s)
          if (balance < price) return s // can't afford — no negative wallets
          ok = true
          const owned = { ...s.owned, [itemId]: (s.owned[itemId] ?? 0) + 1 }
          // Spend accrues into *Spent so the lifetime "earned" totals stay put.
          return currency === 'star'
            ? { starsSpent: s.starsSpent + price, owned }
            : { diamondsSpent: s.diamondsSpent + price, owned }
        })
        return ok
      },

      placeItem: (slot, itemId) =>
        set((s) => {
          const key = String(slot)
          if (s.garden[key] === itemId) return s // already there
          // Need a spare (unplaced) copy. Overwriting a slot frees its old
          // occupant back to the tray (placed counts are recomputed on read).
          if (availableCount(s.owned, s.garden, itemId) <= 0) return s
          return { garden: { ...s.garden, [key]: itemId } }
        }),

      removeItem: (slot) =>
        set((s) => {
          const key = String(slot)
          if (s.garden[key] === undefined) return s
          const garden = { ...s.garden }
          delete garden[key]
          return { garden }
        }),

      // Reset wipes the CHILD's progress, age AND name (a fresh start is
      // often a different child — the gate re-asks, placement re-offers).
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
      version: 3, // v3: added the garden economy (diamonds/spent/owned/garden)
      migrate: migratePersistedState,
      // Persist only the earned progress + settings, never action closures.
      partialize: (s): GameState => ({
        stars: s.stars,
        progress: s.progress,
        muted: s.muted,
        pace: s.pace,
        age: s.age,
        name: s.name,
        currency: s.currency,
        bestScores: s.bestScores,
        diamonds: s.diamonds,
        starsSpent: s.starsSpent,
        diamondsSpent: s.diamondsSpent,
        owned: s.owned,
        garden: s.garden,
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

// ---- Garden wallet selectors ----------------------------------------------

/** Spendable stars = lifetime earned − spent (clamped ≥ 0). */
export function starBalance(s: Pick<GameState, 'stars' | 'starsSpent'>): number {
  return Math.max(0, s.stars - s.starsSpent)
}

/** Spendable diamonds = lifetime earned − spent (clamped ≥ 0). */
export function diamondBalance(s: Pick<GameState, 'diamonds' | 'diamondsSpent'>): number {
  return Math.max(0, s.diamonds - s.diamondsSpent)
}

/** How many of an item are currently placed on the plot. */
export function placedCount(garden: Record<string, string>, itemId: string): number {
  let n = 0
  for (const id of Object.values(garden)) if (id === itemId) n++
  return n
}

/** Owned copies not currently placed — what's waiting in the tray. */
export function availableCount(
  owned: Record<string, number>,
  garden: Record<string, string>,
  itemId: string,
): number {
  return (owned[itemId] ?? 0) - placedCount(garden, itemId)
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
