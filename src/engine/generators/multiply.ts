import type { MultiplyQuestion, Rng } from '../types'
import { pickTheme } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * multiply — ×/÷ concepts and tables (NC-Y2→Y4, CCSS-3, JP-G2's 9×9).
 * `tableSet` selects which tables a level drills (1 = the first-taught
 * 2/5/10; 2 = 3/4/6; 3 = everything to 12). `visual: 1` renders "a groups of
 * b" objects instead of a bare expression — multiplication AS repeated
 * groups before it becomes symbols.
 *
 * Distractors are ADJACENT TABLE ENTRIES ((a±1)·b) — the real confusions —
 * never random numbers.
 */
export const TABLE_SETS: Record<number, readonly number[]> = {
  1: [2, 5, 10],
  2: [3, 4, 6],
  3: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  4: [6, 7, 8, 9], // the famously tricky ones
}

export function generateMultiply(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MultiplyQuestion {
  const set = TABLE_SETS[params.tableSet ?? 1] ?? TABLE_SETS[1]
  const visual = (params.visual ?? 0) === 1
  const b = set[randInt(0, set.length - 1, rng)]
  // Visual mode keeps the groups drawable; numeric mode goes to ×12.
  const a = visual ? randInt(2, 5, rng) : randInt(2, 12, rng)
  const answer = a * b

  const options = new Set<number>([answer])
  for (const cand of [(a - 1) * b, (a + 1) * b, answer + 1]) {
    if (options.size >= 3) break
    if (cand > 0) options.add(cand)
  }

  const theme = pickTheme(rng)
  return {
    id: makeId('mul', rng),
    activity: 'multiply',
    prompt: visual
      ? `${a} groups of ${b} — how many altogether?`
      : `What is ${a} times ${b}?`,
    payload: { a, b, visual, theme },
    options: shuffle([...options].slice(0, 3), rng),
    answer,
  }
}
