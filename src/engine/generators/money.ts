import type { MoneyQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * money — coins to count or add (G1/G2 in CURRICULUM.md). Values are plain
 * numbers; the renderer applies the family's chosen currency symbol (see
 * content/currency.ts — generators stay currency-agnostic).
 *
 * `mixed: 0` → n one-value coins (counting with money, tap-to-count works).
 * `mixed: 1` → two small coins (1/2/5) whose total ≤ max (early adding).
 */
const SMALL_COINS = [1, 2, 5] as const

export function generateMoney(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MoneyQuestion {
  const max = Math.max(2, params.max ?? 5)
  const mixed = (params.mixed ?? 0) === 1

  let coins: number[]
  if (!mixed) {
    const n = randInt(1, max, rng)
    coins = Array.from({ length: n }, () => 1)
  } else {
    // Two coins from {1,2,5} with total ≤ max — pick the first, then a
    // partner that fits (1 always fits since max ≥ 2).
    const first = SMALL_COINS[randInt(0, SMALL_COINS.length - 1, rng)]
    const fits = SMALL_COINS.filter((v) => first + v <= max)
    const second = fits.length
      ? fits[randInt(0, fits.length - 1, rng)]
      : 1
    coins = first + second <= max ? [first, second] : [1, 1]
  }

  const total = coins.reduce((sum, v) => sum + v, 0)
  return {
    id: makeId('money', rng),
    activity: 'money',
    prompt: mixed ? 'How much money altogether?' : 'How much money?',
    payload: { coins },
    options: buildNumberOptions(total, 0, Math.max(max, total), 3, rng),
    answer: total,
  }
}
