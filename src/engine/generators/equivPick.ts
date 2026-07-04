import type { EquivPickQuestion, Rng } from '../types'
import { fractionWord } from '../../content/words'
import { makeId, randInt, shuffle } from '../random'

/**
 * equiv-pick — fraction ↔ decimal ↔ percent equivalence (E6). One family per
 * row; `mode: 0` shows the fraction and asks for the decimal, `mode: 1` shows
 * the fraction OR decimal and asks for the percent. Decoys are the same-form
 * values of OTHER rows, so every wrong card is a real number a child knows.
 */
export const EQUIV_TABLE: readonly [string, string, string][] = [
  // [fraction, decimal, percent]
  ['1/2', '0.5', '50%'],
  ['1/4', '0.25', '25%'],
  ['3/4', '0.75', '75%'],
  ['1/10', '0.1', '10%'],
  ['1/5', '0.2', '20%'],
  ['1/100', '0.01', '1%'],
] as const

export function generateEquivPick(
  params: Record<string, number>,
  rng: Rng = Math.random,
): EquivPickQuestion {
  const wantPercent = (params.mode ?? 0) === 1
  const targetCol = wantPercent ? 2 : 1
  const rowIdx = randInt(0, EQUIV_TABLE.length - 1, rng)
  const row = EQUIV_TABLE[rowIdx]

  // mode 0 always shows the fraction; mode 1 shows the fraction or decimal.
  const shownCol = wantPercent ? randInt(0, 1, rng) : 0
  const shown = row[shownCol]
  const correct = row[targetCol]

  // Two other rows' same-form values as decoys (all distinct by table design).
  const others = shuffle(
    EQUIV_TABLE.filter((_, i) => i !== rowIdx),
    rng,
  ).slice(0, 2)
  const optionLabels = shuffle([correct, ...others.map((r) => r[targetCol])], rng)

  const [num, den] = row[0].split('/').map(Number)
  const spokenShown = shownCol === 0 ? fractionWord(num, den) : shown
  return {
    id: makeId('equiv', rng),
    activity: 'equiv-pick',
    prompt: `Which one is the same as ${spokenShown}?`,
    payload: { shown, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: optionLabels.indexOf(correct),
  }
}
