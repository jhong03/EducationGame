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
  'word-problem': 90, // a story to hear/read per question
  'graph-count': 90, // blocks to count per question
  'build-graph': 90, // build-and-confirm boards
  'column-op': 90, // multi-digit written method
  volume: 90, // layers of cubes to count per question
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
  // ---- mid band (7–9) — Phase 3 --------------------------------------------
  { id: 'place-value', name: 'Place Value', icon: '🧱', order: 1, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'times-tables', name: 'Times Tables', icon: '✖️', order: 2, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'number-crunch', name: 'Add & Subtract', icon: '➕', order: 3, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'sharing', name: 'Sharing', icon: '🍰', order: 4, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'fractions', name: 'Fractions', icon: '🍕', order: 5, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'measuring', name: 'Measuring', icon: '📐', order: 6, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'time-mid', name: 'Time Master', icon: '⏰', order: 7, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'money-mid', name: 'Money Math', icon: '💰', order: 8, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'data', name: 'Data & Graphs', icon: '📊', order: 9, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'shape-lab', name: 'Shape Lab', icon: '🔺', order: 10, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'detective', name: 'Number Detective', icon: '🕵️', order: 11, band: 'mid', subjectId: MATH_SUBJECT_ID },
  { id: 'stories', name: 'Story Problems', icon: '📖', order: 12, band: 'mid', subjectId: MATH_SUBJECT_ID },
  // ---- upper band (10–12) — Phases 5–6 --------------------------------------
  { id: 'big-numbers', name: 'Big Numbers', icon: '🔢', order: 1, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'decimals-lab', name: 'Decimals', icon: '🔟', order: 2, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'percents', name: 'Percentages', icon: '💯', order: 3, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'below-zero', name: 'Below Zero', icon: '🧊', order: 4, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'angles', name: 'Angles & Mirrors', icon: '📐', order: 5, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'upper-crunch', name: 'Big Calculations', icon: '🧮', order: 6, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'ratios', name: 'Ratios', icon: '⚖️', order: 7, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'averages', name: 'Averages & Chance', icon: '📈', order: 8, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'volume-units', name: 'Volume & Units', icon: '📦', order: 9, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'grid-world', name: 'Grid World', icon: '🗺️', order: 10, band: 'upper', subjectId: MATH_SUBJECT_ID },
  { id: 'puzzle-peak', name: 'Puzzle Peak', icon: '🧗', order: 11, band: 'upper', subjectId: MATH_SUBJECT_ID },
] as const

