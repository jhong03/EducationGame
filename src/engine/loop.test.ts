import { describe, it, expect, beforeEach } from 'vitest'
import { generateQuestion } from './generators'
import { evaluateAnswer } from './masteryGate'
import {
  useGameStore,
  unlockedUpTo,
  isLevelUnlocked,
  migratePersistedState,
  categorySprintScore,
} from './store'
import { CATEGORIES, TRAIL, levelsInCategory, nextLevelAfter } from '../content/math'
import type { Answer, Question } from './types'

/**
 * End-to-end engine loop, without React: prove the whole chain the game relies
 * on — a generated question's `answer` really is accepted as correct, mastery
 * clears the level, the next level in the category derives as unlocked, and
 * stars accrue. This is the "a math game that scores a wrong answer as right
 * is a product-killer" guard.
 */

/** The correct answer for any generated question. */
function correctAnswer(q: Question): Answer {
  return q.answer
}

/** A definitely-wrong answer for any generated question. */
function wrongAnswer(q: Question): Answer {
  // Side-answer activities (compare and friends): the other side is wrong.
  if (typeof q.answer === 'string') return q.answer === 'left' ? 'right' : 'left'
  if ('options' in q) {
    const other = q.options.find((o) => o !== q.answer)
    if (other !== undefined) return other
  }
  return q.answer + 1
}

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('single level to mastery', () => {
  it('clears a level after masteryGoal correct answers and unlocks the next in its category', () => {
    const counting = levelsInCategory('counting')
    const level = counting[0]
    const store = useGameStore
    let streak = 0

    // Before playing, only the first level of the category is open.
    expect(unlockedUpTo(counting, store.getState().progress)).toBe(1)
    expect(isLevelUnlocked(counting[1], counting, store.getState().progress)).toBe(false)

    for (let i = 0; i < level.masteryGoal; i++) {
      const q = generateQuestion(level)
      const outcome = evaluateAnswer(q, correctAnswer(q), streak, level.masteryGoal)
      expect(outcome.correct).toBe(true)
      streak = outcome.streak
      store.getState().awardStar()
      store.getState().recordStreak(level.id, streak)
      if (outcome.cleared) store.getState().clearLevel(level.id, streak)
    }

    const progress = store.getState().progress
    expect(progress[level.id].cleared).toBe(true)
    expect(unlockedUpTo(counting, progress)).toBe(2)
    expect(isLevelUnlocked(counting[1], counting, progress)).toBe(true)
    expect(isLevelUnlocked(counting[2], counting, progress)).toBe(false)
    expect(store.getState().stars).toBe(level.masteryGoal)
  })

  it('every category starts with its first level open', () => {
    const progress = useGameStore.getState().progress
    for (const category of CATEGORIES) {
      const levels = levelsInCategory(category.id)
      expect(levels.length).toBeGreaterThan(0)
      expect(isLevelUnlocked(levels[0], levels, progress)).toBe(true)
    }
  })

  it('a cleared level NEVER re-locks, even with a gap before it (future content insertions)', () => {
    const counting = levelsInCategory('counting')
    // Simulate a content update inserting an uncleared level before a cleared
    // one: only level 3 is cleared; 1 and 2 are not.
    const progress = { [counting[2].id]: { cleared: true, bestStreak: 3 } }
    expect(isLevelUnlocked(counting[2], counting, progress)).toBe(true) // cleared → open forever
    expect(isLevelUnlocked(counting[0], counting, progress)).toBe(true) // first is open
    expect(isLevelUnlocked(counting[1], counting, progress)).toBe(false) // still gated
    expect(unlockedUpTo(counting, progress)).toBe(1) // prefix rule unchanged
  })

  it('nextLevelAfter walks every category in order and ends cleanly', () => {
    for (const category of CATEGORIES) {
      const levels = levelsInCategory(category.id)
      for (let i = 0; i < levels.length - 1; i++) {
        expect(nextLevelAfter(levels[i])?.id).toBe(levels[i + 1].id)
      }
      // The last level of every category has no "next".
      expect(nextLevelAfter(levels[levels.length - 1])).toBeUndefined()
    }
  })
})

describe('safe failure', () => {
  it('a wrong answer never advances the streak, clears, or awards a star', () => {
    const counting = levelsInCategory('counting')
    const level = counting[0]
    const q = generateQuestion(level)
    const outcome = evaluateAnswer(q, wrongAnswer(q), 1, level.masteryGoal)
    expect(outcome.correct).toBe(false)
    expect(outcome.streak).toBe(1) // unchanged
    expect(outcome.cleared).toBe(false)
    expect(useGameStore.getState().stars).toBe(0)
    expect(unlockedUpTo(counting, useGameStore.getState().progress)).toBe(1)
  })

  it('wrong answers before the final correct one still let the level clear', () => {
    const level = levelsInCategory('comparing')[0]
    let streak = 0
    let stars = 0
    let attempts = 0
    while (streak < level.masteryGoal) {
      attempts++
      const q = generateQuestion(level)
      // Miss once, then get it right — mastery still reached.
      const wrongOut = evaluateAnswer(q, wrongAnswer(q), streak, level.masteryGoal)
      expect(wrongOut.streak).toBe(streak)
      const rightOut = evaluateAnswer(q, correctAnswer(q), streak, level.masteryGoal)
      streak = rightOut.streak
      stars++
      if (attempts > 50) throw new Error('mastery never reached')
    }
    expect(streak).toBe(level.masteryGoal)
    expect(stars).toBe(level.masteryGoal)
  })
})

