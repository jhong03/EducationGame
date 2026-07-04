import { describe, it, expect } from 'vitest'
import type { Rng } from './types'
import { generateCount } from './generators/count'
import { generateCompare } from './generators/compare'
import { generateAdd } from './generators/add'
import { generateSubitize } from './generators/subitize'
import { generateMatch } from './generators/match'
import { generateSequence } from './generators/sequence'
import { generateSubtract } from './generators/subtract'
import { generateShapeId } from './generators/shapeId'
import { generatePattern } from './generators/pattern'
import { generateClock } from './generators/clock'
import { generateMoney } from './generators/money'
import { generateOddOneOut } from './generators/oddOneOut'
import { generateShadowMatch } from './generators/shadowMatch'
import { generateOneMore } from './generators/oneMore'
import { generateSameOrNot } from './generators/sameOrNot'
import { generateNumCompare } from './generators/numCompare'
import { generateBond } from './generators/bond'
import { generateSides } from './generators/sides'
import { generateCoinCompare } from './generators/coinCompare'
import { generateWhoLeft } from './generators/whoLeft'
import { generateBelongs } from './generators/belongs'
import { generatePosition } from './generators/position'
import { generateDayTime } from './generators/dayTime'
import { generateSizeCompare } from './generators/sizeCompare'
import { generateHeightCompare } from './generators/heightCompare'
import { generateWeightCompare } from './generators/weightCompare'
import { generateMakeAmount } from './generators/makeAmount'
import { generateSetClock } from './generators/setClock'
import { generateTapAll } from './generators/tapAll'
import { generatePlaceValue } from './generators/placeValue'
import { generateRound } from './generators/round'
import { generateMultiply, TABLE_SETS } from './generators/multiply'
import { generateDivide } from './generators/divide'
import { generateShare } from './generators/share'
import { generateArith } from './generators/arith'
import { generateFractionOf } from './generators/fractionOf'
import { generateUnitPick } from './generators/unitPick'
import { generateGridRect } from './generators/gridRect'
import { generateElapsed } from './generators/elapsed'
import { generateChange } from './generators/change'
import { generateGraphCount, generateGraphMost } from './generators/graph'
import { generateShapeSort } from './generators/shapeSort'
import { generateMissing } from './generators/missing'
import { generateLeftover } from './generators/leftover'
import { generateWordProblem } from './generators/wordProblem'
import { generateFractionOp } from './generators/fractionOp'
import { generateReadScale } from './generators/readScale'
import { generateBuildGraph, encodeHeights } from './generators/buildGraph'
import { generateColumnOp, flipDigits } from './generators/columnOp'
import { MEASURE_OBJECTS, SCALE_UNITS } from '../content/world'
import { generateQuestion, GENERATORS } from './generators'
import { TRAIL } from '../content/math'
import { SHAPES, SHAPE_SIDES } from '../content/shapes'
import { themeKind, THEMES } from '../content/themes'
import { WEIGHT_PAIRS } from '../content/world'
import { buildNumberOptions, randInt, randIntExcept, shuffle } from './random'

/**
 * Deterministic RNG (mulberry32) so every run exercises the same stream and a
 * failure is reproducible. We sweep thousands of seeds to stand in for the
 * randomness the generators would see in the wild.
 */
function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RUNS = 3000
const seeds = Array.from({ length: RUNS }, (_, i) => i + 1)

describe('random helpers', () => {
  it('randInt stays within [min, max] inclusive and hits both ends', () => {
    const seen = new Set<number>()
    for (const s of seeds) {
      const r = mulberry32(s)
      const v = randInt(0, 5, r)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(5)
      expect(Number.isInteger(v)).toBe(true)
      seen.add(v)
    }
    expect(seen.has(0)).toBe(true)
    expect(seen.has(5)).toBe(true)
  })

  it('randIntExcept never returns the excluded value and covers the rest', () => {
    const seen = new Set<number>()
    for (const s of seeds) {
      const r = mulberry32(s)
      const v = randIntExcept(1, 6, 3, r)
      expect(v).not.toBe(3)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(6)
      seen.add(v)
    }
    expect([...seen].sort()).toEqual([1, 2, 4, 5, 6])
  })

  it('shuffle preserves the multiset', () => {
    const input = [0, 1, 2, 3, 4, 5]
    for (const s of seeds.slice(0, 200)) {
      const out = shuffle(input, mulberry32(s))
      expect(out.slice().sort((a, b) => a - b)).toEqual(input)
    }
  })

  it('buildNumberOptions: distinct, in range, exactly one correct', () => {
    for (const s of seeds) {
      const r = mulberry32(s)
      const correct = randInt(0, 10, r)
      const opts = buildNumberOptions(correct, 0, 10, 3, r)
      expect(opts).toHaveLength(3)
      expect(new Set(opts).size).toBe(3) // distinct
      expect(opts.filter((o) => o === correct)).toHaveLength(1) // exactly one
      for (const o of opts) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(10)
      }
    }
  })
})

describe('count generator', () => {
  for (const max of [3, 5, 10]) {
    it(`max=${max}: valid quantity, options, and single correct answer`, () => {
      for (const s of seeds) {
        const q = generateCount({ max }, mulberry32(s))
        const n = q.payload.group.count
        expect(q.activity).toBe('count')
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(max)
        expect(q.answer).toBe(n)
        // options: 3, distinct, in [0, max], exactly one correct, never below 0
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) {
          expect(o).toBeGreaterThanOrEqual(0)
          expect(o).toBeLessThanOrEqual(max)
        }
        expect(q.prompt.length).toBeGreaterThan(0)
      }
    })
  }
})

