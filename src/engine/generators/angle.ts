import type { AngleQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * angle — spot the right/acute/obtuse angle (J5/J6). Three drawn angles, one
 * of each family, so exactly one card can match the spoken target. Degrees
 * are payload for the renderer only — never printed.
 */
const ACUTE = [30, 45, 60] as const
const OBTUSE = [120, 135, 150] as const

export function generateAngle(
  params: Record<string, number>,
  rng: Rng = Math.random,
): AngleQuestion {
  const askRight = (params.mode ?? 0) === 0
  const acute = ACUTE[randInt(0, ACUTE.length - 1, rng)]
  const obtuse = OBTUSE[randInt(0, OBTUSE.length - 1, rng)]

  const target: AngleQuestion['payload']['target'] = askRight
    ? 'right'
    : randInt(0, 1, rng) === 0
      ? 'acute'
      : 'obtuse'

  const degrees = shuffle([90, acute, obtuse], rng)
  const targetDegrees = target === 'right' ? 90 : target === 'acute' ? acute : obtuse
  const answer = degrees.indexOf(targetDegrees)

  const spoken =
    target === 'right'
      ? 'Tap the RIGHT angle — the perfect corner!'
      : target === 'acute'
        ? 'Tap the ACUTE angle — the sharp, narrow one!'
        : 'Tap the OBTUSE angle — the wide-open one!'

  return {
    id: makeId('angle', rng),
    activity: 'angle',
    prompt: spoken,
    payload: { degrees, target },
    options: degrees.map((_, i) => i),
    answer,
  }
}
