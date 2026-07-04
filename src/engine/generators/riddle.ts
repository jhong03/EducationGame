import type { RiddleQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * riddle — "I'm thinking of a number" (F6/F7, one- and two-step equations in
 * disguise). Easy: ?×k + c = r (undo two steps). Hard: (? + a)×b = r (the
 * bracket must be undone LAST). The flagship decoy is the half-undone
 * number — the child who reversed one step and stopped.
 */
export function generateRiddle(
  params: Record<string, number>,
  rng: Rng = Math.random,
): RiddleQuestion {
  const hard = (params.hard ?? 0) === 1
  const n = randInt(2, 9, rng)

  let text: string
  let prompt: string
  let halfway: number
  if (hard) {
    const add = randInt(1, 5, rng)
    const times = randInt(2, 4, rng)
    const r = (n + add) * times
    text = `(? + ${add}) × ${times} = ${r}`
    prompt = `I am thinking of a number. I add ${add}, then times it by ${times}, and get ${r}. What is my number?`
    halfway = r / times // divided but forgot to take the ${add} away
  } else {
    const times = randInt(2, 4, rng)
    const plus = randInt(1, 9, rng)
    const r = n * times + plus
    text = `? × ${times} + ${plus} = ${r}`
    prompt = `I am thinking of a number. I times it by ${times} and add ${plus} to get ${r}. What is my number?`
    halfway = r - plus // took the ${plus} away but forgot to divide
  }

  const options = new Set<number>([n, halfway]) // halfway ≠ n by construction
  for (const filler of [n + 1, n - 1]) {
    if (options.size >= 3) break
    if (filler >= 1) options.add(filler)
  }

  return {
    id: makeId('riddle', rng),
    activity: 'riddle',
    prompt,
    payload: { text },
    options: shuffle([...options], rng),
    answer: n,
  }
}