describe('compare generator', () => {
  it('max=6: groups never equal, distinct themes, answer points to more', () => {
    for (const s of seeds) {
      const q = generateCompare({ max: 6 }, mulberry32(s))
      const { left, right } = q.payload
      expect(q.activity).toBe('compare')
      expect(left.count).not.toBe(right.count) // never equal
      expect(left.theme.id).not.toBe(right.theme.id) // different themes
      for (const g of [left, right]) {
        expect(g.count).toBeGreaterThanOrEqual(1)
        expect(g.count).toBeLessThanOrEqual(6)
      }
      const bigger = left.count > right.count ? 'left' : 'right'
      expect(q.answer).toBe(bigger)
    }
  })
})

describe('add generator', () => {
  it('max=5: total never exceeds max, both sides >= 1, single correct option', () => {
    for (const s of seeds) {
      const q = generateAdd({ max: 5 }, mulberry32(s))
      const { left, right } = q.payload
      expect(q.activity).toBe('add')
      expect(left.count).toBeGreaterThanOrEqual(1)
      expect(right.count).toBeGreaterThanOrEqual(1)
      const total = left.count + right.count
      expect(total).toBe(q.answer)
      expect(total).toBeLessThanOrEqual(5) // never exceed max
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(5)
      }
    }
  })
})

describe('subitize generator', () => {
  it('max=5: behaves like count (valid quantity, single correct option) and carries flashMs', () => {
    for (const s of seeds) {
      const q = generateSubitize({ max: 5, flashMs: 1800 }, mulberry32(s))
      const n = q.payload.group.count
      expect(q.activity).toBe('subitize')
      expect(q.payload.flashMs).toBe(1800)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(5)
      expect(q.answer).toBe(n)
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(5)
      }
    }
  })
})

describe('match generator', () => {
  it('max=10: exactly one group holds the target; counts distinct, in [1,max]; one theme; answer is that group’s index', () => {
    for (const s of seeds) {
      const q = generateMatch({ max: 10 }, mulberry32(s))
      const { target, groups } = q.payload
      expect(q.activity).toBe('match')
      expect(target).toBeGreaterThanOrEqual(1)
      expect(target).toBeLessThanOrEqual(10)
      expect(groups).toHaveLength(3)
      // Exactly one group matches the target…
      expect(groups.filter((g) => g.count === target)).toHaveLength(1)
      // …all counts distinct, positive, in range, one shared theme.
      expect(new Set(groups.map((g) => g.count)).size).toBe(3)
      for (const g of groups) {
        expect(g.count).toBeGreaterThanOrEqual(1)
        expect(g.count).toBeLessThanOrEqual(10)
        expect(g.theme.id).toBe(groups[0].theme.id)
      }
      // The answer index really points at the matching group.
      expect(groups[q.answer].count).toBe(target)
      // Options are the group indices, exactly one correct.
      expect(q.options).toEqual([0, 1, 2])
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      // The prompt speaks the number word, not the numeral.
      expect(q.prompt).toMatch(/Find [a-z]+!/)
    }
  })

  it('clamps degenerate max<3 up to 3 — never fewer than three groups', () => {
    for (const max of [1, 2]) {
      for (const s of seeds.slice(0, 500)) {
        const q = generateMatch({ max }, mulberry32(s))
        expect(q.payload.groups).toHaveLength(3)
        expect(q.payload.groups.filter((g) => g.count === q.payload.target)).toHaveLength(1)
        for (const g of q.payload.groups) {
          expect(g.count).toBeGreaterThanOrEqual(1)
          expect(g.count).toBeLessThanOrEqual(3) // the clamped range
        }
      }
    }
  })
})

describe('sequence generator', () => {
  for (const [max, step] of [
    [20, 1],
    [30, 2],
    [50, 5],
  ] as const) {
    it(`max=${max}, step=${step}: run is arithmetic, answer = last + step, everything within [1, max]`, () => {
      for (const s of seeds) {
        const q = generateSequence({ max, step }, mulberry32(s))
        const { shown } = q.payload
        expect(q.activity).toBe('sequence')
        expect(shown).toHaveLength(3)
        expect(shown[1] - shown[0]).toBe(step)
        expect(shown[2] - shown[1]).toBe(step)
        expect(q.answer).toBe(shown[2] + step)
        expect(shown[0]).toBeGreaterThanOrEqual(1)
        expect(q.answer).toBeLessThanOrEqual(max)
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) {
          expect(o).toBeGreaterThanOrEqual(1)
          expect(o).toBeLessThanOrEqual(max)
        }
      }
    })
  }

  it('degenerate params (max too small for the step) stay within max(max, 1+3·step)', () => {
    for (const [max, step] of [
      [3, 1], // 1+3·1 = 4 > 3
      [20, 10], // skip-count config the docstring invites; 1+3·10 = 31 > 20
      [1, 1],
    ] as const) {
      const bound = Math.max(max, 1 + 3 * step)
      for (const s of seeds.slice(0, 500)) {
        const q = generateSequence({ max, step }, mulberry32(s))
        expect(q.payload.shown[0]).toBeGreaterThanOrEqual(1)
        expect(q.answer).toBe(q.payload.shown[2] + step)
        expect(q.answer).toBeLessThanOrEqual(bound)
        for (const o of q.options) {
          expect(o).toBeGreaterThanOrEqual(1)
          expect(o).toBeLessThanOrEqual(bound)
        }
      }
    }
  })
})

