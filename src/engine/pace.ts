import type { PaceId } from './types'

/**
 * Learning-pace profiler — pure logic, no state. A grown-up answers a short,
 * friendly quiz about their child's temperament and preferences (attention
 * span, frustration response, appetite for novelty, energy, "one more go").
 * The score maps to a PaceId, and each pace carries a suggested session plan.
 *
 * Deliberately NOT a clinical instrument: it is a preferences questionnaire
 * that tunes pacing, phrased for parents, stored locally only. Future phases
 * can also feed the pace into adaptive difficulty (see CONTEXT.md seams).
 */

export interface PaceQuestion {
  id: string
  text: string // asked of the grown-up, about the child
  /** Three answers, ordered gentle → eager (scored 0, 1, 2). */
  answers: [string, string, string]
}

export const PACE_QUESTIONS: readonly PaceQuestion[] = [
  {
    id: 'attention',
    text: 'How long does your child usually stay with one activity?',
    answers: [
      'A few minutes, then they move on',
      'Around ten minutes',
      'Ages — they get really absorbed',
    ],
  },
  {
    id: 'frustration',
    text: 'When something is tricky, your child usually…',
    answers: [
      'Gets upset quickly and needs a change',
      'Tries a bit, then wants help',
      'Keeps at it until it works',
    ],
  },
  {
    id: 'novelty',
    text: 'With brand-new games or activities, your child…',
    answers: [
      'Prefers the ones they already know',
      'Warms up after a little while',
      'Dives straight in',
    ],
  },
  {
    id: 'energy',
    text: 'During sit-down play, your child is…',
    answers: [
      'Wiggly — needs to move often',
      'Settled, with the odd wriggle',
      'Calm and focused',
    ],
  },
  {
    id: 'more',
    text: 'After finishing something they enjoyed, your child wants…',
    answers: [
      'A break or something different',
      'Maybe one more go',
      'To keep going and going',
    ],
  },
] as const

/** One answer per question, each 0 | 1 | 2 (index into `answers`). */
export type PaceAnswers = number[]

/**
 * Map quiz answers to a pace. Total spans 0–10:
 *   0–3  → gentle, 4–7 → steady, 8–10 → eager.
 * Out-of-range answer values are clamped so a buggy caller can't skew a
 * child's profile past the scale.
 */
export function scorePace(answers: PaceAnswers): PaceId {
  const total = answers.reduce(
    // Non-finite garbage (NaN, Infinity) scores 0 — corrupt input must never
    // land a child on the most intense profile by accident.
    (sum, a) => sum + (Number.isFinite(a) ? Math.min(2, Math.max(0, Math.round(a))) : 0),
    0,
  )
  if (total <= 3) return 'gentle'
  if (total <= 7) return 'steady'
  return 'eager'
}

export interface PacePlan {
  pace: PaceId
  title: string
  /** Suggested levels per sitting. */
  levelsPerSession: number
  /** Suggested session length, as words for the parent. */
  sessionLength: string
  /** One-line guidance for the grown-up. */
  tips: string[]
}

export const PACE_PLANS: Record<PaceId, PacePlan> = {
  gentle: {
    pace: 'gentle',
    title: 'Little and often',
    levelsPerSession: 1,
    sessionLength: '5–10 minutes',
    tips: [
      'One level per sitting is plenty — stop while it is still fun.',
      'Replay cleared levels for easy wins before trying a new one.',
      'Wiggle break between questions? Great. The meadow will wait.',
    ],
  },
  steady: {
    pace: 'steady',
    title: 'A steady stroll',
    levelsPerSession: 2,
    sessionLength: '10–15 minutes',
    tips: [
      'Aim for a couple of levels per sitting, ideally in one category.',
      'Let them pick the category — choice keeps them invested.',
      'End on a win: after a cleared level is the perfect stopping point.',
    ],
  },
  eager: {
    pace: 'eager',
    title: 'Ready to romp',
    levelsPerSession: 3,
    sessionLength: '15–20 minutes',
    tips: [
      'Two or three levels per sitting suits them — follow their energy.',
      'Mix categories in one session to keep the challenge fresh.',
      'If they breeze through, revisit a harder level for mastery.',
    ],
  },
}

/** The full plan for a set of quiz answers — the single call ParentView makes. */
export function planFor(answers: PaceAnswers): PacePlan {
  return PACE_PLANS[scorePace(answers)]
}
