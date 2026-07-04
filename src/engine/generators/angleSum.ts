import type { AngleSumQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * angle-sum — missing-angle arithmetic (J5–J7): angles on a straight line
 * (one known part) or in a triangle (two known parts) make 180°. All angles
 * are multiples of ten and the missing one is never smaller than 20°, so the
 * work is the RULE, not fiddly subtraction. The 90-minus slip (treating the
 * line as a right angle) rides along when it is positive.
 */
export function generateAngleSum(
  params: Record<string, number>,
  rng: Rng = Math.random,
): AngleSumQuestion {
  const triangle = (params.parts ?? 1) === 2
  const total = 180

  let parts: number[]
  if (triangle) {
    const p1 = 10 * randInt(3, 9, rng) // 30..90
    const p2 = 10 * randInt(2, Math.floor((160 - p1) / 10), rng) // leaves ≥ 20
    parts = [p1, p2]
  } else {
    parts = [10 * randInt(2, 16, rng)] // 20..160
  }
  const known = parts.reduce((x, y) => x + y, 0)
  const answer = total - known

  const options = new Set<number>([answer])
  for (const c of [answer - 10, answer + 10, 90 - known]) {
    if (options.size >= 3) break
    if (c > 0 && c !== answer) options.add(c)
  }

  return {
    id: makeId('angsum', rng),
    activity: 'angle-sum',
    prompt: triangle
      ? `A triangle's angles add up to 180 degrees. Two of them are ${parts[0]} and ${parts[1]} — what is the third?`
      : `Angles on a straight line add up to 180 degrees. One is ${parts[0]} — what is the other?`,
    payload: { parts, total },
    options: shuffle([...options], rng),
    answer,
  }
}
