import type { Rng, SubtractQuestion } from '../types'
import { pickTheme } from '../../content/themes'
import { capitalize, numberWord } from '../../content/words'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * subtract — "how many are left?": a group of `start` objects where `taken` of
 * them go away (rendered faded). Structural invariants: start ≥ 2 so there is
 * something to take (max is clamped up to 2 to keep that possible); taken < start
 * by default so the answer stays ≥ 1 (EYFS keeps early subtraction concrete and
 * positive) — the dedicated "All gone!" level passes `allowZero: 1` to teach zero.
 */
export function generateSubtract(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SubtractQuestion {
  const max = Math.max(2, params.max ?? 5)
  // allowZero: 1 → everything can go away ("all gone!"), teaching zero.
  const allowZero = (params.allowZero ?? 0) === 1
  const start = randInt(2, max, rng)
  const taken = randInt(1, allowZero ? start : start - 1, rng)
  const answer = start - taken
  const theme = pickTheme(rng)
  // Spoken aloud to a pre-reader — the grammar has to be right: "One GOES
  // away", "Two GO away".
  const verb = taken === 1 ? 'goes' : 'go'
  return {
    id: makeId('subtract', rng),
    activity: 'subtract',
    prompt: `${capitalize(numberWord(start))} ${theme.plural}. ${capitalize(numberWord(taken))} ${verb} away. How many are left?`,
    payload: { group: { theme, count: start }, taken },
    options: buildNumberOptions(answer, 0, max, 3, rng),
    answer,
  }
}
