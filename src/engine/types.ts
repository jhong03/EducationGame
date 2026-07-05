/**
 * Engine types — the subject-agnostic contract.
 *
 * IMPORTANT: nothing in this file (or anywhere in engine/) knows what "adding"
 * or "counting" *means*. It only knows there are activities identified by a
 * string, each with a generator that turns params into a Question. All the
 * math lives in content/ and generators/. Keep it that way: if you find
 * yourself writing subject vocabulary in the game loop, move it into content.
 */

/** Age bands. Phase 0 ships `early` only. */
export type Band = 'early' | 'mid' | 'upper' // 4–6, 7–9, 10–12

/**
 * Activity kinds the engine can render. Adding a subject means adding entries
 * here plus a generator + renderer — never touching the game loop.
 */
export type ActivityType =
  | 'count'
  | 'compare'
  | 'add'
  | 'subitize'
  | 'match'
  | 'sequence'
  | 'subtract'
  | 'shape-id'
  | 'pattern'
  | 'clock'
  | 'money'
  | 'odd-one-out'
  | 'shadow-match'
  | 'one-more'
  | 'same-or-not'
  | 'num-compare'
  | 'bond'
  | 'sides'
  | 'coin-compare'
  | 'who-left'
  | 'belongs'
  | 'position'
  | 'day-time'
  | 'size-compare'
  | 'height-compare'
  | 'weight-compare'
  | 'make-amount'
  | 'set-clock'
  | 'tap-all'
  // mid band (7–9)
  | 'place-value'
  | 'round'
  | 'multiply'
  | 'divide'
  | 'share'
  | 'arith'
  | 'fraction-of'
  | 'unit-pick'
  | 'grid-rect'
  | 'elapsed'
  | 'change'
  | 'graph-count'
  | 'graph-most'
  | 'shape-sort'
  | 'missing'
  | 'leftover'
  | 'word-problem'
  // mid band — Phase 4 (fraction ops, scales, graph building, written methods)
  | 'fraction-op'
  | 'read-scale'
  | 'build-graph'
  | 'column-op'
  // upper band — Phases 5–6
  | 'find-number'
  | 'decimal'
  | 'equiv-pick'
  | 'percent-of'
  | 'negatives'
  | 'angle'
  | 'symmetry'
  | 'order-ops'
  | 'ratio'
  | 'mean'
  | 'chance'
  | 'convert'
  | 'volume'
  | 'coord'
  // upper band — age-tier deepening (11+/12+ rungs)
  | 'angle-sum'
  | 'riddle'
  | 'chance-frac'

/**
 * A skill strand a child picks from on the home screen (e.g. "Counting").
 * Categories are always open; progression is gated level-by-level *within* one.
 */
export interface Category {
  id: string
  subjectId: string // 'math'
  band: Band
  order: number // display position on the home screen (1-based)
  name: string // short + speakable, e.g. "Counting"
  icon: string // emoji shown on the category card
}

/** One rung on a subject's skill ladder. */
export interface Level {
  id: string
  subjectId: string // 'math'
  band: Band
  categoryId: string // the strand this level belongs to
  order: number // position within its category (1-based, contiguous)
  name: string // short, e.g. "Count to 5"
  icon: string // emoji shown on the level tile
  activity: ActivityType
  params: Record<string, number> // e.g. { max: 5 }
  masteryGoal: number // correct answers needed to clear (default 3)
  /**
   * Sprint-mode round length in seconds (content data — defaulted per
   * activity's interaction weight, overridable per level). Sprint unlocks
   * once the level is MASTERED; it never replaces the mastery gate.
   */
  sprintSeconds: number
  /**
   * Minimum age (within the band) that SEES this rung on the map — how one
   * band serves meaningfully different ladders to each age (10/11/12).
   * Age-gated rungs always sit at the TOP of their category ladder (minAge
   * non-decreasing along `order`, test-enforced), so every age's visible
   * ladder is a prefix and derived unlock works unchanged. Absent = every
   * age in the band. A cleared rung stays cleared if the age changes.
   */
  minAge?: number
}

/** A drawable, countable, universally-recognizable object type. */
export interface Theme {
  id: string
  singular: string // "apple"  — for prompts/labels
  plural: string // "apples"  — irregulars stored, never guessed
  emoji: string // "🍎"
}

