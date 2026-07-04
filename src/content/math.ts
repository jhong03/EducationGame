import type { ActivityType, Band, Category, Level } from '../engine/types'

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

/**
 * Sprint round lengths (seconds) by activity — the "suitable timeframe" per
 * level. Heavier interactions (flash cycles, per-group counting, build-and-
 * confirm) get the longer round; quick tap-and-answer forms get the short one.
 * Early-band sprints display time AMBIENTLY (no countdown numerals) and always
 * end in celebration — the clock shapes the round, never punishes the child.
 */
const DEFAULT_SPRINT_SECONDS = 60
const SPRINT_SECONDS_BY_ACTIVITY: Partial<Record<ActivityType, number>> = {
  subitize: 90, // flash → recall cycles
  match: 90, // three piles to count per question
  'who-left': 90, // memory flash per question
  'make-amount': 90, // build-and-confirm
  'set-clock': 90, // turn-and-confirm
  'tap-all': 90, // multi-find boards
}

/** The sprint round length for a level (content data, per-activity default). */
function sprintSecondsFor(activity: ActivityType): number {
  return SPRINT_SECONDS_BY_ACTIVITY[activity] ?? DEFAULT_SPRINT_SECONDS
}

/**
 * The skill categories a child picks from on the home screen. One category per
 * strand (see CURRICULUM.md §2) — the curriculum's strands ARE the navigation.
 * Categories are always open; levels gate sequentially inside each.
 */
export const CATEGORIES: readonly Category[] = [
  { id: 'counting', name: 'Counting', icon: '🍎', order: 1, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'comparing', name: 'More or Less', icon: '🎈', order: 2, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'adding', name: 'Adding Up', icon: '🍪', order: 3, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'taking-away', name: 'Taking Away', icon: '🐸', order: 4, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'shapes', name: 'Shapes', icon: '🔷', order: 5, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'patterns', name: 'Patterns', icon: '🧩', order: 6, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'time', name: 'Clock Time', icon: '🕐', order: 7, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'money', name: 'Money', icon: '🪙', order: 8, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'puzzle-grove', name: 'Puzzle Grove', icon: '🦉', order: 9, band: 'early', subjectId: MATH_SUBJECT_ID },
  { id: 'big-small', name: 'Big & Small', icon: '📏', order: 10, band: 'early', subjectId: MATH_SUBJECT_ID },
] as const

/** Small helper so the level table below stays readable and consistent. */
function level(
  id: number, // stable numeric suffix — NEVER renumber; persisted progress is keyed on it
  categoryId: string,
  order: number, // position within the category
  name: string,
  icon: string,
  activity: ActivityType,
  params: Record<string, number>,
  masteryGoal = DEFAULT_MASTERY_GOAL,
): Level {
  return {
    id: `${MATH_SUBJECT_ID}-early-${id}`,
    subjectId: MATH_SUBJECT_ID,
    band: 'early',
    categoryId,
    order,
    name,
    icon,
    activity,
    params,
    masteryGoal,
    sprintSeconds: sprintSecondsFor(activity),
  }
}

/**
 * Phase 0 levels (spec §4), organised into categories. The ids keep their
 * original trail numbering (`math-early-1..5`) — ids are the persistence key,
 * so they are stable forever regardless of how categories are re-shaped.
 */
export const PHASE0_LEVELS: readonly Level[] = [
  level(1, 'counting', 1, 'Count to 3', '🍎', 'count', { max: 3 }),
  level(2, 'counting', 2, 'Count to 5', '🐤', 'count', { max: 5 }),
  level(3, 'counting', 3, 'Count to 10', '⭐', 'count', { max: 10 }),
  level(4, 'comparing', 1, 'Which is more?', '🎈', 'compare', { max: 6 }),
  level(5, 'adding', 1, 'Add it up', '🍪', 'add', { max: 5 }),
] as const

/**
 * Phase 1 — finishes the early band's number sense (CURRICULUM.md §5 Phase 1,
 * approved 2026-07-04): subitizing, numeral↔quantity, counting on to 20,
 * add within 10, and a new Taking Away (subtract) category. Ids continue from
 * Phase 0 — never reuse or renumber.
 */
export const PHASE1_LEVELS: readonly Level[] = [
  level(6, 'counting', 4, 'Quick peek!', '👀', 'subitize', { max: 5, flashMs: 1800 }),
  level(7, 'counting', 5, 'Find the number', '🐠', 'match', { max: 10 }),
  level(8, 'counting', 6, 'What comes next?', '🐛', 'sequence', { max: 20 }),
  level(9, 'adding', 2, 'Add to 10', '🌸', 'add', { max: 10 }),
  level(10, 'taking-away', 1, 'Take away', '🐸', 'subtract', { max: 5 }),
  level(11, 'taking-away', 2, 'Take away more', '🦋', 'subtract', { max: 10 }),
] as const

/**
 * Phase 2 — the early band's "variety layer" (CURRICULUM.md §5 Phase 2):
 * shapes, patterns, clock time, and money (with the currency seam).
 */
