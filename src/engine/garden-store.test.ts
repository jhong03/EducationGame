import { describe, it, expect, beforeEach } from 'vitest'
import {
  useGameStore,
  starBalance,
  diamondBalance,
  placedCount,
  availableCount,
  migratePersistedState,
} from './store'

/**
 * The garden economy leans on the forward-only rule that governs the rest of
 * the game: lifetime "earned" totals (stars, diamonds) never drop — spending
 * accrues separately, and a wallet balance is earned − spent. These pins guard
 * that, plus the place/remove plot math and the v2→v3 migration.
 */

const S = () => useGameStore.getState()

beforeEach(() => {
  S().reset()
})

describe('garden wallet', () => {
  it('a balance is lifetime-earned minus spent', () => {
    useGameStore.setState({ stars: 30, starsSpent: 12, diamonds: 5, diamondsSpent: 2 })
    expect(starBalance(S())).toBe(18)
    expect(diamondBalance(S())).toBe(3)
  })

  it('buying a star item spends the balance but never the earned total', () => {
    useGameStore.setState({ stars: 20 })
    expect(S().buyItem('plant-rose', 'star', 10)).toBe(true)
    const s = S()
    expect(s.stars).toBe(20) // lifetime earned untouched — forward-only holds
    expect(s.starsSpent).toBe(10)
    expect(starBalance(s)).toBe(10)
    expect(s.owned['plant-rose']).toBe(1)
  })

  it('refuses what you cannot afford (wallets never go negative)', () => {
    useGameStore.setState({ stars: 5 })
    expect(S().buyItem('plant-tree', 'star', 20)).toBe(false)
    expect(S().starsSpent).toBe(0)
    expect(S().owned['plant-tree']).toBeUndefined()
  })

  it('diamonds are a wallet of their own', () => {
    useGameStore.setState({ diamonds: 4 })
    expect(S().buyItem('pet-bunny', 'diamond', 3)).toBe(true)
    expect(S().buyItem('pet-bunny', 'diamond', 3)).toBe(false) // only 1 left
    expect(S().owned['pet-bunny']).toBe(1)
    expect(diamondBalance(S())).toBe(1)
    expect(S().stars).toBe(0) // buying a pet never touched the star wallet
  })

  it('awardDiamonds only ever adds', () => {
    S().awardDiamonds(3)
    S().awardDiamonds(0)
    S().awardDiamonds(-5)
    expect(S().diamonds).toBe(3)
  })
})

describe('garden plot (free positions)', () => {
  it('drops owned items at free (x,z) spots, caps at what you own, frees on pick-up', () => {
    useGameStore.setState({ owned: { 'plant-rose': 2 } })
    S().placeItem('plant-rose', 0, 0)
    S().placeItem('plant-rose', 1.2, -0.5)
    expect(placedCount(S().garden, 'plant-rose')).toBe(2)
    expect(availableCount(S().owned, S().garden, 'plant-rose')).toBe(0)

    // A third can't be placed — no spare copy.
    S().placeItem('plant-rose', -1, 1)
    expect(placedCount(S().garden, 'plant-rose')).toBe(2)

    // Pick one up by its key → available in the tray again.
    const key = S().garden[0].key
    S().removeItem(key)
    expect(availableCount(S().owned, S().garden, 'plant-rose')).toBe(1)
  })

  it('stores each placement as an independent instance with its own position', () => {
    useGameStore.setState({ owned: { 'plant-rose': 1, 'pet-cat': 1 } })
    S().placeItem('plant-rose', 0.4, -1.2)
    S().placeItem('pet-cat', -0.8, 0.6)
    const garden = S().garden
    expect(garden).toHaveLength(2)
    const rose = garden.find((p) => p.itemId === 'plant-rose')
    expect(rose?.x).toBeCloseTo(0.4)
    expect(rose?.z).toBeCloseTo(-1.2)
    expect(new Set(garden.map((p) => p.key)).size).toBe(2) // unique keys
  })
})

describe('persist migration (v3 → v4)', () => {
  it('an old save gets an empty garden and zeroed wallets', () => {
    const migrated = migratePersistedState({ stars: 7, progress: {} })
    expect(migrated.diamonds).toBe(0)
    expect(migrated.starsSpent).toBe(0)
    expect(migrated.diamondsSpent).toBe(0)
    expect(migrated.owned).toEqual({})
    expect(migrated.garden).toEqual([])
  })

  it('migrates a v3 slot map to positioned items (dropping non-string slots)', () => {
    const migrated = migratePersistedState({
      owned: { good: 2, zero: 0, neg: -1, notNum: 'x' },
      garden: { '0': 'pet-cat', '1': 5, '7': 'plant-rose' },
    })
    expect(migrated.owned).toEqual({ good: 2 })
    expect(migrated.garden.map((p) => p.itemId).sort()).toEqual(['pet-cat', 'plant-rose'])
    expect(
      migrated.garden.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z) && p.key),
    ).toBe(true)
  })

  it('keeps a v4 positioned array, dropping malformed entries', () => {
    const migrated = migratePersistedState({
      garden: [
        { key: 'a', itemId: 'plant-rose', x: 1, z: 2 },
        { key: 'b', itemId: 'pet-cat', x: 'nope', z: 0 }, // bad x
        { itemId: 'toy-ball', x: 0, z: 0 }, // no key
      ],
    })
    expect(migrated.garden).toEqual([{ key: 'a', itemId: 'plant-rose', x: 1, z: 2 }])
  })
})

describe('reset', () => {
  it('wipes the garden along with the rest of the child profile', () => {
    useGameStore.setState({
      diamonds: 5,
      starsSpent: 3,
      diamondsSpent: 1,
      owned: { 'pet-cat': 1 },
      garden: [{ key: 'k1', itemId: 'pet-cat', x: 0, z: 0 }],
    })
    S().reset()
    const s = S()
    expect(s.diamonds).toBe(0)
    expect(s.starsSpent).toBe(0)
    expect(s.diamondsSpent).toBe(0)
    expect(s.owned).toEqual({})
    expect(s.garden).toEqual([])
  })
})
