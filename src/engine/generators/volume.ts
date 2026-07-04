import type { Rng, VolumeQuestion } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * volume — cubes in a cuboid, taught the honest way: `d` identical layers of
 * w×h (H7). The flagship decoy is the single layer (w·h) — counting the face
 * and stopping is exactly how this goes wrong.
 */
export function generateVolume(
  params: Record<string, number>,
  rng: Rng = Math.random,
): VolumeQuestion {
  // Formula mode (12+): only the dimensions are given — nothing to count,
  // the child must MULTIPLY. Bigger numbers; "added the sides" decoy joins.
  const drawn = (params.formula ?? 0) !== 1
  const w = drawn ? randInt(2, 4, rng) : randInt(3, 6, rng)
  const h = drawn ? randInt(2, 3, rng) : randInt(2, 5, rng)
  const d = drawn ? randInt(2, 3, rng) : randInt(2, 5, rng)
  const answer = w * h * d
  const oneLayer = w * h

  const options = new Set<number>([answer])
  const candidates = drawn
    ? [oneLayer, oneLayer * (d === 2 ? 3 : 2)] // counted one layer / one off
    : [oneLayer, w + h + d, answer - oneLayer, answer + oneLayer] // forgot depth / added the sides / a layer off
  for (const c of candidates) {
    if (options.size >= 3) break
    if (c >= 1 && c !== answer) options.add(c)
  }

  return {
    id: makeId('vol', rng),
    activity: 'volume',
    prompt: drawn
      ? `Every layer is the same. How many cubes in the whole stack?`
      : `A box of cubes: ${w} long, ${h} tall, ${d} deep. How many cubes?`,
    payload: { w, h, d, drawn },
    options: shuffle([...options], rng),
    answer,
  }
}
