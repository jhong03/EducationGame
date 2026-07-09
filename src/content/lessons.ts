/**
 * Lessons — short illustrated "what is this?" classes for the harder and
 * real-world strands (data, not code). Each lesson is a handful of printed
 * steps, most carrying a simple visual (see components/LessonVisual). They're
 * reached from the category screen and teach the concept before/alongside the
 * practice levels; the mastery loop itself is unchanged.
 *
 * Voiceless by design: the text is written to be read (mid/upper band are
 * readers) or read aloud by a grown-up. Adding a lesson = append one entry.
 */

export type LessonVisual =
  | { kind: 'fraction'; parts: number; shaded: number }
  | { kind: 'array'; rows: number; cols: number }
  | { kind: 'place-value'; hundreds?: number; tens: number; ones: number }
  | { kind: 'percent'; shaded: number }
  | { kind: 'number-line'; min: number; max: number; mark: number }
  | { kind: 'coins'; values: number[] }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'angle'; degrees: number }

export interface LessonStep {
  /** The explanation, printed big. */
  text: string
  /** An optional illustration for the idea. */
  visual?: LessonVisual
  /** An optional worked-example line, shown highlighted. */
  example?: string
}

export interface Lesson {
  /** The category this class introduces (content/math.ts id). */
  categoryId: string
  /** The class title, e.g. "What is a fraction?". */
  title: string
  /** A one-line hook shown on the cover. */
  intro: string
  steps: LessonStep[]
}

export const LESSONS: readonly Lesson[] = [
  {
    categoryId: 'fractions',
    title: 'What is a fraction?',
    intro: 'A fraction is a part of a whole.',
    steps: [
      {
        text: 'A fraction is a part of a whole. We split something into equal pieces.',
        visual: { kind: 'fraction', parts: 4, shaded: 0 },
      },
      {
        text: 'The bottom number says how many equal pieces there are. Here there are 4.',
        visual: { kind: 'fraction', parts: 4, shaded: 1 },
        example: 'The whole is split into 4 equal parts.',
      },
      {
        text: 'The top number says how many pieces we have. This is three quarters.',
        visual: { kind: 'fraction', parts: 4, shaded: 3 },
        example: '¾ means 3 of the 4 equal pieces.',
      },
    ],
  },
  {
    categoryId: 'times-tables',
    title: 'What is multiplying?',
    intro: 'Multiplying is counting equal groups.',
    steps: [
      {
        text: 'Multiplying is adding the same number many times — like counting equal groups.',
        visual: { kind: 'array', rows: 3, cols: 4 },
      },
      {
        text: 'Here are 3 rows of 4. That is 3 times 4. Count them all: twelve.',
        visual: { kind: 'array', rows: 3, cols: 4 },
        example: '3 × 4 = 12',
      },
      {
        text: 'So 3 × 4 is the same as 4 + 4 + 4. Multiplying is just a faster way to add.',
        example: '4 + 4 + 4 = 12',
      },
    ],
  },
  {
    categoryId: 'place-value',
    title: 'Tens and ones',
    intro: 'Big numbers are built from tens and ones.',
    steps: [
      {
        text: 'We can build numbers out of tens and ones. A ten is ten ones stuck together.',
        visual: { kind: 'place-value', tens: 1, ones: 0 },
      },
      {
        text: 'Two tens and three ones make twenty-three.',
        visual: { kind: 'place-value', tens: 2, ones: 3 },
        example: '2 tens + 3 ones = 23',
      },
      {
        text: 'Ten tens make one hundred. The place of a digit tells you its value.',
        visual: { kind: 'place-value', hundreds: 1, tens: 0, ones: 0 },
        example: '10 tens = 100',
      },
    ],
  },
  {
    categoryId: 'percents',
    title: 'What does % mean?',
    intro: 'Percent means "out of one hundred".',
    steps: [
      {
        text: 'Percent means "out of 100". Picture one hundred little squares.',
        visual: { kind: 'percent', shaded: 0 },
      },
      {
        text: '50% means 50 out of 100 — that is one half.',
        visual: { kind: 'percent', shaded: 50 },
        example: '50% = half',
      },
      {
        text: '25% means 25 out of 100 — that is one quarter.',
        visual: { kind: 'percent', shaded: 25 },
        example: '25% = a quarter',
      },
    ],
  },
  {
    categoryId: 'below-zero',
    title: 'Numbers below zero',
    intro: 'Some numbers are less than zero.',
    steps: [
      {
        text: 'Numbers can go below zero. We call those negative numbers.',
        visual: { kind: 'number-line', min: -5, max: 5, mark: 0 },
      },
      {
        text: 'On a number line, negative numbers sit to the LEFT of zero.',
        visual: { kind: 'number-line', min: -5, max: 5, mark: -3 },
        example: '−3 is 3 steps left of 0',
      },
      {
        text: 'The lower you go, the smaller the number — like a very cold temperature.',
        visual: { kind: 'number-line', min: -5, max: 5, mark: -5 },
      },
    ],
  },
  {
    categoryId: 'money-mid',
    title: 'Money and change',
    intro: 'Add coins to make an amount; change is what comes back.',
    steps: [
      {
        text: 'To find how much money you have, add up the coins.',
        visual: { kind: 'coins', values: [10, 5, 2] },
      },
      {
        text: 'Ten and five and two add up to seventeen.',
        visual: { kind: 'coins', values: [10, 5, 2] },
        example: '10 + 5 + 2 = 17',
      },
      {
        text: 'Change is what you get back. Pay 20 for something costing 17 and you get 3 back.',
        example: '20 − 17 = 3 change',
      },
    ],
  },
  {
    categoryId: 'time-mid',
    title: 'Reading a clock',
    intro: 'The short hand is the hour; the long hand is the minutes.',
    steps: [
      {
        text: 'The short hand points to the hour. The long hand points to the minutes.',
        visual: { kind: 'clock', hour: 3, minute: 0 },
      },
      {
        text: 'When the long hand points straight up to 12, it is o’clock. This says 3 o’clock.',
        visual: { kind: 'clock', hour: 3, minute: 0 },
        example: '3:00',
      },
      {
        text: 'The long hand pointing to 6 means 30 minutes past — half past the hour.',
        visual: { kind: 'clock', hour: 3, minute: 30 },
        example: '3:30 — half past 3',
      },
    ],
  },
  {
    categoryId: 'angles',
    title: 'Kinds of angles',
    intro: 'An angle is the amount of turn between two lines.',
    steps: [
      {
        text: 'An angle is the turn between two lines. We measure it in degrees (°).',
        visual: { kind: 'angle', degrees: 90 },
      },
      {
        text: 'A square corner is a right angle — exactly 90 degrees.',
        visual: { kind: 'angle', degrees: 90 },
        example: '90° = right angle',
      },
      {
        text: 'Smaller than a right angle is called acute; wider than it is called obtuse.',
        visual: { kind: 'angle', degrees: 40 },
        example: '40° is acute (a small angle)',
      },
    ],
  },
]

const BY_CATEGORY = new Map(LESSONS.map((l) => [l.categoryId, l]))

/** The lesson for a category, if one exists. */
export function lessonForCategory(categoryId: string): Lesson | undefined {
  return BY_CATEGORY.get(categoryId)
}

/** Does this category have a "what is this?" class? */
export function hasLesson(categoryId: string): boolean {
  return BY_CATEGORY.has(categoryId)
}
