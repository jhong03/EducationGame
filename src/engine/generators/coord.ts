import type { CoordQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * coord — grid coordinates (F8/J8). Base: read a first-quadrant point;
 * x ≠ y always, because the flagship decoy is the swap (y, x) —
 * across-before-up is the lesson. `quad: 4` (11+) opens all four quadrants
 * (sign-slip decoy joins). `translate: 1` (12+) slides the star and asks
 * where it LANDS (wrong-direction and axis-mix decoys).
 */
export function generateCoord(
  params: Record<string, number>,
  rng: Rng = Math.random,
): CoordQuestion {
  if ((params.translate ?? 0) === 1) return generateTranslate(rng)
  if ((params.quad ?? 1) === 4) return generateFourQuadrant(rng)

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

/** All four quadrants: negative coordinates, and the sign slip as a card. */
function generateFourQuadrant(rng: Rng): CoordQuestion {
  const size = 4
  const nonZero = (except?: number) => {
    const pool: number[] = []
    for (let v = -size; v <= size; v++) if (v !== 0 && v !== except) pool.push(v)
    return pool[randInt(0, pool.length - 1, rng)]
  }
  const x = nonZero()
  const y = nonZero(x) // x ≠ y keeps the swap decoy wrong

  const correct = `(${x}, ${y})`
  // Swap, sign-slip — provably distinct from each other and from the truth.
  const optionLabels = shuffle([correct, `(${y}, ${x})`, `(${-x}, ${y})`], rng)
  return {
    id: makeId('coord', rng),
    activity: 'coord',
    prompt: 'Where is the star? Across first — minus means left or down!',
    payload: { x, y, size, min: -size, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(correct),
  }
}

/** Slide the star and name the landing point. */
function generateTranslate(rng: Rng): CoordQuestion {
  const size = 5
  const x = randInt(1, 4, rng)
  const y = randInt(1, 4, rng)
  const stepPool = (from: number) =>
    [-2, -1, 1, 2].filter((s) => from + s >= 0 && from + s <= size)
  const dxPool = stepPool(x)
  const dx = dxPool[randInt(0, dxPool.length - 1, rng)]
  const dyPool = stepPool(y).filter((s) => s !== dx) // dx ≠ dy keeps the mix decoy wrong
  const dy = dyPool[randInt(0, dyPool.length - 1, rng)]

  const correct = `(${x + dx}, ${y + dy})`
  const labels = new Set<string>([correct])
  // Wrong direction, axis mix-up, forgot the vertical move — dedupe keeps 3.
  for (const c of [`(${x - dx}, ${y - dy})`, `(${x + dy}, ${y + dx})`, `(${x + dx}, ${y})`]) {
    if (labels.size >= 3) break
    if (c !== correct) labels.add(c)
  }

  const optionLabels = shuffle([...labels], rng)
  const across = dx > 0 ? `${dx} right` : `${-dx} left`
  const up = dy > 0 ? `${dy} up` : `${-dy} down`
  return {
    id: makeId('coord', rng),
    activity: 'coord',
    prompt: `Slide the star ${across} and ${up} — where does it land?`,
    payload: { x, y, size, dx, dy, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(correct),
  }
}