/** A pile of `count` objects, all of one theme. The atom the UI renders. */
export interface ObjectGroup {
  theme: Theme
  count: number
}

interface BaseQuestion {
  id: string
  prompt: string // spoken aloud via the AudioManager
  activity: ActivityType
}

/** "How many apples?" — one group, answer via number buttons. */
export interface CountQuestion extends BaseQuestion {
  activity: 'count'
  payload: { group: ObjectGroup }
  options: number[] // exactly one equals `answer`, shuffled
  answer: number
}

/** "Which has more?" — two groups, answer by tapping a side. */
export interface CompareQuestion extends BaseQuestion {
  activity: 'compare'
  payload: { left: ObjectGroup; right: ObjectGroup }
  answer: 'left' | 'right' // the side with more objects
}

/** "How many altogether?" — two groups, answer via number buttons. */
export interface AddQuestion extends BaseQuestion {
  activity: 'add'
  payload: { left: ObjectGroup; right: ObjectGroup }
  options: number[] // exactly one equals `answer`, shuffled
  answer: number
}

/**
 * "How many did you see?" — the group flashes for `flashMs` then hides, so the
 * child recognises the quantity at a glance instead of counting one by one.
 */
export interface SubitizeQuestion extends BaseQuestion {
  activity: 'subitize'
  payload: { group: ObjectGroup; flashMs: number }
  options: number[] // exactly one equals `answer`, shuffled
  answer: number
}

/**
 * "Find seven!" — a big numeral + spoken word; the child taps the group with
 * that many objects (numeral ↔ quantity). `answer` is the index into `groups`.
 */
export interface MatchQuestion extends BaseQuestion {
  activity: 'match'
  payload: { target: number; groups: ObjectGroup[] } // exactly one has `target`
  options: number[] // the group indices [0..n-1]; exactly one equals `answer`
  answer: number // index of the matching group
}

/** "What comes next?" — a short run of numbers, then a blank. */
export interface SequenceQuestion extends BaseQuestion {
  activity: 'sequence'
  payload: { shown: number[] } // e.g. [4, 5, 6] → answer 7
  options: number[] // exactly one equals `answer`, shuffled
  answer: number
}

/** "How many are left?" — a group where `taken` objects go away. */
export interface SubtractQuestion extends BaseQuestion {
  activity: 'subtract'
  payload: { group: ObjectGroup; taken: number } // 1 ≤ taken < group.count
  options: number[] // exactly one equals `answer`, shuffled
  answer: number // group.count - taken
}

/** "Find the circle!" — one card per shape; the tapped INDEX is the answer. */
export interface ShapeQuestion extends BaseQuestion {
  activity: 'shape-id'
  payload: { shapeIds: string[]; targetId: string } // exactly one matches
  options: number[] // card indices; exactly one equals `answer`
  answer: number
}

/** "What comes next?" — a repeating motif run, then a blank. */
export interface PatternQuestion extends BaseQuestion {
  activity: 'pattern'
  payload: { sequence: string[]; optionMotifs: string[] } // emoji motifs
  options: number[] // indices into optionMotifs; exactly one correct
  answer: number
}

/** "What time is it?" — read an analog clock, pick the matching time. */
export interface ClockQuestion extends BaseQuestion {
  activity: 'clock'
  payload: {
    hour: number // 1..12
    minute: number // 0 | 30 for the early band
    choices: Array<{ hour: number; minute: number }> // exactly one matches
  }
  options: number[] // indices into choices
  answer: number
}

/** "How much money?" — coins to count/add; answer is the total value. */
export interface MoneyQuestion extends BaseQuestion {
  activity: 'money'
  payload: { coins: number[] } // coin values, e.g. [1,1,1] or [2,5]
  options: number[] // candidate totals; exactly one equals `answer`
  answer: number
}

/** "Which one is different?" — several alike, one odd; tap the odd one.
 *  In size mode the odd one is the same thing rendered at `scale`. */
export interface OddOneOutQuestion extends BaseQuestion {
  activity: 'odd-one-out'
  payload: { items: Array<{ emoji: string; name: string; scale?: number }> }
  options: number[] // item indices; exactly one equals `answer`
  answer: number
}

/** "Which one made this shadow?" — a silhouette + candidate objects. */
export interface ShadowMatchQuestion extends BaseQuestion {
  activity: 'shadow-match'
  payload: {
    targetEmoji: string // rendered as a silhouette
    choices: Array<{ emoji: string; name: string }> // exactly one matches
  }
  options: number[] // choice indices
  answer: number
}

