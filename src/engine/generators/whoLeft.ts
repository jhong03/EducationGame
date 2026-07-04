import type { Rng, WhoLeftQuestion } from '../types'
import { THEMES } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * who-left — a memory game: three friends appear, then one slips away while
 * hidden. "Who went away?" The options are the SAME three friends, so the
 * child recalls the missing one rather than eliminating strangers.
 */
export function generateWhoLeft(
  params: Record<string, number>,
  rng: Rng = Math.random,
): WhoLeftQuestion {
  const count = Math.max(2, Math.min(params.count ?? 3, 4))
  const flashMs = params.flashMs ?? 2600
  const themes = shuffle(THEMES, rng).slice(0, count)
  const missing = randInt(0, count - 1, rng)
  const items = themes.map((t) => ({ emoji: t.emoji, name: t.singular }))
  return {
    id: makeId('wholeft', rng),
    activity: 'who-left',
    prompt: 'Look carefully… who went away?',
    payload: { items, missing, flashMs },
    options: items.map((_, i) => i),
    answer: missing,
  }
}
