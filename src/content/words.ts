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

/** The praise pool — shown as ON-SCREEN words with the correct chime
 *  (praise is deliberately unvoiced; PlayScreen picks at random). */
export const PRAISE = [
  'Yes!',
  'You did it!',
  'Great job!',
  'Woohoo!',
  'Nice counting!',
  'Well done!',
] as const

const TENS_WORDS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
] as const

/**
 * The spoken/written form of any number to 999,999 ("thirty-four thousand
 * five hundred and six"). The upper band's find-number levels PRINT the
 * words and hide the numerals in the buttons — reading big numbers is the
 * skill (B5).
 */
export function numberWordBig(n: number): string {
  if (n < 0) return `minus ${numberWordBig(-n)}`
  if (n <= 20) return numberWord(n)
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return ones === 0 ? TENS_WORDS[tens] : `${TENS_WORDS[tens]}-${NUMBER_WORDS[ones]}`
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100)
    const rest = n % 100
    return rest === 0
      ? `${numberWord(hundreds)} hundred`
      : `${numberWord(hundreds)} hundred and ${numberWordBig(rest)}`
  }
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    if (rest === 0) return `${numberWordBig(thousands)} thousand`
    return `${numberWordBig(thousands)} thousand ${rest < 100 ? 'and ' : ''}${numberWordBig(rest)}`
  }
  return String(n)
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
  100: ['hundredth', 'hundredths'],
}

/**
 * The word form of a fraction ("3/4" → "three quarters") — prompts print
 * the words rather than the raw label.
 */
export function fractionWord(num: number, den: number): string {
  const part = FRACTION_PARTS[den]
  if (!part) return `${numberWord(num)} out of ${numberWord(den)}`
  return `${numberWord(num)} ${num === 1 ? part[0] : part[1]}`
}
