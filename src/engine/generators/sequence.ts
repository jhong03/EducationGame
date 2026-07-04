import type { Rng, SequenceQuestion } from '../types'
import { numberWord } from '../../content/words'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * sequence — "what comes next?": a short ascending run of numbers, then a
 * blank. Phase 1 uses step 1 (counting on, up to `max`); later levels can pass
 * `step: 2|5|10` for skip-counting without touching this code.
 *
 * Invariant, BY CONSTRUCTION: the run and the answer stay within
 * [1, effectiveMax], where effectiveMax = max(max, 1 + 3*step). For any sane
 * level (max ≥ 1 + 3*step) that is exactly [1, max]; if a level under-sizes
 * `max` for its step, the range grows just enough to stay coherent instead of
 * silently emitting numbers past the promised bound.
 */
export function generateSequence(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SequenceQuestion {
  const max = params.max ?? 20
  const rawStep = params.step ?? 1
  const descending = rawStep < 0
  const step = Math.max(1, Math.abs(rawStep))
  // align: 1 → the run starts on a multiple of the step (10, 20, 30… not
  // 7, 17, 27) — how skip-counting is first taught.
  const align = (params.align ?? 0) === 1 && step > 1
  const shownCount = 3
  // The smallest max that can hold a full run starting at 1.
  const effectiveMax = Math.max(max, 1 + shownCount * step)

  let start: number
  if (align) {
    const maxMultiple = Math.max(1, Math.floor((effectiveMax - shownCount * step) / step))
    start = step * randInt(1, maxMultiple, rng)
  } else {
    start = randInt(1, effectiveMax - shownCount * step, rng)
  }

  // Descending runs walk down toward 1 from a high enough perch.
  if (descending) start = start + shownCount * step

  const dir = descending ? -1 : 1
  const shown = Array.from({ length: shownCount }, (_, i) => start + dir * i * step)
  const answer = start + dir * shownCount * step
  return {
    id: makeId('sequence', rng),
    activity: 'sequence',
    prompt: `What comes next? ${shown.map(numberWord).join(', ')}…`,
    payload: { shown },
    options: buildNumberOptions(answer, 1, effectiveMax, 3, rng),
    answer,
  }
}
