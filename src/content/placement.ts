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
 * Mid band, age 8: a Year-3-ish starter proves the mid basics (tens & ones,
 * the first tables, adding within 20) and skips straight to newer material.
 * Probes are the top rung of each placed range, as everywhere.
 */
const AGE_8_PLAN: readonly PlacementCheckpoint[] = [
  { probe: 'math-mid-1', places: ['math-mid-1'] }, // tens and ones
  { probe: 'math-mid-5', places: ['math-mid-4', 'math-mid-5'] }, // groups → ×2,5,10
  { probe: 'math-mid-8', places: ['math-mid-8'] }, // add within 20
]

/** Age 9 probes deeper: hundreds, the ×3/4/6 tables, adding within 100,
 *  and exact division. */
const AGE_9_PLAN: readonly PlacementCheckpoint[] = [
  { probe: 'math-mid-2', places: ['math-mid-1', 'math-mid-2'] }, // hundreds too
  { probe: 'math-mid-6', places: ['math-mid-4', 'math-mid-5', 'math-mid-6'] }, // ×3,4,6
  { probe: 'math-mid-9', places: ['math-mid-8', 'math-mid-9'] }, // add within 100
  { probe: 'math-mid-13', places: ['math-mid-12', 'math-mid-13'] }, // share → divide
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
 * Every band's FIRST age starts fresh (4, 7 and 10 ARE their band's floor);
 * older starters within a band probe past what they clearly know:
 * early 5–6, mid 8–9, upper 11–12.
 */
export function placementPlanFor(age: number): readonly PlacementCheckpoint[] {
  if (!Number.isFinite(age) || age <= 4) return []
  const band = bandForAge(age)
  if (band === 'early') return age === 5 ? AGE_5_PLAN : AGE_6_PLAN
  if (band === 'mid' && age >= 8) return age === 8 ? AGE_8_PLAN : AGE_9_PLAN
  if (band === 'upper' && age >= 11) {
    return age === 11 ? AGE_11_UPPER_PLAN : AGE_12_UPPER_PLAN
  }
  return []
}

/** Resolve a checkpoint's probe level (content integrity is test-enforced). */
export function probeLevel(checkpoint: PlacementCheckpoint): Level | undefined {
  return levelById(checkpoint.probe)
}
