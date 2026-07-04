import type { Rng } from '../engine/types'
import { shuffle } from '../engine/random'

/**
 * The 2D shape set for the early band (J1 in CURRICULUM.md). Names are spoken
 * ("Find the circle!"), the glyphs are drawn by components/ShapeGlyph so every
 * card shares one color — SHAPE is the only discriminator, never color.
 */
export interface Shape {
  id: string
  name: string // spoken + shown to grown-ups
}

export const SHAPES: readonly Shape[] = [
  { id: 'circle', name: 'circle' },
  { id: 'square', name: 'square' },
  { id: 'triangle', name: 'triangle' },
  { id: 'star', name: 'star' },
  { id: 'rectangle', name: 'rectangle' },
  { id: 'heart', name: 'heart' },
  // Appended AFTER the original six so existing `pool` params keep their
  // meaning (pool slices from the front).
  { id: 'pentagon', name: 'pentagon' },
  { id: 'hexagon', name: 'hexagon' },
] as const

/**
 * Straight-side counts for the "how many sides?" activity. Only shapes with
 * an unambiguous early-band answer appear here (no circles/hearts/stars —
 * curved edges and points are a later conversation).
 */
export const SHAPE_SIDES: Record<string, number> = {
  triangle: 3,
  square: 4,
  rectangle: 4,
  pentagon: 5,
  hexagon: 6,
}

/**
 * Lines of symmetry per shape AS DRAWN by ShapeGlyph (triangle is drawn
 * equilateral, the star five-pointed). No circle — "infinite" is a later
 * conversation. Rectangle's 2-vs-4 is the classic misconception the
 * symmetry activity leans on.
 */
export const SHAPE_SYMMETRY: Record<string, number> = {
  square: 4,
  rectangle: 2,
  triangle: 3,
  pentagon: 5,
  hexagon: 6,
  star: 5,
  heart: 1,
}

export function shapeById(id: string): Shape | undefined {
  return SHAPES.find((s) => s.id === id)
}

/** `count` distinct shapes from the first `pool` entries, shuffled. */
export function pickShapes(pool: number, count: number, rng: Rng): Shape[] {
  const usable = SHAPES.slice(0, Math.max(count, Math.min(pool, SHAPES.length)))
  return shuffle(usable, rng).slice(0, count)
}
