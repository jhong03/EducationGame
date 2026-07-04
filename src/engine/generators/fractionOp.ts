import type { FractionOpQuestion, Rng } from '../types'
import { fractionWord } from '../../content/words'
import { makeId, randInt, shuffle } from '../random'

/**
 * fraction-op — fractions beyond reading one bar (E3/E4 in CURRICULUM.md):
 * `op: 0` equivalence ("which is the same as 1/2?"), `op: 1` add and `op: 2`
 * subtract with the SAME denominator. Distractors are the misconceptions
 * children really bring: add-one-to-top-and-bottom for equivalence, and
 * adding the denominators too for fraction addition.
 */

/** Base fractions for equivalence — small denominators so the bar stays readable. */
const BASES: readonly [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
] as const

/** Denominators the add/subtract rungs draw from. */
const OP_DENS: readonly number[] = [4, 5, 6, 8, 10] as const

export function generateFractionOp(
  params: Record<string, number>,
  rng: Rng = Math.random,
): FractionOpQuestion {
  const op = params.op ?? 0
  if (op === 0) return generateEquivalence(rng)
  return generateSameDenOp(op === 2, rng)
}

function generateEquivalence(rng: Rng): FractionOpQuestion {
  const [n, d] = BASES[randInt(0, BASES.length - 1, rng)]
  // Scale so the equivalent's denominator stays ≤ 12 (k ≥ 2 always fits: d ≤ 5).
  const k = randInt(2, Math.floor(12 / d), rng)
  const label = `${n * k}/${d * k}`

  // Distractors: +1 to top AND bottom (looks fair, isn't), and scaling only
  // the bottom. Neither can be value-equal to n/d (that needs n = d), so the
  // equivalence is always unique among the cards.
  const candidates = [`${n + 1}/${d + 1}`, `${n}/${d * k}`, `1/${d * k + 1}`]
  const labels = new Set<string>([label])
  for (const c of candidates) {
    if (labels.size >= 3) break
    if (c !== label) labels.add(c)
  }

  const optionLabels = shuffle([...labels], rng)
  return {
    id: makeId('fracop', rng),
    activity: 'fraction-op',
    prompt: `Which one is the same as ${fractionWord(n, d)}?`,
    payload: { op: 'same', aNum: n, bNum: 0, den: d, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(label),
  }
}

function generateSameDenOp(subtract: boolean, rng: Rng): FractionOpQuestion {
  const den = OP_DENS[randInt(0, OP_DENS.length - 1, rng)]
  let a: number
  let b: number
  if (subtract) {
    a = randInt(2, den - 1, rng)
    b = randInt(1, a - 1, rng)
  } else {
    a = randInt(1, den - 2, rng)
    b = randInt(1, den - 1 - a, rng) // sum stays proper (< 1 whole)
  }
  const result = subtract ? a - b : a + b
  const label = `${result}/${den}`

  // rAlt: the near-miss numerator, kept ≥ 1 and < den.
  const rAlt = result + 1 <= den - 1 ? result + 1 : result - 1
  // Final entry is a guaranteed-distinct filler (different denominator), so
  // the card row never comes up short when the classics collide (e.g. a=2,b=1).
  const candidates = subtract
    ? [`${a}/${den}`, `${rAlt}/${den}`, `${b}/${den}`, `${result}/${den * 2}`] // "forgot to take away" first
    : [`${result}/${den * 2}`, `${rAlt}/${den}`, `${b}/${den}`] // added the denominators too
  const labels = new Set<string>([label])
  for (const c of candidates) {
    if (labels.size >= 3) break
    if (c !== label) labels.add(c)
  }

  const optionLabels = shuffle([...labels], rng)
  return {
    id: makeId('fracop', rng),
    activity: 'fraction-op',
    prompt: `What is ${fractionWord(a, den)} ${subtract ? 'minus' : 'plus'} ${fractionWord(b, den)}?`,
    payload: { op: subtract ? 'sub' : 'add', aNum: a, bNum: b, den, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(label),
  }
}
