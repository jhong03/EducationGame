import type { MakeAmountQuestion, Rng } from '../types'
import { numberWord } from '../../content/words'
import { buildNumberOptions, makeId, randInt } from '../random'

/**
 * make-amount — "make 6!": a pile of unit coins; the child taps coins up to
 * the target (each picked coin wears a ✓, the pile shows the running total),
 * then presses ✔️. There are always more coins than needed, so restraint —
 * stopping at the target — is part of the skill (G2: make an amount).
 */
export function generateMakeAmount(
  params: Record<string, number>,
  rng: Rng = Math.random,
): MakeAmountQuestion {
  const max = Math.max(3, params.max ?? 8)
  const target = randInt(2, max - 1, rng) // never "tap everything"
  const coinCount = max
  return {
    id: makeId('makeamt', rng),
    activity: 'make-amount',
    prompt: `Can you make ${numberWord(target)}?`,
    payload: { coinCount, target },
    options: buildNumberOptions(target, 0, coinCount, 3, rng),
    answer: target,
  }
}
