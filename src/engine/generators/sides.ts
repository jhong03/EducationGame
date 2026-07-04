import type { Rng, SidesQuestion } from '../types'
import { SHAPE_SIDES } from '../../content/shapes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * sides — "how many sides does it have?" (NC-Y1): one straight-sided shape,
 * count its sides. Bridges the Shapes and Counting worlds.
 */
const SIDED = Object.keys(SHAPE_SIDES)

export function generateSides(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SidesQuestion {
  void params // no tunables yet — the sided-shape pool is the content
  const shapeId = SIDED[randInt(0, SIDED.length - 1, rng)]
  const answer = SHAPE_SIDES[shapeId]
  return {
    id: makeId('sides', rng),
    activity: 'sides',
    prompt: 'How many sides does it have?',
    payload: { shapeId },
    options: buildNumberOptions(answer, 3, 6, 3, rng),
    answer,
  }
}
