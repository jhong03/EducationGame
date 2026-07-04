import type { ChangeQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * change — pay a round amount, get the difference back (G3). The renderer
 * applies the family's currency symbol; values stay plain numbers.
 */
export function generateChange(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ChangeQuestion {
  const paid = params.pay ?? 10
  const price = randInt(1, paid - 1, rng)
  const answer = paid - price
  return {
    id: makeId('change', rng),
    activity: 'change',
    prompt: `It costs ${price}. You pay with ${paid}. How much change do you get?`,
    payload: { price, paid },
    options: buildNumberOptions(answer, 0, paid, 3, rng),
    answer,
  }
}