/** A pickable thing with a spoken name (cards, scenes, vanished friends…). */
export interface NamedItem {
  emoji: string
  name: string
}

/** "One more / one fewer than these?" — a group plus a ±1 question. */
export interface OneMoreQuestion extends BaseQuestion {
  activity: 'one-more'
  payload: { group: ObjectGroup; delta: 1 | -1 }
  options: number[]
  answer: number
}

/** "Are they the same?" — two groups; answer 1 = same amount, 0 = not. */
export interface SameOrNotQuestion extends BaseQuestion {
  activity: 'same-or-not'
  payload: { left: ObjectGroup; right: ObjectGroup }
  options: number[] // [1, 0]
  answer: number
}

/** "Which number is bigger?" — two numerals; tap a side. */
export interface NumCompareQuestion extends BaseQuestion {
  activity: 'num-compare'
  payload: { left: number; right: number }
  answer: 'left' | 'right'
}

/** "3 and how many more make 5?" — missing addend to a target. */
export interface BondQuestion extends BaseQuestion {
  activity: 'bond'
  payload: { group: ObjectGroup; target: number }
  options: number[]
  answer: number
}

/** "How many sides?" — one shape; count its sides. */
export interface SidesQuestion extends BaseQuestion {
  activity: 'sides'
  payload: { shapeId: string }
  options: number[]
  answer: number
}

/** "Which coin is worth more?" — two coin values; tap a side. */
export interface CoinCompareQuestion extends BaseQuestion {
  activity: 'coin-compare'
  payload: { left: number; right: number }
  answer: 'left' | 'right'
}

/** Friends flash, one leaves — "who went away?" (memory). */
export interface WhoLeftQuestion extends BaseQuestion {
  activity: 'who-left'
  payload: { items: NamedItem[]; missing: number; flashMs: number }
  options: number[] // indices into items
  answer: number // === missing
}

/** "Which one belongs with these?" — sorting by kind. */
export interface BelongsQuestion extends BaseQuestion {
  activity: 'belongs'
  payload: { shown: NamedItem[]; choices: NamedItem[] }
  options: number[]
  answer: number
}

/** "Tap the first / middle / last one" — positional language. */
export interface PositionQuestion extends BaseQuestion {
  activity: 'position'
  payload: { items: NamedItem[]; target: 'first' | 'middle' | 'last' }
  options: number[]
  answer: number
}

/** "Tap the morning / night one" — times of day as scenes. */
export interface DayTimeQuestion extends BaseQuestion {
  activity: 'day-time'
  payload: { scenes: NamedItem[]; targetName: string }
  options: number[]
  answer: number
}

/** "Tap the big / small one" — one thing, two sizes. */
export interface SizeCompareQuestion extends BaseQuestion {
  activity: 'size-compare'
  payload: { item: NamedItem; bigSide: 'left' | 'right'; target: 'big' | 'small' }
  answer: 'left' | 'right'
}

/** "Which is taller / shorter?" — two block towers. */
export interface HeightCompareQuestion extends BaseQuestion {
  activity: 'height-compare'
  payload: { left: number; right: number; target: 'tall' | 'short' } // block counts
  answer: 'left' | 'right'
}

/** "Which is heavier / lighter?" — a real-world weight pair. */
export interface WeightCompareQuestion extends BaseQuestion {
  activity: 'weight-compare'
  payload: { left: NamedItem; right: NamedItem; target: 'heavy' | 'light' }
  answer: 'left' | 'right'
}

/** "Make 6!" — tap coins to build the target, then confirm. */
export interface MakeAmountQuestion extends BaseQuestion {
  activity: 'make-amount'
  payload: { coinCount: number; target: number } // unit coins on the table
  options: number[]
  answer: number // === target
}

/** "Make it 4 o'clock!" — turn the clock's hand to the target hour. */
export interface SetClockQuestion extends BaseQuestion {
  activity: 'set-clock'
  payload: { targetHour: number; startHour: number }
  options: number[]
  answer: number // === targetHour
}

/** "Tap ALL the circles!" — find every target shape on the board. */
export interface TapAllQuestion extends BaseQuestion {
  activity: 'tap-all'
  payload: { shapeIds: string[]; targetId: string; count: number }
  options: number[]
  answer: number // === count (submitted when all are found)
}

