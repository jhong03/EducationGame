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
  const bracketMode = params.brackets ?? 0
  const a = randInt(2, 9, rng)
  const b = randInt(2, 5, rng)
  const c = randInt(2, 5, rng)

  let text: string
  let answer: number
  let trap: number
  if (bracketMode === 2) {
    // Double brackets (age 12): both must be done first.
    const c2 = randInt(4, 9, rng)
    const d = randInt(1, c2 - 2, rng) // the second bracket stays ≥ 2
    text = `(${a} + ${b}) × (${c2} − ${d})`
    answer = (a + b) * (c2 - d)
    trap = (a + b) * c2 - d // ignored the second bracket
  } else if (bracketMode === 1) {
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
  // trap === answer would need a=1, c=1 or d(a+b−1)=0 — all excluded by ranges.

  const options = new Set<number>([answer, trap])
  for (const filler of [answer + 1, answer - 1, answer + 2]) {
    if (options.size >= 3) break
    if (filler > 0) options.add(filler)
  }

  return {
    id: makeId('ops', rng),
    activity: 'order-ops',
    prompt:
      bracketMode === 2
        ? 'BOTH brackets first! What does it make?'
        : bracketMode === 1
          ? 'Brackets first! What does it make?'
          : 'Times BEFORE plus! What does it make?',
    payload: { text },
    options: shuffle([...options], rng),
    answer,
  }
}
