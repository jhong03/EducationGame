import type { PlaceValueQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * place-value — read base-ten blocks (NC-Y2/3, CCSS-1/2, SG-P1/2). The
 * classic wrong answer is the DIGIT SWAP (reading 73 as 37), so it is always
 * one of the options when it exists and differs.
 */
function digitSwap(n: number): number {
  const s = String(n)
  if (s.length === 2) return Number(s[1] + s[0])
  if (s.length === 3) return Number(s[2] + s[1] + s[0])
  return n
}

export function generatePlaceValue(
  params: Record<string, number>,
  rng: Rng = Math.random,
): PlaceValueQuestion {
  const max = Math.max(21, params.max ?? 99)
  const min = max > 99 ? 101 : 11
  let value = randInt(min, max, rng)
  // Same-digit numbers (33, 77…) have no swap distractor — nudge off them.
  if (digitSwap(value) === value) value = value === max ? value - 1 : value + 1

  const options = new Set<number>([value])
  const swap = digitSwap(value)
  if (swap !== value && swap >= 1) options.add(swap)
  // Off-by-ten reads (miscounting the rods).
  for (const cand of [value + 10, value - 10, value + 1, value - 1]) {
    if (options.size >= 3) break
    if (cand >= 1) options.add(cand)
  }

  return {
    id: makeId('pv', rng),
    activity: 'place-value',
    prompt: 'What number do the blocks show?',
    payload: { value },
    options: shuffle([...options].slice(0, 3), rng),
    answer: value,
  }
}
