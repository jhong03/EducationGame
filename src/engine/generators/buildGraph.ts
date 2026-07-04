import type { BuildGraphQuestion, Rng } from '../types'
import { THEMES } from '../../content/themes'
import { makeId, randInt, shuffle } from '../random'

/** Digit-encode column heights ([2,3,1] → 231) — one number carries the board. */
export function encodeHeights(heights: readonly number[]): number {
  return heights.reduce((acc, h) => acc * 10 + h, 0)
}

/**
 * build-graph — construct the block graph (K3): a tally chart gives each
 * column's count; the child taps columns to raise the towers, then confirms.
 * The submitted answer is the digit-encoded board, so a wrong build is a
 * plain wrong number and the ordinary retry path applies. The decoy options
 * are near-miss boards (one column off by one) so sprint/loop plumbing always
 * has a wrong-but-buildable answer available.
 */
export function generateBuildGraph(
  params: Record<string, number>,
  rng: Rng = Math.random,
): BuildGraphQuestion {
  const cols = Math.min(4, Math.max(2, params.cols ?? 3))
  const maxHeight = Math.min(5, Math.max(2, params.max ?? 4))
  const themes = shuffle(THEMES, rng).slice(0, cols)
  const items = themes.map((t) => ({
    emoji: t.emoji,
    name: t.singular,
    value: randInt(1, maxHeight, rng),
  }))

  const target = items.map((i) => i.value)
  const answer = encodeHeights(target)
  const offByOne = (idx: number) => {
    const heights = [...target]
    heights[idx] = heights[idx] < maxHeight ? heights[idx] + 1 : heights[idx] - 1
    return encodeHeights(heights)
  }

  return {
    id: makeId('build', rng),
    activity: 'build-graph',
    prompt: 'Build the graph to match the tally!',
    payload: { items, maxHeight },
    // cols ≥ 2, so the two altered boards touch different columns: three
    // distinct encodings, exactly one correct.
    options: shuffle([answer, offByOne(cols - 1), offByOne(0)], rng),
    answer,
  }
}
