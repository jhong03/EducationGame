import type { MeanQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * mean — the average of a small score set (K5), built BACKWARD from a whole
 * mean so the division always comes out clean. The sum is always on offer:
 * "added but forgot to divide" is the mistake every child makes first.
 */
export function generateMean(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MeanQuestion {
  const count = Math.min(4, Math.max(3, params.count ?? 3))
  const mean = randInt(3, 8, rng)
  const spread = () => randInt(1, Math.min(2, mean - 1), rng)

  let values: number[]
  if (count === 3) {
    const d = spread()
    values = [mean - d, mean, mean + d]
  } else {
    const d = spread()
    const e = randInt(0, Math.min(2, mean - 1), rng)
    values = [mean - d, mean + d, mean - e, mean + e]
  }
  values = shuffle(values, rng)

  const sum = mean * count
  const options = new Set<number>([mean, sum])
  for (const filler of [mean + 1, mean - 1]) {
    if (options.size >= 3) break
    if (filler >= 1) options.add(filler)
  }

  return {
    id: makeId('mean', rng),
    activity: 'mean',
    prompt: `The scores are ${values.join(', ')}. What is the mean?`,
    payload: { values },
    options: shuffle([...options], rng),
    answer: mean,
  }
}
