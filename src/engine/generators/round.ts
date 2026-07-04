import type { RoundQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * round — to the nearest ten (NC-Y4, CCSS-3). The value is never itself a
 * multiple of ten (nothing to do), and the options are the two neighbouring
 * tens plus one more — the child picks WHICH ten it is nearest.
 */
export function generateRound(
  params: Record<string, number>,
  rng: Rng = Math.random,
): RoundQuestion {
  // mix: 1 — each question picks its own target (the age-11 stretch: you
  // must HEAR which place you're rounding to, not settle into one habit).
  const nearest =
    (params.mix ?? 0) === 1 ? [10, 100, 1000][randInt(0, 2, rng)] : (params.nearest ?? 10)
  const maxTens = Math.max(2, Math.floor((params.max ?? 100) / nearest) - 1)
  const tensPart = randInt(1, maxTens, rng)
  // Anywhere strictly between two multiples (1..nearest−1), so rounding can
  // go BOTH ways — 304 rounds down but 361 rounds up.
  const ones = randInt(1, nearest - 1, rng)
  const value = tensPart * nearest + ones
  const answer = Math.round(value / nearest) * nearest

  const below = Math.floor(value / nearest) * nearest
  const above = below + nearest
  const wrongNeighbor = answer === below ? above : below
  const third = answer + (answer === below ? -nearest : nearest)
  const options = new Set<number>([answer, wrongNeighbor])
  if (third >= 0) options.add(third)
  if (options.size < 3) options.add(answer + 2 * nearest)

  return {
    id: makeId('round', rng),
    activity: 'round',
    prompt: `Round ${value} to the nearest ${
      nearest === 1000 ? 'thousand' : nearest === 100 ? 'hundred' : 'ten'
    }!`,
    payload: { value, nearest },
    options: shuffle([...options].slice(0, 3), rng),
    answer,
  }
}
