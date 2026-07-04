import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import ParentView from './ParentView'
import { useGameStore } from '../engine/store'

/**
 * The grown-ups panel: it should surface progress, and its one destructive
 * action (reset) must sit behind the addition gate — a wrong tap changes
 * nothing; the right tap wipes progress back to the start.
 */

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function seedProgress() {
  useGameStore.getState().reset()
  // Counting: level 1 mastered, level 2 attempted (open), level 3 locked.
  // Comparing & Adding: untouched (their first levels derive as open).
  useGameStore.setState({
    stars: 7,
    age: 5,
    progress: {
      'math-early-1': { cleared: true, bestStreak: 3 },
      'math-early-2': { cleared: false, bestStreak: 1 },
    },
  })
}

beforeEach(() => {
  seedProgress()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<ParentView onClose={() => {}} />))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function buttons(): HTMLButtonElement[] {
  return [...container.querySelectorAll('button')]
}

function buttonByText(text: string): HTMLButtonElement | null {
  return buttons().find((b) => b.textContent?.trim() === text) ?? null
}

function buttonByAria(label: string): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
}

function click(el: HTMLElement | null) {
  if (!el) throw new Error('element not found')
  act(() => el.click())
}

/** Read the "a + b = ?" gate off the screen and return the correct sum. */
function gateAnswer(): number {
  const m = container.textContent?.match(/(\d+)\s*\+\s*(\d+)\s*=/)
  if (!m) throw new Error('gate prompt not visible')
  return Number(m[1]) + Number(m[2])
}

describe('ParentView', () => {
  it('shows the progress summary grouped by category', () => {
    expect(container.textContent).toContain('7') // stars
    expect(container.textContent).toContain('1/94') // mastered levels
    expect(container.textContent).toContain('0/22') // finished categories
    // Category headers and level statuses.
    expect(container.textContent).toContain('Counting')
    expect(container.textContent).toContain('More or Less')
    expect(container.textContent).toContain('Adding Up')
    expect(container.textContent).toContain('Taking Away')
    expect(container.textContent).toContain('Shapes')
    expect(container.textContent).toContain('Patterns')
    expect(container.textContent).toContain('Clock Time')
    expect(container.textContent).toContain('Money')
    expect(container.textContent).toContain('Puzzle Grove')
    expect(container.textContent).toContain('Big & Small')
    expect(container.textContent).toContain('Place Value')
    expect(container.textContent).toContain('Times Tables')
    expect(container.textContent).toContain('Fractions')
    expect(container.textContent).toContain('Story Problems')
    expect(container.textContent).toContain('Count to 3')
    // Pin the status DERIVATION, not just the vocabulary: with this seed the
    // statuses must be exactly 1× Mastered (counting L1), 22× In progress
    // (counting L2 + each other category's first level), 71× Locked (all the
    // rest of the 94). Swapping the mapping breaks these counts.
    const text = container.textContent ?? ''
    expect(text.match(/Mastered/g)?.length).toBe(1 + 1) // 1 pill + the "Mastered" stat label
    expect(text.match(/In progress/g)?.length).toBe(22)
    expect(text.match(/Locked/g)?.length).toBe(71)
  })

  it('offers the currency picker and reflects the choice', () => {
    expect(container.textContent).toContain('Money currency')
    click(buttonByAria('British Pound'))
    expect(useGameStore.getState().currency).toBe('GBP')
    expect(container.textContent).toContain('£')
  })

  it('offers the pace quiz and shows a plan after five answers', () => {
    expect(container.textContent).toContain('Learning pace')
    click(buttonByText('Find our pace'))
    // Answer all five questions with the middle option.
    for (let i = 0; i < 5; i++) {
      expect(container.textContent).toContain(`Question ${i + 1} of 5`)
      const middle = [...container.querySelectorAll('button')].filter((b) =>
        b.className.includes('text-left'),
      )[1]
      click(middle)
    }
    // Five middle answers → total 5 → steady.
    expect(useGameStore.getState().pace).toBe('steady')
    expect(container.textContent).toContain('A steady stroll')
    expect(container.textContent).toContain('per sitting')
    expect(buttonByText('Retake the quiz')).not.toBeNull()
  })

  it('placed levels show as “Placed”, not “Mastered”, and don’t inflate the mastered stat', () => {
    act(() => {
      // Place all four More-or-Less rungs — a whole category via placement.
      useGameStore
        .getState()
        .placeLevels(['math-early-4', 'math-early-26', 'math-early-27', 'math-early-28'])
    })
    expect(container.textContent).toContain('Placed')
    expect(container.textContent).toContain('1/94') // mastered = earned only
    expect(container.textContent).toContain('1/22') // …but the category counts as finished
  })

  it('resets progress only after the addition gate is passed correctly', () => {
    click(buttonByText('Reset all progress'))

    // A wrong tap must NOT reset anything.
    const answer = gateAnswer()
    const wrong = buttons().find(
      (b) => /^\d+$/.test(b.getAttribute('aria-label') ?? '') && Number(b.getAttribute('aria-label')) !== answer,
    )
    click(wrong ?? null)
    expect(useGameStore.getState().stars).toBe(7)
    expect(useGameStore.getState().progress['math-early-1'].cleared).toBe(true)
    // The remounted option row must recapture keyboard focus (not <body>).
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^\d+$/)

    // The gate reshuffles after a miss — read it again and tap the right answer.
    const correct = gateAnswer()
    click(buttonByAria(String(correct)))

    const state = useGameStore.getState()
    expect(state.stars).toBe(0)
    expect(state.progress).toEqual({})
    expect(container.textContent).toContain('Progress reset')
  })

  it('cancel backs out of the gate without resetting', () => {
    click(buttonByText('Reset all progress'))
    click(buttonByText('Cancel'))
    expect(useGameStore.getState().stars).toBe(7)
    expect(buttonByText('Reset all progress')).not.toBeNull()
  })
})
