import type { Rng, SetClockQuestion } from '../types'
import { numberWord } from '../../content/words'
import { buildNumberOptions, makeId, randInt, randIntExcept } from '../random'

/**
 * set-clock — "make it 4 o'clock!": the clock starts on a different hour and
 * the child TURNS the hand (tap-to-advance — easier than dragging for small
 * motor skills), then confirms. O'clock times only at this rung.
 */
export function generateSetClock(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SetClockQuestion {
  void params
  const targetHour = randInt(1, 12, rng)
  const startHour = randIntExcept(1, 12, targetHour, rng)
  return {
    id: makeId('setclock', rng),
    activity: 'set-clock',
    prompt: `Turn the clock to ${numberWord(targetHour)} o'clock!`,
    payload: { targetHour, startHour },
    options: buildNumberOptions(targetHour, 1, 12, 3, rng),
    answer: targetHour,
  }
}
