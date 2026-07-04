import type { Rng, ShapeQuestion } from '../types'
import { pickShapes } from '../../content/shapes'
import { makeId, randInt } from '../random'

/**
 * shape-id — "Find the circle!": three cards, each one shape drawn in the SAME
 * color (shape is the only discriminator), one of which is the spoken target.
 * `pool` widens the shape vocabulary per level (4 = circle/square/triangle/
 * star; 6 adds rectangle/heart). The tapped card's INDEX is the answer.
 */
export function generateShapeId(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ShapeQuestion {
  const pool = params.pool ?? 4
  const choices = 3
  const shapes = pickShapes(pool, choices, rng) // distinct, shuffled
  const answer = randInt(0, shapes.length - 1, rng)
  const target = shapes[answer]
  return {
    id: makeId('shape', rng),
    activity: 'shape-id',
    prompt: `Find the ${target.name}!`,
    payload: { shapeIds: shapes.map((s) => s.id), targetId: target.id },
    options: shapes.map((_, i) => i),
    answer,
  }
}
