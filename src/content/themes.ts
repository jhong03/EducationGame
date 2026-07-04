import type { Rng, Theme } from '../engine/types'

/**
 * The object themes counted in Number Meadow. Big, friendly, universally
 * recognizable. Plurals are stored (not derived) so irregulars like "fish"
 * and "butterflies" are always spoken correctly.
 *
 * `kind` groups themes for sorting-by-rule play (Puzzle Grove's "which one
 * belongs?"): food / animal / nature / toy.
 */
export type ThemeKind = 'food' | 'animal' | 'nature' | 'toy'

export const THEME_KINDS: Record<string, ThemeKind> = {
  apple: 'food',
  cookie: 'food',
  banana: 'food',
  strawberry: 'food',
  duck: 'animal',
  frog: 'animal',
  fish: 'animal',
  butterfly: 'animal',
  bee: 'animal',
  star: 'nature',
  flower: 'nature',
  tree: 'nature',
  sun: 'nature',
  balloon: 'toy',
  ball: 'toy',
}

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
  { id: 'bee', singular: 'bee', plural: 'bees', emoji: '🐝' },
  { id: 'banana', singular: 'banana', plural: 'bananas', emoji: '🍌' },
  { id: 'strawberry', singular: 'strawberry', plural: 'strawberries', emoji: '🍓' },
  { id: 'tree', singular: 'tree', plural: 'trees', emoji: '🌳' },
  { id: 'sun', singular: 'sun', plural: 'suns', emoji: '☀️' },
  { id: 'ball', singular: 'ball', plural: 'balls', emoji: '⚽' },
] as const

/** Kind lookup for a theme (sorting play). */
export function themeKind(theme: Theme): ThemeKind {
  return THEME_KINDS[theme.id] ?? 'nature'
}

/** All themes of one kind. */
export function themesOfKind(kind: ThemeKind): Theme[] {
  return THEMES.filter((t) => themeKind(t) === kind)
}

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
