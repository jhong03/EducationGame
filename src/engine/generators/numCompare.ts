import type { NumCompareQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * num-compare — "which NUMBER is bigger?": pure numeral comparison, no
 * objects to count (CCSS-K.CC.7). The two numerals are always different.
 */
export function generateNumCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): NumCompareQuestion {
  const max = Math.max(2, params.max ?? 10)
  const left = randInt(1, max, rng)
  const right = randIntExcept(1, max, left, rng)
  return {
    id: makeId('numcmp', rng),
    activity: 'num-compare',
    prompt: 'Which number is bigger?',
    payload: { left, right },
    answer: left > right ? 'left' : 'right',
  }
}