export const PHASE2_LEVELS: readonly Level[] = [
  level(12, 'shapes', 1, 'Find the shape', '🔷', 'shape-id', { pool: 4 }),
  level(13, 'shapes', 2, 'More shapes', '💜', 'shape-id', { pool: 6 }),
  level(14, 'patterns', 1, 'Copy the pattern', '🧩', 'pattern', { kinds: 1 }),
  level(15, 'patterns', 2, 'Trickier patterns', '🎀', 'pattern', { kinds: 3 }),
  level(16, 'time', 1, "O'clock", '🕐', 'clock', { step: 60 }),
  level(17, 'time', 2, 'Half past', '🕜', 'clock', { step: 30 }),
  level(18, 'money', 1, 'Count the coins', '🪙', 'money', { mixed: 0, max: 5 }),
  level(19, 'money', 2, 'Coins together', '💰', 'money', { mixed: 1, max: 10 }),
  // Puzzle Grove — strand L's opening (locked decision #5: its own category).
  level(20, 'puzzle-grove', 1, 'Odd one out', '🦉', 'odd-one-out', { choices: 4 }),
  level(21, 'puzzle-grove', 2, 'Shadow match', '🌙', 'shadow-match', { choices: 3 }),
] as const

/**
 * Early-band expansion wave (approved 2026-07-04): deepens every category,
 * grows Puzzle Grove, opens Big & Small 📏, and adds the three interaction
 * upgrades (make-amount, set-clock, tap-all). Ids continue — never renumber.
 */
export const EXPANSION_LEVELS: readonly Level[] = [
  // A · deepen the categories
  level(22, 'counting', 7, 'Count down!', '🚀', 'sequence', { step: -1, max: 10 }),
  level(23, 'counting', 8, 'Count by tens', '🔟', 'sequence', { step: 10, max: 100, align: 1 }),
  level(24, 'counting', 9, 'None at all!', '🍽️', 'count', { max: 3, allowZero: 1 }),
  level(25, 'counting', 10, 'One more, one fewer', '🐿️', 'one-more', { max: 5 }),
  level(26, 'comparing', 2, 'Which has fewer?', '🐟', 'compare', { max: 6, fewer: 1 }),
  level(27, 'comparing', 3, 'Same or not?', '🟰', 'same-or-not', { max: 5 }),
  level(28, 'comparing', 4, 'Bigger number', '🔢', 'num-compare', { max: 10 }),
  level(29, 'adding', 3, 'Doubles!', '👯', 'add', { max: 10, doubles: 1 }),
  level(30, 'adding', 4, 'Make 5', '🖐️', 'bond', { target: 5 }),
  level(31, 'adding', 5, 'Make 10', '🙌', 'bond', { target: 10 }),
  level(32, 'taking-away', 3, 'All gone!', '🫧', 'subtract', { max: 5, allowZero: 1 }),
  level(33, 'shapes', 3, 'How many sides?', '📐', 'sides', {}),
  level(34, 'patterns', 3, 'Three-part patterns', '🎀', 'pattern', { kinds: 4 }),
  level(35, 'money', 3, 'Worth more?', '🤑', 'coin-compare', {}),
  // B · reasoning & variety
  level(36, 'puzzle-grove', 3, 'Who left?', '🫥', 'who-left', { count: 3 }),
  level(37, 'puzzle-grove', 4, 'Which belongs?', '🧺', 'belongs', {}),
  level(38, 'puzzle-grove', 5, 'First, middle, last', '🚦', 'position', {}),
  level(39, 'puzzle-grove', 6, 'Spot the big one', '🔍', 'odd-one-out', { choices: 4, size: 1 }),
  level(40, 'time', 3, 'Morning or night?', '🌅', 'day-time', {}),
  // C · Big & Small 📏
  level(41, 'big-small', 1, 'Big or small', '🐘', 'size-compare', {}),
  level(42, 'big-small', 2, 'Tall or short', '🗼', 'height-compare', { max: 6 }),
  level(43, 'big-small', 3, 'Heavy or light', '🪶', 'weight-compare', {}),
  // D · interaction upgrades
  level(44, 'money', 4, 'Make the amount', '🛍️', 'make-amount', { max: 8 }),
  level(45, 'time', 4, 'Set the clock', '⏰', 'set-clock', {}),
  level(46, 'shapes', 4, 'Find them all!', '🔎', 'tap-all', { board: 6 }),
] as const

/** Every playable level, flat (ParentView totals, tests). */
export const TRAIL: readonly Level[] = [
  ...PHASE0_LEVELS,
  ...PHASE1_LEVELS,
  ...PHASE2_LEVELS,
  ...EXPANSION_LEVELS,
]

/** Look up a category by id. */
export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

/** The categories belonging to one age band, in home-screen order. */
export function categoriesForBand(band: Band): Category[] {
  return CATEGORIES.filter((c) => c.band === band).sort((a, b) => a.order - b.order)
}

/** A category's levels, sorted by their in-category order. */
export function levelsInCategory(categoryId: string): Level[] {
  return TRAIL.filter((l) => l.categoryId === categoryId).sort(
    (a, b) => a.order - b.order,
  )
}

/** Look up a level by id. */
export function levelById(id: string): Level | undefined {
  return TRAIL.find((l) => l.id === id)
}

/**
 * The level after this one within the same category, if any. Tolerates gaps in
 * `order` numbering (finds the next-higher order, not exactly order+1), so a
 * future content edit can't make ClearedScreen falsely announce "finished".
 */
export function nextLevelAfter(level: Level): Level | undefined {
  return levelsInCategory(level.categoryId).find((l) => l.order > level.order)
}
