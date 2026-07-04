import type { ClockQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * clock — read an analog clock (I2/I3 in CURRICULUM.md). `step: 60` asks
 * o'clock times only; `step: 30` mixes in half-past. The three choices share
 * the shown minute and differ by HOUR (one skill per question); the tapped
 * choice's INDEX is the answer.
 */
export function generateClock(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ClockQuestion {
  const step = params.step ?? 60
  const hour = randInt(1, 12, rng)
  const minute = step <= 30 && rng() < 0.5 ? 30 : 0

  // Two distractor hours, all distinct, same minute.
  const second = randIntExcept(1, 12, hour, rng)
  let third = randIntExcept(1, 12, hour, rng)
  for (let guard = 0; third === second && guard < 12; guard++) {
    third = randIntExcept(1, 12, hour, rng)
  }
  const choices = shuffle(
    [hour, second, third].map((h) => ({ hour: h, minute })),
    rng,
  )
  const answer = choices.findIndex((c) => c.hour === hour)

  return {
    id: makeId('clock', rng),
    activity: 'clock',
    // Deliberately does NOT speak the time — reading the clock IS the skill.
    prompt: 'What time is it?',
    payload: { hour, minute, choices },
    options: choices.map((_, i) => i),
    answer,
  }
}
