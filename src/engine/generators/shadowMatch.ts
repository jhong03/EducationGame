import type { Rng, ShadowMatchQuestion, Theme } from '../types'
import { THEMES } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * shadow-match — "Which one made this shadow?" (Puzzle Grove, L1/L3 visual
 * reasoning). One object rendered as a silhouette; the child taps the object
 * it belongs to.
 *
 * Silhouette twins: some themes are indistinguishable as black outlines
 * (apple vs cookie — both circles), so the choice set never contains two
 * themes from the same silhouette group.
 */
const SILHOUETTE_GROUPS: Record<string, string> = {
  apple: 'round',
  cookie: 'round',
  ball: 'round',
  // every other theme reads distinctly in silhouette
}

function silhouetteGroup(theme: Theme): string {
  return SILHOUETTE_GROUPS[theme.id] ?? theme.id
}

export function generateShadowMatch(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ShadowMatchQuestion {
  const count = Math.max(2, Math.min(params.choices ?? 3, 4))

  // Greedily take themes whose silhouette group is not yet used.
  const seen = new Set<string>()
  const picked: Theme[] = []
  for (const theme of shuffle(THEMES, rng)) {
    const group = silhouetteGroup(theme)
    if (seen.has(group)) continue
    seen.add(group)
    picked.push(theme)
    if (picked.length >= count) break
  }

  const answer = randInt(0, picked.length - 1, rng)
  const target = picked[answer]
  return {
    id: makeId('shadow', rng),
    activity: 'shadow-match',
    prompt: 'Which one made this shadow?',
    payload: {
      targetEmoji: target.emoji,
      choices: picked.map((t) => ({ emoji: t.emoji, name: t.singular })),
    },
    options: picked.map((_, i) => i),
    answer,
  }
}
