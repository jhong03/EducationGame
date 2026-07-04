import type { CoinCompareQuestion, Rng } from '../types'
import { makeId, randInt } from '../random'

/**
 * coin-compare — "which coin is worth more?": value beats size/shine — a
 * first taste of denominations (SG-P1 money sense). Values are plain numbers;
 * the renderer applies the family's currency symbol.
 */
const VALUES = [1, 2, 5, 10] as const

export function generateCoinCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CoinCompareQuestion {
  void params
  const i = randInt(0, VALUES.length - 1, rng)
  let j = randInt(0, VALUES.length - 2, rng)
  if (j >= i) j++
  const left = VALUES[i]
  const right = VALUES[j]
  return {
    id: makeId('coincmp', rng),
    activity: 'coin-compare',
    prompt: 'Which coin is worth more?',
    payload: { left, right },
    answer: left > right ? 'left' : 'right',
  }
}
