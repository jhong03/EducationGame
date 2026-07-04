import type { GridRectQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * grid-rect — area by counting squares (CCSS-3, NC-Y4) and perimeter as the
 * walk around the edge (NC-Y3). Same rectangle, two different questions —
 * that contrast IS the lesson.
 */
export function generateGridRect(
  params: Record<string, number>,
  rng: Rng = Math.random,
): GridRectQuestion {
  const mode = (params.mode ?? 0) === 1 ? 'perimeter' : 'area'
  const w = randInt(2, 6, rng)
  const h = randInt(2, 5, rng)
  const answer = mode === 'area' ? w * h : 2 * (w + h)
  const hi = mode === 'area' ? 30 : 24
  return {
    id: makeId('rect', rng),
    activity: 'grid-rect',
    prompt:
      mode === 'area'
        ? 'How many squares fill the shape?'
        : 'How many steps all the way around the edge?',
    payload: { w, h, mode },
    options: buildNumberOptions(answer, 1, hi, 3, rng),
    answer,
  }
}
