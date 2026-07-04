import type { Rng, WordProblemQuestion } from '../types'
import { STORY_TEMPLATES, TWO_STEP_TEMPLATES } from '../../content/stories'
import { pickTheme } from '../../content/themes'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * word-problem — a story, spoken and shown (L4/L5). `ops: 1` mixes one-step
 * add & subtract stories; `ops: 2` uses the times stories. The upper band's
 * TWO-step stories: `ops: 3` (add/subtract chains) and `ops: 4` (a times
 * step first). Numbers are sized so every intermediate stays whole and ≥ 0.
 */
export function generateWordProblem(
  params: Record<string, number>,
  rng: Rng = Math.random,
): WordProblemQuestion {
  const ops = params.ops ?? 1
  if (ops >= 3) return generateTwoStep(ops === 4, rng)
  const wantTimes = ops === 2
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

/** The two-step stories (L5): answer = (a op1 b) op2 c, everything ≥ 0. */
function generateTwoStep(wantTimes: boolean, rng: Rng): WordProblemQuestion {
  const pool = TWO_STEP_TEMPLATES.filter((t) => (t.ops[0] === '×') === wantTimes)
  const template = pool[randInt(0, pool.length - 1, rng)]
  const theme = pickTheme(rng)
  const [op1, op2] = template.ops

  let a: number
  let b: number
  if (op1 === '×') {
    a = randInt(2, 4, rng)
    b = randInt(2, 5, rng)
  } else if (op1 === '-') {
    a = randInt(8, 20, rng)
    b = randInt(1, a - 3, rng) // leaves ≥ 3 for the second take-away
  } else {
    a = randInt(5, 12, rng)
    b = randInt(3, 9, rng)
  }
  const step1 = op1 === '×' ? a * b : op1 === '-' ? a - b : a + b
  const c = op2 === '-' ? randInt(1, Math.min(9, step1 - 1), rng) : randInt(2, 8, rng)
  const answer = op2 === '-' ? step1 - c : step1 + c

  const story = template.text
    .replaceAll('{a}', String(a))
    .replaceAll('{b}', String(b))
    .replaceAll('{c}', String(c))
    .replaceAll('{things}', theme.plural)

  return {
    id: makeId('story2', rng),
    activity: 'word-problem',
    prompt: story,
    payload: { story },
    options: buildNumberOptions(answer, 0, Math.max(30, answer + 3), 3, rng),
    answer,
  }
}
