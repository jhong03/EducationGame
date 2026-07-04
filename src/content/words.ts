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
