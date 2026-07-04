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

/**
 * Things to measure, each with its sensible unit and a same-dimension foil
 * (the REAL confusion: a pencil in metres, not a pencil in litres).
 */
export interface MeasureObject extends NamedItem {
  unit: string
  foil: string // wrong unit of the SAME dimension
}

/** Units a read-scale level can be set in: the printed label + spoken name. */
export interface ScaleUnit {
  label: string
  spoken: string
}

export const SCALE_UNITS: readonly ScaleUnit[] = [
  { label: 'cm', spoken: 'centimeters' },
  { label: 'g', spoken: 'grams' },
  { label: 'ml', spoken: 'milliliters' },
] as const

export const MEASURE_OBJECTS: readonly MeasureObject[] = [
  { emoji: '✏️', name: 'a pencil', unit: 'cm', foil: 'm' },
  { emoji: '📖', name: 'a book', unit: 'cm', foil: 'm' },
  { emoji: '🚪', name: 'a door', unit: 'm', foil: 'cm' },
  { emoji: '🚌', name: 'a bus', unit: 'm', foil: 'cm' },
  { emoji: '🐕', name: 'a dog', unit: 'kg', foil: 'g' },
  { emoji: '🍉', name: 'a watermelon', unit: 'kg', foil: 'g' },
  { emoji: '🪶', name: 'a feather', unit: 'g', foil: 'kg' },
  { emoji: '🪙', name: 'a coin', unit: 'g', foil: 'kg' },
  { emoji: '🛁', name: 'a bathtub', unit: 'l', foil: 'ml' },
  { emoji: '🥄', name: 'a spoonful', unit: 'ml', foil: 'l' },
] as const
