import type { DecimalQuestion, Rng } from '../types'
import { makeId, randInt, randIntExcept, shuffle } from '../random'

/**
 * decimal — read tenths (a 10-part bar) or hundredths (a 10×10 grid) as a
 * decimal (E5). The flagship decoy is the place misread: 0.7 for 0.07 (and
 * vice versa) — exactly the mistake this rung exists to catch.
 */
export function generateDecimal(
  params: Record<string, number>,
  rng: Rng = Math.random,
): DecimalQuestion {
  const den: 10 | 100 = (params.den ?? 10) === 100 ? 100 : 10

  let num: number
  let label: string
  const candidates: string[] = []
  if (den === 10) {
    num = randInt(1, 9, rng)
    label = `0.${num}`
    // Place misread ("0.03"), then a different tenth.
    candidates.push(`0.0${num}`, `0.${randIntExcept(1, 9, num, rng)}`)
  } else {
    // Not a multiple of 10, so the label needs BOTH decimal places.
    do {
      num = randInt(1, 99, rng)
    } while (num % 10 === 0)
    const pad = String(num).padStart(2, '0')
    label = `0.${pad}`
    if (num < 10) {
      candidates.push(`0.${num}`) // 0.7 offered against 0.07
    } else {
      const swapped = pad.split('').reverse().join('')
      candidates.push(`0.${swapped}`) // 0.43 against 0.34
    }
    const other = randIntExcept(1, 99, num, rng)
    candidates.push(`0.${String(other).padStart(2, '0')}`)
    candidates.push(`0.${String(num < 99 ? num + 1 : num - 1).padStart(2, '0')}`)
  }

  const labels = new Set<string>([label])
  for (const c of candidates) {
    if (labels.size >= 3) break
    if (c !== label) labels.add(c)
  }

  const optionLabels = shuffle([...labels], rng)
  return {
    id: makeId('dec', rng),
    activity: 'decimal',
    prompt:
      den === 10
        ? 'How much of the bar is shaded? Pick the decimal!'
        : 'How much of the square is shaded? Pick the decimal!',
    payload: { num, den, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(label),
  }
}
