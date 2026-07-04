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
