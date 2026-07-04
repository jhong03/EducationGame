import type { FindNumberQuestion, Rng } from '../types'
import { numberWordBig } from '../../content/words'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * find-number — "Find four thousand two hundred and six!" (B5: read big
 * numbers). The prompt is the WORDS (spoken and printed); the numerals only
 * appear on the buttons, so translating words → digits is the whole task.
 * Decoys are the digit swaps a place-value misread actually produces.
 * `digits: 5` (age 12) stretches to the ten-thousands.
 */
export function generateFindNumber(
  params: Record<string, number>,
  rng: Rng = Math.random,
): FindNumberQuestion {
  const len = (params.digits ?? 4) >= 5 ? 5 : 4

  // Leading pair differs (and both ≥ 1, so the high swap keeps its length);
  // trailing pair differs (so the low swap changes the number).
  const digits: number[] = [randInt(1, 9, rng)]
  digits.push(randIntExcept(1, 9, digits[0], rng))
  while (digits.length < len - 2) digits.push(randInt(0, 9, rng))
  const tens = randInt(0, 9, rng)
  digits.push(tens, randIntExcept(0, 9, tens, rng))

  const valueOf = (ds: readonly number[]) => ds.reduce((acc, d) => acc * 10 + d, 0)
  const swapped = (i: number) => {
    const ds = [...digits]
    ;[ds[i], ds[i + 1]] = [ds[i + 1], ds[i]]
    return valueOf(ds)
  }
  const value = valueOf(digits)

  return {
    id: makeId('findnum', rng),
    activity: 'find-number',
    prompt: `Find ${numberWordBig(value)}!`,
    payload: { value },
    options: shuffle([value, swapped(0), swapped(len - 2)], rng),
    answer: value,
  }
}
