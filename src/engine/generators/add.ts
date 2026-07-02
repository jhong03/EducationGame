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
  const total = randInt(2, max, rng) // at least 1 + 1
  const left = randInt(1, total - 1, rng) // 1..total-1  → both sides ≥ 1
  const right = total - left
  const theme = pickTheme(rng) // like objects combine more naturally
  return {
    id: makeId('add', rng),
    activity: 'add',
    prompt: 'How many altogether?',
    payload: {
      left: { theme, count: left },
      right: { theme, count: right },
    },
    options: buildNumberOptions(total, 0, max, 3, rng),
    answer: total,
  }
}
