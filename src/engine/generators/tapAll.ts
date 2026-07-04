import type { Rng, TapAllQuestion } from '../types'
import { SHAPES, shapeById } from '../../content/shapes'
import { makeId, randInt, shuffle } from '../random'

/**
 * tap-all — "tap ALL the circles!": a board of shapes where the target
 * appears 2–3 times among distractors; the child finds every one. The board
 * is shuffled; `answer` is the target count (submitted by the stage when the
 * last one is found).
 */
export function generateTapAll(
  params: Record<string, number>,
  rng: Rng = Math.random,
): TapAllQuestion {
  const board = Math.max(4, Math.min(params.board ?? 6, 9))
  const pool = SHAPES.slice(0, 4) // circle / square / triangle / star
  const target = pool[randInt(0, pool.length - 1, rng)]
  const count = randInt(2, 3, rng)

  // Fill the rest of the board with non-target shapes (repeats allowed).
  const others = pool.filter((s) => s.id !== target.id)
  const filler = Array.from(
    { length: board - count },
    () => others[randInt(0, others.length - 1, rng)].id,
  )
  const shapeIds = shuffle(
    [...Array.from({ length: count }, () => target.id), ...filler],
    rng,
  )
  return {
    id: makeId('tapall', rng),
    activity: 'tap-all',
    prompt: `Tap ALL the ${shapeById(target.id)?.name ?? target.id}s!`,
    payload: { shapeIds, targetId: target.id, count },
    options: [count, count === 2 ? 3 : 2], // exactly-one-correct contract
    answer: count,
  }
}
