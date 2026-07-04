import type { FindNumberQuestion, Rng } from '../types'
import { numberWordBig } from '../../content/words'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * find-number — "Find four thousand two hundred and six!" (B5: read big
 * numbers). The prompt is the WORDS (spoken and printed); the numerals only
 * appear on the buttons, so translating words → digits is the whole task.
 * Decoys are the digit swaps a place-value misread actually produces.
 */
export function generateFindNumber(
  params: Record<string, number>,
  rng: Rng = Math.random,
): FindNumberQuestion {
  void params
  // Digits chosen so BOTH swaps change the number: thousands ≠ hundreds and
  // tens ≠ ones (and hundreds ≥ 1 so the high swap keeps four digits).
  const thousands = randInt(1, 9, rng)
  const hundreds = randIntExcept(1, 9, thousands, rng)
  const tens = randInt(0, 9, rng)
  const ones = randIntExcept(0, 9, tens, rng)

  const value = thousands * 1000 + hundreds * 100 + tens * 10 + ones
  const swapHigh = hundreds * 1000 + thousands * 100 + tens * 10 + ones
  const swapLow = thousands * 1000 + hundreds * 100 + ones * 10 + tens

  return {
    id: makeId('findnum', rng),
    activity: 'find-number',
    prompt: `Find ${numberWordBig(value)}!`,
    payload: { value },
    options: shuffle([value, swapHigh, swapLow], rng),
    answer: value,
  }
}
