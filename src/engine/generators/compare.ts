import type { CompareQuestion, Rng } from '../types'
import { pickTwoThemes } from '../../content/themes'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * compare — two groups of different sizes and different themes (each 1..max).
 * The child taps the bigger group. The two counts are guaranteed unequal, so
 * there is always exactly one "more" side.
 */
export function generateCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CompareQuestion {
  const max = params.max ?? 6
  const [themeLeft, themeRight] = pickTwoThemes(rng)
  const left = randInt(1, max, rng)
  const right = randIntExcept(1, max, left, rng) // never equal to left
  return {
    id: makeId('compare', rng),
    activity: 'compare',
    prompt: 'Which one has more?',
    payload: {
      left: { theme: themeLeft, count: left },
      right: { theme: themeRight, count: right },
    },
    answer: left > right ? 'left' : 'right',
  }
}
