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
    case 'subitize':
    case 'sequence':
    case 'subtract':
    case 'match': // answer is the tapped group's index
    case 'shape-id': // tapped card's index
    case 'pattern': // tapped motif's index
    case 'clock': // tapped time-choice's index
    case 'money': // total value
    case 'odd-one-out': // tapped item's index
    case 'shadow-match': // tapped choice's index
    case 'one-more': // value
    case 'same-or-not': // 1 = same, 0 = not
    case 'bond': // missing addend
    case 'sides': // side count
    case 'who-left': // vanished item's index
    case 'belongs': // choice index
    case 'position': // item index
    case 'day-time': // scene index
    case 'make-amount': // built total
    case 'set-clock': // dialled hour
    case 'tap-all': // found-them-all count
    case 'place-value': // the number the blocks show
    case 'round': // nearest ten/hundred
    case 'multiply': // product
    case 'divide': // quotient
    case 'share': // per-plate count
    case 'arith': // sum / difference
    case 'grid-rect': // area / perimeter
    case 'elapsed': // hours between
    case 'change': // paid − price
    case 'graph-count': // a column's value
    case 'missing': // the blank
    case 'leftover': // the remainder
    case 'word-problem': // the story's answer
    case 'fraction-of': // fraction card index
    case 'unit-pick': // unit card index
    case 'graph-most': // tallest column index
    case 'shape-sort': // matching shape index
    case 'fraction-op': // fraction card index
    case 'read-scale': // the tick the arrow points at
    case 'build-graph': // digit-encoded column heights
    case 'column-op': // sum / difference / product
    case 'find-number': // the numeral for the spoken words
    case 'decimal': // decimal card index
    case 'equiv-pick': // equivalent card index
    case 'percent-of': // the part
    case 'negatives': // the (negative) tick
    case 'angle': // angle card index
    case 'symmetry': // mirror-line count
    case 'order-ops': // the properly-ordered result
    case 'ratio': // the scaled partner quantity
    case 'mean': // the average
    case 'chance': // scale-word index
    case 'convert': // the converted amount
    case 'volume': // total cubes
    case 'coord': // coordinate card index
    case 'angle-sum': // the missing angle
    case 'riddle': // the thought-of number
    case 'chance-frac': // fraction card index
      return typeof answer === 'number' && answer === question.answer
    case 'compare':
    case 'num-compare':
    case 'coin-compare':
    case 'size-compare':
    case 'height-compare':
    case 'weight-compare':
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
