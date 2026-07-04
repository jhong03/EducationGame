import type { ActivityType, Level, Question, QuestionGenerator, Rng } from '../types'
import { generateCount } from './count'
import { generateCompare } from './compare'
import { generateAdd } from './add'
import { generateSubitize } from './subitize'
import { generateMatch } from './match'
import { generateSequence } from './sequence'
import { generateSubtract } from './subtract'
import { generateShapeId } from './shapeId'
import { generatePattern } from './pattern'
import { generateClock } from './clock'
import { generateMoney } from './money'
import { generateOddOneOut } from './oddOneOut'
import { generateShadowMatch } from './shadowMatch'
import { generateOneMore } from './oneMore'
import { generateSameOrNot } from './sameOrNot'
import { generateNumCompare } from './numCompare'
import { generateBond } from './bond'
import { generateSides } from './sides'
import { generateCoinCompare } from './coinCompare'
import { generateWhoLeft } from './whoLeft'
import { generateBelongs } from './belongs'
import { generatePosition } from './position'
import { generateDayTime } from './dayTime'
import { generateSizeCompare } from './sizeCompare'
import { generateHeightCompare } from './heightCompare'
import { generateWeightCompare } from './weightCompare'
import { generateMakeAmount } from './makeAmount'
import { generateSetClock } from './setClock'
import { generateTapAll } from './tapAll'

/**
 * The activity registry: ActivityType → generator. This is the only place the
 * engine "knows" which activities exist. Adding a subject/activity means adding
 * one entry here plus a renderer — the game loop calls generators blindly.
 */
export const GENERATORS: Record<ActivityType, QuestionGenerator> = {
  count: generateCount,
  compare: generateCompare,
  add: generateAdd,
  subitize: generateSubitize,
  match: generateMatch,
  sequence: generateSequence,
  subtract: generateSubtract,
  'shape-id': generateShapeId,
  pattern: generatePattern,
  clock: generateClock,
  money: generateMoney,
  'odd-one-out': generateOddOneOut,
  'shadow-match': generateShadowMatch,
  'one-more': generateOneMore,
  'same-or-not': generateSameOrNot,
  'num-compare': generateNumCompare,
  bond: generateBond,
  sides: generateSides,
  'coin-compare': generateCoinCompare,
  'who-left': generateWhoLeft,
  belongs: generateBelongs,
  position: generatePosition,
  'day-time': generateDayTime,
  'size-compare': generateSizeCompare,
  'height-compare': generateHeightCompare,
  'weight-compare': generateWeightCompare,
  'make-amount': generateMakeAmount,
  'set-clock': generateSetClock,
  'tap-all': generateTapAll,
}

/** Generate the next Question for a level by dispatching on its activity. */
export function generateQuestion(level: Level, rng: Rng = Math.random): Question {
  const generator = GENERATORS[level.activity]
  if (!generator) {
    throw new Error(`No generator registered for activity "${level.activity}"`)
  }
  return generator(level.params, rng)
}

export {
  generateCount,
  generateCompare,
  generateAdd,
  generateSubitize,
  generateMatch,
  generateSequence,
  generateSubtract,
  generateShapeId,
  generatePattern,
  generateClock,
  generateMoney,
  generateOddOneOut,
  generateShadowMatch,
  generateOneMore,
  generateSameOrNot,
  generateNumCompare,
  generateBond,
  generateSides,
  generateCoinCompare,
  generateWhoLeft,
  generateBelongs,
  generatePosition,
  generateDayTime,
  generateSizeCompare,
  generateHeightCompare,
  generateWeightCompare,
  generateMakeAmount,
  generateSetClock,
  generateTapAll,
}
