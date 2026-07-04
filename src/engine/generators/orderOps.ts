import type { OrderOpsQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * order-ops — multiply before add (F6/BODMAS). The flagship decoy is the
 * left-to-right (or brackets-ignored) evaluation — provably never equal to
 * the true answer for these operand ranges, so the trap is always a trap.
 */
export function generateOrderOps(
  params: Record<string, number>,
  rng: Rng = Math.random,
): OrderOpsQuestion {
  const brackets = (params.brackets ?? 0) === 1
  const a = randInt(2, 9, rng)
  const b = randInt(2, 5, rng)
  const c = randInt(2, 5, rng)

  let text: string
  let answer: number
  let trap: number
  if (brackets) {
    text = `(${a} + ${b}) × ${c}`
    answer = (a + b) * c
    trap = a + b * c // ignored the brackets
  } else if (randInt(0, 1, rng) === 0) {
    text = `${a} + ${b} × ${c}`
    answer = a + b * c
    trap = (a + b) * c // marched left to right
  } else {
    text = `${a} × ${b} + ${c}`
    answer = a * b + c
    trap = a * (b + c) // multiplied into the add
  }
  // trap === answer would need c=1 or a=1 — both excluded by the ranges.

  const options = new Set<number>([answer, trap])
  for (const filler of [answer + 1, answer - 1, answer + 2]) {
    if (options.size >= 3) break
    if (filler > 0) options.add(filler)
  }

  return {
    id: makeId('ops', rng),
    activity: 'order-ops',
    prompt: brackets
      ? 'Brackets first! What does it make?'
      : 'Times BEFORE plus! What does it make?',
    payload: { text },
    options: shuffle([...options], rng),
    answer,
  }
}
