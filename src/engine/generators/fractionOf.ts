import type { FractionOfQuestion, Rng } from '../types'
import { makeId, randInt, shuffle } from '../random'

/**
 * fraction-of — read a shaded bar (E1/E2 in CURRICULUM.md, the bar model
 * Singapore builds everything on). `dens: 1` keeps to halves/quarters;
 * `dens: 2` opens unit fractions to eighths; `unit: 0` allows more than one
 * shaded piece (non-unit fractions like 3/4).
 */
const DEN_SETS: Record<number, readonly number[]> = {
  1: [2, 4],
  2: [2, 3, 4, 5, 6, 8],
}

export function generateFractionOf(
  params: Record<string, number>,
  rng: Rng = Math.random,
): FractionOfQuestion {
  const dens = DEN_SETS[params.dens ?? 1] ?? DEN_SETS[1]
  const unitOnly = (params.unit ?? 1) === 1
  const den = dens[randInt(0, dens.length - 1, rng)]
  const num = unitOnly ? 1 : randInt(1, den - 1, rng)
  const label = `${num}/${den}`

  // Distractors: same numerator with a different denominator (the classic
  // "count the pieces wrong"), and the flipped shading (den−num / den).
  const wrongDen = dens.find((d) => d !== den) ?? den + 1
  const candidates = [`${num}/${wrongDen}`, `${den - num}/${den}`, `1/${den + 1}`]
  const labels = new Set<string>([label])
  for (const c of candidates) {
    if (labels.size >= 3) break
    if (c !== label) labels.add(c)
  }

  const optionLabels = shuffle([...labels].slice(0, 3), rng)
  return {
    id: makeId('frac', rng),
    activity: 'fraction-of',
    prompt: 'What fraction is shaded?',
    payload: { num, den, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(label),
  }
}
