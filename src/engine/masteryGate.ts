import type { Answer, Question } from './types'

/**
 * The mastery gate — pure logic, no state, no side effects. The store composes
 * these; keeping them pure makes the "a correct answer that isn't" class of bug
 * unit-testable (spec §3, §7).
 *
 * Safe-failure rule (spec §1): a wrong answer never decrements progress. The
 * child simply retries the same question, so the streak holds steady on a wrong
 * answer and only climbs on a correct one.
 */

/** Is `answer` the right response to `question`? Narrowed per activity. */
export function isCorrect(question: Question, answer: Answer): boolean {
  switch (question.activity) {
    case 'count':
    case 'add':
      return typeof answer === 'number' && answer === question.answer
    case 'compare':
      return answer === question.answer
  }
}

/**
 * The streak (correct answers within the current level attempt) after an
 * answer. Climbs by one when correct; unchanged when wrong — never resets.
 */
export function nextStreak(current: number, correct: boolean): number {
  return correct ? current + 1 : current
}

/** Has the child cleared the level? (Reached the mastery goal.) */
export function isLevelCleared(streak: number, masteryGoal: number): boolean {
  return streak >= masteryGoal
}

export interface AnswerOutcome {
  correct: boolean
  streak: number // updated streak
  cleared: boolean // did this answer clear the level?
}

/**
 * Evaluate one answer against a question given the current streak and the
 * level's mastery goal. The single entry point the store calls per answer.
 */
export function evaluateAnswer(
  question: Question,
  answer: Answer,
  currentStreak: number,
  masteryGoal: number,
): AnswerOutcome {
  const correct = isCorrect(question, answer)
  const streak = nextStreak(currentStreak, correct)
  return {
    correct,
    streak,
    // A level clears the moment the streak reaches the goal — and only on the
    // answer that pushes it there (so we fire the celebration exactly once).
    cleared: correct && isLevelCleared(streak, masteryGoal),
  }
}
