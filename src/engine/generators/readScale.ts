import type { ReadScaleQuestion, Rng } from '../types'
import { SCALE_UNITS } from '../../content/world'
import { makeId, randInt, shuffle } from '../random'

/**
 * read-scale — read a partitioned ruler/scale (H3/H4): major ticks carry
 * numbers, minor ticks don't, and the pointer always sits on an UNLABELED
 * tick — the child must count divisions, not read a printed number.
 * Distractors are the neighbouring ticks (the off-by-one-division misread).
 */
export function generateReadScale(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ReadScaleQuestion {
  const max = Math.max(4, params.max ?? 10)
  const step = Math.max(1, params.step ?? 1)
  const labelEvery = Math.max(step, params.labelEvery ?? step * 2)
  const unit = SCALE_UNITS[params.unit ?? 0] ?? SCALE_UNITS[0]

  // Interior ticks that carry no label; fall back to any interior tick if the
  // params label everything (defensive — content shouldn't do that).
  const unlabeled: number[] = []
  const interior: number[] = []
  for (let v = step; v < max; v += step) {
    interior.push(v)
    if (v % labelEvery !== 0) unlabeled.push(v)
  }
  const pool = unlabeled.length > 0 ? unlabeled : interior
  const value = pool[randInt(0, pool.length - 1, rng)]

  const options = new Set<number>([value])
  for (const cand of [value - step, value + step, value - 2 * step, value + 2 * step]) {
    if (options.size >= 3) break
    if (cand >= 0 && cand <= max) options.add(cand)
  }

  return {
    id: makeId('scale', rng),
    activity: 'read-scale',
    prompt: `Where is the arrow pointing? How many ${unit.spoken}?`,
    payload: { max, step, labelEvery, value, unit: unit.label },
    options: shuffle([...options], rng),
    answer: value,
  }
}
