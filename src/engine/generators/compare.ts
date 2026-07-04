import type { CompareQuestion, Rng } from '../types'
import { pickTwoThemes } from '../../content/themes'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * compare — two groups of different sizes and different themes (each 1..max).
 * The child taps the bigger group (or, with `fewer: 1`, the smaller one).
 * The two counts are guaranteed unequal, so there is always exactly one
 * correct side.
 */
export function generateCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CompareQuestion {
  const max = params.max ?? 6
  const fewer = (params.fewer ?? 0) === 1
  const [themeLeft, themeRight] = pickTwoThemes(rng)
  const left = randInt(1, max, rng)
  const right = randIntExcept(1, max, left, rng) // never equal to left
  const moreSide = left > right ? 'left' : 'right'
  const lessSide = moreSide === 'left' ? 'right' : 'left'
  return {
    id: makeId('compare', rng),
    activity: 'compare',
    prompt: fewer ? 'Which one has fewer?' : 'Which one has more?',
    payload: {
      left: { theme: themeLeft, count: left },
      right: { theme: themeRight, count: right },
    },
    answer: fewer ? lessSide : moreSide,
  }
}
