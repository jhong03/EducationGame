import { describe, it, expect, beforeEach } from 'vitest'
import { generateQuestion } from './generators'
import { evaluateAnswer } from './masteryGate'
import { useGameStore } from './store'
import { MAX_ORDER, TRAIL } from '../content/math'
import type { Answer, Question } from './types'

/**
 * End-to-end engine loop, without React: prove the whole chain the game relies
 * on — a generated question's `answer` really is accepted as correct, mastery
 * clears the level, the next order unlocks, and stars accrue. This is the
 * "a math game that scores a wrong answer as right is a product-killer" guard.
 */

/** The correct answer for any generated question. */
function correctAnswer(q: Question): Answer {
  return q.answer
}

/** A definitely-wrong answer for any generated question. */
function wrongAnswer(q: Question): Answer {
  if (q.activity === 'compare') return q.answer === 'left' ? 'right' : 'left'
  const other = q.options.find((o) => o !== q.answer)
  return other ?? q.answer + 1
}

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('single level to mastery', () => {
  it('clears a level after masteryGoal correct answers and unlocks the next', () => {
    const level = TRAIL[0]
    const store = useGameStore
    let streak = 0

    for (let i = 0; i < level.masteryGoal; i++) {
      const q = generateQuestion(level)
      const outcome = evaluateAnswer(q, correctAnswer(q), streak, level.masteryGoal)
      expect(outcome.correct).toBe(true)
      streak = outcome.streak
      store.getState().awardStar()
      store.getState().recordStreak(level.id, streak)
      if (outcome.cleared) store.getState().clearLevel(level.id, level.order, streak)
    }

    expect(store.getState().unlockedOrder).toBe(level.order + 1)
    expect(store.getState().stars).toBe(level.masteryGoal)
    expect(store.getState().progress[level.id].cleared).toBe(true)
  })
})

describe('safe failure', () => {
  it('a wrong answer never advances the streak, clears, or awards a star', () => {
    const level = TRAIL[0]
    const q = generateQuestion(level)
    const outcome = evaluateAnswer(q, wrongAnswer(q), 1, level.masteryGoal)
    expect(outcome.correct).toBe(false)
    expect(outcome.streak).toBe(1) // unchanged
    expect(outcome.cleared).toBe(false)
    expect(useGameStore.getState().stars).toBe(0)
    expect(useGameStore.getState().unlockedOrder).toBe(1)
  })

  it('wrong answers before the final correct one still let the level clear', () => {
    const level = TRAIL[3] // compare
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

describe('full trail to the top', () => {
  it('playing every level clears the whole meadow and unlocks past the last', () => {
    const store = useGameStore
    let expectedStars = 0

    for (const level of TRAIL) {
      // Level must be unlocked before we can play it.
      expect(store.getState().unlockedOrder).toBeGreaterThanOrEqual(level.order)
      let streak = 0
      while (streak < level.masteryGoal) {
        const q = generateQuestion(level)
        expect(q.activity).toBe(level.activity)
        const outcome = evaluateAnswer(q, correctAnswer(q), streak, level.masteryGoal)
        expect(outcome.correct).toBe(true)
        streak = outcome.streak
        store.getState().awardStar()
        expectedStars++
        if (outcome.cleared) store.getState().clearLevel(level.id, level.order, streak)
      }
    }

    expect(store.getState().unlockedOrder).toBe(MAX_ORDER + 1)
    expect(store.getState().stars).toBe(expectedStars)
    for (const level of TRAIL) {
      expect(store.getState().progress[level.id].cleared).toBe(true)
    }
  })
})
