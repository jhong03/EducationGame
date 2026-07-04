import type { NegativesQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * negatives — the number line below zero (B7). `mode: 0` reads the arrow (it
 * always sits on a NEGATIVE tick — that's the new territory); `mode: 1` works
 * a subtraction that crosses zero, with the line drawn underneath as support.
 * Age-tier stretches: `mode: 2` finds the GAP between two marked temperatures
 * spanning zero (the value is the distance, not a position — the sign-blind
 * "just subtract the numbers" slip rides along); `mode: 3` computes sums that
 * START below zero (−3 + 8, −2 − 5).
 */
export function generateNegatives(
  params: Record<string, number>,
  rng: Rng = Math.random,
): NegativesQuestion {
  const max = Math.max(5, params.max ?? 10)
  const mode = params.mode ?? 0

  if (mode === 2) {
    const below = -randInt(1, max - 1, rng)
    const above = randInt(1, max - 1, rng)
    const value = above - below // the true gap, spanning zero
    const signBlind = Math.abs(above - Math.abs(below)) // ignored the minus
    const options = new Set<number>([value])
    for (const c of [signBlind, value - 1, value + 1, value - 2]) {
      if (options.size >= 3) break
      if (c >= 1 && c !== value) options.add(c)
    }
    return {
      id: makeId('neg', rng),
      activity: 'negatives',
      prompt: `How many degrees warmer is ${above} than minus ${-below}?`,
      payload: { min: -max, max, value, marks: [below, above] },
      options: shuffle([...options], rng),
      answer: value,
    }
  }

  if (mode === 3) {
    const a = randInt(1, 9, rng)
    const adding = randInt(0, 1, rng) === 0
    let b: number
    let value: number
    if (adding) {
      b = randIntExcept(1, 9, a, rng) // b ≠ a so the answer is never zero
      value = b - a
    } else {
      b = randInt(1, Math.max(1, max - a), rng) // stays on the line (≥ −max)
      value = -a - b
    }
    return {
      id: makeId('neg', rng),
      activity: 'negatives',
      prompt: `What is minus ${a} ${adding ? 'plus' : 'minus'} ${b}? Let the line help!`,
      payload: { min: -max, max, value, expr: `−${a} ${adding ? '+' : '−'} ${b}` },
      options: buildNumberOptions(value, -max, max, 3, rng),
      answer: value,
    }
  }

  if (mode === 1) {
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
