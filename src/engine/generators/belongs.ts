import type { BelongsQuestion, Rng } from '../types'
import { THEMES, themesOfKind, type ThemeKind } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/**
 * belongs — sorting by rule (Puzzle Grove, L1): two things of one kind are
 * shown ("these go together"); the child picks which of three candidates
 * belongs with them. Exactly one candidate shares the kind.
 */
const KINDS: readonly ThemeKind[] = ['food', 'animal', 'nature'] // each has ≥ 3 members

export function generateBelongs(
  params: Record<string, number>,
  rng: Rng = Math.random,
): BelongsQuestion {
  void params
  const kind = KINDS[randInt(0, KINDS.length - 1, rng)]
  const members = shuffle(themesOfKind(kind), rng)
  const shown = members.slice(0, 2).map((t) => ({ emoji: t.emoji, name: t.singular }))
  const correct = members[2]

  // Two distractors from OTHER kinds, distinct themes.
  const outsiders = shuffle(
    THEMES.filter((t) => !themesOfKind(kind).includes(t)),
    rng,
  ).slice(0, 2)

  const choiceThemes = shuffle([correct, ...outsiders], rng)
  const answer = choiceThemes.findIndex((t) => t.id === correct.id)
  return {
    id: makeId('belongs', rng),
    activity: 'belongs',
    prompt: 'These go together! Which one belongs with them?',
    payload: {
      shown,
      choices: choiceThemes.map((t) => ({ emoji: t.emoji, name: t.singular })),
    },
    options: choiceThemes.map((_, i) => i),
    answer,
  }
}
