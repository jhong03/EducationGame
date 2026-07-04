/**
 * Number words — language content shared by spoken prompts ("Find seven!") and
 * the AudioManager's counting voice. Content, not engine: swap this module to
 * localise. Covers 0–20, the full range any early-band level can produce.
 */
export const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
] as const

/** The spoken word for n, falling back to digits beyond the list. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

/** Sentence-case a word ("five" → "Five") for prompt starts. */
export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Fraction part names — singular/plural per denominator the game uses. */
const FRACTION_PARTS: Record<number, readonly [string, string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['quarter', 'quarters'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
  12: ['twelfth', 'twelfths'],
}

/**
 * The spoken form of a fraction ("3/4" → "three quarters"). TTS reads "3/4"
 * as "three slash four", so prompts must never speak the raw label.
 */
export function fractionWord(num: number, den: number): string {
  const part = FRACTION_PARTS[den]
  if (!part) return `${numberWord(num)} out of ${numberWord(den)}`
  return `${numberWord(num)} ${num === 1 ? part[0] : part[1]}`
}
