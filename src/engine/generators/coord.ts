import type { CoordQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * coord — read a first-quadrant grid point (F8/J8). x ≠ y always, because
 * the flagship decoy is the swap (y, x): across-before-up is the lesson.
 */
export function generateCoord(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CoordQuestion {
  const size = Math.min(6, Math.max(4, params.size ?? 5))
  const x = randInt(1, size, rng)
  const y = randIntExcept(1, size, x, rng) // x ≠ y so the swap is always wrong

  const correct = `(${x}, ${y})`
  const swap = `(${y}, ${x})`
  // A third point that differs from both: nudge y (staying on the grid).
  const yAlt = y < size ? y + 1 : y - 1
  const third = `(${x}, ${yAlt})`

  const optionLabels = shuffle([correct, swap, third], rng)
  return {
    id: makeId('coord', rng),
    activity: 'coord',
    prompt: 'Where is the star? Across first, then up!',
    payload: { x, y, size, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(correct),
  }
}
