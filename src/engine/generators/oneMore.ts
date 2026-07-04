import type { OneMoreQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * one-more — "one more / one fewer than these?" (EYFS ±1 fluency). A group is
 * shown (tap-countable); the child answers what one more or one fewer would
 * be. Delta is random per question; "one fewer than 1" is a friendly 0.
 */
export function generateOneMore(
  params: Record<string, number>,
  rng: Rng = Math.random,
): OneMoreQuestion {
  const max = params.max ?? 5
  const n = randInt(1, max, rng)
  const delta: 1 | -1 = rng() < 0.5 ? 1 : -1
  const answer = n + delta
  const theme = pickTheme(rng)
  return {
    id: makeId('onemore', rng),
    activity: 'one-more',
    prompt:
      delta === 1
        ? `What is one more than these ${theme.plural}?`
        : `What is one fewer than these ${theme.plural}?`,
    payload: { group: { theme, count: n }, delta },
    options: buildNumberOptions(answer, 0, max + 1, 3, rng),
    answer,
  }
}
