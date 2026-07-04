import type { NamedItem } from '../engine/types'

/**
 * Small real-world vocabularies for the Big & Small and Clock Time
 * categories. Pure content — swap or extend without touching generators.
 */

/** Pairs where the FIRST is unmistakably heavier (early-band world knowledge). */
export const WEIGHT_PAIRS: readonly [NamedItem, NamedItem][] = [
  [{ emoji: '🐘', name: 'elephant' }, { emoji: '🐭', name: 'mouse' }],
  [{ emoji: '🐋', name: 'whale' }, { emoji: '🐠', name: 'fish' }],
  [{ emoji: '🪨', name: 'rock' }, { emoji: '🪶', name: 'feather' }],
  [{ emoji: '🚗', name: 'car' }, { emoji: '⚽', name: 'ball' }],
  [{ emoji: '🐻', name: 'bear' }, { emoji: '🐝', name: 'bee' }],
] as const

/** Times of day as unmistakable scenes. */
export const DAY_SCENES: readonly NamedItem[] = [
  { emoji: '🌅', name: 'morning' },
  { emoji: '☀️', name: 'daytime' },
  { emoji: '🌙', name: 'night' },
] as const
