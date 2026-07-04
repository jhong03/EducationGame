import type { ClockQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * clock — read an analog clock (I2/I3/I4 in CURRICULUM.md). `step: 60` asks
 * o'clock only; `step: 30` mixes in half-past (choices differ by HOUR);
 * `step: 5` reads to five minutes (hour fixed, choices differ by MINUTE) —
 * one skill per question either way. The tapped choice's INDEX is the answer.
 */
export function generateClock(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ClockQuestion {
  const step = params.step ?? 60
  const hour = randInt(1, 12, rng)

  let minute: number
  let choices: Array<{ hour: number; minute: number }>
  if (step <= 5) {
    // Minutes are the skill: same hour, three distinct five-minute marks.
    const slot = randInt(0, 11, rng)
    minute = slot * 5
    const second = randIntExcept(0, 11, slot, rng)
    let third = randIntExcept(0, 11, slot, rng)
    for (let guard = 0; third === second && guard < 12; guard++) {
      third = randIntExcept(0, 11, slot, rng)
    }
    choices = shuffle(
      [slot, second, third].map((s) => ({ hour, minute: s * 5 })),
      rng,
    )
  } else {
    // Hours are the skill: same minute, three distinct hours.
    minute = step <= 30 && rng() < 0.5 ? 30 : 0
    const second = randIntExcept(1, 12, hour, rng)
    let third = randIntExcept(1, 12, hour, rng)
    for (let guard = 0; third === second && guard < 12; guard++) {
      third = randIntExcept(1, 12, hour, rng)
    }
    choices = shuffle(
      [hour, second, third].map((h) => ({ hour: h, minute })),
      rng,
    )
  }

  const answer = choices.findIndex((c) => c.hour === hour && c.minute === minute)

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
