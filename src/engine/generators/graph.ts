import type { GraphCountQuestion, GraphMostQuestion, Rng } from '../types'
import { THEMES } from '../../content/themes'
import { buildNumberOptions, makeId, randInt, shuffle } from '../random'

/**
 * graph-count / graph-most — read a block graph (K2/K3). Columns are stacks
 * of countable blocks (values 1–8, all distinct so "most" is never a tie).
 */
function makeColumns(rng: Rng) {
  const themes = shuffle(THEMES, rng).slice(0, 3)
  const values = new Set<number>()
  while (values.size < 3) values.add(randInt(1, 8, rng))
  const vals = shuffle([...values], rng)
  return themes.map((t, i) => ({ emoji: t.emoji, name: t.singular, value: vals[i] }))
}

export function generateGraphCount(
  params: Record<string, number>,
  rng: Rng = Math.random,
): GraphCountQuestion {
  void params
  const items = makeColumns(rng)
  const targetIndex = randInt(0, items.length - 1, rng)
  const answer = items[targetIndex].value
  return {
    id: makeId('graphc', rng),
    activity: 'graph-count',
    prompt: `How many ${items[targetIndex].name} blocks does the graph show?`,
    payload: { items, targetIndex },
    options: buildNumberOptions(answer, 1, 8, 3, rng),
    answer,
  }
}

export function generateGraphMost(
  params: Record<string, number>,
  rng: Rng = Math.random,
): GraphMostQuestion {
  void params
  const items = makeColumns(rng)
  let answer = 0
  for (let i = 1; i < items.length; i++) {
    if (items[i].value > items[answer].value) answer = i
  }
  return {
    id: makeId('graphm', rng),
    activity: 'graph-most',
    prompt: 'Which one has the most?',
    payload: { items },
    options: items.map((_, i) => i),
    answer,
  }
}
