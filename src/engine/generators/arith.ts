import type { ArithQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * arith — bare-number add/subtract for the mid band (NC-Y2/3, CCSS-2,
 * SG-P2): "17 + 8", "23 − 6". Objects gave way to symbols; the numbers stay
 * within `max`, differences stay ≥ 1.
 *
 * `op: 0` = addition, `op: 1` = subtraction.
 */
export function generateArith(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ArithQuestion {
  const max = Math.max(5, params.max ?? 20)
  const subtract = (params.op ?? 0) === 1

  let a: number
  let b: number
  let answer: number
  if (subtract) {
    a = randInt(2, max, rng)
    b = randInt(1, a - 1, rng)
    answer = a - b
  } else {
    a = randInt(1, max - 1, rng)
    b = randInt(1, max - a, rng)
    answer = a + b
  }

  return {
    id: makeId('arith', rng),
    activity: 'arith',
    prompt: subtract ? `What is ${a} minus ${b}?` : `What is ${a} plus ${b}?`,
    payload: { a, b, op: subtract ? '-' : '+' },
    options: buildNumberOptions(answer, 0, max, 3, rng),
    answer,
  }
}
