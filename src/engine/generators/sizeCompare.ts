import type { Rng, SizeCompareQuestion } from '../types'
import { pickTheme } from '../../content/themes'
import { makeId } from '../random'

/**
 * size-compare — Big & Small's opener (H1): the SAME thing twice, one giant,
 * one small; tap the one the voice asks for. Identical objects isolate SIZE
 * as the only difference.
 */
export function generateSizeCompare(
  params: Record<string, number>,
  rng: Rng = Math.random,
): SizeCompareQuestion {
  void params
  const theme = pickTheme(rng)
  const bigSide = rng() < 0.5 ? 'left' : 'right'
  const target = rng() < 0.5 ? 'big' : 'small'
  const smallSide = bigSide === 'left' ? 'right' : 'left'
  return {
    id: makeId('size', rng),
    activity: 'size-compare',
    prompt: `Tap the ${target} ${theme.singular}!`,
    payload: { item: { emoji: theme.emoji, name: theme.singular }, bigSide, target },
    answer: target === 'big' ? bigSide : smallSide,
  }
}
