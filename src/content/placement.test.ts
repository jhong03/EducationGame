import { describe, it, expect, beforeEach } from 'vitest'
import { placementPlanFor, probeLevel } from './placement'
import { levelById, levelsInCategory } from './math'
import { useGameStore, isLevelUnlocked } from '../engine/store'

/**
 * Placement is the one mechanism that writes progress without full mastery,
 * so its plans and store semantics carry mastery-pillar weight: plans must
 * never create unlock gaps, and placement must never overwrite or reward.
 */

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('placement plans', () => {
  it('age 4 and under (and garbage): no placement — start at rung one', () => {
    expect(placementPlanFor(4)).toHaveLength(0)
    expect(placementPlanFor(3)).toHaveLength(0)
    expect(placementPlanFor(NaN)).toHaveLength(0)
  })

  it('band-floor ages (7 and 10) have no plan — their ladder starts fresh', () => {
    for (const age of [7, 10]) {
      expect(placementPlanFor(age)).toHaveLength(0)
    }
  })

  it('mid 8/9 have plans over mid-band levels, and 9 probes deeper than 8', () => {
    const plan8 = placementPlanFor(8)
    const plan9 = placementPlanFor(9)
    expect(plan8.length).toBeGreaterThan(0)
    expect(plan9.length).toBeGreaterThan(plan8.length)
    for (const cp of [...plan8, ...plan9]) {
      for (const id of [cp.probe, ...cp.places]) {
        const level = levelById(id)
        expect(level, id).toBeDefined()
        expect(level!.band).toBe('mid')
      }
    }
  })

  it('upper 11/12 have plans, and 12 probes strictly deeper than 11', () => {
    const plan11 = placementPlanFor(11)
    const plan12 = placementPlanFor(12)
    expect(plan11.length).toBeGreaterThan(0)
    expect(plan12.length).toBeGreaterThan(plan11.length)
    // The 12 plan extends the 11 plan — same base checkpoints first.
    expect(plan12.slice(0, plan11.length)).toEqual(plan11)
  })

  it('upper plans only touch rungs that age can SEE (minAge respected)', () => {
    for (const age of [11, 12]) {
      for (const cp of placementPlanFor(age)) {
        for (const id of [cp.probe, ...cp.places]) {
          const level = levelById(id)
          expect(level, id).toBeDefined()
          expect(level!.band).toBe('upper')
          expect(level!.minAge ?? 0, id).toBeLessThanOrEqual(age)
        }
      }
    }
  })

  it('early ages 5–6 have plans whose probes and places all resolve to real levels', () => {
    for (const age of [5, 6]) {
      const plan = placementPlanFor(age)
      expect(plan.length).toBeGreaterThan(0)
      for (const cp of plan) {
        const probe = probeLevel(cp)
        expect(probe, `probe ${cp.probe}`).toBeDefined()
        // Probes stay within the calm, renderable placement forms.
        expect(['count', 'compare', 'add']).toContain(probe!.activity)
        for (const id of cp.places) {
          expect(levelById(id), `placed id ${id}`).toBeDefined()
        }
      }
    }
  })

  it('passing checkpoints in order never leaves an unlock gap in any category', () => {
    for (const age of [5, 6, 8, 9, 11, 12]) {
      useGameStore.getState().reset()
      for (const cp of placementPlanFor(age)) {
        useGameStore.getState().placeLevels(cp.places)
        const progress = useGameStore.getState().progress
        for (const id of cp.places) {
          const level = levelById(id)!
          const catLevels = levelsInCategory(level.categoryId)
          expect(isLevelUnlocked(level, catLevels, progress)).toBe(true)
          // Contiguity: every rung below a placed rung is also cleared.
          for (const l of catLevels) {
            if (l.order < level.order) {
              expect(progress[l.id]?.cleared, `${l.id} below ${id}`).toBe(true)
            }
          }
        }
      }
    }
  })
})

describe('placeLevels semantics', () => {
  it('marks uncleared levels cleared+placed and never awards stars', () => {
    useGameStore.getState().placeLevels(['math-early-1', 'math-early-2'])
    const s = useGameStore.getState()
    expect(s.progress['math-early-1']).toEqual({ cleared: true, bestStreak: 0, placed: true })
    expect(s.progress['math-early-2']).toEqual({ cleared: true, bestStreak: 0, placed: true })
    expect(s.stars).toBe(0)
  })

  it('never downgrades an earned clear to a placement', () => {
    useGameStore.getState().clearLevel('math-early-1', 3)
    useGameStore.getState().placeLevels(['math-early-1'])
    const p = useGameStore.getState().progress['math-early-1']
    expect(p.cleared).toBe(true)
    expect(p.bestStreak).toBe(3)
    expect(p.placed).toBeUndefined() // earned stays earned
  })

  it('practice keeps the placed flag; real mastery erases it', () => {
    useGameStore.getState().placeLevels(['math-early-2'])
    // A stray correct answer during replay is not yet mastery.
    useGameStore.getState().recordStreak('math-early-2', 1)
    expect(useGameStore.getState().progress['math-early-2'].placed).toBe(true)
    // Clearing the level for real converts placed → mastered.
    useGameStore.getState().clearLevel('math-early-2', 3)
    const p = useGameStore.getState().progress['math-early-2']
    expect(p.cleared).toBe(true)
    expect(p.bestStreak).toBe(3)
    expect(p.placed).toBeUndefined()
  })
})
