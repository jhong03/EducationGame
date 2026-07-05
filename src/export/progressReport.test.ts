import { describe, it, expect } from 'vitest'
import { buildProgressReport, filenamePrefix, toCsv, toJson } from './progressReport'
import { TRAIL } from '../content/math'

/**
 * The export is a parent-facing artifact: its rows must agree with the
 * Chapter-progress page's derivations, and the CSV must survive level names
 * that contain commas ("Five past, ten past").
 */

const STATE = {
  name: 'Maya',
  age: 5,
  stars: 7,
  progress: {
    'math-early-1': { cleared: true, bestStreak: 3, attempts: 4, correct: 3 },
    'math-early-2': { cleared: true, bestStreak: 0, placed: true },
    'math-early-3': { cleared: false, bestStreak: 1, attempts: 2, correct: 1 },
  },
  bestScores: { 'math-early-1': 6 },
}

describe('buildProgressReport', () => {
  const report = buildProgressReport(STATE, '2026-07-05T10:00:00.000Z')

  it('covers every level exactly once, in meadow order', () => {
    expect(report.rows).toHaveLength(TRAIL.length)
    expect(new Set(report.rows.map((r) => r.levelId)).size).toBe(TRAIL.length)
    expect(report.rows[0].levelId).toBe('math-early-1') // Counting rung 1 first
    expect(report.totalLevels).toBe(TRAIL.length)
  })

  it('derives statuses exactly like the panel: earned, placed, open, locked', () => {
    const byId = new Map(report.rows.map((r) => [r.levelId, r]))
    expect(byId.get('math-early-1')!.status).toBe('Mastered')
    expect(byId.get('math-early-2')!.status).toBe('Placed')
    expect(byId.get('math-early-3')!.status).toBe('In progress') // next after the cleared prefix
    expect(byId.get('math-upper-52')!.status).toBe('Locked')
    expect(report.mastered).toBe(1) // placed grants position, not credit
  })

  it('carries streaks, counters, accuracy and sprint bests', () => {
    const first = report.rows[0]
    expect(first.bestStreak).toBe(3)
    expect(first.attempts).toBe(4)
    expect(first.correct).toBe(3)
    expect(first.accuracyPct).toBe(75)
    expect(first.sprintBest).toBe(6)
    // Untouched levels: zeros and a null accuracy, never fake 0%.
    const untouched = report.rows.find((r) => r.levelId === 'math-upper-1')!
    expect(untouched.attempts).toBe(0)
    expect(untouched.accuracyPct).toBeNull()
  })

  it('keeps the injected metadata verbatim', () => {
    expect(report.exportedAt).toBe('2026-07-05T10:00:00.000Z')
    expect(report.child).toBe('Maya')
    expect(report.age).toBe(5)
    expect(report.stars).toBe(7)
  })
})

describe('toCsv', () => {
  const report = buildProgressReport(STATE, '2026-07-05T10:00:00.000Z')
  const csv = toCsv(report)
  const lines = csv.split('\n')

  it('is one header plus one line per level', () => {
    expect(lines).toHaveLength(1 + TRAIL.length)
    expect(lines[0]).toBe(
      'Category,Level,Level ID,Band,Status,Best streak,Answers,Correct,Accuracy %,Sprint best',
    )
  })

  it('quotes fields containing commas so spreadsheets parse cleanly', () => {
    // "Five past, ten past" (Time Master) carries a comma.
    const row = lines.find((l) => l.includes('Five past'))
    expect(row).toContain('"Five past, ten past"')
    // Every data line still splits into exactly 10 fields once quotes are honored.
    const fieldCount = (line: string) =>
      (line.match(/(?:^|,)(?:"(?:[^"]|"")*"|[^,]*)/g) ?? []).length
    for (const line of lines) expect(fieldCount(line), line).toBe(10)
  })

  it('renders null accuracy as an empty field, not 0', () => {
    const untouched = lines.find((l) => l.startsWith('Big Numbers,Find the number'))
    expect(untouched).toContain(',,') // the empty Accuracy % slot
  })
})

describe('toJson / filenamePrefix', () => {
  it('round-trips through JSON.parse', () => {
    const report = buildProgressReport(STATE, '2026-07-05T10:00:00.000Z')
    const parsed = JSON.parse(toJson(report))
    expect(parsed.child).toBe('Maya')
    expect(parsed.rows).toHaveLength(TRAIL.length)
  })

  it('slugs the child name for filenames', () => {
    expect(filenamePrefix('Maya')).toBe('maya-')
    expect(filenamePrefix('Zoë-Ann K.')).toBe('zo-ann-k-')
    expect(filenamePrefix(null)).toBe('')
    expect(filenamePrefix('   ')).toBe('')
  })
})
