import type { Level, PaceId } from './types'

/**
 * Adaptive difficulty — the calibration seam, filled (CONTEXT.md §5.1).
 *
 * MASTERY PLAY ONLY. Sprints never adapt (high scores must compare fairly)
 * and placement never adapts (probes are canonical). The mastery GOAL never
 * changes either — adaptation only shapes the question stream:
 *
 * - A question that took 2 tries makes the next one gentler (×0.8); 3+ tries
 *   gentler still (×0.6). Recovery is instant: one first-try answer and the
 *   level is back at full strength. The child never sees a message — the
 *   meadow simply meets them where they are (safe failure, invisible).
 * - REPLAYING an already-mastered level is practice, so first-try answers
 *   ramp UP — how far depends on the grown-ups' pace profile: eager ×1.5,
 *   steady ×1.25, gentle never ramps.
 *
 * Only the `max` param scales — the one knob where "bigger = harder" holds
 * across generators (counts, sums, bounds, line ends). Structural knobs
 * (table sets, denominators, modes) never move: they'd change the SKILL,
 * not the difficulty. `column-op` is excluded entirely because its `max`
 * selects the digit COUNT — a structural mode, not a bound.
 */

export interface AttemptSignal {
  /** Tries the child needed on the previous question (1 = first try). */
  lastTries: number
  /** Was the level already cleared before this attempt began? */
  replay: boolean
}

/** How hard the NEXT question should be, as a multiplier on `max`. */
export function difficultyScale(signal: AttemptSignal, pace: PaceId | null): number {
  if (signal.lastTries >= 3) return 0.6
  if (signal.lastTries === 2) return 0.8
  if (signal.replay) {
    if (pace === 'eager') return 1.5
    if (pace === 'gentle') return 1
    return 1.25 // steady, or no profile yet
  }
  return 1
}

/** Activities whose `max` is a structural mode switch, never a difficulty knob. */
const STRUCTURAL_MAX = new Set<Level['activity']>(['column-op'])

/**
 * A copy of the level with `max` scaled (rounded, floored at 3 so tiny
 * levels stay playable). Levels without `max`, structural activities, and
 * scale 1 all pass through untouched — same object, zero cost.
 */
export function adaptLevel(level: Level, scale: number): Level {
  if (scale === 1) return level
  if (STRUCTURAL_MAX.has(level.activity)) return level
  const max = level.params.max
  if (typeof max !== 'number') return level
  return {
    ...level,
    params: { ...level.params, max: Math.max(3, Math.round(max * scale)) },
  }
}