describe('subtract generator', () => {
  for (const max of [5, 10]) {
    it(`max=${max}: answer = start − taken, always ≥ 1, options never negative`, () => {
      for (const s of seeds) {
        const q = generateSubtract({ max }, mulberry32(s))
        const { group, taken } = q.payload
        expect(q.activity).toBe('subtract')
        expect(group.count).toBeGreaterThanOrEqual(2)
        expect(group.count).toBeLessThanOrEqual(max)
        expect(taken).toBeGreaterThanOrEqual(1)
        expect(taken).toBeLessThan(group.count) // something always remains
        expect(q.answer).toBe(group.count - taken)
        expect(q.answer).toBeGreaterThanOrEqual(1)
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) {
          expect(o).toBeGreaterThanOrEqual(0) // never below zero
          expect(o).toBeLessThanOrEqual(max)
        }
        // Spoken grammar: "One GOES away", "Two GO away" — this string is read
        // aloud to a pre-reader, so verb agreement is a correctness matter.
        expect(q.prompt).toMatch(taken === 1 ? / One goes away\. / : / go away\. /)
        expect(q.prompt[0]).toBe(q.prompt[0].toUpperCase())
      }
    })
  }
})

describe('shape-id generator', () => {
  for (const pool of [4, 6]) {
    it(`pool=${pool}: three distinct shapes from the pool, answer points at the spoken target`, () => {
      for (const s of seeds) {
        const q = generateShapeId({ pool }, mulberry32(s))
        const { shapeIds, targetId } = q.payload
        expect(q.activity).toBe('shape-id')
        expect(shapeIds).toHaveLength(3)
        expect(new Set(shapeIds).size).toBe(3) // distinct
        const poolIds = SHAPES.slice(0, pool).map((sh) => sh.id)
        for (const id of shapeIds) expect(poolIds).toContain(id)
        // Exactly one card is the target, the answer indexes it, the prompt speaks it.
        expect(shapeIds.filter((id) => id === targetId)).toHaveLength(1)
        expect(shapeIds[q.answer]).toBe(targetId)
        expect(q.options).toEqual([0, 1, 2])
        expect(q.prompt).toContain(targetId)
      }
    })
  }
})

describe('pattern generator', () => {
  for (const kinds of [1, 3]) {
    it(`kinds=${kinds}: sequence really repeats a unit and the answer continues it`, () => {
      for (const s of seeds) {
        const q = generatePattern({ kinds }, mulberry32(s))
        const { sequence, optionMotifs } = q.payload
        expect(q.activity).toBe('pattern')
        expect(sequence.length).toBeGreaterThanOrEqual(5)
        expect(optionMotifs).toHaveLength(3)
        expect(new Set(optionMotifs).size).toBe(3)
        // Reverse-engineer the unit: it must be one of AB / AAB / ABB and the
        // answer must be the sequence's next element under that unit.
        const unitLengths = [2, 3]
        const fits = unitLengths.some((len) => {
          const unit = sequence.slice(0, len)
          const repeats = sequence.every((m, i) => m === unit[i % len])
          const next = unit[sequence.length % len]
          return repeats && optionMotifs[q.answer] === next
        })
        expect(fits).toBe(true)
        // The two pattern motifs are among the options exactly once each.
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      }
    })
  }
})

describe('clock generator', () => {
  for (const step of [60, 30]) {
    it(`step=${step}: valid time, three distinct hour choices sharing the minute`, () => {
      let sawHalfPast = false
      for (const s of seeds) {
        const q = generateClock({ step }, mulberry32(s))
        const { hour, minute, choices } = q.payload
        expect(q.activity).toBe('clock')
        expect(hour).toBeGreaterThanOrEqual(1)
        expect(hour).toBeLessThanOrEqual(12)
        expect([0, 30]).toContain(minute)
        if (step === 60) expect(minute).toBe(0)
        if (minute === 30) sawHalfPast = true
        expect(choices).toHaveLength(3)
        expect(new Set(choices.map((c) => c.hour)).size).toBe(3) // distinct hours
        for (const c of choices) expect(c.minute).toBe(minute) // hour is the skill
        // Exactly one choice is the shown time, and the answer indexes it.
        expect(choices.filter((c) => c.hour === hour)).toHaveLength(1)
        expect(choices[q.answer].hour).toBe(hour)
      }
      if (step === 30) expect(sawHalfPast).toBe(true)
    })
  }
})

