import type { ColumnOpQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * column-op — the written method (C4/C5): column addition with a FORCED
 * ones-carry, column subtraction with a FORCED ones-borrow (without the
 * regroup it's just `arith` again). `max: 100` uses 2-digit operands,
 * `max: 1000` uses 3-digit; results always stay under the bound.
 *
 * Distractors are the two written-method slips children actually make:
 * forgetting the carry (answer − 10), and doing "big digit minus small
 * digit" in every column instead of borrowing (`flipDigits`).
 */
export function generateColumnOp(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ColumnOpQuestion {
  const subtract = (params.op ?? 0) === 1
  const threeDigit = (params.max ?? 100) >= 1000

  let a: number
  let b: number
  if (subtract) {
    const bOnes = randInt(1, 9, rng)
    const aOnes = randInt(0, bOnes - 1, rng) // aOnes < bOnes → borrow
    if (threeDigit) {
      const bHundreds = randInt(1, 7, rng)
      const aHundreds = randInt(bHundreds + 1, 8, rng) // a > b even after borrows
      a = aHundreds * 100 + randInt(0, 9, rng) * 10 + aOnes
      b = bHundreds * 100 + randInt(0, 9, rng) * 10 + bOnes
    } else {
      const bTens = randInt(1, 7, rng)
      const aTens = randInt(bTens + 1, 9, rng)
      a = aTens * 10 + aOnes
      b = bTens * 10 + bOnes
    }
  } else {
    const aOnes = randInt(1, 9, rng)
    const bOnes = randInt(10 - aOnes, 9, rng) // sum ≥ 10 → carry
    if (threeDigit) {
      const aHundreds = randInt(1, 6, rng)
      const bHundreds = randInt(1, 7 - aHundreds, rng) // total stays < 1000
      a = aHundreds * 100 + randInt(0, 9, rng) * 10 + aOnes
      b = bHundreds * 100 + randInt(0, 9, rng) * 10 + bOnes
    } else {
      const aTens = randInt(1, 7, rng)
      const bTens = randInt(1, 8 - aTens, rng) // total stays < 100
      a = aTens * 10 + aOnes
      b = bTens * 10 + bOnes
    }
  }
  const answer = subtract ? a - b : a + b

  const candidates = subtract
    ? [flipDigits(a, b), answer + 10, answer - 10, answer + 20]
    : [answer - 10, answer + 10, answer - 1]
  const options = new Set<number>([answer])
  for (const c of candidates) {
    if (options.size >= 3) break
    if (c > 0 && c !== answer) options.add(c)
  }

  return {
    id: makeId('col', rng),
    activity: 'column-op',
    prompt: subtract
      ? `What is ${a} minus ${b}? Work down the columns!`
      : `What is ${a} plus ${b}? Work down the columns!`,
    payload: { a, b, op: subtract ? '-' : '+' },
    options: shuffle([...options], rng),
    answer,
  }
}

/** Per-column |big − small| — what a no-borrow attempt actually produces. */
export function flipDigits(a: number, b: number): number {
  let out = 0
  let place = 1
  while (a > 0 || b > 0) {
    out += Math.abs((a % 10) - (b % 10)) * place
    place *= 10
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return out
}
