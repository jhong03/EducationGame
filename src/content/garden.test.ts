import { describe, it, expect } from 'vitest'
import {
  GARDEN_ITEMS,
  GARDEN_SECTIONS,
  gardenItemById,
  itemsByKind,
  isLivelyKind,
  sellRefund,
} from './garden'

/**
 * The garden catalogue is persistence-load-bearing: `owned` counts and the
 * `garden` layout are keyed by item id, and the wallet math trusts the prices.
 * These pins guard the invariants the shop and store rely on.
 */

describe('garden catalogue', () => {
  it('has stable, unique ids', () => {
    const ids = GARDEN_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses a unique emoji per item (so the plot never reads ambiguously)', () => {
    const emojis = GARDEN_ITEMS.map((i) => i.emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })

  it('prices are positive whole numbers', () => {
    for (const item of GARDEN_ITEMS) {
      expect(Number.isInteger(item.price), `${item.id} price integer`).toBe(true)
      expect(item.price, `${item.id} price > 0`).toBeGreaterThan(0)
    }
  })

  it('effort buys the everyday; skill buys the treats', () => {
    for (const item of GARDEN_ITEMS) {
      if (item.kind === 'plant' || item.kind === 'toy') {
        expect(item.currency, `${item.id} is star-priced`).toBe('star')
      }
      if (item.kind === 'pet' || item.kind === 'build') {
        expect(item.currency, `${item.id} is diamond-priced`).toBe('diamond')
      }
    }
  })

  it('star items outnumber diamond items (so early play always has things to buy)', () => {
    const stars = GARDEN_ITEMS.filter((i) => i.currency === 'star').length
    const diamonds = GARDEN_ITEMS.filter((i) => i.currency === 'diamond').length
    expect(stars).toBeGreaterThan(0)
    expect(diamonds).toBeGreaterThan(0)
    expect(stars).toBeGreaterThanOrEqual(Math.floor(diamonds / 2))
  })

  it('every shop section has items, and every item belongs to a section', () => {
    const sectionKinds = GARDEN_SECTIONS.map((s) => s.kind)
    expect(new Set(sectionKinds).size).toBe(sectionKinds.length)
    for (const section of GARDEN_SECTIONS) {
      expect(itemsByKind(section.kind).length, `${section.kind} has items`).toBeGreaterThan(0)
    }
    for (const item of GARDEN_ITEMS) {
      expect(sectionKinds).toContain(item.kind)
    }
  })

  it('resolves every id, and only real ids', () => {
    for (const item of GARDEN_ITEMS) {
      expect(gardenItemById(item.id)).toBe(item)
    }
    expect(gardenItemById('nope-not-real')).toBeUndefined()
  })

  it('every item sells back for something, but never a profit', () => {
    for (const item of GARDEN_ITEMS) {
      const refund = sellRefund(item)
      expect(refund, `${item.id} refunds something`).toBeGreaterThan(0)
      expect(refund, `${item.id} never profits`).toBeLessThanOrEqual(item.price)
      expect(Number.isInteger(refund), `${item.id} whole refund`).toBe(true)
    }
  })

  it('only pets are lively (idle bob + tap reaction)', () => {
    expect(isLivelyKind('pet')).toBe(true)
    for (const kind of ['plant', 'toy', 'decoration', 'build'] as const) {
      expect(isLivelyKind(kind)).toBe(false)
    }
  })
})
