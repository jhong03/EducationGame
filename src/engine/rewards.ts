/**
 * Diamonds — the garden's SKILL currency (user-approved 2026-07-05). Where a
 * star is earned for every correct answer (effort), a diamond is earned only
 * for genuine mastery (skill): the first time a level is truly cleared, plus a
 * bonus when that clear finishes a whole chapter. Placement never earns them
 * (it grants position, not reward), and replays never earn them (forward-only:
 * a thing already earned can't be earned twice).
 *
 * Pure and content-free, so the faucet is test-pinned. The caller (PlayScreen,
 * the only mastery surface) supplies the two facts it alone knows.
 */

/** Diamonds for mastering a level the first time. */
export const DIAMOND_PER_MASTERY = 1
/** Bonus diamonds when that mastery completes the whole chapter. */
export const DIAMOND_PER_CATEGORY = 5

export function diamondsForMastery(opts: {
  /** This mastery earned the level for the FIRST time (not a replay of an
   *  already-earned level, and not merely a placement position). */
  firstEarn: boolean
  /** This clear leaves every level in the level's category cleared. */
  categoryComplete: boolean
}): number {
  if (!opts.firstEarn) return 0
  return DIAMOND_PER_MASTERY + (opts.categoryComplete ? DIAMOND_PER_CATEGORY : 0)
}
