import type { ChanceQuestion, Rng } from '../types'
import { CHANCE_LABELS, CHANCE_SCENARIOS } from '../../content/world'
import { makeId, randInt } from '../random'

/**
 * chance — probability language (K7): certain / maybe / impossible. The
 * three cards keep a FIXED order — they're a scale, not a lineup, and
 * learning where each scenario sits on it is the skill.
 */
export function generateChance(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ChanceQuestion {
  void params
  const scenario = CHANCE_SCENARIOS[randInt(0, CHANCE_SCENARIOS.length - 1, rng)]
  const optionLabels = [...CHANCE_LABELS]

  return {
    id: makeId('chance', rng),
    activity: 'chance',
    prompt: `${scenario.text} Certain, maybe, or impossible?`,
    payload: { scenario: scenario.text, optionLabels },
    options: optionLabels.map((_, i) => i),
    answer: scenario.verdict,
  }
}
