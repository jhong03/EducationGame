import type { HeightCompareQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept } from '../random'

/**
 * height-compare — "which is taller / shorter?": two block towers of clearly
 * different heights (H1 direct comparison). Heights differ by at least one
 * block by construction.
 */
export function generateHeightCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): HeightCompareQuestion {
  const max = Math.max(3, params.max ?? 6)
  const left = randInt(2, max, rng)
  const right = randIntExcept(2, max, left, rng)
  const target = rng() < 0.5 ? 'tall' : 'short'
  const tallSide = left > right ? 'left' : 'right'
  const shortSide = tallSide === 'left' ? 'right' : 'left'
  return {
    id: makeId('height', rng),
    activity: 'height-compare',
    prompt: target === 'tall' ? 'Which tower is taller?' : 'Which tower is shorter?',
    payload: { left, right, target },
    answer: target === 'tall' ? tallSide : shortSide,
  }
}