// ---- Mid band (7–9) --------------------------------------------------------

/** "What number do the blocks show?" — base-ten blocks to read. */
export interface PlaceValueQuestion extends BaseQuestion {
  activity: 'place-value'
  payload: { value: number } // hundreds/tens/ones derived at render
  options: number[] // includes the classic digit-swap distractor
  answer: number
}

/** "Round 47 to the nearest ten!" */
export interface RoundQuestion extends BaseQuestion {
  activity: 'round'
  payload: { value: number; nearest: number }
  options: number[]
  answer: number
}

/** "3 groups of 5 — how many?" (visual) or "3 × 5?" (numeric). */
export interface MultiplyQuestion extends BaseQuestion {
  activity: 'multiply'
  payload: { a: number; b: number; visual: boolean; theme: Theme }
  options: number[] // distractors are ADJACENT table entries ((a±1)·b)
  answer: number
}

/** "15 ÷ 5?" — division facts, always exact. */
export interface DivideQuestion extends BaseQuestion {
  activity: 'divide'
  payload: { n: number; b: number }
  options: number[]
  answer: number
}

/** "12 strawberries shared between 3 plates — how many each?" */
export interface ShareQuestion extends BaseQuestion {
  activity: 'share'
  payload: { total: number; plates: number; theme: Theme }
  options: number[]
  answer: number
}

/** "17 + 8?" / "23 − 6?" — bare-number arithmetic (mid band). */
export interface ArithQuestion extends BaseQuestion {
  activity: 'arith'
  payload: { a: number; b: number; op: '+' | '-' }
  options: number[]
  answer: number
}

/** "What fraction is shaded?" — a partitioned bar; pick the fraction card. */
export interface FractionOfQuestion extends BaseQuestion {
  activity: 'fraction-of'
  payload: { num: number; den: number; optionLabels: string[] } // e.g. "3/4"
  options: number[] // indices into optionLabels
  answer: number
}

/** "Which unit for measuring a pencil?" — pick cm/m/kg/… */
export interface UnitPickQuestion extends BaseQuestion {
  activity: 'unit-pick'
  payload: { object: NamedItem; unitLabels: string[] }
  options: number[]
  answer: number
}

/** Count the squares inside (area) or the steps around (perimeter). */
export interface GridRectQuestion extends BaseQuestion {
  activity: 'grid-rect'
  payload: { w: number; h: number; mode: 'area' | 'perimeter' }
  options: number[]
  answer: number
}

/** "From 3 o'clock to 7 o'clock — how many hours?" (two clock faces). */
export interface ElapsedQuestion extends BaseQuestion {
  activity: 'elapsed'
  payload: { startHour: number; endHour: number }
  options: number[]
  answer: number
}

/** "It costs 7. You pay 10. How much change?" */
export interface ChangeQuestion extends BaseQuestion {
  activity: 'change'
  payload: { price: number; paid: number }
  options: number[]
  answer: number
}

/** A block graph; either count one column… */
export interface GraphCountQuestion extends BaseQuestion {
  activity: 'graph-count'
  payload: { items: Array<NamedItem & { value: number }>; targetIndex: number }
  options: number[]
  answer: number // the target column's value
}

/** …or tap the column with the most. */
export interface GraphMostQuestion extends BaseQuestion {
  activity: 'graph-most'
  payload: { items: Array<NamedItem & { value: number }> }
  options: number[] // column indices
  answer: number // index of the (unique) tallest
}

/** "Tap the shape with 5 sides!" — property sorting. */
export interface ShapeSortQuestion extends BaseQuestion {
  activity: 'shape-sort'
  payload: { shapeIds: string[]; targetSides: number }
  options: number[]
  answer: number
}

/** "□ + 3 = 7" — the missing number (F4, early algebra). */
export interface MissingQuestion extends BaseQuestion {
  activity: 'missing'
  payload: { text: string } // rendered with □ in place
  options: number[]
  answer: number
}

/** "17 shared between 5 — how many left over?" (remainders). */
export interface LeftoverQuestion extends BaseQuestion {
  activity: 'leftover'
  payload: { n: number; b: number }
  options: number[]
  answer: number
}

