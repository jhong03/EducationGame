import { describe, it, expect } from 'vitest'
import { LESSONS, lessonForCategory, hasLesson } from './lessons'
import { CATEGORIES, categoryById } from './math'
import { shapeById } from './shapes'

/**
 * Lessons are teaching content, but they still make claims the visuals render
 * (a fraction can't shade more parts than it has, a mark must sit on its line,
 * etc.) and they must point at real categories — these pins guard that.
 */
describe('lessons', () => {
  it('each lesson targets a real category and carries content', () => {
    for (const l of LESSONS) {
      expect(categoryById(l.categoryId), `${l.categoryId} is a real category`).toBeTruthy()
      expect(l.title.length).toBeGreaterThan(0)
      expect(l.intro.length).toBeGreaterThan(0)
      expect(l.steps.length).toBeGreaterThan(0)
      for (const s of l.steps) {
        expect(s.text.length, `${l.categoryId} step has text`).toBeGreaterThan(0)
      }
    }
  })

  it('has at most one lesson per category', () => {
    const ids = LESSONS.map((l) => l.categoryId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('EVERY chapter has an intro class — no child meets a concept cold', () => {
    for (const category of CATEGORIES) {
      expect(hasLesson(category.id), `${category.id} has a lesson`).toBe(true)
    }
  })

  it('every visual is internally consistent', () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const v = s.visual
        if (!v) continue
        if (v.kind === 'fraction') {
          expect(v.parts).toBeGreaterThan(0)
          expect(v.shaded).toBeGreaterThanOrEqual(0)
          expect(v.shaded).toBeLessThanOrEqual(v.parts)
        } else if (v.kind === 'percent') {
          expect(v.shaded).toBeGreaterThanOrEqual(0)
          expect(v.shaded).toBeLessThanOrEqual(100)
        } else if (v.kind === 'number-line') {
          expect(v.min).toBeLessThan(v.max)
          expect(v.mark).toBeGreaterThanOrEqual(v.min)
          expect(v.mark).toBeLessThanOrEqual(v.max)
        } else if (v.kind === 'array') {
          expect(v.rows).toBeGreaterThan(0)
          expect(v.cols).toBeGreaterThan(0)
        } else if (v.kind === 'clock') {
          expect(v.minute).toBeGreaterThanOrEqual(0)
          expect(v.minute).toBeLessThan(60)
        } else if (v.kind === 'angle') {
          expect(v.degrees).toBeGreaterThan(0)
          expect(v.degrees).toBeLessThanOrEqual(180)
        } else if (v.kind === 'emoji-row') {
          expect(v.count).toBeGreaterThan(0)
          expect(v.emoji.length).toBeGreaterThan(0)
        } else if (v.kind === 'emoji-groups') {
          expect(v.left.count).toBeGreaterThan(0)
          expect(v.right.count).toBeGreaterThan(0)
        } else if (v.kind === 'shape') {
          expect(shapeById(v.shapeId), `${v.shapeId} is a real shape`).toBeTruthy()
        } else if (v.kind === 'pattern') {
          expect(v.motifs.length).toBeGreaterThanOrEqual(3)
        } else if (v.kind === 'bar-graph') {
          expect(v.bars.length).toBeGreaterThan(0)
          for (const b of v.bars) expect(b.value).toBeGreaterThan(0)
        } else if (v.kind === 'expr') {
          expect(v.text.length).toBeGreaterThan(0)
        } else if (v.kind === 'grid-star') {
          expect(v.x).toBeGreaterThanOrEqual(0)
          expect(v.x).toBeLessThanOrEqual(v.size)
          expect(v.y).toBeGreaterThanOrEqual(0)
          expect(v.y).toBeLessThanOrEqual(v.size)
        }
      }
    }
  })

  it('lessonForCategory and hasLesson agree', () => {
    for (const l of LESSONS) {
      expect(hasLesson(l.categoryId)).toBe(true)
      expect(lessonForCategory(l.categoryId)?.title).toBe(l.title)
    }
    expect(hasLesson('nope-not-real')).toBe(false)
    expect(lessonForCategory('nope-not-real')).toBeUndefined()
  })
})
