import type { Rng, Theme } from '../engine/types'

/**
 * The object themes counted in Number Meadow. Big, friendly, universally
 * recognizable. Plurals are stored (not derived) so irregulars like "fish"
 * and "butterflies" are always spoken correctly.
 */
export const THEMES: readonly Theme[] = [
  { id: 'apple', singular: 'apple', plural: 'apples', emoji: '🍎' },
  { id: 'duck', singular: 'duck', plural: 'ducks', emoji: '🐤' },
  { id: 'star', singular: 'star', plural: 'stars', emoji: '⭐' },
  { id: 'balloon', singular: 'balloon', plural: 'balloons', emoji: '🎈' },
  { id: 'frog', singular: 'frog', plural: 'frogs', emoji: '🐸' },
  { id: 'flower', singular: 'flower', plural: 'flowers', emoji: '🌸' },
  { id: 'fish', singular: 'fish', plural: 'fish', emoji: '🐠' },
  { id: 'cookie', singular: 'cookie', plural: 'cookies', emoji: '🍪' },
  { id: 'butterfly', singular: 'butterfly', plural: 'butterflies', emoji: '🦋' },
] as const

/** Pick one theme at random. */
export function pickTheme(rng: Rng = Math.random): Theme {
  return THEMES[Math.floor(rng() * THEMES.length)]
}

/** Pick two *distinct* themes (for compare, so the sides look different). */
export function pickTwoThemes(rng: Rng = Math.random): [Theme, Theme] {
  const first = pickTheme(rng)
  let second = pickTheme(rng)
  // At 9 themes this resolves almost immediately; bounded to avoid any chance
  // of a pathological rng looping forever.
  for (let guard = 0; second.id === first.id && guard < 100; guard++) {
    second = pickTheme(rng)
  }
  return [first, second]
}