describe('every category to the end', () => {
  it('playing every level clears the whole meadow', () => {
    const store = useGameStore
    let expectedStars = 0

    for (const category of CATEGORIES) {
      const levels = levelsInCategory(category.id)
      for (const level of levels) {
        // Level must derive as unlocked before we can play it.
        expect(isLevelUnlocked(level, levels, store.getState().progress)).toBe(true)
        let streak = 0
        while (streak < level.masteryGoal) {
          const q = generateQuestion(level)
          expect(q.activity).toBe(level.activity)
          const outcome = evaluateAnswer(q, correctAnswer(q), streak, level.masteryGoal)
          expect(outcome.correct).toBe(true)
          streak = outcome.streak
          store.getState().awardStar()
          expectedStars++
          if (outcome.cleared) store.getState().clearLevel(level.id, streak)
        }
      }
      // The category is fully cleared.
      expect(unlockedUpTo(levels, store.getState().progress)).toBe(levels.length + 1)
    }

    expect(store.getState().stars).toBe(expectedStars)
    for (const level of TRAIL) {
      expect(store.getState().progress[level.id].cleared).toBe(true)
    }
  })
})

describe('reset semantics', () => {
  it('wipes progress, stars AND age (new-player handoff), but keeps pace + mute', () => {
    const store = useGameStore
    store.setState({
      stars: 9,
      age: 6,
      pace: 'steady',
      muted: true,
      progress: { 'math-early-1': { cleared: true, bestStreak: 3 } },
    })
    store.getState().reset()
    const s = store.getState()
    expect(s.stars).toBe(0)
    expect(s.progress).toEqual({})
    expect(s.age).toBeNull() // the age gate re-asks (and re-offers placement)
    expect(s.pace).toBe('steady') // household settings survive
    expect(s.muted).toBe(true)
  })
})

describe('sprint scores', () => {
  it('recordSprintScore is forward-only: a worse run never lowers a best', () => {
    const store = useGameStore
    store.getState().recordSprintScore('math-early-1', 5)
    expect(store.getState().bestScores['math-early-1']).toBe(5)
    store.getState().recordSprintScore('math-early-1', 3) // worse — ignored
    expect(store.getState().bestScores['math-early-1']).toBe(5)
    store.getState().recordSprintScore('math-early-1', 9) // better — kept
    expect(store.getState().bestScores['math-early-1']).toBe(9)
  })

  it('categorySprintScore sums a category’s level bests', () => {
    const counting = levelsInCategory('counting')
    const bests = { [counting[0].id]: 4, [counting[2].id]: 6 }
    expect(categorySprintScore(counting, bests)).toBe(10)
    expect(categorySprintScore(levelsInCategory('money'), bests)).toBe(0)
  })

  it('reset wipes sprint bests along with the rest of the child’s progress', () => {
    useGameStore.getState().recordSprintScore('math-early-1', 8)
    useGameStore.getState().reset()
    expect(useGameStore.getState().bestScores).toEqual({})
  })

  it('every level carries a sane sprintSeconds (content data)', () => {
    const HEAVY = new Set(['subitize', 'match', 'who-left', 'make-amount', 'set-clock', 'tap-all'])
    for (const level of TRAIL) {
      expect(level.sprintSeconds).toBeGreaterThanOrEqual(45)
      expect(level.sprintSeconds).toBeLessThanOrEqual(120)
      if (HEAVY.has(level.activity)) {
        expect(level.sprintSeconds, level.id).toBeGreaterThanOrEqual(90)
      }
    }
  })
})

describe('persisted-state migration (v1 → v2)', () => {
  it('keeps earned fields and drops the old unlockedOrder', () => {
    const v1 = {
      unlockedOrder: 4,
      stars: 12,
      progress: {
        'math-early-1': { cleared: true, bestStreak: 3 },
        'math-early-2': { cleared: true, bestStreak: 3 },
        'math-early-3': { cleared: true, bestStreak: 3 },
      },
      muted: true,
    }
    const migrated = migratePersistedState(v1)
    expect(migrated).toEqual({
      stars: 12,
      progress: v1.progress,
      muted: true,
      pace: null, // v1 predates the pace profile
      age: null, // …and the age gate, which will ask once
      currency: 'USD', // …and the currency setting (defaulted)
      bestScores: {}, // …and sprint scores
    })
    expect('unlockedOrder' in migrated).toBe(false)

    // The derived unlock matches what the child had earned: the three Phase 0
    // counting levels are cleared, so the save lands exactly on the first
    // Phase 1 rung (order 4) — old progress flows into new content untouched.
    const counting = levelsInCategory('counting')
    expect(unlockedUpTo(counting, migrated.progress)).toBe(4)
    for (const category of CATEGORIES) {
      const levels = levelsInCategory(category.id)
      expect(isLevelUnlocked(levels[0], levels, migrated.progress)).toBe(true)
    }
  })

  it('tolerates malformed or empty persisted state', () => {
    expect(migratePersistedState(undefined)).toEqual({
      stars: 0,
      progress: {},
      muted: false,
      pace: null,
      age: null,
      currency: 'USD',
      bestScores: {},
    })
    expect(
      migratePersistedState({ stars: 'nope', muted: 'yes', pace: 'warp', age: 99 }),
    ).toEqual({
      stars: 0,
      progress: {},
      muted: false,
      pace: null, // unknown pace value is discarded, not trusted
      age: null, // implausible age re-asks the gate
      currency: 'USD',
      bestScores: {},
    })
    // Plausible values survive.
    expect(migratePersistedState({ age: 8 }).age).toBe(8)
    expect(migratePersistedState({ currency: 'GBP' }).currency).toBe('GBP')
    // Sprint bests: numeric entries survive, junk is dropped.
    expect(
      migratePersistedState({
        bestScores: { 'math-early-1': 7, 'math-early-2': 'lots', 'math-early-3': NaN },
      }).bestScores,
    ).toEqual({ 'math-early-1': 7 })
  })
})
