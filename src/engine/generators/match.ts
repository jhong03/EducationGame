import type { MatchQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { numberWord } from '../../content/words'
import { makeId, randInt, shuffle } from '../random'

/**
 * match — numeral ↔ quantity. A big numeral is shown and spoken ("Find
 * seven!"); the child taps the group holding that many objects. All groups
 * share one theme so QUANTITY is the only discriminator. `answer` is the index
 * of the matching group; `options` are the group indices (for the generic
 * "exactly one correct option" contract).
 */
export function generateMatch(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MatchQuestion {
  // Three distinct counts need at least [1..3], so max is clamped up to 3 —
  // a level authored with max < 3 degrades to {max:3} instead of silently
  // shipping a one- or two-group question.
  const max = Math.max(3, params.max ?? 10)
  const choices = 3
  const target = randInt(1, max, rng)
  const theme = pickTheme(rng)

  // Distractor counts hug the target (±1, ±2 …) so the choice is meaningful,
  // clamped to [1, max], all distinct. Deterministic outward walk — no
  // rejection loop, so a degenerate rng can't hang it.
  const counts = new Set<number>([target])
  for (let d = 1; counts.size < choices && d <= max; d++) {
    for (const cand of [target - d, target + d]) {
      if (cand >= 1 && cand <= max) {
        counts.add(cand)
        if (counts.size >= choices) break
      }
    }
  }

  const groups = shuffle(
    [...counts].map((count) => ({ theme, count })),
    rng,
  )
  const answer = groups.findIndex((g) => g.count === target)
  return {
    id: makeId('match', rng),
    activity: 'match',
    prompt: `Find ${numberWord(target)}!`,
    payload: { target, groups },
    options: groups.map((_, i) => i),
    answer,
  }
}