describe('money generator', () => {
  it('mixed=0, max=5: 1..max unit coins, answer = coin count, options valid', () => {
    for (const s of seeds) {
      const q = generateMoney({ mixed: 0, max: 5 }, mulberry32(s))
      const { coins } = q.payload
      expect(q.activity).toBe('money')
      expect(coins.length).toBeGreaterThanOrEqual(1)
      expect(coins.length).toBeLessThanOrEqual(5)
      expect(coins.every((v) => v === 1)).toBe(true)
      expect(q.answer).toBe(coins.length)
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0)
    }
  })

  it('mixed=1, max=10: two small coins, total ≤ max, answer = sum', () => {
    for (const s of seeds) {
      const q = generateMoney({ mixed: 1, max: 10 }, mulberry32(s))
      const { coins } = q.payload
      expect(coins).toHaveLength(2)
      for (const v of coins) expect([1, 2, 5]).toContain(v)
      const total = coins[0] + coins[1]
      expect(total).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(total)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('odd-one-out generator', () => {
  it('choices=4: exactly one odd item, answer indexes it, odd position varies', () => {
    const answerPositions = new Set<number>()
    for (const s of seeds) {
      const q = generateOddOneOut({ choices: 4 }, mulberry32(s))
      const { items } = q.payload
      expect(q.activity).toBe('odd-one-out')
      expect(items).toHaveLength(4)
      // Exactly two distinct emojis: the main one (×3) and the odd one (×1).
      const byEmoji = new Map<string, number>()
      for (const it of items) byEmoji.set(it.emoji, (byEmoji.get(it.emoji) ?? 0) + 1)
      expect(byEmoji.size).toBe(2)
      expect([...byEmoji.values()].sort((a, b) => a - b)).toEqual([1, 3])
      // The answer points at the singleton.
      expect(byEmoji.get(items[q.answer].emoji)).toBe(1)
      expect(q.options).toEqual([0, 1, 2, 3])
      answerPositions.add(q.answer)
    }
    // The odd one is not stuck in one slot.
    expect(answerPositions.size).toBe(4)
  })
})

describe('shadow-match generator', () => {
  it('choices=3: distinct choices, answer owns the shadow, silhouette twins never co-occur', () => {
    for (const s of seeds) {
      const q = generateShadowMatch({ choices: 3 }, mulberry32(s))
      const { targetEmoji, choices } = q.payload
      expect(q.activity).toBe('shadow-match')
      expect(choices).toHaveLength(3)
      expect(new Set(choices.map((c) => c.emoji)).size).toBe(3)
      // The answer's choice really is the shadow's owner, exactly once.
      expect(choices[q.answer].emoji).toBe(targetEmoji)
      expect(choices.filter((c) => c.emoji === targetEmoji)).toHaveLength(1)
      // Apple (🍎) and cookie (🍪) are identical as silhouettes — never both.
      const names = choices.map((c) => c.name)
      expect(names.includes('apple') && names.includes('cookie')).toBe(false)
    }
  })
})

describe('expansion: param variants of existing generators', () => {
  const some = seeds.slice(0, 700)

  it('sequence step:-1 walks down and never leaves [1, max]', () => {
    for (const s of some) {
      const q = generateSequence({ step: -1, max: 10 }, mulberry32(s))
      const [a, b, c] = q.payload.shown
      expect(a - b).toBe(1)
      expect(b - c).toBe(1)
      expect(q.answer).toBe(c - 1)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(10)
    }
  })

  it('sequence step:10 align:1 runs on decade multiples within 100', () => {
    let sawHigh = false
    for (const s of some) {
      const q = generateSequence({ step: 10, max: 100, align: 1 }, mulberry32(s))
      for (const n of [...q.payload.shown, q.answer]) {
        expect(n % 10).toBe(0)
        expect(n).toBeGreaterThanOrEqual(10)
        expect(n).toBeLessThanOrEqual(100)
      }
      if (q.answer >= 80) sawHigh = true
    }
    expect(sawHigh).toBe(true)
  })

  it('count allowZero:1 really produces zero (and stays correct)', () => {
    let sawZero = false
    for (const s of some) {
      const q = generateCount({ max: 3, allowZero: 1 }, mulberry32(s))
      expect(q.answer).toBe(q.payload.group.count)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      if (q.answer === 0) sawZero = true
    }
    expect(sawZero).toBe(true)
  })

  it('compare fewer:1 points at the smaller side', () => {
    for (const s of some) {
      const q = generateCompare({ max: 6, fewer: 1 }, mulberry32(s))
      const { left, right } = q.payload
      expect(q.answer).toBe(left.count < right.count ? 'left' : 'right')
      expect(q.prompt).toContain('fewer')
    }
  })

  it('add doubles:1 keeps both sides equal with total ≤ max', () => {
    for (const s of some) {
      const q = generateAdd({ max: 10, doubles: 1 }, mulberry32(s))
      expect(q.payload.left.count).toBe(q.payload.right.count)
      expect(q.answer).toBe(q.payload.left.count * 2)
      expect(q.answer).toBeLessThanOrEqual(10)
    }
  })

  it('subtract allowZero:1 reaches zero sometimes and never goes negative', () => {
    let sawZero = false
    for (const s of some) {
      const q = generateSubtract({ max: 5, allowZero: 1 }, mulberry32(s))
      expect(q.answer).toBe(q.payload.group.count - q.payload.taken)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      if (q.answer === 0) sawZero = true
    }
    expect(sawZero).toBe(true)
  })

  it('pattern kinds:4 includes three-motif units and always continues correctly', () => {
    let sawThreeMotifs = false
    for (const s of some) {
      const q = generatePattern({ kinds: 4 }, mulberry32(s))
      const { sequence, optionMotifs } = q.payload
      const fits = [2, 3].some((len) => {
        const unit = sequence.slice(0, len)
        const repeats = sequence.every((m, i) => m === unit[i % len])
        return repeats && optionMotifs[q.answer] === unit[sequence.length % len]
      })
      expect(fits).toBe(true)
      if (new Set(sequence).size === 3) sawThreeMotifs = true
    }
    expect(sawThreeMotifs).toBe(true)
  })

  it('odd-one-out size:1 keeps one theme and marks exactly one item big', () => {
    for (const s of some) {
      const q = generateOddOneOut({ choices: 4, size: 1 }, mulberry32(s))
      const { items } = q.payload
      expect(new Set(items.map((i) => i.emoji)).size).toBe(1) // same thing
      const big = items.filter((i) => (i.scale ?? 1) > 1)
      expect(big).toHaveLength(1)
      expect((items[q.answer].scale ?? 1) > 1).toBe(true)
    }
  })
})

describe('expansion: new activity generators', () => {
  const some = seeds.slice(0, 700)

  it('one-more: answer is exactly n ± 1, options never negative', () => {
    let sawUp = false
    let sawDown = false
    for (const s of some) {
      const q = generateOneMore({ max: 5 }, mulberry32(s))
      expect(q.answer).toBe(q.payload.group.count + q.payload.delta)
      expect(Math.abs(q.payload.delta)).toBe(1)
      if (q.payload.delta === 1) sawUp = true
      else sawDown = true
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0)
    }
    expect(sawUp && sawDown).toBe(true)
  })

  it('same-or-not: answer matches equality; both outcomes occur; themes differ', () => {
    let sawSame = false
    let sawDiff = false
    for (const s of some) {
      const q = generateSameOrNot({ max: 5 }, mulberry32(s))
      const same = q.payload.left.count === q.payload.right.count
      expect(q.answer).toBe(same ? 1 : 0)
      expect(q.payload.left.theme.id).not.toBe(q.payload.right.theme.id)
      if (same) sawSame = true
      else sawDiff = true
    }
    expect(sawSame && sawDiff).toBe(true)
  })

  it('num-compare / coin-compare: the answer side holds the bigger value', () => {
    for (const s of some) {
      const n = generateNumCompare({ max: 10 }, mulberry32(s))
      expect(n.payload.left).not.toBe(n.payload.right)
      expect(n.answer).toBe(n.payload.left > n.payload.right ? 'left' : 'right')
      const c = generateCoinCompare({}, mulberry32(s + 99991))
      expect(c.payload.left).not.toBe(c.payload.right)
      expect(c.answer).toBe(c.payload.left > c.payload.right ? 'left' : 'right')
    }
  })

  it('bond: shown + answer === target, answer ≥ 1', () => {
    for (const target of [5, 10]) {
      for (const s of some) {
        const q = generateBond({ target }, mulberry32(s))
        expect(q.payload.group.count + q.answer).toBe(target)
        expect(q.answer).toBeGreaterThanOrEqual(1)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      }
    }
  })

  it('sides: answer always matches the shape-side table', () => {
    for (const s of some) {
      const q = generateSides({}, mulberry32(s))
      expect(q.answer).toBe(SHAPE_SIDES[q.payload.shapeId])
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })

  it('who-left: distinct friends, answer is the one who left, position varies', () => {
    const positions = new Set<number>()
    for (const s of some) {
      const q = generateWhoLeft({ count: 3 }, mulberry32(s))
      expect(new Set(q.payload.items.map((i) => i.emoji)).size).toBe(3)
      expect(q.answer).toBe(q.payload.missing)
      positions.add(q.answer)
    }
    expect(positions.size).toBe(3)
  })

  it('belongs: exactly one choice shares the shown pair’s kind', () => {
    const kindOf = (name: string) => {
      const theme = THEMES.find((t) => t.singular === name)
      return theme ? themeKind(theme) : 'unknown'
    }
    for (const s of some) {
      const q = generateBelongs({}, mulberry32(s))
      const shownKinds = q.payload.shown.map((i) => kindOf(i.name))
      expect(shownKinds[0]).toBe(shownKinds[1]) // the pair really goes together
      const matches = q.payload.choices.filter((c) => kindOf(c.name) === shownKinds[0])
      expect(matches).toHaveLength(1)
      expect(kindOf(q.payload.choices[q.answer].name)).toBe(shownKinds[0])
    }
  })

  it('position: the answer index matches the spoken target', () => {
    for (const s of some) {
      const q = generatePosition({}, mulberry32(s))
      const expected = { first: 0, middle: 1, last: 2 }[q.payload.target]
      expect(q.answer).toBe(expected)
      expect(q.prompt).toContain(q.payload.target)
    }
  })

  it('day-time: the answer scene carries the spoken name', () => {
    for (const s of some) {
      const q = generateDayTime({}, mulberry32(s))
      expect(q.payload.scenes[q.answer].name).toBe(q.payload.targetName)
      expect(q.payload.scenes.filter((sc) => sc.name === q.payload.targetName)).toHaveLength(1)
    }
  })

  it('size-compare: the answer side matches big/small semantics', () => {
    for (const s of some) {
      const q = generateSizeCompare({}, mulberry32(s))
      const smallSide = q.payload.bigSide === 'left' ? 'right' : 'left'
      expect(q.answer).toBe(q.payload.target === 'big' ? q.payload.bigSide : smallSide)
    }
  })

  it('height-compare: towers differ and the answer side matches tall/short', () => {
    for (const s of some) {
      const q = generateHeightCompare({ max: 6 }, mulberry32(s))
      expect(q.payload.left).not.toBe(q.payload.right)
      const tallSide = q.payload.left > q.payload.right ? 'left' : 'right'
      const shortSide = tallSide === 'left' ? 'right' : 'left'
      expect(q.answer).toBe(q.payload.target === 'tall' ? tallSide : shortSide)
    }
  })

  it('weight-compare: the answer really is the heavier (or lighter) of the pair', () => {
    const heavyNames = new Set(WEIGHT_PAIRS.map(([heavy]) => heavy.name))
    for (const s of some) {
      const q = generateWeightCompare({}, mulberry32(s))
      expect(q.payload.left.name).not.toBe(q.payload.right.name)
      const answerIsHeavy = heavyNames.has(q.payload[q.answer].name)
      expect(answerIsHeavy).toBe(q.payload.target === 'heavy')
    }
  })

  it('make-amount: 2 ≤ target < coins on the table', () => {
    for (const s of some) {
      const q = generateMakeAmount({ max: 8 }, mulberry32(s))
      expect(q.answer).toBe(q.payload.target)
      expect(q.payload.target).toBeGreaterThanOrEqual(2)
      expect(q.payload.target).toBeLessThan(q.payload.coinCount)
    }
  })

  it('set-clock: start and target are distinct hours on the dial', () => {
    for (const s of some) {
      const q = generateSetClock({}, mulberry32(s))
      expect(q.payload.startHour).not.toBe(q.payload.targetHour)
      for (const h of [q.payload.startHour, q.payload.targetHour]) {
        expect(h).toBeGreaterThanOrEqual(1)
        expect(h).toBeLessThanOrEqual(12)
      }
      expect(q.answer).toBe(q.payload.targetHour)
    }
  })

  it('tap-all: the board holds exactly `count` targets and options obey the contract', () => {
    for (const s of some) {
      const q = generateTapAll({ board: 6 }, mulberry32(s))
      const targets = q.payload.shapeIds.filter((id) => id === q.payload.targetId)
      expect(targets).toHaveLength(q.payload.count)
      expect(q.payload.count).toBeGreaterThanOrEqual(2)
      expect(q.payload.shapeIds).toHaveLength(6)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })
})

describe('mid band (Phase 3) generators', () => {
  const some = seeds.slice(0, 700)

  it('place-value: value in range, digit-swap distractor offered, one correct', () => {
    for (const [max, lo] of [
      [99, 11],
      [999, 101],
    ] as const) {
      let sawSwap = false
      for (const s of some) {
        const q = generatePlaceValue({ max }, mulberry32(s))
        expect(q.answer).toBe(q.payload.value)
        expect(q.payload.value).toBeGreaterThanOrEqual(lo)
        expect(q.payload.value).toBeLessThanOrEqual(max)
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        const swapped = Number(String(q.payload.value).split('').reverse().join(''))
        if (swapped !== q.payload.value && q.options.includes(swapped)) sawSwap = true
      }
      expect(sawSwap).toBe(true) // the classic misread is really being drilled
    }
  })

  it('round: answer is genuinely the nearest ten, value never a multiple of ten', () => {
    for (const s of some) {
      const q = generateRound({ nearest: 10, max: 100 }, mulberry32(s))
      expect(q.payload.value % 10).not.toBe(0)
      expect(q.answer).toBe(Math.round(q.payload.value / 10) * 10)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      for (const o of q.options) expect(o % 10).toBe(0) // all options are tens
    }
  })

  it('multiply: product correct, table from the set, distractors are adjacent entries', () => {
    for (const tableSet of [1, 2, 3]) {
      for (const s of some) {
        const q = generateMultiply({ tableSet }, mulberry32(s))
        expect(q.answer).toBe(q.payload.a * q.payload.b)
        expect(TABLE_SETS[tableSet]).toContain(q.payload.b)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) expect(o).toBeGreaterThan(0)
      }
    }
    // Visual mode keeps groups drawable.
    for (const s of some.slice(0, 200)) {
      const q = generateMultiply({ tableSet: 1, visual: 1 }, mulberry32(s))
      expect(q.payload.visual).toBe(true)
      expect(q.payload.a).toBeLessThanOrEqual(5)
    }
  })

  it('divide: always exact (n = b·answer), quotient ≥ 2', () => {
    for (const s of some) {
      const q = generateDivide({ tableSet: 1 }, mulberry32(s))
      expect(q.payload.n % q.payload.b).toBe(0)
      expect(q.answer).toBe(q.payload.n / q.payload.b)
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })

  it('share: total splits exactly across the plates', () => {
    for (const s of some) {
      const q = generateShare({ max: 20 }, mulberry32(s))
      expect(q.payload.total).toBe(q.payload.plates * q.answer)
      expect(q.payload.plates).toBeGreaterThanOrEqual(2)
      expect(q.payload.total).toBeLessThanOrEqual(20)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })

  it('arith: op semantics hold and results stay within bounds', () => {
    for (const [op, max] of [
      [0, 20],
      [0, 100],
      [1, 20],
      [1, 100],
    ] as const) {
      for (const s of some) {
        const q = generateArith({ op, max }, mulberry32(s))
        const { a, b } = q.payload
        if (op === 0) {
          expect(q.payload.op).toBe('+')
          expect(q.answer).toBe(a + b)
          expect(q.answer).toBeLessThanOrEqual(max)
        } else {
          expect(q.payload.op).toBe('-')
          expect(q.answer).toBe(a - b)
          expect(q.answer).toBeGreaterThanOrEqual(1)
        }
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('mid deepening wave generators', () => {
  const some = seeds.slice(0, 600)

  it('fraction-of: label matches the shading, exactly one correct card', () => {
    for (const [dens, unit] of [
      [1, 1],
      [2, 1],
      [2, 0],
    ] as const) {
      for (const s of some) {
        const q = generateFractionOf({ dens, unit }, mulberry32(s))
        const { num, den, optionLabels } = q.payload
        expect(num).toBeGreaterThanOrEqual(1)
        expect(num).toBeLessThan(den)
        if (unit === 1) expect(num).toBe(1)
        expect(optionLabels[q.answer]).toBe(`${num}/${den}`)
        expect(optionLabels.filter((l) => l === `${num}/${den}`)).toHaveLength(1)
        expect(new Set(optionLabels).size).toBe(optionLabels.length)
      }
    }
  })

  it('unit-pick: the right unit wins; the same-dimension foil is on offer', () => {
    for (const s of some) {
      const q = generateUnitPick({}, mulberry32(s))
      const obj = MEASURE_OBJECTS.find((o) => o.name === q.payload.object.name)!
      expect(q.payload.unitLabels[q.answer]).toBe(obj.unit)
      expect(q.payload.unitLabels).toContain(obj.foil) // the real confusion
      expect(new Set(q.payload.unitLabels).size).toBe(3)
    }
  })

  it('grid-rect: area = w·h, perimeter = 2(w+h)', () => {
    for (const mode of [0, 1]) {
      for (const s of some) {
        const q = generateGridRect({ mode }, mulberry32(s))
        const { w, h } = q.payload
        expect(q.answer).toBe(mode === 0 ? w * h : 2 * (w + h))
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      }
    }
  })

  it('elapsed: end − start, clocks stay on the dial', () => {
    for (const s of some) {
      const q = generateElapsed({}, mulberry32(s))
      expect(q.answer).toBe(q.payload.endHour - q.payload.startHour)
      expect(q.payload.endHour).toBeLessThanOrEqual(12)
      expect(q.answer).toBeGreaterThanOrEqual(1)
    }
  })

  it('change: paid − price, price below payment', () => {
    for (const s of some) {
      const q = generateChange({ pay: 10 }, mulberry32(s))
      expect(q.payload.paid).toBe(10)
      expect(q.payload.price).toBeLessThan(10)
      expect(q.answer).toBe(10 - q.payload.price)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })

  it('graphs: distinct column values; count reads the target; most is the unique max', () => {
    for (const s of some) {
      const gc = generateGraphCount({}, mulberry32(s))
      expect(new Set(gc.payload.items.map((i) => i.value)).size).toBe(3)
      expect(gc.answer).toBe(gc.payload.items[gc.payload.targetIndex].value)
      const gm = generateGraphMost({}, mulberry32(s + 77))
      const values = gm.payload.items.map((i) => i.value)
      expect(gm.payload.items[gm.answer].value).toBe(Math.max(...values))
      expect(values.filter((v) => v === Math.max(...values))).toHaveLength(1)
    }
  })

  it('shape-sort: side counts distinct, answer card has the spoken sides', () => {
    for (const s of some) {
      const q = generateShapeSort({}, mulberry32(s))
      const sides = q.payload.shapeIds.map((id) => SHAPE_SIDES[id])
      expect(new Set(sides).size).toBe(3)
      expect(sides[q.answer]).toBe(q.payload.targetSides)
      expect(q.prompt).toContain(String(q.payload.targetSides))
    }
  })

  it('missing: the blank really balances the equation (all forms)', () => {
    for (const op of [0, 1]) {
      for (const s of some) {
        const q = generateMissing({ op, max: 20 }, mulberry32(s))
        const filled = q.payload.text.replace('□', String(q.answer))
        const [lhs, rhs] = filled.split('=').map((p) => p.trim())
        const value = lhs.includes('×')
          ? lhs.split('×').reduce((acc, part) => acc * Number(part.trim()), 1)
          : lhs.includes('−')
            ? lhs
                .split('−')
                .map((p) => Number(p.trim()))
                .reduce((a, b) => a - b)
            : lhs
                .split('+')
                .map((p) => Number(p.trim()))
                .reduce((a, b) => a + b)
        expect(value).toBe(Number(rhs))
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
      }
    }
  })

  it('leftover: n mod b is the answer, and it is never zero or ≥ b', () => {
    for (const s of some) {
      const q = generateLeftover({}, mulberry32(s))
      expect(q.answer).toBe(q.payload.n % q.payload.b)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThan(q.payload.b)
      for (const o of q.options) expect(o).toBeLessThan(q.payload.b)
    }
  })

  it('word-problem: the story computes to the answer for its op', () => {
    for (const ops of [1, 2]) {
      for (const s of some) {
        const q = generateWordProblem({ ops }, mulberry32(s))
        expect(q.payload.story).not.toContain('{') // all placeholders filled
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        expect(q.answer).toBeGreaterThan(0)
      }
    }
  })

  it('clock step:5 reads minutes — same hour, distinct five-minute choices', () => {
    let sawOddMinutes = false
    for (const s of some) {
      const q = generateClock({ step: 5 }, mulberry32(s))
      expect(q.payload.minute % 5).toBe(0)
      for (const c of q.payload.choices) {
        expect(c.hour).toBe(q.payload.hour) // minutes are the skill here
        expect(c.minute % 5).toBe(0)
      }
      expect(new Set(q.payload.choices.map((c) => c.minute)).size).toBe(3)
      const chosen = q.payload.choices[q.answer]
      expect(chosen.minute).toBe(q.payload.minute)
      if (![0, 30].includes(q.payload.minute)) sawOddMinutes = true
    }
    expect(sawOddMinutes).toBe(true)
  })

  it('round nearest:100 speaks hundreds, lands on them, and rounds BOTH ways', () => {
    let up = false
    let down = false
    for (const s of some.slice(0, 300)) {
      const q = generateRound({ nearest: 100, max: 1000 }, mulberry32(s))
      expect(q.prompt).toContain('hundred')
      expect(q.answer % 100).toBe(0)
      expect(q.answer).toBe(Math.round(q.payload.value / 100) * 100)
      if (q.answer > q.payload.value) up = true
      else down = true
    }
    expect(up && down).toBe(true)
  })
})

describe('Phase 4 generators', () => {
  const some = seeds.slice(0, 600)

  /** a/b value-equals c/d? Cross-multiply — no float traps. */
  const sameValue = (l1: string, l2: string) => {
    const [n1, d1] = l1.split('/').map(Number)
    const [n2, d2] = l2.split('/').map(Number)
    return n1 * d2 === n2 * d1
  }

  it('fraction-op equivalence: exactly one card is value-equal, written differently', () => {
    for (const s of some) {
      const q = generateFractionOp({ op: 0 }, mulberry32(s))
      const { op, aNum, den, optionLabels } = q.payload
      expect(op).toBe('same')
      expect(aNum).toBeGreaterThanOrEqual(1)
      expect(aNum).toBeLessThan(den)
      const base = `${aNum}/${den}`
      const equalCards = optionLabels.filter((l) => sameValue(l, base))
      expect(equalCards).toHaveLength(1) // one right answer, provably
      expect(equalCards[0]).toBe(optionLabels[q.answer])
      expect(optionLabels[q.answer]).not.toBe(base) // …and it LOOKS different
      expect(new Set(optionLabels).size).toBe(optionLabels.length)
      expect(optionLabels).toHaveLength(3)
    }
  })

  it('fraction-op add/sub: result card right and proper; add offers the added-denominators trap', () => {
    for (const op of [1, 2] as const) {
      for (const s of some) {
        const q = generateFractionOp({ op }, mulberry32(s))
        const { aNum, bNum, den, optionLabels } = q.payload
        expect(q.payload.op).toBe(op === 1 ? 'add' : 'sub')
        expect(bNum).toBeGreaterThanOrEqual(1)
        const result = op === 1 ? aNum + bNum : aNum - bNum
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThan(den) // stays proper — never past one whole
        expect(optionLabels[q.answer]).toBe(`${result}/${den}`)
        expect(optionLabels.filter((l) => sameValue(l, `${result}/${den}`))).toHaveLength(1)
        expect(new Set(optionLabels).size).toBe(optionLabels.length)
        expect(optionLabels).toHaveLength(3)
        if (op === 1) expect(optionLabels).toContain(`${result}/${den * 2}`)
      }
    }
  })

  it('read-scale: the pointer sits on an UNLABELED tick and every option is a real tick', () => {
    for (const params of [
      { max: 10, step: 1, labelEvery: 2, unit: 0 },
      { max: 100, step: 10, labelEvery: 20, unit: 1 },
    ]) {
      for (const s of some) {
        const q = generateReadScale(params, mulberry32(s))
        const { max, step, labelEvery, value, unit } = q.payload
        expect(value % step).toBe(0)
        expect(value % labelEvery).not.toBe(0) // must count divisions, not read a printed number
        expect(value).toBeGreaterThan(0)
        expect(value).toBeLessThan(max)
        expect(q.answer).toBe(value)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        for (const o of q.options) {
          expect(o % step).toBe(0) // plausible ticks only
          expect(o).toBeGreaterThanOrEqual(0)
          expect(o).toBeLessThanOrEqual(max)
        }
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(unit).toBe(SCALE_UNITS[params.unit].label)
      }
    }
  })

  it('build-graph: the answer encodes the tally targets; decoys are buildable near-misses', () => {
    for (const params of [
      { cols: 3, max: 4 },
      { cols: 4, max: 5 },
    ]) {
      for (const s of some) {
        const q = generateBuildGraph(params, mulberry32(s))
        const { items, maxHeight } = q.payload
        expect(items).toHaveLength(params.cols)
        expect(maxHeight).toBe(params.max)
        for (const item of items) {
          expect(item.value).toBeGreaterThanOrEqual(1)
          expect(item.value).toBeLessThanOrEqual(maxHeight)
        }
        expect(q.answer).toBe(encodeHeights(items.map((i) => i.value)))
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        expect(new Set(q.options).size).toBe(3)
        for (const o of q.options) {
          // Every decoy must decode to a board the child could actually build.
          const digits = String(o).split('').map(Number)
          expect(digits).toHaveLength(params.cols)
          for (const d of digits) {
            expect(d).toBeGreaterThanOrEqual(1)
            expect(d).toBeLessThanOrEqual(maxHeight)
          }
        }
      }
    }
  })

  it('column-op add: ones always carry, sums stay under the bound, forgot-the-carry on offer', () => {
    for (const max of [100, 1000]) {
      for (const s of some) {
        const q = generateColumnOp({ op: 0, max }, mulberry32(s))
        const { a, b } = q.payload
        expect(q.payload.op).toBe('+')
        expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10) // the carry is the lesson
        expect(q.answer).toBe(a + b)
        expect(q.answer).toBeLessThan(max)
        expect(String(a)).toHaveLength(max === 1000 ? 3 : 2)
        expect(String(b)).toHaveLength(max === 1000 ? 3 : 2)
        expect(q.options).toContain(q.answer - 10) // the forgotten carry
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        expect(new Set(q.options).size).toBe(3)
      }
    }
  })

  it('column-op subtract: ones always borrow, results positive, the no-borrow flip on offer', () => {
    for (const max of [100, 1000]) {
      for (const s of some) {
        const q = generateColumnOp({ op: 1, max }, mulberry32(s))
        const { a, b } = q.payload
        expect(q.payload.op).toBe('-')
        expect(a % 10).toBeLessThan(b % 10) // the borrow is the lesson
        expect(a).toBeGreaterThan(b)
        expect(q.answer).toBe(a - b)
        expect(q.answer).toBeGreaterThanOrEqual(1)
        const flip = flipDigits(a, b)
        if (flip !== q.answer) expect(q.options).toContain(flip)
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
        expect(new Set(q.options).size).toBe(3)
      }
    }
  })
})

describe('registry / generateQuestion', () => {
  it('has a generator for every activity used by any level on the trail', () => {
    for (const level of TRAIL) {
      expect(GENERATORS[level.activity]).toBeTypeOf('function')
    }
  })

  it('dispatches to the matching activity for every level', () => {
    for (const level of TRAIL) {
      for (const s of seeds.slice(0, 200)) {
        const q = generateQuestion(level, mulberry32(s))
        expect(q.activity).toBe(level.activity)
      }
    }
  })
})
