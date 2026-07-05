import { describe, it, expect } from 'vitest'
import type { Level, LevelProgress } from './types'
import { daySeed, pickWarmup } from './warmup'

/**
 * The warm-up picker carries review weight: it must only resurface levels
 * the child truly EARNED, put the shakiest skills first, and spread across
 * categories — while staying deterministic for a given day.
 */

function lvl(id: string, categoryId: string, order: number): Level {
  return {
    id,
    subjectId: 'math',
    band: 'early',
    categoryId,
    order,
    name: id,
    icon: '⭐',
    activity: 'count',
    params: { max: 3 },
    masteryGoal: 3,
    sprintSeconds: 60,
  }
}

const LEVELS = [
  lvl('a1', 'counting', 1),
  lvl('a2', 'counting', 2),
  lvl('b1', 'adding', 1),
  lvl('c1', 'shapes', 1),
]

const p = (over: Partial<LevelProgress>): LevelProgress => ({
  cleared: true,
  bestStreak: 3,
  ...over,
})

describe('pickWarmup', () => {
  it('only earned-mastered levels qualify — placed and uncleared never do', () => {
    const picked = pickWarmup(
      LEVELS,
      {
        a1: p({}),
        a2: p({ placed: true }), // placement grants position, not review
        b1: { cleared: false, bestStreak: 2 }, // main path, not review
      },
      'Mon Jul 06 2026',
    )
    expect(picked.map((l) => l.id)).toEqual(['a1'])
  })

  it('shakiest accuracy comes first; unmeasured levels sort last', () => {
    const picked = pickWarmup(
      LEVELS,
      {
        a1: p({ attempts: 10, correct: 9 }), // 90%
        b1: p({ attempts: 10, correct: 5 }), // 50% — needs the review most
        c1: p({}), // never measured
      },
      'Mon Jul 06 2026',
    )
    expect(picked[0].id).toBe('b1')
    expect(picked[picked.length - 1].id).toBe('c1')
  })

  it('spreads across categories before doubling up, capped at count', () => {
    const picked = pickWarmup(
      LEVELS,
      { a1: p({}), a2: p({}), b1: p({}), c1: p({}) },
      'Mon Jul 06 2026',
      3,
    )
    expect(picked).toHaveLength(3)
    // Three different categories before a second counting level appears.
    expect(new Set(picked.map((l) => l.categoryId)).size).toBe(3)
  })

  it('is deterministic for a given day and empty when nothing is earned', () => {
    const progress = { a1: p({}), b1: p({}), c1: p({}) }
    const one = pickWarmup(LEVELS, progress, 'Tue Jul 07 2026')
    const two = pickWarmup(LEVELS, progress, 'Tue Jul 07 2026')
    expect(one.map((l) => l.id)).toEqual(two.map((l) => l.id))
    expect(pickWarmup(LEVELS, {}, 'Tue Jul 07 2026')).toEqual([])
  })
})

describe('daySeed', () => {
  it('is stable per key and lands in [0, 1)', () => {
    expect(daySeed('Mon Jul 06 2026')).toBe(daySeed('Mon Jul 06 2026'))
    for (const key of ['a', 'b', 'Mon Jul 06 2026', 'Tue Jul 07 2026']) {
      const v = daySeed(key)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
