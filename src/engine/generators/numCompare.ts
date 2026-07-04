import type { NumCompareQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * num-compare — "which NUMBER is bigger?": pure numeral comparison, no
 * objects to count (CCSS-K.CC.7). The two numerals are always different.
 * `neg: 1` (upper band, B7) draws from [−max, max]: −2 beats −7 — exactly
 * the intuition-breaker this rung teaches.
 */
export function generateNumCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): NumCompareQuestion {
  // dec: 1 (upper, E5): one-decimal vs two-decimal — "longer looks bigger"
  // is exactly the misread this rung exists to break (0.5 beats 0.35).
  if ((params.dec ?? 0) === 1) {
    const leftTenths = randInt(1, 9, rng)
    let rightHundredths = randInt(1, 99, rng)
    if (rightHundredths === leftTenths * 10) {
      rightHundredths += rightHundredths === 99 ? -1 : 1 // never equal in value
    }
    const left = leftTenths / 10
    const right = rightHundredths / 100
    return {
      id: makeId('numcmp', rng),
      activity: 'num-compare',
      prompt: 'Which number is bigger? Careful — longer is not always bigger!',
      payload: { left, right },
      answer: left > right ? 'left' : 'right',
    }
  }

  const max = Math.max(2, params.max ?? 10)
  const min = (params.neg ?? 0) === 1 ? -max : 1
  const left = randInt(min, max, rng)
  const right = randIntExcept(min, max, left, rng)
  return {
    id: makeId('numcmp', rng),
    activity: 'num-compare',
    prompt: 'Which number is bigger?',
    payload: { left, right },
    answer: left > right ? 'left' : 'right',
  }
}
