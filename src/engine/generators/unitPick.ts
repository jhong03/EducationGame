import type { Rng, UnitPickQuestion } from '../types'
import { MEASURE_OBJECTS } from '../../content/world'
import { makeId, randInt, shuffle } from '../random'

/**
 * unit-pick — "which unit measures a pencil?" (H3). The wrong answers are
 * chosen to teach: one is the SAME dimension at the wrong scale (m for a
 * pencil), one is a different dimension entirely (kg for a pencil).
 */
const ALL_UNITS = ['cm', 'm', 'kg', 'g', 'l', 'ml'] as const

export function generateUnitPick(
  params: Record<string, number>,
  rng: Rng = Math.random,
): UnitPickQuestion {
  void params
  const object = MEASURE_OBJECTS[randInt(0, MEASURE_OBJECTS.length - 1, rng)]
  const offDimension = ALL_UNITS.filter((u) => u !== object.unit && u !== object.foil)
  const third = offDimension[randInt(0, offDimension.length - 1, rng)]

  const unitLabels = shuffle([object.unit, object.foil, third], rng)
  return {
    id: makeId('unit', rng),
    activity: 'unit-pick',
    prompt: `Which unit would you use to measure ${object.name}?`,
    payload: { object: { emoji: object.emoji, name: object.name }, unitLabels },
    options: unitLabels.map((_, i) => i),
    answer: unitLabels.indexOf(object.unit),
  }
}
