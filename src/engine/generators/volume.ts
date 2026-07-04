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
  void params
  const w = randInt(2, 4, rng)
  const h = randInt(2, 3, rng)
  const d = randInt(2, 3, rng)
  const answer = w * h * d
  const oneLayer = w * h
  const layersOff = oneLayer * (d === 2 ? 3 : 2) // one layer too many/few

  return {
    id: makeId('vol', rng),
    activity: 'volume',
    prompt: `Every layer is the same. How many cubes in the whole stack?`,
    payload: { w, h, d },
    options: shuffle([answer, oneLayer, layersOff], rng),
    answer,
  }
}
