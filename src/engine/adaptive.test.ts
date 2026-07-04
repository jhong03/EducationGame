import { describe, it, expect } from 'vitest'
import type { Rng } from './types'
import { adaptLevel, difficultyScale } from './adaptive'
import { generateQuestion } from './generators'
import { TRAIL, levelById } from '../content/math'

/**
 * The adaptive seam carries mastery-pillar weight from the other side: a
 * SCALED level must still generate sound questions (exactly one correct
 * option, a wrong option to exist for retries), or easing a struggling child
 * would hand them a broken question. So every scale the seam can emit is
 * swept against every level it can touch.
 */

function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('difficultyScale', () => {
  it('eases after a hard question, hardest cases first', () => {
    expect(difficultyScale({ lastTries: 3, replay: false }, null)).toBe(0.6)
    expect(difficultyScale({ lastTries: 5, replay: true }, 'eager')).toBe(0.6)
    expect(difficultyScale({ lastTries: 2, replay: false }, null)).toBe(0.8)
    expect(difficultyScale({ lastTries: 2, replay: true }, 'eager')).toBe(0.8) // struggling beats replay
  })

  it('first-try answers keep fresh levels at full strength', () => {
    expect(difficultyScale({ lastTries: 1, replay: false }, null)).toBe(1)
    expect(difficultyScale({ lastTries: 1, replay: false }, 'eager')).toBe(1)
  })

  it('replays ramp by pace profile — and gentle never ramps', () => {
    expect(difficultyScale({ lastTries: 1, replay: true }, 'eager')).toBe(1.5)
    expect(difficultyScale({ lastTries: 1, replay: true }, 'steady')).toBe(1.25)
    expect(difficultyScale({ lastTries: 1, replay: true }, null)).toBe(1.25)
    expect(difficultyScale({ lastTries: 1, replay: true }, 'gentle')).toBe(1)
  })
})

describe('adaptLevel', () => {
  const counting = levelById('math-early-1')! // count, max: 3

  it('scale 1, missing max, and structural activities pass through untouched', () => {
    expect(adaptLevel(counting, 1)).toBe(counting) // same object — zero cost
    const noMax = TRAIL.find((l) => typeof l.params.max !== 'number')!
    expect(adaptLevel(noMax, 0.6)).toBe(noMax)
    const columnOp = TRAIL.find((l) => l.activity === 'column-op')!
    expect(adaptLevel(columnOp, 0.6)).toBe(columnOp) // max = digit MODE, not a bound
  })

  it('scales max, rounds, floors at 3, and never mutates the original', () => {
    const bigger = adaptLevel(counting, 1.5)
    expect(bigger.params.max).toBe(5) // 3 × 1.5 rounded
    const smaller = adaptLevel(counting, 0.6)
    expect(smaller.params.max).toBe(3) // floored — tiny levels stay playable
    expect(counting.params.max).toBe(3) // source untouched
    const upper = adaptLevel(levelById('math-upper-3')!, 0.6) // num-compare max 9999
    expect(upper.params.max).toBe(5999)
  })

  it('every scale the seam can emit still generates sound questions', () => {
    const scalable = TRAIL.filter(
      (l) => typeof l.params.max === 'number' && l.activity !== 'column-op',
    )
    expect(scalable.length).toBeGreaterThan(40) // the seam really covers the meadow
    for (const level of scalable) {
      for (const scale of [0.6, 0.8, 1.25, 1.5]) {
        const adapted = adaptLevel(level, scale)
        for (let s = 1; s <= 40; s++) {
          const q = generateQuestion(adapted, mulberry32(s * 7 + scale * 100))
          if ('options' in q && typeof q.answer === 'number') {
            expect(
              q.options.filter((o) => o === q.answer),
              `${level.id} @×${scale}`,
            ).toHaveLength(1)
            expect(
              q.options.some((o) => o !== q.answer),
              `${level.id} @×${scale} needs a wrong option`,
            ).toBe(true)
          }
        }
      }
    }
  })
})
