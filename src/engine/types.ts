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
