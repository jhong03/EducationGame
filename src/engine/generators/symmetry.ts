import type { Rng, SymmetryQuestion } from '../types'
import { SHAPE_SIDES, SHAPE_SYMMETRY, shapeById } from '../../content/shapes'
import { makeId, randInt, shuffle } from '../random'

/**
 * symmetry — "how many mirror lines?" (J4). The star decoy: a shape's SIDE
 * count (rectangle: 4 sides but only 2 mirror lines — the classic mix-up)
 * is offered whenever it differs from the true answer.
 */
const IDS = Object.keys(SHAPE_SYMMETRY)

export function generateSymmetry(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SymmetryQuestion {
  void params
  const shapeId = IDS[randInt(0, IDS.length - 1, rng)]
  const answer = SHAPE_SYMMETRY[shapeId]

  const candidates = [SHAPE_SIDES[shapeId], answer - 1, answer + 1, answer + 2]
  const options = new Set<number>([answer])
  for (const c of candidates) {
    if (options.size >= 3) break
    if (c !== undefined && c >= 0 && c !== answer) options.add(c)
  }

  return {
    id: makeId('sym', rng),
    activity: 'symmetry',
    prompt: `How many mirror lines does the ${shapeById(shapeId)?.name ?? shapeId} have?`,
    payload: { shapeId },
    options: shuffle([...options], rng),
    answer,
  }
}
