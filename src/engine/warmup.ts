import type { Level, LevelProgress } from './types'

/**
 * The daily warm-up (spaced review, v1): a few EARNED-mastered levels
 * resurface on the meadow each day so old skills don't fade. Pure and
 * content-free — the caller passes the candidate levels (their band, their
 * age tier), this module just picks.
 *
 * Selection: shakiest first (lowest lifetime accuracy), then a
 * date-seeded rotation for ties, one level per category so the warm-up
 * never feels like a single chapter's drill. No timestamps exist in the
 * save, so "spaced" is approximated by the daily reshuffle — different
 * day, different mix — while accuracy keeps the neediest skills in front.
 */

/** Deterministic tiny hash → [0, 1) for date-seeded rotation. */
export function daySeed(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export function pickWarmup(
  levels: readonly Level[],
  progress: Record<string, LevelProgress>,
  seedKey: string,
  count = 3,
): Level[] {
  // Only levels the child truly mastered — placement grants position, not
  // review material, and unfinished levels are the MAIN path, not review.
  const earned = levels.filter((l) => {
    const p = progress[l.id]
    return p?.cleared === true && !p.placed
  })
  if (earned.length === 0) return []

  const accuracy = (l: Level): number => {
    const p = progress[l.id]
    if (!p?.attempts) return 101 // never-measured sorts after every real score
    return ((p.correct ?? 0) / p.attempts) * 100
  }

  // Shakiest first; date-seeded rotation breaks ties differently each day.
  const offset = Math.floor(daySeed(seedKey) * earned.length)
  const rotated = [...earned.slice(offset), ...earned.slice(0, offset)]
  const sorted = rotated.sort((a, b) => accuracy(a) - accuracy(b))

  // One per category first, so the mix spans skills; fill from the rest.
  const picked: Level[] = []
  const seenCategories = new Set<string>()
  for (const level of sorted) {
    if (picked.length >= count) break
    if (seenCategories.has(level.categoryId)) continue
    seenCategories.add(level.categoryId)
    picked.push(level)
  }
  for (const level of sorted) {
    if (picked.length >= count) break
    if (!picked.includes(level)) picked.push(level)
  }
  return picked
}
