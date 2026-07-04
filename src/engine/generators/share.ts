import type { Rng, ShareQuestion } from '../types'
import { pickTheme } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * share — division as fair sharing (NC-Y3, SG-P2): a pile split between
 * plates, everyone gets the same. Constructed as plates·per, so sharing is
 * always exactly fair.
 */
export function generateShare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ShareQuestion {
  const max = Math.max(6, params.max ?? 20)
  const plates = randInt(2, 5, rng)
  const per = randInt(1, Math.max(1, Math.floor(max / plates)), rng)
  const total = plates * per
  const theme = pickTheme(rng)

  const options = new Set<number>([per])
  for (const cand of [per + 1, per - 1, per + 2]) {
    if (options.size >= 3) break
    if (cand >= 1) options.add(cand)
  }

  return {
    id: makeId('share', rng),
    activity: 'share',
    prompt: `${total} ${theme.plural} shared between ${plates} plates — how many on each plate?`,
    payload: { total, plates, theme },
    options: shuffle([...options].slice(0, 3), rng),
    answer: per,
  }
}
