import type { Rng, SameOrNotQuestion } from '../types'
import { pickTwoThemes } from '../../content/themes'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * same-or-not — equality judgement (the "equal" third of the original
 * more/less/equal spine rung). Two groups of DIFFERENT themes; half the time
 * the counts match. Different themes with equal counts is the deep bit:
 * five ducks and five apples are the same NUMBER.
 */
export function generateSameOrNot(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SameOrNotQuestion {
  const max = Math.max(2, params.max ?? 5)
  const [themeLeft, themeRight] = pickTwoThemes(rng)
  const left = randInt(1, max, rng)
  const same = rng() < 0.5
  const right = same ? left : randIntExcept(1, max, left, rng)
  return {
    id: makeId('same', rng),
    activity: 'same-or-not',
    prompt: 'Are they the same amount?',
    payload: {
      left: { theme: themeLeft, count: left },
      right: { theme: themeRight, count: right },
    },
    options: [1, 0], // fixed order: the buttons are "same" / "not the same"
    answer: same ? 1 : 0,
  }
}
