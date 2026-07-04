import type { ConvertQuestion, Rng } from '../types'
import { CONVERT_PAIRS } from '../../content/world'
import { makeId, randInt, shuffle } from '../random'

/**
 * convert — metric unit hops (H8). Decoys are the wrong-factor answers
 * (÷10 and ×10 of the truth): the child who "knows there's a conversion"
 * but picks the wrong power of ten meets their exact mistake.
 */
export function generateConvert(
  params: Record<string, number>,
  rng: Rng = Math.random,
): ConvertQuestion {
  void params
  const pair = CONVERT_PAIRS[randInt(0, CONVERT_PAIRS.length - 1, rng)]
  const amount = randInt(1, pair.maxAmount, rng)
  const answer = amount * pair.factor

  return {
    id: makeId('conv', rng),
    activity: 'convert',
    prompt: `How many ${pair.toName} are in ${amount} ${amount === 1 ? pair.fromName.replace(/s$/, '') : pair.fromName}?`,
    payload: { from: pair.from, to: pair.to, amount },
    options: shuffle([answer, answer / 10, answer * 10], rng),
    answer,
  }
}
