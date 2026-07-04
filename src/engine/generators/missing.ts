import type { MissingQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'
import { TABLE_SETS } from './multiply'

/**
 * missing — the blank in the equation (F4, the door into algebra):
 * □ + 3 = 7 · 5 + □ = 9 · 8 − □ = 3, and with `op: 1`, □ × 5 = 20.
 */
export function generateMissing(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MissingQuestion {
  const multiplication = (params.op ?? 0) === 1
  const max = Math.max(5, params.max ?? 20)

  let text: string
  let answer: number
  let hi = max
  if (multiplication) {
    const set = TABLE_SETS[1]
    const b = set[randInt(0, set.length - 1, rng)]
    answer = randInt(2, 9, rng)
    text = `□ × ${b} = ${answer * b}`
    hi = 12
  } else {
    const form = randInt(0, 2, rng)
    const c = randInt(3, max, rng)
    const part = randInt(1, c - 1, rng)
    if (form === 0) {
      answer = c - part
      text = `□ + ${part} = ${c}`
    } else if (form === 1) {
      answer = c - part
      text = `${part} + □ = ${c}`
    } else {
      answer = part
      text = `${c} − □ = ${c - part}`
    }
  }

  return {
    id: makeId('missing', rng),
    activity: 'missing',
    prompt: 'What number is hiding in the box?',
    payload: { text },
    options: buildNumberOptions(answer, 0, hi, 3, rng),
    answer,
  }
}
