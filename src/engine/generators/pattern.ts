import type { PatternQuestion, Rng } from '../types'
import { THEMES } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * pattern — copy & extend a repeating pattern (F1 in CURRICULUM.md). A motif
 * unit (AB, or with `kinds: 2` also AAB/ABB) repeats until at least five
 * items are showing, then a blank asks for the next item. Options are the two
 * pattern motifs plus one outsider — exactly one continues the pattern.
 */
const UNITS: readonly (readonly ('A' | 'B' | 'C')[])[] = [
  ['A', 'B'],
  ['A', 'A', 'B'],
  ['A', 'B', 'B'],
  ['A', 'B', 'C'], // three-part patterns (kinds: 4)
]

export function generatePattern(
  params: Record<string, number>,
  rng: Rng = Math.random,
): PatternQuestion {
  const kinds = Math.min(params.kinds ?? 1, UNITS.length)
  const unit = UNITS[randInt(0, kinds - 1, rng)]

  // Distinct themes: the pattern motifs plus (for two-motif units) an
  // outsider distractor. ABC units use all three motifs as the options —
  // no outsider giveaway.
  const [a, b, c] = shuffle(THEMES, rng).slice(0, 3)
  const motifOf = (slot: 'A' | 'B' | 'C') =>
    slot === 'A' ? a.emoji : slot === 'B' ? b.emoji : c.emoji

  // Repeat the unit to at least five visible items; the next one is the blank.
  const visibleCount = Math.max(5, unit.length * 2)
  const sequence = Array.from({ length: visibleCount }, (_, i) =>
    motifOf(unit[i % unit.length]),
  )
  const nextMotif = motifOf(unit[visibleCount % unit.length])

  const optionMotifs = shuffle([a.emoji, b.emoji, c.emoji], rng)
  const answer = optionMotifs.indexOf(nextMotif)
  return {
    id: makeId('pattern', rng),
    activity: 'pattern',
    prompt: 'What comes next in the pattern?',
    payload: { sequence, optionMotifs },
    options: optionMotifs.map((_, i) => i),
    answer,
  }
}
