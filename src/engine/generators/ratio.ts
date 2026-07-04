import type { RatioQuestion, Rng } from '../types'
import { pickTwoThemes } from '../../content/themes'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * ratio — "for every" scaling (E9). Both sides scale by the same factor; the
 * decoys are one-group-off (±b), the miscount a real attempt produces.
 * `big: 1` grows the numbers for the recipe-scaling rung.
 */
export function generateRatio(
  params: Record<string, number>,
  rng: Rng = Math.random,
): RatioQuestion {
  const big = (params.big ?? 0) === 1
  const share = (params.share ?? 0) === 1
  const [aTheme, bTheme] = pickTwoThemes(rng)
  const a = big ? randInt(2, 4, rng) : randInt(1, 3, rng)
  const b = randIntExcept(1, big ? 5 : 4, a, rng)
  const k = big ? randInt(3, 5, rng) : randInt(2, 3, rng)

  if (share) {
    // Share mode (11+): the combined pile is given; how many are a's kind?
    const total = (a + b) * k
    const answer = a * k
    const options = new Set<number>([answer])
    for (const c of [b * k, k, answer - a, answer + a]) {
      if (options.size >= 3) break
      if (c >= 1 && c !== answer) options.add(c)
    }
    return {
      id: makeId('ratio', rng),
      activity: 'ratio',
      prompt: `There are ${a} ${aTheme.plural} for every ${b} ${bTheme.plural}, and ${total} altogether. How many ${aTheme.plural}?`,
      payload: {
        a,
        b,
        scaledA: total,
        aEmoji: aTheme.emoji,
        bEmoji: bTheme.emoji,
        aName: aTheme.plural,
        bName: bTheme.plural,
        total,
      },
      options: shuffle([...options], rng),
      answer,
    }
  }

  const scaledA = a * k
  const answer = b * k

  const options = new Set<number>([answer, answer - b, answer + b])

  return {
    id: makeId('ratio', rng),
    activity: 'ratio',
    prompt: `There are ${a} ${aTheme.plural} for every ${b} ${bTheme.plural}. If there are ${scaledA} ${aTheme.plural}, how many ${bTheme.plural}?`,
    payload: {
      a,
      b,
      scaledA,
      aEmoji: aTheme.emoji,
      bEmoji: bTheme.emoji,
      aName: aTheme.plural,
      bName: bTheme.plural,
    },
    options: shuffle([...options], rng),
    answer,
  }
}
