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
export type ActivityType = 'count' | 'compare' | 'add'

/** One rung on a subject's skill ladder. */
export interface Level {
  id: string
  subjectId: string // 'math'
  band: Band
  order: number // position on the trail (1-based, contiguous)
  name: string // short, e.g. "Count to 5"
  icon: string // emoji shown on the trail node
  activity: ActivityType
  params: Record<string, number> // e.g. { max: 5 }
  masteryGoal: number // correct answers needed to clear (default 3)
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

/** Discriminated on `activity`. Narrow before rendering/checking. */
export type Question = CountQuestion | CompareQuestion | AddQuestion

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
}

/** The persisted slice of game state (mirrors spec §3). */
export interface GameState {
  unlockedOrder: number // highest unlocked trail position
  stars: number
  progress: Record<string, LevelProgress>
  muted: boolean
}
