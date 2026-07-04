import type { PercentOfQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * percent-of — percentages of amounts (E8), whole answers always. `set: 1`
 * keeps to the anchors (100%, 50%, 10%); `set: 2` opens 25/75/20/5%;
 * `set: 3` (11+) is any tens-percent of any tens-amount; `set: 4` (12+) uses
 * the awkward five-percents. Amount granularity per set keeps every
 * combination landing on a whole number.
 */
const PCT_SETS: Record<number, readonly number[]> = {
  1: [100, 50, 10],
  2: [25, 75, 20, 5],
  3: [30, 40, 60, 90],
  4: [15, 35, 55, 95],
}

export function generatePercentOf(
  params: Record<string, number>,
  rng: Rng = Math.random,
): PercentOfQuestion {
  const set = params.set ?? 1
  const pcts = PCT_SETS[set] ?? PCT_SETS[1]
  const pct = pcts[randInt(0, pcts.length - 1, rng)]
  const of = set === 3 ? 10 * randInt(1, 10, rng) : 20 * randInt(1, 5, rng)
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