/** A one-step story problem, spoken and shown. */
export interface WordProblemQuestion extends BaseQuestion {
  activity: 'word-problem'
  payload: { story: string }
  options: number[]
  answer: number
}

// ---- Mid band — Phase 4 ----------------------------------------------------

/**
 * Fractions beyond reading a bar (E3/E4): `op: 'same'` asks for the equivalent
 * fraction of the shaded bar; `'add'`/`'sub'` combine two same-denominator
 * bars. Answers are fraction cards, so `answer` is an index into
 * `optionLabels` (like fraction-of).
 */
export interface FractionOpQuestion extends BaseQuestion {
  activity: 'fraction-op'
  payload: {
    op: 'same' | 'add' | 'sub'
    aNum: number // shaded pieces in the (first) bar
    bNum: number // second bar's shading for add/sub; 0 for 'same'
    den: number
    optionLabels: string[] // e.g. "5/8"
  }
  options: number[] // indices into optionLabels
  answer: number
}

/** Read a partitioned scale/ruler (H3/H4) — the pointer sits on a tick that
 *  is deliberately NOT labeled, so the child works along the divisions. */
export interface ReadScaleQuestion extends BaseQuestion {
  activity: 'read-scale'
  payload: {
    max: number // scale end (starts at 0)
    step: number // minor tick spacing — the unit being read
    labelEvery: number // labeled-tick spacing (a multiple of step)
    value: number // where the pointer points
    unit: string // display label, e.g. 'cm'
  }
  options: number[] // all plausible tick values
  answer: number
}

/** Build the block graph to match the tallies (K3), then confirm. The built
 *  column heights are digit-encoded ([2,3,1] → 231) so one number carries the
 *  whole board through the ordinary answer path. */
export interface BuildGraphQuestion extends BaseQuestion {
  activity: 'build-graph'
  payload: {
    items: Array<NamedItem & { value: number }> // target height per column
    maxHeight: number // tallest buildable column (≤ 9 so encoding is unambiguous)
  }
  options: number[]
  answer: number // digit-encoded target heights
}

/** Column addition/subtraction/multiplication (C4/C5/D7) — the written
 *  method, with a carry or borrow always forced (without one it's just
 *  `arith` again). `'×'` is short multiplication: 2-digit × 1-digit. */
export interface ColumnOpQuestion extends BaseQuestion {
  activity: 'column-op'
  payload: { a: number; b: number; op: '+' | '-' | '×' }
  options: number[] // includes the forgot-the-carry / digit-flip classics
  answer: number
}

// ---- Upper band — Phases 5–6 -----------------------------------------------

/** "Find four thousand two hundred six!" — the prompt shows the WORDS,
 *  the buttons show numerals (B5: read big numbers). Decoys are digit swaps. */
export interface FindNumberQuestion extends BaseQuestion {
  activity: 'find-number'
  payload: { value: number }
  options: number[]
  answer: number
}

/** A shaded tenths bar or hundredths grid → pick the decimal card (E5).
 *  The classic 0.7-vs-0.07 misread is always among the cards. */
export interface DecimalQuestion extends BaseQuestion {
  activity: 'decimal'
  payload: { num: number; den: 10 | 100; optionLabels: string[] }
  options: number[] // indices into optionLabels
  answer: number
}

/** "Which is the same as 1/2?" — fraction ↔ decimal ↔ percent cards (E6). */
export interface EquivPickQuestion extends BaseQuestion {
  activity: 'equiv-pick'
  payload: { shown: string; optionLabels: string[] }
  options: number[] // indices into optionLabels
  answer: number
}

/** "What is 50% of 40?" — percentages of amounts, always whole answers (E8). */
export interface PercentOfQuestion extends BaseQuestion {
  activity: 'percent-of'
  payload: { pct: number; of: number }
  options: number[]
  answer: number
}

/** The −max..max number line (B7): read the arrow (mode 0), work an
 *  expression that lands below zero (`expr` set, mode 1/3), or find the GAP
 *  between two marked temperatures (`marks` set, mode 2 — `value` is then
 *  the distance, not a line position). */
export interface NegativesQuestion extends BaseQuestion {
  activity: 'negatives'
  payload: {
    min: number
    max: number
    value: number
    expr?: string
    marks?: [number, number] // the two dots for gap mode
  }
  options: number[]
  answer: number // === value
}

