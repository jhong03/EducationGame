import type { Rng, ShapeSortQuestion } from '../types'
import { SHAPE_SIDES } from '../../content/shapes'
import { makeId, randInt, shuffle } from '../random'

/**
 * shape-sort — sorting by property (J3): "tap the shape with 5 sides". The
 * three cards always have DISTINCT side counts, so the property alone decides.
 */
const DISTINCT_SIDED = ['triangle', 'square', 'pentagon', 'hexagon'] // 3/4/5/6

export function generateShapeSort(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ShapeSortQuestion {
  void params
  const shapeIds = shuffle(DISTINCT_SIDED, rng).slice(0, 3)
  const answer = randInt(0, shapeIds.length - 1, rng)
  const targetSides = SHAPE_SIDES[shapeIds[answer]]
  return {
    id: makeId('ssort', rng),
    activity: 'shape-sort',
    prompt: `Tap the shape with ${targetSides} sides!`,
    payload: { shapeIds, targetSides },
    options: shapeIds.map((_, i) => i),
    answer,
  }
}
