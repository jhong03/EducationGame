import type { Rng } from './types'

/**
 * Randomness helpers shared by the generators. All take an injectable `rng`
 * (defaulting to Math.random) so tests can drive them deterministically and
 * assert invariants.
 */

/** Integer in [min, max], inclusive. */
export function randInt(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * Integer in [min, max] that is never equal to `except`.
 * Assumes the range holds at least two values (so an alternative exists).
 * Uniform over the range minus the excluded value — no rejection loop, so a
 * degenerate rng can't hang it.
 */
export function randIntExcept(
  min: number,
  max: number,
  except: number,
  rng: Rng = Math.random,
): number {
  const pick = randInt(min, max - 1, rng) // one fewer slot
  return pick >= except ? pick + 1 : pick // hop over the hole
}

/** Fisher–Yates shuffle; returns a new array, leaves the input untouched. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Build `count` answer options for a number question: the correct value plus
 * near distractors, every value clamped to [min, max], all distinct, shuffled.
 * Distractors hug the correct answer (±1, ±2, …) so the choice is meaningful.
 */
export function buildNumberOptions(
  correct: number,
  min: number,
  max: number,
  count: number,
  rng: Rng = Math.random,
): number[] {
  const options = new Set<number>([correct])
  // Expand outward from the correct answer, nearest first.
  for (let d = 1; options.size < count && d <= max - min; d++) {
    for (const cand of [correct - d, correct + d]) {
      if (cand >= min && cand <= max) {
        options.add(cand)
        if (options.size >= count) break
      }
    }
  }
  // Safety net if the range was somehow too tight (never hit by Phase 0 params).
  for (let v = min; options.size < count && v <= max; v++) options.add(v)
  return shuffle([...options], rng)
}

/** A short, session-unique id for a generated question (used as a React key). */
export function makeId(prefix: string, rng: Rng = Math.random): string {
  return `${prefix}-${Math.floor(rng() * 1e9).toString(36)}`
}
