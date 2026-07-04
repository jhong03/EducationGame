import type { Rng, WordProblemQuestion } from '../types'
import { STORY_TEMPLATES } from '../../content/stories'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * word-problem — a one-step story, spoken and shown (L4/L5). `ops: 1` mixes
 * add & subtract stories; `ops: 2` uses the times stories. Numbers are sized
 * so every answer is checkable in the head.
 */
export function generateWordProblem(
  params: Record<string, number>,
  rng: Rng = Math.random,
): WordProblemQuestion {
  const wantTimes = (params.ops ?? 1) === 2
  const pool = STORY_TEMPLATES.filter((t) => (t.op === '×') === wantTimes)
  const template = pool[randInt(0, pool.length - 1, rng)]
  const theme = pickTheme(rng)

  let a: number
  let b: number
  let answer: number
  if (template.op === '+') {
    a = randInt(3, 12, rng)
    b = randInt(2, 8, rng)
    answer = a + b
  } else if (template.op === '-') {
    a = randInt(5, 20, rng)
    b = randInt(1, a - 1, rng)
    answer = a - b
  } else {
    a = randInt(2, 5, rng)
    b = [2, 3, 4, 5, 10][randInt(0, 4, rng)]
    answer = a * b
  }

  const story = template.text
    .replaceAll('{a}', String(a))
    .replaceAll('{b}', String(b))
    .replaceAll('{things}', theme.plural)

  return {
    id: makeId('story', rng),
    activity: 'word-problem',
    prompt: story,
    payload: { story },
    options: buildNumberOptions(answer, 0, Math.max(25, answer + 3), 3, rng),
    answer,
  }
}
