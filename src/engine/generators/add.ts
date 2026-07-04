import type { AddQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * add — two small groups of the same theme whose total never exceeds max. We
 * pick the total first (2..max, since each group holds at least one), then
 * split it, which makes the "≤ max" invariant structural. The child answers
 * with a number button.
 */
export function generateAdd(
  params: Record<string, number>,
  rng: Rng = Math.random,
): AddQuestion {
  const max = params.max ?? 5
  // doubles: 1 → both sides equal (the EYFS "double facts" goal).
  const doubles = (params.doubles ?? 0) === 1
  let left: number
  let right: number
  if (doubles) {
    left = randInt(1, Math.max(1, Math.floor(max / 2)), rng)
    right = left
  } else {
    const total = randInt(2, max, rng) // at least 1 + 1
    left = randInt(1, total - 1, rng) // 1..total-1  → both sides ≥ 1
    right = total - left
  }
  const total = left + right
  const theme = pickTheme(rng) // like objects combine more naturally
  return {
    id: makeId('add', rng),
    activity: 'add',
    prompt: doubles ? 'Double it! How many altogether?' : 'How many altogether?',
    payload: {
      left: { theme, count: left },
      right: { theme, count: right },
    },
    options: buildNumberOptions(total, 0, max, 3, rng),
    answer: total,
  }
}
