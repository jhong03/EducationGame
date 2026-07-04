import type { DivideQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'
import { TABLE_SETS } from './multiply'

/**
 * divide — division facts as the inverse of the tables (NC-Y3/4, CCSS-3).
 * Always exact: n is CONSTRUCTED as b·q, so a remainder is impossible.
 */
export function generateDivide(
  params: Record<string, number>,
  rng: Rng = Math.random,
): DivideQuestion {
  const set = TABLE_SETS[params.tableSet ?? 1] ?? TABLE_SETS[1]
  const b = set[randInt(0, set.length - 1, rng)]
  const answer = randInt(2, 10, rng)
  const n = b * answer

  const options = new Set<number>([answer])
  for (const cand of [answer - 1, answer + 1, answer + 2]) {
    if (options.size >= 3) break
    if (cand >= 1) options.add(cand)
  }

  return {
    id: makeId('div', rng),
    activity: 'divide',
    prompt: `What is ${n} divided by ${b}?`,
    payload: { n, b },
    options: shuffle([...options].slice(0, 3), rng),
    answer,
  }
}