/** Tap the right/acute/obtuse angle (J5/J6) — drawn, never labeled. */
export interface AngleQuestion extends BaseQuestion {
  activity: 'angle'
  payload: { degrees: number[]; target: 'right' | 'acute' | 'obtuse' }
  options: number[] // card indices
  answer: number
}

/** "How many mirror lines?" — lines of symmetry for a drawn shape (J4). */
export interface SymmetryQuestion extends BaseQuestion {
  activity: 'symmetry'
  payload: { shapeId: string }
  options: number[]
  answer: number
}

/** "2 + 3 × 4?" — order of operations; the trap is left-to-right (F6). */
export interface OrderOpsQuestion extends BaseQuestion {
  activity: 'order-ops'
  payload: { text: string }
  options: number[]
  answer: number
}

/** "2 🍎 for every 3 🐟 — 6 🍎 means how many 🐟?" — scale a ratio (E9).
 *  Share mode (`total` set): "{total} altogether — how many 🍎?" */
export interface RatioQuestion extends BaseQuestion {
  activity: 'ratio'
  payload: {
    a: number
    b: number
    scaledA: number
    aEmoji: string
    bEmoji: string
    aName: string // plural
    bName: string // plural
    total?: number // share mode: the combined pile being split
  }
  options: number[]
  answer: number // scaled partner count, or the a-side share in share mode
}

/** "Scores 3, 5, 7 — what is the mean?" (K5). The sum is always a decoy.
 *  Missing mode: the mean is GIVEN and one score is hidden — find it. */
export interface MeanQuestion extends BaseQuestion {
  activity: 'mean'
  payload: {
    values: number[] // complete; the renderer masks `hiddenIndex`
    hiddenIndex?: number
    mean?: number // spoken/shown in missing mode
  }
  options: number[]
  answer: number
}

/** "You roll a seven on a normal dice — certain, maybe or impossible?" (K7). */
export interface ChanceQuestion extends BaseQuestion {
  activity: 'chance'
  payload: { scenario: string; optionLabels: string[] } // Certain/Maybe/Impossible
  options: number[] // indices into optionLabels
  answer: number
}

/** "2 m = ? cm" — unit conversion; the wrong-factor decoys ride along (H8). */
export interface ConvertQuestion extends BaseQuestion {
  activity: 'convert'
  payload: { from: string; to: string; amount: number }
  options: number[]
  answer: number
}

/** Count the cubes: `d` layers of w×h (H7). One-layer-only is the decoy.
 *  `drawn: false` = formula mode: dimensions shown, nothing to count. */
export interface VolumeQuestion extends BaseQuestion {
  activity: 'volume'
  payload: { w: number; h: number; d: number; drawn: boolean }
  options: number[]
  answer: number
}

/** "Where is the star?" — grid coordinates; (y, x) is the trap (F8/J8).
 *  `min` < 0 opens all four quadrants; `dx`/`dy` set = translate the star. */
export interface CoordQuestion extends BaseQuestion {
  activity: 'coord'
  payload: {
    x: number
    y: number
    size: number
    min?: number // default 0 (first quadrant)
    dx?: number // translate mode: the slide to apply
    dy?: number
    optionLabels: string[]
  }
  options: number[] // indices into optionLabels
  answer: number
}

// ---- Upper band — age-tier deepening (11+/12+) ------------------------------

/** "One angle on the line is 110° — the other?" / triangle's third angle. */
export interface AngleSumQuestion extends BaseQuestion {
  activity: 'angle-sum'
  payload: { parts: number[]; total: number } // 1 part = straight line, 2 = triangle
  options: number[]
  answer: number
}

/** "I times my number by 3 and add 4 to get 19 — what was it?" (F6/F7). */
export interface RiddleQuestion extends BaseQuestion {
  activity: 'riddle'
  payload: { text: string } // the equation card, e.g. "? × 3 + 4 = 19"
  options: number[]
  answer: number
}

/** "2 blue of 5 marbles — the chance of blue?" as a fraction card (K7). */
export interface ChanceFracQuestion extends BaseQuestion {
  activity: 'chance-frac'
  payload: { scenario: string; favorable: number; total: number; optionLabels: string[] }
  options: number[] // indices into optionLabels
  answer: number
}

