import { describe, it, expect } from 'vitest'
import {
  diamondsForMastery,
  DIAMOND_PER_MASTERY,
  DIAMOND_PER_CATEGORY,
} from './rewards'

describe('diamondsForMastery', () => {
  it('a first mastery earns the base diamond', () => {
    expect(diamondsForMastery({ firstEarn: true, categoryComplete: false })).toBe(
      DIAMOND_PER_MASTERY,
    )
  })

  it('finishing the chapter adds the bonus', () => {
    expect(diamondsForMastery({ firstEarn: true, categoryComplete: true })).toBe(
      DIAMOND_PER_MASTERY + DIAMOND_PER_CATEGORY,
    )
  })

  it('a replay earns nothing — even if it "completes" the category', () => {
    expect(diamondsForMastery({ firstEarn: false, categoryComplete: false })).toBe(0)
    expect(diamondsForMastery({ firstEarn: false, categoryComplete: true })).toBe(0)
  })

  it('the faucet only ever pays out (both amounts are positive)', () => {
    expect(DIAMOND_PER_MASTERY).toBeGreaterThan(0)
    expect(DIAMOND_PER_CATEGORY).toBeGreaterThan(0)
  })
})
