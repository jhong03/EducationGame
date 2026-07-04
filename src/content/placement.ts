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
 * The checkpoint sequence for an age; empty = no placement (start at rung 1).
 * Only EARLY-band ages need placing — mid/upper children land in their own
 * band, whose categories all start fresh at rung 1 (a mid placement plan
 * arrives when the mid ladder grows tall enough to skip).
 */
export function placementPlanFor(age: number): readonly PlacementCheckpoint[] {
  if (!Number.isFinite(age) || age <= 4) return []
  if (bandForAge(age) !== 'early') return []
  if (age === 5) return AGE_5_PLAN
  return AGE_6_PLAN
}

/** Resolve a checkpoint's probe level (content integrity is test-enforced). */
export function probeLevel(checkpoint: PlacementCheckpoint): Level | undefined {
  return levelById(checkpoint.probe)
}
