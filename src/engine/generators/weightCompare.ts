import type { Rng, WeightCompareQuestion } from '../types'
import { WEIGHT_PAIRS } from '../../content/world'
import { makeId, randInt } from '../random'

/**
 * weight-compare — "which is heavier / lighter?": real-world pairs where the
 * answer is world knowledge, not on-screen size (an elephant beats a mouse
 * however large the emoji). Pair order is randomised per question.
 */
export function generateWeightCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): WeightCompareQuestion {
  void params
  const [heavy, light] = WEIGHT_PAIRS[randInt(0, WEIGHT_PAIRS.length - 1, rng)]
  const heavyOnLeft = rng() < 0.5
  const target = rng() < 0.5 ? 'heavy' : 'light'
  const heavySide = heavyOnLeft ? 'left' : 'right'
  const lightSide = heavyOnLeft ? 'right' : 'left'
  return {
    id: makeId('weight', rng),
    activity: 'weight-compare',
    prompt: target === 'heavy' ? 'Which one is heavier?' : 'Which one is lighter?',
    payload: {
      left: heavyOnLeft ? { ...heavy } : { ...light },
      right: heavyOnLeft ? { ...light } : { ...heavy },
      target,
    },
    answer: target === 'heavy' ? heavySide : lightSide,
  }
}
