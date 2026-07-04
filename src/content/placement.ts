import type { Level } from '../engine/types'
import { bandForAge } from '../engine/band'
import { levelById } from './math'

/**
 * Placement plans (the calibration seam from the original spec, v1) — how the
 * age gate seeds a starting point WITHIN the early band. Each checkpoint asks
 * one question generated from `probe`; a correct answer places the child past
 * `places` (marked cleared+placed, no stars). The first miss ends the check
 * gently — everything already passed stays passed.
 *
 * Design rules:
 * - Probes use only count/compare/add activities (the calm, familiar forms).
 * - `places` always covers a category's rungs contiguously from the bottom,
 *   so the derived-unlock prefix never has gaps.
 * - Placement skips only the GRINDY basics; the novel Phase-1 interactions
 *   (Quick peek!, Find the number, What comes next?) are left to play — they
 *   are quick wins for an older child, not a grind.
 */

export interface PlacementCheckpoint {
  /** Level whose generator produces the probe question. */
  probe: string
  /** Level ids marked cleared+placed when the probe is answered correctly. */
  places: readonly string[]
}

/** Age 5: skip up to the basic counting rungs. */
const AGE_5_PLAN: readonly PlacementCheckpoint[] = [
  { probe: 'math-early-2', places: ['math-early-1', 'math-early-2'] }, // count to 5
  { probe: 'math-early-3', places: ['math-early-3'] }, // count to 10
]

/** Age 6: the early band's fast lane past the counting/compare/add basics. */
const AGE_6_PLAN: readonly PlacementCheckpoint[] = [
  { probe: 'math-early-3', places: ['math-early-1', 'math-early-2', 'math-early-3'] }, // count to 10
  { probe: 'math-early-4', places: ['math-early-4'] }, // which is more
  { probe: 'math-early-5', places: ['math-early-5'] }, // add within 5
]

/**
 * Upper band, age 11: the band is age-tiered, so an older starter proves the
 * grindy NUMBER-WORK of the base tier and begins at their own material. Each
 * probe is the top rung of the range it places; the novel meadow forms
 * (angles, coordinates, riddles, chance) are left to play — quick wins for a
 * capable child, not a grind.
 */
const AGE_11_UPPER_PLAN: readonly PlacementCheckpoint[] = [
  { probe: 'math-upper-2', places: ['math-upper-1', 'math-upper-2'] }, // round to 1000
  { probe: 'math-upper-4', places: ['math-upper-3', 'math-upper-4'] }, // thousands ladder
  { probe: 'math-upper-6', places: ['math-upper-5', 'math-upper-6'] }, // tenths & hundredths
  { probe: 'math-upper-9', places: ['math-upper-9'] }, // easy percents
  { probe: 'math-upper-11', places: ['math-upper-11'] }, // the number line
]

/** Age 12 probes deeper — through the base tier AND into the 11+ rungs. */
const AGE_12_UPPER_PLAN: readonly PlacementCheckpoint[] = [
  ...AGE_11_UPPER_PLAN,
  // The decimal ladder through the 11+ compare (equivalence rungs ride along).
  { probe: 'math-upper-33', places: ['math-upper-7', 'math-upper-8', 'math-upper-33'] },
  // The calculation ladder through 11+ giant times.
  {
    probe: 'math-upper-41',
    places: ['math-upper-17', 'math-upper-18', 'math-upper-19', 'math-upper-20', 'math-upper-41'],
  },
]

/**
 * The checkpoint sequence for an age; empty = no placement (start at rung 1).
 * Early 5–6 skip the counting grind; upper 11–12 skip the tiers below their
 * own (age 10 IS the base tier — nothing to skip). Mid children start fresh —
 * a mid plan arrives when that ladder earns a fast lane.
 */
export function placementPlanFor(age: number): readonly PlacementCheckpoint[] {
  if (!Number.isFinite(age) || age <= 4) return []
  const band = bandForAge(age)
  if (band === 'early') return age === 5 ? AGE_5_PLAN : AGE_6_PLAN
  if (band === 'upper' && age >= 11) {
    return age === 11 ? AGE_11_UPPER_PLAN : AGE_12_UPPER_PLAN
  }
  return []
}

/** Resolve a checkpoint's probe level (content integrity is test-enforced). */
export function probeLevel(checkpoint: PlacementCheckpoint): Level | undefined {
  return levelById(checkpoint.probe)
}