/** Discriminated on `activity`. Narrow before rendering/checking. */
export type Question =
  | CountQuestion
  | CompareQuestion
  | AddQuestion
  | SubitizeQuestion
  | MatchQuestion
  | SequenceQuestion
  | SubtractQuestion
  | ShapeQuestion
  | PatternQuestion
  | ClockQuestion
  | MoneyQuestion
  | OddOneOutQuestion
  | ShadowMatchQuestion
  | OneMoreQuestion
  | SameOrNotQuestion
  | NumCompareQuestion
  | BondQuestion
  | SidesQuestion
  | CoinCompareQuestion
  | WhoLeftQuestion
  | BelongsQuestion
  | PositionQuestion
  | DayTimeQuestion
  | SizeCompareQuestion
  | HeightCompareQuestion
  | WeightCompareQuestion
  | MakeAmountQuestion
  | SetClockQuestion
  | TapAllQuestion
  | PlaceValueQuestion
  | RoundQuestion
  | MultiplyQuestion
  | DivideQuestion
  | ShareQuestion
  | ArithQuestion
  | FractionOfQuestion
  | UnitPickQuestion
  | GridRectQuestion
  | ElapsedQuestion
  | ChangeQuestion
  | GraphCountQuestion
  | GraphMostQuestion
  | ShapeSortQuestion
  | MissingQuestion
  | LeftoverQuestion
  | WordProblemQuestion
  | FractionOpQuestion
  | ReadScaleQuestion
  | BuildGraphQuestion
  | ColumnOpQuestion
  | FindNumberQuestion
  | DecimalQuestion
  | EquivPickQuestion
  | PercentOfQuestion
  | NegativesQuestion
  | AngleQuestion
  | SymmetryQuestion
  | OrderOpsQuestion
  | RatioQuestion
  | MeanQuestion
  | ChanceQuestion
  | ConvertQuestion
  | VolumeQuestion
  | CoordQuestion
  | AngleSumQuestion
  | RiddleQuestion
  | ChanceFracQuestion

/** What a child answers with — a number (count/add) or a side (compare). */
export type Answer = number | 'left' | 'right'

/**
 * A source of randomness generators accept, so tests can inject a deterministic
 * stream. Defaults to Math.random in the app.
 */
export type Rng = () => number

/** Generator contract: params (+ optional rng) → a ready-to-render Question. */
export type QuestionGenerator = (
  params: Record<string, number>,
  rng?: Rng,
) => Question

// ---- Progress / persisted state -------------------------------------------

export interface LevelProgress {
  cleared: boolean
  bestStreak: number
  /**
   * True when `cleared` came from the placement check (one demonstrated
   * answer), not full in-level mastery. Unlock derivation treats both the
   * same; the grown-ups panel labels them differently, and truly mastering
   * the level later clears the flag.
   */
  placed?: boolean
}

/**
 * A child's learning-pace profile, set by a grown-up via the short preferences
 * quiz in ParentView (never shown to the child). Drives the suggested session
 * plan; later phases can also feed it into adaptive difficulty.
 */
export type PaceId = 'gentle' | 'steady' | 'eager'

/**
 * The persisted slice of game state. Note there is no stored unlock state:
 * which levels are open is *derived* from `progress` (the consecutive run of
 * cleared levels at the start of each category) — one source of truth, and
 * category trails can be re-ordered or extended without migrating children.
 */
export interface GameState {
  stars: number
  progress: Record<string, LevelProgress>
  muted: boolean
  /** Learning-pace profile chosen via the grown-ups quiz; null = not set yet. */
  pace: PaceId | null
  /**
   * The child's age (4–12), picked on first launch and editable by a grown-up.
   * null = not chosen yet → the age gate shows. The active Band derives from
   * it (engine/band.ts); progress is keyed by level id, so changing age never
   * loses anything.
   */
  age: number | null
  /**
   * The child's name — asked (skippably) right after the age gate, editable
   * by a grown-up. Purely cosmetic: greets on the meadow and rides the
   * status chip during play. Part of the child's profile, so reset clears it
   * (new-sibling handoff). null = not set.
   */
  name: string | null
  /**
   * The family's currency (content/currency.ts id, e.g. 'USD'). Money content
   * stores plain values; only rendering reads this, so switching currency
   * never touches progress.
   */
  currency: string
  /**
   * Best sprint score per level id. Forward-only, like everything earned:
   * a worse run never lowers a best.
   */
  bestScores: Record<string, number>
}
