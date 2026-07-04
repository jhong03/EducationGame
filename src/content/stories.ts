/**
 * One-step story-problem templates (L4 in CURRICULUM.md — every curriculum's
 * capstone for this band). Placeholders: {a} {b} {things}. The generator
 * substitutes numbers and a theme; the answer op is data, not code.
 */
export interface StoryTemplate {
  op: '+' | '-' | '×'
  text: string
}

export const STORY_TEMPLATES: readonly StoryTemplate[] = [
  { op: '+', text: 'Maya has {a} {things}. She finds {b} more. How many now?' },
  { op: '+', text: 'There are {a} {things} on the hill and {b} by the pond. How many altogether?' },
  { op: '-', text: 'Sam has {a} {things}. He gives {b} away. How many are left?' },
  { op: '-', text: '{a} {things} were on the tree. {b} fell off. How many are still there?' },
  { op: '×', text: 'There are {a} baskets with {b} {things} in each. How many altogether?' },
  { op: '×', text: '{a} friends have {b} {things} each. How many in total?' },
] as const

/**
 * Two-step stories for the upper band (L5): answer = (a op1 b) op2 c. The
 * generator sizes numbers so every intermediate result stays whole and ≥ 0.
 */
export interface TwoStepTemplate {
  ops: readonly ['+' | '-' | '×', '+' | '-']
  text: string
}

export const TWO_STEP_TEMPLATES: readonly TwoStepTemplate[] = [
  { ops: ['+', '-'], text: 'Maya picks {a} {things}, then {b} more, then gives {c} away. How many now?' },
  { ops: ['-', '-'], text: 'Sam has {a} {things}. He gives {b} to Ali and {c} to Ren. How many are left?' },
  { ops: ['+', '+'], text: 'Ren finds {a} {things}, {b} more in the morning and {c} more at night. How many in all?' },
  { ops: ['×', '-'], text: 'There are {a} boxes with {b} {things} in each. Then {c} roll away. How many now?' },
  { ops: ['×', '+'], text: '{a} friends bring {b} {things} each, and {c} more are already on the table. How many in total?' },
] as const
