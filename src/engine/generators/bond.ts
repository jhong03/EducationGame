import type { BondQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { capitalize, numberWord } from '../../content/words'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * bond — number bonds (EYFS: bonds to 5, then 10): k objects are shown, the
 * child finds the missing addend to the spoken target. 1 ≤ k < target, so
 * the answer is always ≥ 1.
 */
export function generateBond(
  params: Record<string, number>,
  rng: Rng = Math.random,
): BondQuestion {
  const target = Math.max(2, params.target ?? 5)
  const k = randInt(1, target - 1, rng)
  const answer = target - k
  const theme = pickTheme(rng)
  return {
    id: makeId('bond', rng),
    activity: 'bond',
    prompt: `${capitalize(numberWord(k))} ${
      k === 1 ? theme.singular : theme.plural
    }… how many more make ${numberWord(target)}?`,
    payload: { group: { theme, count: k }, target },
    options: buildNumberOptions(answer, 0, target, 3, rng),
    answer,
  }
}
