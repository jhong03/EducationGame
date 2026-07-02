import type { ActivityType, Band, Level } from '../engine/types'

export const MATH_SUBJECT_ID = 'math'

/**
 * The full math skill spine across all three bands (spec §4). This is
 * reference data so the model is shaped correctly for later phases — only the
 * `early` band is turned into playable Levels below. Adding a rung later means
 * adding a Level object (and, if it needs a new activity, a generator), not
 * rewriting the engine.
 */
export const MATH_SPINE: Record<Band, readonly string[]> = {
  early: [
    'count to 3',
    'count to 5',
    'count to 10',
    'numeral ↔ quantity',
    'compare (more/less/equal)',
    'add within 5',
    'add within 10',
  ],
  mid: [
    'add/subtract within 20',
    'add/subtract within 100',
    'place value',
    'skip-counting',
    'intro times tables',
    'simple division',
    'halves & quarters',
  ],
  upper: [
    'multi-digit ×/÷',
    'equivalent & add/subtract fractions',
    'decimals',
    'percentages',
    'area/perimeter',
    'order of operations',
    'simple equations',
    'multi-step word problems',
  ],
} as const

const DEFAULT_MASTERY_GOAL = 3

/** Small helper so the level table below stays readable and consistent. */
function level(
  order: number,
  name: string,
  icon: string,
  activity: ActivityType,
  params: Record<string, number>,
  masteryGoal = DEFAULT_MASTERY_GOAL,
): Level {
  return {
    id: `${MATH_SUBJECT_ID}-early-${order}`,
    subjectId: MATH_SUBJECT_ID,
    band: 'early',
    order,
    name,
    icon,
    activity,
    params,
    masteryGoal,
  }
}

/**
 * Phase 0 trail — exactly these five levels, in order (spec §4).
 * The playable content of Number Meadow.
 */
export const PHASE0_LEVELS: readonly Level[] = [
  level(1, 'Count to 3', '🍎', 'count', { max: 3 }),
  level(2, 'Count to 5', '🐤', 'count', { max: 5 }),
  level(3, 'Count to 10', '⭐', 'count', { max: 10 }),
  level(4, 'Which is more?', '🎈', 'compare', { max: 6 }),
  level(5, 'Add it up', '🍪', 'add', { max: 5 }),
] as const

/** The ordered trail the game actually runs. */
export const TRAIL: readonly Level[] = PHASE0_LEVELS

/** Look up a level by its trail position (1-based). */
export function levelByOrder(order: number): Level | undefined {
  return TRAIL.find((l) => l.order === order)
}

/** Look up a level by id. */
export function levelById(id: string): Level | undefined {
  return TRAIL.find((l) => l.id === id)
}

/** The last position on the trail — used to detect "reached the top". */
export const MAX_ORDER = TRAIL.reduce((m, l) => Math.max(m, l.order), 0)
