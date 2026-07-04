import type { CountQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * count — render n objects (n = 1..max) of one theme. The child answers with a
 * number button. Options are the correct value plus near distractors, clamped
 * to [0, max], shuffled.
 */
export function generateCount(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CountQuestion {
  const max = params.max ?? 5
  // allowZero: 1 → "none at all" is a possible (and teachable) answer.
  const min = (params.allowZero ?? 0) === 1 ? 0 : 1
  const n = randInt(min, max, rng)
  const theme = pickTheme(rng)
  return {
    id: makeId('count', rng),
    activity: 'count',
    prompt: `How many ${theme.plural}?`,
    payload: { group: { theme, count: n } },
    options: buildNumberOptions(n, 0, max, 3, rng),
    answer: n,
  }
}
