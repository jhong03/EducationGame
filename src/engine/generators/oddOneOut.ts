import type { OddOneOutQuestion, Rng } from '../types'
import { pickTheme, pickTwoThemes } from '../../content/themes'
import { makeId, randInt } from '../random'

/**
 * odd-one-out — the Puzzle Grove classic (L1 in CURRICULUM.md): several of
 * one thing, ONE of another; tap the different one. Same/different judgement
 * is pre-numeric reasoning — no counting involved, position is random.
 *
 * `size: 1` flips the rule: every item is the SAME thing, but one is giant —
 * the difference is size, not kind (visual discrimination).
 */
export function generateOddOneOut(
  params: Record<string, number>,
  rng: Rng = Math.random,
): OddOneOutQuestion {
  const choices = Math.max(3, params.choices ?? 4)
  const bySize = (params.size ?? 0) === 1
  const answer = randInt(0, choices - 1, rng)

  let items: OddOneOutQuestion['payload']['items']
  if (bySize) {
    const theme = pickTheme(rng)
    items = Array.from({ length: choices }, (_, i) => ({
      emoji: theme.emoji,
      name: theme.singular,
      scale: i === answer ? 1.7 : 1,
    }))
  } else {
    const [main, odd] = pickTwoThemes(rng) // guaranteed distinct
    items = Array.from({ length: choices }, (_, i) =>
      i === answer
        ? { emoji: odd.emoji, name: odd.singular }
        : { emoji: main.emoji, name: main.singular },
    )
  }
  return {
    id: makeId('odd', rng),
    activity: 'odd-one-out',
    prompt: bySize ? 'Which one is the big one?' : 'Which one is different?',
    payload: { items },
    options: items.map((_, i) => i),
    answer,
  }
}
