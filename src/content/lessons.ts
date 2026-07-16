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
  | { kind: 'emoji-row'; emoji: string; count: number }
  | {
      kind: 'emoji-groups'
      left: { emoji: string; count: number }
      right: { emoji: string; count: number }
      op: '+' | '−' | 'vs' | ':'
    }
  | { kind: 'shape'; shapeId: string }
  | { kind: 'pattern'; motifs: string[] }
  | { kind: 'bar-graph'; bars: { emoji: string; value: number }[] }
  | { kind: 'expr'; text: string }
  | { kind: 'grid-star'; x: number; y: number; size: number }
  | { kind: 'sizes'; big: string; small: string }

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
  // ---- early band (4–6) — pre-reader-simple; a grown-up can read along -----
  {
    categoryId: 'counting',
    title: 'Counting things',
    intro: 'Counting tells you how many.',
    steps: [
      {
        text: 'Counting tells you HOW MANY there are. Point at each one and say a number.',
        visual: { kind: 'emoji-row', emoji: '🍎', count: 3 },
      },
      {
        text: 'One… two… three! The LAST number you say is how many there are.',
        visual: { kind: 'emoji-row', emoji: '🍎', count: 3 },
        example: '1, 2, 3 → 3 apples!',
      },
      {
        text: 'It works for anything. Count slowly, one at a time.',
        visual: { kind: 'emoji-row', emoji: '🐤', count: 5 },
        example: '5 chicks!',
      },
    ],
  },
  {
    categoryId: 'comparing',
    title: 'More or fewer?',
    intro: 'Which group has more?',
    steps: [
      {
        text: 'Look at both groups. Which side has MORE?',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🎈', count: 4 },
          right: { emoji: '🎈', count: 2 },
          op: 'vs',
        },
      },
      {
        text: '4 balloons is more than 2 balloons. The bigger group wins!',
        example: '4 is more than 2',
      },
      {
        text: 'When both sides match, they are EQUAL — exactly the same.',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🍪', count: 3 },
          right: { emoji: '🍪', count: 3 },
          op: 'vs',
        },
        example: '3 and 3 are equal',
      },
    ],
  },
  {
    categoryId: 'adding',
    title: 'What is adding?',
    intro: 'Adding is putting groups together.',
    steps: [
      {
        text: 'Adding is putting two groups together.',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🍪', count: 2 },
          right: { emoji: '🍪', count: 3 },
          op: '+',
        },
      },
      {
        text: '2 cookies and 3 cookies — push them together and count them ALL.',
        example: '2 + 3 = 5',
      },
      {
        text: 'You can add any two groups. Just count everything!',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🐸', count: 1 },
          right: { emoji: '🐸', count: 4 },
          op: '+',
        },
        example: '1 + 4 = 5',
      },
    ],
  },
  {
    categoryId: 'taking-away',
    title: 'Taking away',
    intro: 'Some go away — how many are left?',
    steps: [
      {
        text: 'Taking away means some go away. How many are LEFT?',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🐸', count: 5 },
          right: { emoji: '🐸', count: 2 },
          op: '−',
        },
      },
      {
        text: '5 frogs… 2 hop away. Count what is left: 3!',
        example: '5 − 2 = 3',
      },
      {
        text: 'Taking away makes a group smaller. Count what STAYS.',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🍎', count: 4 },
          right: { emoji: '🍎', count: 1 },
          op: '−',
        },
        example: '4 − 1 = 3',
      },
    ],
  },
  {
    categoryId: 'shapes',
    title: 'Meet the shapes',
    intro: 'Shapes are all around you.',
    steps: [
      {
        text: 'Shapes are everywhere! A CIRCLE is perfectly round.',
        visual: { kind: 'shape', shapeId: 'circle' },
      },
      {
        text: 'A TRIANGLE has 3 straight sides. Count them!',
        visual: { kind: 'shape', shapeId: 'triangle' },
        example: '3 sides',
      },
      {
        text: 'A SQUARE has 4 sides, all exactly the same length.',
        visual: { kind: 'shape', shapeId: 'square' },
        example: '4 equal sides',
      },
    ],
  },
  {
    categoryId: 'patterns',
    title: 'What is a pattern?',
    intro: 'Patterns repeat the same way.',
    steps: [
      {
        text: 'A pattern repeats the same way, again and again.',
        visual: { kind: 'pattern', motifs: ['🌟', '🌙', '🌟', '🌙', '🌟', '🌙'] },
      },
      {
        text: 'Star, moon, star, moon… what comes next? A star!',
        example: '🌟 🌙 🌟 🌙 → 🌟',
      },
      {
        text: 'Find the part that repeats — then you always know what comes next.',
        visual: { kind: 'pattern', motifs: ['🍎', '🍎', '🍌', '🍎', '🍎', '🍌'] },
      },
    ],
  },
  {
    categoryId: 'time',
    title: 'The clock',
    intro: 'The short hand shows the hour.',
    steps: [
      {
        text: 'A clock has two hands. The SHORT hand points to the hour.',
        visual: { kind: 'clock', hour: 3, minute: 0 },
      },
      {
        text: 'When the long hand points straight up, we say o’clock. This is 3 o’clock!',
        visual: { kind: 'clock', hour: 3, minute: 0 },
        example: '3 o’clock',
      },
      {
        text: 'When the long hand points DOWN to the 6, it is half past.',
        visual: { kind: 'clock', hour: 3, minute: 30 },
        example: 'half past 3',
      },
    ],
  },
  {
    categoryId: 'money',
    title: 'What are coins?',
    intro: 'Coins are money — each has a value.',
    steps: [
      {
        text: 'Coins are money! The number on a coin is how much it is worth.',
        visual: { kind: 'coins', values: [1, 1, 1] },
      },
      {
        text: 'Count coins like anything else. Three 1-coins make 3.',
        example: '1 + 1 + 1 = 3',
      },
      {
        text: 'A bigger number is worth more — one 5-coin equals five 1-coins!',
        visual: { kind: 'coins', values: [5, 1] },
        example: '5 and 1 make 6',
      },
    ],
  },
  {
    categoryId: 'puzzle-grove',
    title: 'Puzzle time!',
    intro: 'Look carefully — be a detective.',
    steps: [
      {
        text: 'Puzzles ask you to LOOK carefully. One of these is not like the others…',
        visual: { kind: 'pattern', motifs: ['🍎', '🍎', '🍎', '🐸'] },
      },
      {
        text: 'Three apples and one frog — the frog is the odd one out!',
        example: '🐸 is different',
      },
      {
        text: 'Ask: what is the SAME? What is DIFFERENT? That’s how a detective looks.',
      },
    ],
  },
  {
    categoryId: 'big-small',
    title: 'Big and small',
    intro: 'Compare sizes: big, small, tall, short.',
    steps: [
      {
        text: 'Some things are BIG and some are small.',
        visual: { kind: 'sizes', big: '🐘', small: '🐭' },
      },
      {
        text: 'The elephant is bigger. The mouse is smaller.',
        example: 'big 🐘 · small 🐭',
      },
      {
        text: 'You can compare in lots of ways: taller and shorter, heavier and lighter.',
        visual: { kind: 'sizes', big: '🦒', small: '🐰' },
      },
    ],
  },
  // ---- mid band (7–9) -------------------------------------------------------
  {
    categoryId: 'number-crunch',
    title: 'Adding bigger numbers',
    intro: 'Break numbers into tens and ones.',
    steps: [
      {
        text: 'You can add BIG numbers — the trick is tens first, then ones.',
        visual: { kind: 'expr', text: '23 + 14' },
      },
      {
        text: '23 + 14: add the tens (20 + 10 = 30), add the ones (3 + 4 = 7). Together: 37!',
        example: '23 + 14 = 37',
      },
      {
        text: 'Taking away works the same — break both numbers into tens and ones.',
        visual: { kind: 'expr', text: '38 − 15' },
        example: '38 − 15 = 23',
      },
    ],
  },
  {
    categoryId: 'sharing',
    title: 'What is sharing?',
    intro: 'Split things fairly — the same for everyone.',
    steps: [
      {
        text: 'Sharing means splitting FAIRLY — everyone gets the same amount.',
        visual: { kind: 'emoji-row', emoji: '🍰', count: 6 },
      },
      {
        text: '6 cakes shared between 3 friends: deal them out one by one — 2 each!',
        example: '6 ÷ 3 = 2',
      },
      {
        text: 'Sharing is called DIVIDING. The ÷ sign means “split into equal groups”.',
        visual: { kind: 'expr', text: '8 ÷ 2 = 4' },
      },
    ],
  },
  {
    categoryId: 'measuring',
    title: 'Measuring things',
    intro: 'How long? How heavy? How full?',
    steps: [
      {
        text: 'Measuring tells you how long, how heavy, or how full something is.',
        visual: { kind: 'number-line', min: 0, max: 10, mark: 7 },
      },
      {
        text: 'Length is measured in centimetres (cm). This one reaches 7.',
        example: '7 cm long',
      },
      {
        text: 'Grams (g) weigh things. Millilitres (ml) fill things. Pick the right unit!',
        example: 'cm = long · g = heavy · ml = full',
      },
    ],
  },
  {
    categoryId: 'data',
    title: 'Reading graphs',
    intro: 'A graph is a picture of counting.',
    steps: [
      {
        text: 'A graph is a PICTURE of counting — a taller bar means more.',
        visual: {
          kind: 'bar-graph',
          bars: [
            { emoji: '🍎', value: 3 },
            { emoji: '🍌', value: 5 },
            { emoji: '🍇', value: 2 },
          ],
        },
      },
      {
        text: 'The banana bar is the tallest — 5 blocks. Bananas win!',
        example: '🍌 = 5 · the most',
      },
      {
        text: 'To read any bar, count its blocks. Graphs make comparing easy.',
      },
    ],
  },
  {
    categoryId: 'shape-lab',
    title: 'Shape secrets',
    intro: 'Count sides to name any shape.',
    steps: [
      {
        text: 'Every shape has sides and corners you can count.',
        visual: { kind: 'shape', shapeId: 'pentagon' },
      },
      {
        text: 'A PENTAGON has 5 sides — “penta” means five!',
        visual: { kind: 'shape', shapeId: 'pentagon' },
        example: '5 sides',
      },
      {
        text: 'A HEXAGON has 6. Count the sides and you can name any shape.',
        visual: { kind: 'shape', shapeId: 'hexagon' },
        example: '6 sides',
      },
    ],
  },
  {
    categoryId: 'detective',
    title: 'Missing numbers',
    intro: 'A number is hiding — find it!',
    steps: [
      {
        text: 'Sometimes a number HIDES in a sum. Your job is to find it!',
        visual: { kind: 'expr', text: '3 + □ = 7' },
      },
      {
        text: '3 plus WHAT makes 7? Count up from 3: four more!',
        example: '3 + 4 = 7',
      },
      {
        text: 'Work backwards like a detective — use the answer to find the clue.',
        visual: { kind: 'expr', text: '□ − 2 = 5' },
        example: '7 − 2 = 5',
      },
    ],
  },
  {
    categoryId: 'stories',
    title: 'Number stories',
    intro: 'Maths can hide inside a story.',
    steps: [
      {
        text: 'Some maths hides inside a story. Read it slowly!',
        visual: { kind: 'expr', text: '“Ana has 3 apples. She buys 2 more.”' },
      },
      {
        text: '“3 apples… 2 MORE” — the word MORE means adding!',
        example: '3 + 2 = 5',
      },
      {
        text: 'Words are clues: “more” adds, “left” takes away, “each” shares.',
      },
    ],
  },
  // ---- upper band (10–12) ---------------------------------------------------
  {
    categoryId: 'big-numbers',
    title: 'Really big numbers',
    intro: 'Thousands, hundreds, tens and ones.',
    steps: [
      {
        text: 'Big numbers are built from thousands, hundreds, tens and ones.',
        visual: { kind: 'expr', text: '4,275' },
      },
      {
        text: '4,275 is 4 thousands, 2 hundreds, 7 tens and 5 ones.',
        example: '4000 + 200 + 70 + 5',
      },
      {
        text: 'The comma helps you read it: “four thousand, two hundred and seventy-five”.',
      },
    ],
  },
  {
    categoryId: 'decimals-lab',
    title: 'What is a decimal?',
    intro: 'Numbers between the whole numbers.',
    steps: [
      {
        text: 'A decimal is a number BETWEEN whole numbers. The dot splits wholes from parts.',
        visual: { kind: 'fraction', parts: 10, shaded: 3 },
      },
      {
        text: '0.3 means 3 tenths — 3 pieces of a whole cut into 10.',
        example: '0.3 = 3 tenths',
      },
      {
        text: '0.7 beats 0.3 — more tenths. But watch out: 0.07 is tiny (hundredths)!',
        visual: { kind: 'fraction', parts: 10, shaded: 7 },
        example: '0.7 is bigger than 0.3',
      },
    ],
  },
  {
    categoryId: 'upper-crunch',
    title: 'Order of operations',
    intro: 'Multiply before you add.',
    steps: [
      {
        text: 'Big calculations have RULES: multiply and divide BEFORE you add and take away.',
        visual: { kind: 'expr', text: '2 + 3 × 4' },
      },
      {
        text: '2 + 3 × 4: do 3 × 4 first (12), THEN add 2. It’s 14 — not 20!',
        example: '2 + 12 = 14',
      },
      {
        text: 'Brackets beat everything — whatever is inside them goes first.',
        visual: { kind: 'expr', text: '(2 + 3) × 4 = 20' },
      },
    ],
  },
  {
    categoryId: 'ratios',
    title: 'What is a ratio?',
    intro: '“For every one of these, two of those.”',
    steps: [
      {
        text: 'A ratio compares two groups: for every 1 apple there are 2 bananas.',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🍎', count: 1 },
          right: { emoji: '🍌', count: 2 },
          op: ':',
        },
      },
      {
        text: 'Double both sides and the ratio stays the same: 2 apples, 4 bananas.',
        visual: {
          kind: 'emoji-groups',
          left: { emoji: '🍎', count: 2 },
          right: { emoji: '🍌', count: 4 },
          op: ':',
        },
        example: '1 : 2 = 2 : 4',
      },
      {
        text: 'Ratios grow TOGETHER — whatever you do to one side, do to the other.',
      },
    ],
  },
  {
    categoryId: 'averages',
    title: 'Averages & chance',
    intro: 'Even things out; guess how likely.',
    steps: [
      {
        text: 'An average EVENS things out — as if everyone got the same share.',
        visual: {
          kind: 'bar-graph',
          bars: [
            { emoji: '1️⃣', value: 2 },
            { emoji: '2️⃣', value: 4 },
            { emoji: '3️⃣', value: 6 },
          ],
        },
      },
      {
        text: 'Scores of 2, 4 and 6: the total is 12, split between 3 → the mean is 4.',
        example: '(2 + 4 + 6) ÷ 3 = 4',
      },
      {
        text: 'CHANCE says how likely something is: certain, likely, unlikely… or impossible.',
      },
    ],
  },
  {
    categoryId: 'volume-units',
    title: 'Volume',
    intro: 'How much space something fills.',
    steps: [
      {
        text: 'Volume is how much SPACE something fills — count the cubes.',
        visual: { kind: 'array', rows: 3, cols: 4 },
      },
      {
        text: 'One layer is 4 × 3 = 12 cubes. Stack two layers: 24 cubes!',
        example: '4 × 3 × 2 = 24',
      },
      {
        text: 'Units swap in thousands: 1 litre is 1000 millilitres.',
        visual: { kind: 'expr', text: '1 L = 1000 ml' },
      },
    ],
  },
  {
    categoryId: 'grid-world',
    title: 'Coordinates',
    intro: 'Every spot has an address.',
    steps: [
      {
        text: 'A grid gives every spot an ADDRESS: (across, up).',
        visual: { kind: 'grid-star', x: 3, y: 2, size: 5 },
      },
      {
        text: '(3, 2) means go 3 ACROSS, then 2 UP. Across always comes first!',
        example: '(3, 2) → ➡️ 3, ⬆️ 2',
      },
      {
        text: 'Swap the numbers and you land somewhere different — (2, 3) is another spot!',
        visual: { kind: 'grid-star', x: 2, y: 3, size: 5 },
        example: '(2, 3) ≠ (3, 2)',
      },
    ],
  },
  {
    categoryId: 'puzzle-peak',
    title: 'Two-step puzzles',
    intro: 'Solve the first step, then use it.',
    steps: [
      {
        text: 'Some puzzles take TWO steps. Solve the first — then use it for the second!',
        visual: { kind: 'expr', text: '“3 packs of 4 stickers… give 2 away.”' },
      },
      {
        text: 'Step 1: 3 × 4 = 12 stickers. Step 2: 12 − 2 = 10 left.',
        example: '3 × 4 = 12 → 12 − 2 = 10',
      },
      {
        text: 'Break a big problem into small steps — every peak is climbed one step at a time. 🧗',
      },
    ],
  },
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
