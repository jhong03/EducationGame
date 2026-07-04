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

/** Unit conversions the upper band drills (H8) — printed + spoken forms. */
export interface ConvertPair {
  from: string
  fromName: string
  to: string
  toName: string
  factor: number
  maxAmount: number // keeps answers head-checkable
}

export const CONVERT_PAIRS: readonly ConvertPair[] = [
  { from: 'm', fromName: 'meters', to: 'cm', toName: 'centimeters', factor: 100, maxAmount: 5 },
  { from: 'cm', fromName: 'centimeters', to: 'mm', toName: 'millimeters', factor: 10, maxAmount: 9 },
  { from: 'km', fromName: 'kilometers', to: 'm', toName: 'meters', factor: 1000, maxAmount: 3 },
  { from: 'kg', fromName: 'kilograms', to: 'g', toName: 'grams', factor: 1000, maxAmount: 3 },
  { from: 'l', fromName: 'liters', to: 'ml', toName: 'milliliters', factor: 1000, maxAmount: 3 },
] as const

/** The probability-language scale (K7). Order is the scale — never shuffled. */
export const CHANCE_LABELS = ['Certain', 'Maybe', 'Impossible'] as const

export interface ChanceScenario {
  text: string
  verdict: 0 | 1 | 2 // index into CHANCE_LABELS
}

export const CHANCE_SCENARIOS: readonly ChanceScenario[] = [
  { text: 'The sun will come up tomorrow morning.', verdict: 0 },
  { text: 'You pick a red ball from a bag of ONLY red balls.', verdict: 0 },
  { text: 'Monday will come after Sunday.', verdict: 0 },
  { text: 'A flipped coin lands on heads.', verdict: 1 },
  { text: 'You roll a six on your very first try.', verdict: 1 },
  { text: 'The spinner lands on red, and most parts are red.', verdict: 1 },
  { text: 'You pick a blue ball from a bag of ONLY red balls.', verdict: 2 },
  { text: 'A normal dice rolls a seven.', verdict: 2 },
  { text: 'Tomorrow will have 25 hours.', verdict: 2 },
] as const
