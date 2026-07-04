import type { ElapsedQuestion, Rng } from '../types'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * elapsed — whole hours between two clock faces (I6). Start and end stay on
 * the same "day arc" (1 → 12) so the difference is always plain subtraction.
 */
export function generateElapsed(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ElapsedQuestion {
  void params
  const startHour = randInt(1, 9, rng)
  const answer = randInt(1, Math.min(6, 12 - startHour), rng)
  const endHour = startHour + answer
  return {
    id: makeId('elapsed', rng),
    activity: 'elapsed',
    prompt: `From ${startHour} o'clock to ${endHour} o'clock — how many hours?`,
    payload: { startHour, endHour },
    options: buildNumberOptions(answer, 1, 8, 3, rng),
    answer,
  }
}
