import { describe, it, expect } from 'vitest'
import { AGES, BANDS, bandForAge, bandLabel } from './band'

describe('bandForAge', () => {
  it('maps every pickable age to its band, exactly on the boundaries', () => {
    expect(bandForAge(4)).toBe('early')
    expect(bandForAge(5)).toBe('early')
    expect(bandForAge(6)).toBe('early')
    expect(bandForAge(7)).toBe('mid')
    expect(bandForAge(9)).toBe('mid')
    expect(bandForAge(10)).toBe('upper')
    expect(bandForAge(12)).toBe('upper')
  })

  it('clamps out-of-range and garbage ages to the nearest band, never undefined', () => {
    expect(bandForAge(3)).toBe('early') // younger sibling
    expect(bandForAge(0)).toBe('early')
    expect(bandForAge(13)).toBe('upper') // just aged out
    expect(bandForAge(99)).toBe('upper')
    expect(bandForAge(NaN)).toBe('early') // corrupt data → gentlest band
  })

  it('AGES covers the three bands contiguously', () => {
    expect(AGES[0]).toBe(BANDS[0].minAge)
    expect(AGES[AGES.length - 1]).toBe(BANDS[BANDS.length - 1].maxAge)
    for (const age of AGES) {
      expect(['early', 'mid', 'upper']).toContain(bandForAge(age))
    }
  })

  it('bandLabel resolves every band', () => {
    expect(bandLabel('early')).toBe('Ages 4–6')
    expect(bandLabel('mid')).toBe('Ages 7–9')
    expect(bandLabel('upper')).toBe('Ages 10–12')
  })
})
