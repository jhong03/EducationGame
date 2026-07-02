import { describe, it, expect } from 'vitest'
import type { AddQuestion, CompareQuestion, CountQuestion } from './types'
import {
  evaluateAnswer,
  isCorrect,
  isLevelCleared,
  nextStreak,
} from './masteryGate'

const countQ: CountQuestion = {
  id: 'c1',
  activity: 'count',
  prompt: 'How many apples?',
  payload: { group: { theme: { id: 'apple', singular: 'apple', plural: 'apples', emoji: '🍎' }, count: 3 } },
  options: [2, 3, 4],
  answer: 3,
}

const compareQ: CompareQuestion = {
  id: 'p1',
  activity: 'compare',
  prompt: 'Which one has more?',
  payload: {
    left: { theme: { id: 'duck', singular: 'duck', plural: 'ducks', emoji: '🐤' }, count: 5 },
    right: { theme: { id: 'frog', singular: 'frog', plural: 'frogs', emoji: '🐸' }, count: 2 },
  },
  answer: 'left',
}

const addQ: AddQuestion = {
  id: 'a1',
  activity: 'add',
  prompt: 'How many altogether?',
  payload: {
    left: { theme: { id: 'star', singular: 'star', plural: 'stars', emoji: '⭐' }, count: 2 },
    right: { theme: { id: 'star', singular: 'star', plural: 'stars', emoji: '⭐' }, count: 1 },
  },
  options: [3, 4, 5],
  answer: 3,
}

describe('isCorrect', () => {
  it('grades count answers by number', () => {
    expect(isCorrect(countQ, 3)).toBe(true)
    expect(isCorrect(countQ, 2)).toBe(false)
  })

  it('grades add answers by number', () => {
    expect(isCorrect(addQ, 3)).toBe(true)
    expect(isCorrect(addQ, 5)).toBe(false)
  })

  it('grades compare answers by side', () => {
    expect(isCorrect(compareQ, 'left')).toBe(true)
    expect(isCorrect(compareQ, 'right')).toBe(false)
  })

  it('rejects a side answer to a number question and vice versa', () => {
    expect(isCorrect(countQ, 'left')).toBe(false)
    expect(isCorrect(compareQ, 5)).toBe(false)
  })
})

describe('nextStreak — safe failure', () => {
  it('climbs by one on a correct answer', () => {
    expect(nextStreak(0, true)).toBe(1)
    expect(nextStreak(2, true)).toBe(3)
  })

  it('never decrements on a wrong answer (holds steady)', () => {
    expect(nextStreak(0, false)).toBe(0)
    expect(nextStreak(2, false)).toBe(2)
  })
})

describe('isLevelCleared', () => {
  it('clears exactly at the mastery goal', () => {
    expect(isLevelCleared(2, 3)).toBe(false)
    expect(isLevelCleared(3, 3)).toBe(true)
    expect(isLevelCleared(4, 3)).toBe(true)
  })
})

describe('evaluateAnswer', () => {
  it('increments streak and reports correctness on a right answer', () => {
    const out = evaluateAnswer(countQ, 3, 0, 3)
    expect(out).toEqual({ correct: true, streak: 1, cleared: false })
  })

  it('holds the streak and does not clear on a wrong answer', () => {
    const out = evaluateAnswer(countQ, 2, 2, 3)
    expect(out).toEqual({ correct: false, streak: 2, cleared: false })
  })

  it('fires cleared exactly on the answer that reaches the goal', () => {
    const out = evaluateAnswer(countQ, 3, 2, 3)
    expect(out).toEqual({ correct: true, streak: 3, cleared: true })
  })

  it('a wrong answer at the threshold does not clear', () => {
    const out = evaluateAnswer(countQ, 2, 2, 3)
    expect(out.cleared).toBe(false)
  })

  it('drives a full level to mastery over repeated correct answers', () => {
    let streak = 0
    let clears = 0
    for (let i = 0; i < 3; i++) {
      const out = evaluateAnswer(compareQ, 'left', streak, 3)
      streak = out.streak
      if (out.cleared) clears++
    }
    expect(streak).toBe(3)
    expect(clears).toBe(1) // celebration fires exactly once
  })
})
