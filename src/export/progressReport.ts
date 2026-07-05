import type { GameState } from '../engine/types'
import { CATEGORIES, levelsInCategory } from '../content/math'
import { hasCleared, isLevelUnlocked } from '../engine/store'

/**
 * The progress export (parent/teacher use-case): one row per level, in
 * meadow order, with the same status derivation the Chapter-progress page
 * shows. Pure builders — the DOM download lives in the screen; these are
 * fully unit-tested, including CSV escaping (level names contain commas).
 */

export interface ProgressReportRow {
  category: string
  level: string
  levelId: string
  band: string
  status: 'Mastered' | 'Placed' | 'In progress' | 'Locked'
  bestStreak: number
  attempts: number
  correct: number
  /** Whole percent, or null before the first recorded answer. */
  accuracyPct: number | null
  sprintBest: number
}

export interface ProgressReport {
  exportedAt: string // injected by the caller (testable determinism)
  child: string | null
  age: number | null
  stars: number
  mastered: number // earned clears only — placement grants position, not credit
  totalLevels: number
  rows: ProgressReportRow[]
}

type ReportState = Pick<GameState, 'name' | 'age' | 'stars' | 'progress' | 'bestScores'>

export function buildProgressReport(state: ReportState, exportedAt: string): ProgressReport {
  const rows: ProgressReportRow[] = []
  for (const category of CATEGORIES) {
    const levels = levelsInCategory(category.id)
    for (const level of levels) {
      const p = state.progress[level.id]
      const cleared = hasCleared(state.progress, level.id)
      const unlocked = isLevelUnlocked(level, levels, state.progress)
      const attempts = p?.attempts ?? 0
      const correct = p?.correct ?? 0
      rows.push({
        category: category.name,
        level: level.name,
        levelId: level.id,
        band: level.band,
        status: cleared
          ? p?.placed
            ? 'Placed'
            : 'Mastered'
          : unlocked
            ? 'In progress'
            : 'Locked',
        bestStreak: p?.bestStreak ?? 0,
        attempts,
        correct,
        accuracyPct: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
        sprintBest: state.bestScores[level.id] ?? 0,
      })
    }
  }
  return {
    exportedAt,
    child: state.name,
    age: state.age,
    stars: state.stars,
    mastered: rows.filter((r) => r.status === 'Mastered').length,
    totalLevels: rows.length,
    rows,
  }
}

/** Quote a CSV field when it needs it; double any embedded quotes. */
function csvField(value: string | number | null): string {
  const s = value === null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** Spreadsheet-friendly: a header row + one row per level (meta lives in JSON). */
export function toCsv(report: ProgressReport): string {
  const header = [
    'Category',
    'Level',
    'Level ID',
    'Band',
    'Status',
    'Best streak',
    'Answers',
    'Correct',
    'Accuracy %',
    'Sprint best',
  ]
  const lines = [header.join(',')]
  for (const r of report.rows) {
    lines.push(
      [
        csvField(r.category),
        csvField(r.level),
        csvField(r.levelId),
        csvField(r.band),
        csvField(r.status),
        csvField(r.bestStreak),
        csvField(r.attempts),
        csvField(r.correct),
        csvField(r.accuracyPct),
        csvField(r.sprintBest),
      ].join(','),
    )
  }
  return lines.join('\n')
}

export function toJson(report: ProgressReport): string {
  return JSON.stringify(report, null, 2)
}

/** "Maya" → "maya-", null → "" — the filename prefix. */
export function filenamePrefix(name: string | null): string {
  if (!name) return ''
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug ? `${slug}-` : ''
}
