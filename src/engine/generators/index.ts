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
import { generatePlaceValue } from './placeValue'
import { generateRound } from './round'
import { generateMultiply } from './multiply'
import { generateDivide } from './divide'
import { generateShare } from './share'
import { generateArith } from './arith'
import { generateFractionOf } from './fractionOf'
import { generateUnitPick } from './unitPick'
import { generateGridRect } from './gridRect'
import { generateElapsed } from './elapsed'
import { generateChange } from './change'
import { generateGraphCount, generateGraphMost } from './graph'
import { generateShapeSort } from './shapeSort'
import { generateMissing } from './missing'
import { generateLeftover } from './leftover'
import { generateWordProblem } from './wordProblem'
import { generateFractionOp } from './fractionOp'
import { generateReadScale } from './readScale'
import { generateBuildGraph } from './buildGraph'
import { generateColumnOp } from './columnOp'
import { generateFindNumber } from './findNumber'
import { generateDecimal } from './decimal'
import { generateEquivPick } from './equivPick'
import { generatePercentOf } from './percentOf'
import { generateNegatives } from './negatives'
import { generateAngle } from './angle'
import { generateSymmetry } from './symmetry'
import { generateOrderOps } from './orderOps'
import { generateRatio } from './ratio'
import { generateMean } from './mean'
import { generateChance } from './chance'
import { generateConvert } from './convert'
import { generateVolume } from './volume'
import { generateCoord } from './coord'

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
  'place-value': generatePlaceValue,
  round: generateRound,
  multiply: generateMultiply,
  divide: generateDivide,
  share: generateShare,
  arith: generateArith,
  'fraction-of': generateFractionOf,
  'unit-pick': generateUnitPick,
  'grid-rect': generateGridRect,
  elapsed: generateElapsed,
  change: generateChange,
  'graph-count': generateGraphCount,
  'graph-most': generateGraphMost,
  'shape-sort': generateShapeSort,
  missing: generateMissing,
  leftover: generateLeftover,
  'word-problem': generateWordProblem,
  'fraction-op': generateFractionOp,
  'read-scale': generateReadScale,
  'build-graph': generateBuildGraph,
  'column-op': generateColumnOp,
  'find-number': generateFindNumber,
  decimal: generateDecimal,
  'equiv-pick': generateEquivPick,
  'percent-of': generatePercentOf,
  negatives: generateNegatives,
  angle: generateAngle,
  symmetry: generateSymmetry,
  'order-ops': generateOrderOps,
  ratio: generateRatio,
  mean: generateMean,
  chance: generateChance,
  convert: generateConvert,
  volume: generateVolume,
  coord: generateCoord,
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
  generatePlaceValue,
  generateRound,
  generateMultiply,
  generateDivide,
  generateShare,
  generateArith,
  generateFractionOf,
  generateUnitPick,
  generateGridRect,
  generateElapsed,
  generateChange,
  generateGraphCount,
  generateGraphMost,
  generateShapeSort,
  generateMissing,
  generateLeftover,
  generateWordProblem,
  generateFractionOp,
  generateReadScale,
  generateBuildGraph,
  generateColumnOp,
  generateFindNumber,
  generateDecimal,
  generateEquivPick,
  generatePercentOf,
  generateNegatives,
  generateAngle,
  generateSymmetry,
  generateOrderOps,
  generateRatio,
  generateMean,
  generateChance,
  generateConvert,
  generateVolume,
  generateCoord,
}
