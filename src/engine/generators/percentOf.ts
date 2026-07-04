import type { PercentOfQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * percent-of — percentages of amounts (E8), whole answers always. `set: 1`
 * keeps to the anchors (100%, 50%, 10%); `set: 2` opens 25/75/20/5%. Amounts
 * are multiples of 20, so every combination lands on a whole number.
 */
const PCT_SETS: Record<number, readonly number[]> = {
  1: [100, 50, 10],
  2: [25, 75, 20, 5],
}

export function generatePercentOf(
  params: Record<string, number>,
  rng: Rng = Math.random,
): PercentOfQuestion {
  const pcts = PCT_SETS[params.set ?? 1] ?? PCT_SETS[1]
  const pct = pcts[randInt(0, pcts.length - 1, rng)]
  const of = 20 * randInt(1, 5, rng) // 20..100
  const answer = (pct * of) / 100

  return {
    id: makeId('pct', rng),
    activity: 'percent-of',
    prompt: `What is ${pct} percent of ${of}?`,
    payload: { pct, of },
    options: buildNumberOptions(answer, 0, of, 3, rng),
    answer,
  }
}
