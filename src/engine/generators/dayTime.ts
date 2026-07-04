import type { DayTimeQuestion, Rng } from '../types'
import { DAY_SCENES } from '../../content/world'
import { makeId, randInt, shuffle } from '../random'

/**
 * day-time — times of day as scenes (I1: sequencing the day). "Tap the
 * morning one!" — vocabulary + scene recognition, no clock needed yet.
 */
export function generateDayTime(
  params: Record<string, number>,
  rng: Rng = Math.random,
): DayTimeQuestion {
  void params
  const scenes = shuffle(DAY_SCENES, rng)
  const answer = randInt(0, scenes.length - 1, rng)
  const target = scenes[answer]
  return {
    id: makeId('daytime', rng),
    activity: 'day-time',
    prompt: `Tap the ${target.name} one!`,
    payload: { scenes: scenes.map((s) => ({ ...s })), targetName: target.name },
    options: scenes.map((_, i) => i),
    answer,
  }
}
