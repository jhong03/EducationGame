import type { PositionQuestion, Rng } from '../types'
import { THEMES } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * position — positional language (first / middle / last): three different
 * things in a row; tap the one the voice asks for. The row order IS the
 * question, so items are never reshuffled after generation.
 */
const TARGETS = ['first', 'middle', 'last'] as const

export function generatePosition(
  params: Record<string, number>,
  rng: Rng = Math.random,
): PositionQuestion {
  void params
  const themes = shuffle(THEMES, rng).slice(0, 3)
  const target = TARGETS[randInt(0, TARGETS.length - 1, rng)]
  const answer = target === 'first' ? 0 : target === 'middle' ? 1 : 2
  return {
    id: makeId('position', rng),
    activity: 'position',
    prompt: `Tap the ${target} one!`,
    payload: {
      items: themes.map((t) => ({ emoji: t.emoji, name: t.singular })),
      target,
    },
    options: [0, 1, 2],
    answer,
  }
}
