import type { ActivityType, Level, Question, QuestionGenerator, Rng } from '../types'
import { generateCount } from './count'
import { generateCompare } from './compare'
import { generateAdd } from './add'

/**
 * The activity registry: ActivityType → generator. This is the only place the
 * engine "knows" which activities exist. Adding a subject/activity means adding
 * one entry here plus a renderer — the game loop calls generators blindly.
 */
export const GENERATORS: Record<ActivityType, QuestionGenerator> = {
  count: generateCount,
  compare: generateCompare,
  add: generateAdd,
}

/** Generate the next Question for a level by dispatching on its activity. */
export function generateQuestion(level: Level, rng: Rng = Math.random): Question {
  const generator = GENERATORS[level.activity]
  if (!generator) {
    throw new Error(`No generator registered for activity "${level.activity}"`)
  }
  return generator(level.params, rng)
}

export { generateCount, generateCompare, generateAdd }
