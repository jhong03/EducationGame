import type { NegativesQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * negatives — the number line below zero (B7). `mode: 0` reads the arrow (it
 * always sits on a NEGATIVE tick — that's the new territory); `mode: 1` works
 * a subtraction that crosses zero, with the line drawn underneath as support.
 */
export function generateNegatives(
  params: Record<string, number>,
  rng: Rng = Math.random,
): NegativesQuestion {
  const max = Math.max(5, params.max ?? 10)
  const crossing = (params.mode ?? 0) === 1

  if (!crossing) {
    const value = -randInt(1, max, rng)
    return {
      id: makeId('neg', rng),
      activity: 'negatives',
      prompt: 'Where is the arrow pointing? Mind the minus!',
      payload: { min: -max, max, value },
      options: buildNumberOptions(value, -max, max, 3, rng),
      answer: value,
    }
  }

  const a = randInt(1, 8, rng)
  const drop = randInt(1, max, rng) // how far below zero we land
  const b = a + drop
  const value = a - b // always negative
  return {
    id: makeId('neg', rng),
    activity: 'negatives',
    prompt: `What is ${a} minus ${b}? Use the line — keep going past zero!`,
    payload: { min: -max, max, value, expr: `${a} − ${b}` },
    options: buildNumberOptions(value, -max, max, 3, rng),
    answer: value,
  }
}