/** Small helper so the level tables below stay readable and consistent. */
function makeLevel(
  band: Band,
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
    id: `${MATH_SUBJECT_ID}-${band}-${id}`,
    subjectId: MATH_SUBJECT_ID,
    band,
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

const level = (
  id: number,
  categoryId: string,
  order: number,
  name: string,
  icon: string,
  activity: ActivityType,
  params: Record<string, number>,
  masteryGoal?: number,
) => makeLevel('early', id, categoryId, order, name, icon, activity, params, masteryGoal)

const midLevel = (
  id: number,
  categoryId: string,
  order: number,
  name: string,
  icon: string,
  activity: ActivityType,
  params: Record<string, number>,
  masteryGoal?: number,
) => makeLevel('mid', id, categoryId, order, name, icon, activity, params, masteryGoal)

const upperLevel = (
  id: number,
  categoryId: string,
  order: number,
  name: string,
  icon: string,
  activity: ActivityType,
  params: Record<string, number>,
  masteryGoal?: number,
) => makeLevel('upper', id, categoryId, order, name, icon, activity, params, masteryGoal)

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

/**
 * Phase 3 — the mid band (7–9) opens: place value, tables, bare-number
 * arithmetic, sharing/division. Ids live in their own `math-mid-*` space.
 */
export const PHASE3_LEVELS: readonly Level[] = [
  midLevel(1, 'place-value', 1, 'Tens and ones', '🧱', 'place-value', { max: 99 }),
  midLevel(2, 'place-value', 2, 'Hundreds too!', '🏗️', 'place-value', { max: 999 }),
  midLevel(3, 'place-value', 3, 'Round it', '🎯', 'round', { nearest: 10, max: 100 }),
  midLevel(4, 'times-tables', 1, 'Equal groups', '🫐', 'multiply', { tableSet: 1, visual: 1 }),
  midLevel(5, 'times-tables', 2, '×2, ×5, ×10', '✌️', 'multiply', { tableSet: 1 }),
  midLevel(6, 'times-tables', 3, '×3, ×4, ×6', '🎲', 'multiply', { tableSet: 2 }),
  midLevel(7, 'times-tables', 4, 'All the tables!', '🌟', 'multiply', { tableSet: 3 }),
  midLevel(8, 'number-crunch', 1, 'Add within 20', '🐣', 'arith', { op: 0, max: 20 }),
  midLevel(9, 'number-crunch', 2, 'Add within 100', '🦅', 'arith', { op: 0, max: 100 }),
  midLevel(10, 'number-crunch', 3, 'Subtract within 20', '🍂', 'arith', { op: 1, max: 20 }),
  midLevel(11, 'number-crunch', 4, 'Subtract within 100', '🍁', 'arith', { op: 1, max: 100 }),
  midLevel(12, 'sharing', 1, 'Share it out', '🍰', 'share', { max: 20 }),
  midLevel(13, 'sharing', 2, 'Divide it', '➗', 'divide', { tableSet: 1 }),
] as const

/**
 * Mid-band deepening wave (user-directed 2026-07-04: "7–9 is the most
 * important phase") — every existing mid chapter grows and eight NEW chapters
 * open: Fractions, Measuring, Time Master, Money Math, Data & Graphs, Shape
 * Lab, Number Detective, Story Problems.
 */
export const PHASE3B_LEVELS: readonly Level[] = [
  // deepen the first four chapters
  midLevel(14, 'place-value', 4, 'Bigger or smaller?', '⚖️', 'num-compare', { max: 999 }),
  midLevel(15, 'place-value', 5, 'Round to 100', '💯', 'round', { nearest: 100, max: 1000 }),
  midLevel(16, 'times-tables', 5, 'The tricky tables', '🌶️', 'multiply', { tableSet: 4 }),
  midLevel(17, 'number-crunch', 5, 'Big sums', '🏔️', 'arith', { op: 0, max: 1000 }),
  midLevel(18, 'sharing', 3, 'Divide more', '🧁', 'divide', { tableSet: 2 }),
  midLevel(19, 'sharing', 4, 'Left over!', '🍪', 'leftover', {}),
  // Fractions 🍕
  midLevel(20, 'fractions', 1, 'Halves & quarters', '🍕', 'fraction-of', { dens: 1, unit: 1 }),
  midLevel(21, 'fractions', 2, 'One slice', '🍰', 'fraction-of', { dens: 2, unit: 1 }),
  midLevel(22, 'fractions', 3, 'More slices', '🥧', 'fraction-of', { dens: 2, unit: 0 }),
  // Measuring 📐
  midLevel(23, 'measuring', 1, 'Which unit?', '📏', 'unit-pick', {}),
  midLevel(24, 'measuring', 2, 'Count the squares', '🟪', 'grid-rect', { mode: 0 }),
  midLevel(25, 'measuring', 3, 'All the way round', '🚶', 'grid-rect', { mode: 1 }),
  // Time Master ⏰
  midLevel(26, 'time-mid', 1, 'Five past, ten past', '🕔', 'clock', { step: 5 }),
  midLevel(27, 'time-mid', 2, 'How many hours?', '⏳', 'elapsed', {}),
  // Money Math 💰
  midLevel(28, 'money-mid', 1, 'Shopping sums', '🛒', 'money', { mixed: 1, max: 20 }),
  midLevel(29, 'money-mid', 2, 'Give the change', '🧾', 'change', { pay: 10 }),
  // Data & Graphs 📊
  midLevel(30, 'data', 1, 'Read the blocks', '📊', 'graph-count', {}),
  midLevel(31, 'data', 2, 'Most and fewest', '🥇', 'graph-most', {}),
  // Shape Lab 🔺
  midLevel(32, 'shape-lab', 1, 'Count the sides', '📐', 'sides', {}),
  midLevel(33, 'shape-lab', 2, 'Shape detective', '🔍', 'shape-sort', {}),
  // Number Detective 🕵️
  midLevel(34, 'detective', 1, 'Missing number', '❓', 'missing', { op: 0, max: 20 }),
  midLevel(35, 'detective', 2, 'Missing times', '✳️', 'missing', { op: 1 }),
  midLevel(36, 'detective', 3, 'Pattern trails', '👣', 'sequence', { step: 3, max: 40, align: 1 }),
  // Story Problems 📖
  midLevel(37, 'stories', 1, 'Number stories', '📖', 'word-problem', { ops: 1 }),
  midLevel(38, 'stories', 2, 'Times stories', '📚', 'word-problem', { ops: 2 }),
] as const

/**
 * Phase 4 — the mid band's remaining core (CURRICULUM.md §5 Phase 4):
 * the written methods (column add/subtract with a forced carry/borrow),
 * fraction equivalence and same-denominator ops, reading partitioned
 * scales/rulers, and constructing graphs from tallies.
 */
export const PHASE4_LEVELS: readonly Level[] = [
  // Add & Subtract ➕ — the written method
  midLevel(39, 'number-crunch', 6, 'Carry the one', '🧮', 'column-op', { op: 0, max: 100 }),
  midLevel(40, 'number-crunch', 7, 'Borrow ten', '🔄', 'column-op', { op: 1, max: 100 }),
  midLevel(41, 'number-crunch', 8, 'Tower sums', '🗼', 'column-op', { op: 0, max: 1000 }),
  // Fractions 🍕 — equivalence, then same-denominator ops
  midLevel(42, 'fractions', 4, 'Twin fractions', '👯', 'fraction-op', { op: 0 }),
  midLevel(43, 'fractions', 5, 'Add the slices', '🍽️', 'fraction-op', { op: 1 }),
  midLevel(44, 'fractions', 6, 'Slices left', '😋', 'fraction-op', { op: 2 }),
  // Measuring 📐 — read the divisions
  midLevel(45, 'measuring', 4, 'Read the ruler', '🐛', 'read-scale', { max: 10, step: 1, labelEvery: 2, unit: 0 }),
  midLevel(46, 'measuring', 5, 'Weigh it!', '⚖️', 'read-scale', { max: 100, step: 10, labelEvery: 20, unit: 1 }),
  // Data & Graphs 📊 — construct, not just read
  midLevel(47, 'data', 3, 'Tally it up', '🖐️', 'build-graph', { cols: 3, max: 4 }),
  midLevel(48, 'data', 4, 'Build the graph', '🧱', 'build-graph', { cols: 4, max: 5 }),
] as const

/**
 * Phases 5–6 — the upper band (10–12) opens, removing the last "still
 * growing" fallback: big numbers, decimals & percentages, negatives, angles
 * & symmetry, short multiplication & order of operations, ratio, averages &
 * chance, unit conversion & volume, coordinates, two-step stories.
 * Ids live in their own `math-upper-*` space.
 */
export const PHASE56_LEVELS: readonly Level[] = [
  // Big Numbers 🔢
  upperLevel(1, 'big-numbers', 1, 'Find the number', '🔢', 'find-number', {}),
  upperLevel(2, 'big-numbers', 2, 'Round to 1000', '🎯', 'round', { nearest: 1000, max: 10000 }),
  upperLevel(3, 'big-numbers', 3, 'Bigger number', '⚖️', 'num-compare', { max: 9999 }),
  upperLevel(4, 'big-numbers', 4, 'Count in thousands', '🚀', 'sequence', { step: 1000, max: 10000, align: 1 }),
  // Decimals 🔟
  upperLevel(5, 'decimals-lab', 1, 'Tenths', '🔟', 'decimal', { den: 10 }),
  upperLevel(6, 'decimals-lab', 2, 'Hundredths', '💠', 'decimal', { den: 100 }),
  upperLevel(7, 'decimals-lab', 3, 'Fraction twins', '👯', 'equiv-pick', { mode: 0 }),
  upperLevel(8, 'decimals-lab', 4, 'Percent twins', '🎭', 'equiv-pick', { mode: 1 }),
  // Percentages 💯
  upperLevel(9, 'percents', 1, 'Easy percents', '💯', 'percent-of', { set: 1 }),
  upperLevel(10, 'percents', 2, 'Trickier percents', '🌶️', 'percent-of', { set: 2 }),
  // Below Zero 🧊
  upperLevel(11, 'below-zero', 1, 'The number line', '🧊', 'negatives', { mode: 0, max: 10 }),
  upperLevel(12, 'below-zero', 2, 'Past zero', '🥶', 'negatives', { mode: 1, max: 10 }),
  upperLevel(13, 'below-zero', 3, 'Warmer or colder?', '🌡️', 'num-compare', { max: 10, neg: 1 }),
  // Angles & Mirrors 📐
  upperLevel(14, 'angles', 1, 'Right angles', '📐', 'angle', { mode: 0 }),
  upperLevel(15, 'angles', 2, 'Sharp or wide', '✂️', 'angle', { mode: 1 }),
  upperLevel(16, 'angles', 3, 'Mirror lines', '🪞', 'symmetry', {}),
  // Big Calculations 🧮
  upperLevel(17, 'upper-crunch', 1, 'Column times', '✖️', 'column-op', { op: 2, max: 100 }),
  upperLevel(18, 'upper-crunch', 2, 'Bigger times', '🚂', 'column-op', { op: 2, max: 1000 }),
  upperLevel(19, 'upper-crunch', 3, 'Times before plus', '🚦', 'order-ops', { brackets: 0 }),
  upperLevel(20, 'upper-crunch', 4, 'Brackets first', '🎪', 'order-ops', { brackets: 1 }),
  // Ratios ⚖️
  upperLevel(21, 'ratios', 1, 'For every…', '⚖️', 'ratio', {}),
  upperLevel(22, 'ratios', 2, 'Recipe scaling', '🧑‍🍳', 'ratio', { big: 1 }),
  // Averages & Chance 📈
  upperLevel(23, 'averages', 1, 'The mean', '📈', 'mean', { count: 3 }),
  upperLevel(24, 'averages', 2, 'Mean of four', '📊', 'mean', { count: 4 }),
  upperLevel(25, 'averages', 3, 'What are the chances?', '🎲', 'chance', {}),
  // Volume & Units 📦
  upperLevel(26, 'volume-units', 1, 'Unit hops', '🦘', 'convert', {}),
  upperLevel(27, 'volume-units', 2, 'Stack the cubes', '🧱', 'volume', {}),
  // Grid World 🗺️
  upperLevel(28, 'grid-world', 1, 'Treasure map', '🗺️', 'coord', { size: 5 }),
  // Puzzle Peak 🧗
  upperLevel(29, 'puzzle-peak', 1, 'Two-step stories', '🪜', 'word-problem', { ops: 3 }),
  upperLevel(30, 'puzzle-peak', 2, 'Times-story twists', '🌀', 'word-problem', { ops: 4 }),
] as const

/** Every playable level, flat (ParentView totals, tests). */
export const TRAIL: readonly Level[] = [
  ...PHASE0_LEVELS,
  ...PHASE1_LEVELS,
  ...PHASE2_LEVELS,
  ...EXPANSION_LEVELS,
  ...PHASE3_LEVELS,
  ...PHASE3B_LEVELS,
  ...PHASE4_LEVELS,
  ...PHASE56_LEVELS,
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
