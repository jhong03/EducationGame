import { describe, it, expect } from 'vitest'
import type { Rng } from './types'
import { generateCount } from './generators/count'
import { generateCompare } from './generators/compare'
import { generateAdd } from './generators/add'
import { generateQuestion, GENERATORS } from './generators'
import { PHASE0_LEVELS } from '../content/math'
import { buildNumberOptions, randInt, randIntExcept, shuffle } from './random'

/**
 * Deterministic RNG (mulberry32) so every run exercises the same stream and a
 * failure is reproducible. We sweep thousands of seeds to stand in for the
 * randomness the generators would see in the wild.
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

const RUNS = 3000
const seeds = Array.from({ length: RUNS }, (_, i) => i + 1)

describe('random helpers', () => {
  it('randInt stays within [min, max] inclusive and hits both ends', () => {
    const seen = new Set<number>()
    for (const s of seeds) {
      const r = mulberry32(s)
      const v = randInt(0, 5, r)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(5)
      expect(Number.isInteger(v)).toBe(true)
      seen.add(v)
    }
    expect(seen.has(0)).toBe(true)
    expect(seen.has(5)).toBe(true)
  })

  it('randIntExcept never returns the excluded value and covers the rest', () => {
    const seen = new Set<number>()
    for (const s of seeds) {
      const r = mulberry32(s)
      const v = randIntExcept(1, 6, 3, r)
      expect(v).not.toBe(3)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(6)
      seen.add(v)
    }
    expect([...seen].sort()).toEqual([1, 2, 4, 5, 6])
  })

  it('shuffle preserves the multiset', () => {
    const input = [0, 1, 2, 3, 4, 5]
    for (const s of seeds.slice(0, 200)) {
      const out = shuffle(input, mulberry32(s))
      expect(out.slice().sort((a, b) => a - b)).toEqual(input)
    }
  })

  it('buildNumberOptions: distinct, in range, exactly one correct', () => {
    for (const s of seeds) {
      const r = mulberry32(s)
      const correct = randInt(0, 10, r)
      const opts = buildNumberOptions(correct, 0, 10, 3, r)
      expect(opts).toHaveLength(3)
      expect(new Set(opts).size).toBe(3) // distinct
      expect(opts.filter((o) => o === correct)).toHaveLength(1) // exactly one
      for (const o of opts) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(10)
      }
    }
  })
})

describe('count generator', () => {
  for (const max of [3, 5, 10]) {
    it(`max=${max}: valid quantity, options, and single correct answer`, () => {
      for (const s of seeds) {
        const q = generateCount({ max }, mulberry32(s))
        const n = q.payload.group.count
        expect(q.activity).toBe('count')
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(max)
        expect(q.answer).toBe(n)
        // options: 3, distinct, in [0, max], exactly one correct, never below 0
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) {
          expect(o).toBeGreaterThanOrEqual(0)
          expect(o).toBeLessThanOrEqual(max)
        }
        expect(q.prompt.length).toBeGreaterThan(0)
      }
    })
  }
})

describe('compare generator', () => {
  it('max=6: groups never equal, distinct themes, answer points to more', () => {
    for (const s of seeds) {
      const q = generateCompare({ max: 6 }, mulberry32(s))
      const { left, right } = q.payload
      expect(q.activity).toBe('compare')
      expect(left.count).not.toBe(right.count) // never equal
      expect(left.theme.id).not.toBe(right.theme.id) // different themes
      for (const g of [left, right]) {
        expect(g.count).toBeGreaterThanOrEqual(1)
        expect(g.count).toBeLessThanOrEqual(6)
      }
      const bigger = left.count > right.count ? 'left' : 'right'
      expect(q.answer).toBe(bigger)
    }
  })
})

describe('add generator', () => {
  it('max=5: total never exceeds max, both sides >= 1, single correct option', () => {
    for (const s of seeds) {
      const q = generateAdd({ max: 5 }, mulberry32(s))
      const { left, right } = q.payload
      expect(q.activity).toBe('add')
      expect(left.count).toBeGreaterThanOrEqual(1)
      expect(right.count).toBeGreaterThanOrEqual(1)
      const total = left.count + right.count
      expect(total).toBe(q.answer)
      expect(total).toBeLessThanOrEqual(5) // never exceed max
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(5)
      }
    }
  })
})

describe('registry / generateQuestion', () => {
  it('has a generator for every activity used by the Phase 0 trail', () => {
    for (const level of PHASE0_LEVELS) {
      expect(GENERATORS[level.activity]).toBeTypeOf('function')
    }
  })

  it('dispatches to the matching activity for every level', () => {
    for (const level of PHASE0_LEVELS) {
      for (const s of seeds.slice(0, 200)) {
        const q = generateQuestion(level, mulberry32(s))
        expect(q.activity).toBe(level.activity)
      }
    }
  })
})
