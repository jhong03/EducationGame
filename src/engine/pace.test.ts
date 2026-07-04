import { describe, it, expect } from 'vitest'
import { PACE_PLANS, PACE_QUESTIONS, planFor, scorePace } from './pace'

/**
 * The pace profiler is pure logic that shapes a family's routine — its mapping
 * must be exact and total (every possible answer set lands on a real plan).
 */

describe('scorePace', () => {
  it('maps the score bands correctly at every boundary', () => {
    expect(scorePace([0, 0, 0, 0, 0])).toBe('gentle') // 0
    expect(scorePace([1, 1, 1, 0, 0])).toBe('gentle') // 3 — top of gentle
    expect(scorePace([1, 1, 1, 1, 0])).toBe('steady') // 4 — bottom of steady
    expect(scorePace([2, 2, 2, 1, 0])).toBe('steady') // 7 — top of steady
    expect(scorePace([2, 2, 2, 2, 0])).toBe('eager') // 8 — bottom of eager
    expect(scorePace([2, 2, 2, 2, 2])).toBe('eager') // 10
  })

  it('is total: every combination of answers yields a valid pace', () => {
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++)
          for (let d = 0; d < 3; d++)
            for (let e = 0; e < 3; e++) {
              const pace = scorePace([a, b, c, d, e])
              expect(['gentle', 'steady', 'eager']).toContain(pace)
              expect(PACE_PLANS[pace]).toBeDefined()
            }
  })

  it('clamps out-of-range or fractional answers instead of skewing the scale', () => {
    expect(scorePace([99, 99, 99, 99, 99])).toBe('eager') // clamped to 2s
    expect(scorePace([-5, -5, -5, -5, -5])).toBe('gentle') // clamped to 0s
    expect(scorePace([1.4, 1.4, 1.4, 0, 0])).toBe('gentle') // rounds to 1s → 3
  })

  it('scores non-finite garbage as 0 — corruption must never yield the most intense profile', () => {
    expect(scorePace([NaN, NaN, NaN, NaN, NaN])).toBe('gentle')
    expect(scorePace([Infinity, -Infinity, NaN, 2, 2])).toBe('steady') // only the real 2s count
  })
})

describe('quiz content & plans', () => {
  it('every question offers exactly three answers, ordered for 0/1/2 scoring', () => {
    expect(PACE_QUESTIONS.length).toBe(5)
    for (const q of PACE_QUESTIONS) {
      expect(q.answers).toHaveLength(3)
      expect(q.text.length).toBeGreaterThan(0)
    }
  })

  it('planFor returns the plan matching the scored pace, with usable guidance', () => {
    const plan = planFor([0, 1, 0, 1, 0]) // 2 → gentle
    expect(plan.pace).toBe('gentle')
    expect(plan.levelsPerSession).toBeGreaterThanOrEqual(1)
    expect(plan.tips.length).toBeGreaterThan(0)
    // Suggested load grows monotonically with eagerness.
    expect(PACE_PLANS.gentle.levelsPerSession).toBeLessThan(PACE_PLANS.steady.levelsPerSession)
    expect(PACE_PLANS.steady.levelsPerSession).toBeLessThan(PACE_PLANS.eager.levelsPerSession)
  })
})
