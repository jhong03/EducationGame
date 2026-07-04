import type { Rng, SubitizeQuestion } from '../types'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * subitize — a group of n objects (n = 1..max, max usually ≤ 5) flashes for
 * `flashMs` then hides. The child answers from what they SAW, not counted —
 * this trains instant quantity recognition (EYFS/CCSS-K "recognise without
 * counting"). Same number-button answer surface as `count`.
 */
export function generateSubitize(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SubitizeQuestion {
  const max = params.max ?? 5
  const flashMs = params.flashMs ?? 1800
  const n = randInt(1, max, rng)
  const theme = pickTheme(rng)
  return {
    id: makeId('subitize', rng),
    activity: 'subitize',
    prompt: 'Quick! How many did you see?',
    payload: { group: { theme, count: n }, flashMs },
    options: buildNumberOptions(n, 0, max, 3, rng),
    answer: n,
  }
}
