import type { ChanceFracQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * chance-frac — probability as a fraction (K7's endpoint): f favorable of t
 * marbles → f/t. The decoys are THE two confusions: the complement (red's
 * chance) and the odds form f/(t−f). t ≠ 2f is enforced so the complement is
 * never accidentally correct.
 */
export function generateChanceFrac(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ChanceFracQuestion {
  void params
  const favorable = randInt(1, 4, rng)
  const pool: number[] = []
  for (let t = favorable + 1; t <= 8; t++) if (t !== 2 * favorable) pool.push(t)
  const total = pool[randInt(0, pool.length - 1, rng)]
  const other = total - favorable

  const correct = `${favorable}/${total}`
  const complement = `${other}/${total}` // the red chance, not the blue one
  const odds = `${favorable}/${other}` // "blue to red", not a probability
  const optionLabels = shuffle([correct, complement, odds], rng)

  const scenario = `A bag holds ${favorable} blue and ${other} red marbles. You pick one without looking.`
  return {
    id: makeId('chfrac', rng),
    activity: 'chance-frac',
    prompt: `${scenario} What is the chance it is blue?`,
    payload: { scenario, favorable, total, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(correct),
  }
}
