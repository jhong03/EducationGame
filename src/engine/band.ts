import type { Band } from './types'

/**
 * Age → band mapping — the product's age structure (subject-agnostic, so it
 * lives in the engine, not content). A child's age is chosen once on first
 * launch (and editable by a grown-up); everything band-scoped derives from it.
 */

export interface BandInfo {
  band: Band
  label: string // grown-up facing, e.g. "Ages 4–6"
  minAge: number
  maxAge: number
}

export const BANDS: readonly BandInfo[] = [
  { band: 'early', label: 'Ages 4–6', minAge: 4, maxAge: 6 },
  { band: 'mid', label: 'Ages 7–9', minAge: 7, maxAge: 9 },
  { band: 'upper', label: 'Ages 10–12', minAge: 10, maxAge: 12 },
] as const

/** Every age the picker offers, in order. */
export const AGES: readonly number[] = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/**
 * The band for an age. Ages outside 4–12 clamp to the nearest band (a 3-year-
 * old sibling gets `early`, a 13-year-old gets `upper`) — never undefined, so
 * corrupt or future-shifted data can't strand a child without content.
 */
export function bandForAge(age: number): Band {
  if (!Number.isFinite(age)) return 'early'
  for (const info of BANDS) {
    if (age <= info.maxAge) return info.band
  }
  return 'upper'
}

/** The grown-up label for a band (e.g. "Ages 7–9"). */
export function bandLabel(band: Band): string {
  return BANDS.find((b) => b.band === band)?.label ?? ''
}
