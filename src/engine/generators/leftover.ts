import type { LeftoverQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * leftover — division WITH a remainder (D6): built as n = b·q + r with
 * 1 ≤ r < b, so there is always genuinely something left over, and the
 * options never reach b (a remainder can't).
 */
export function generateLeftover(
  params: Record<string, number>,
  rng: Rng = Math.random,
): LeftoverQuestion {
  void params
  const b = [3, 4, 5][randInt(0, 2, rng)]
  const q = randInt(2, 5, rng)
  const answer = randInt(1, b - 1, rng)
  const n = b * q + answer

  const options = new Set<number>([answer])
  for (const cand of shuffle([0, 1, 2, 3, 4], rng)) {
    if (options.size >= 3) break
    if (cand < b) options.add(cand)
  }

  return {
    id: makeId('leftover', rng),
    activity: 'leftover',
    prompt: `${n} shared between ${b} — how many are LEFT OVER?`,
    payload: { n, b },
    options: shuffle([...options].slice(0, 3), rng),
    answer,
  }
}
