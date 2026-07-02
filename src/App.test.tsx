import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
import { useGameStore } from './engine/store'
import type { CountQuestion } from './engine/types'

/**
 * Full-loop integration test through the real React components (spec §9, step
 * 7): start on the trail → open Level 1 → answer to mastery → land on the
 * cleared screen with Level 2 unlocked. The generator is mocked to a fixed
 * question so the test knows which button is correct; everything else — routing,
 * mastery gate, store, feedback timers — is the real thing. Audio no-ops in
 * jsdom (no SpeechSynthesis / AudioContext), which the AudioManager tolerates.
 */

// React needs to know it's in an act() environment.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fixedQuestion: CountQuestion = {
  id: 'fixed',
  activity: 'count',
  prompt: 'How many apples?',
  payload: {
    group: { theme: { id: 'apple', singular: 'apple', plural: 'apples', emoji: '🍎' }, count: 2 },
  },
  options: [1, 2, 3],
  answer: 2,
}

vi.mock('./engine/generators', () => ({
  generateQuestion: () => ({ ...fixedQuestion }),
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.getState().reset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<App />))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

function buttonByAria(label: string): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
}

function answerButton(value: string): HTMLButtonElement | null {
  return [...container.querySelectorAll('button')].find(
    (b) => b.getAttribute('aria-label') === value,
  ) as HTMLButtonElement | null
}

function click(el: HTMLElement | null) {
  if (!el) throw new Error('element not found')
  act(() => el.click())
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('full play loop', () => {
  it('opens Level 1, reaches mastery, shows the cleared screen, unlocks Level 2', () => {
    // Trail shows the first node open.
    const node = buttonByAria('Count to 3')
    expect(node).not.toBeNull()
    expect(node!.disabled).toBe(false)
    // Locked node is not tappable.
    expect(buttonByAria('Add it up, locked')?.disabled).toBe(true)

    click(node)

    // On the play screen: answer correctly to the mastery goal (3).
    for (let i = 0; i < 3; i++) {
      const two = answerButton('2')
      expect(two, `answer button present on rep ${i}`).not.toBeNull()
      click(two)
      advance(1200) // let the celebrate→advance timer fire
    }

    // Cleared screen appeared.
    expect(container.textContent).toContain('Level complete!')

    // Store reflects the win.
    const state = useGameStore.getState()
    expect(state.unlockedOrder).toBe(2)
    expect(state.stars).toBe(3)
    expect(state.progress['math-early-1'].cleared).toBe(true)
  })

  it('a wrong answer keeps the child on the same question with no progress lost', () => {
    click(buttonByAria('Count to 3'))

    // Tap a wrong number.
    click(answerButton('1'))
    advance(900)

    // Still on the play screen (no cleared text), nothing awarded.
    expect(container.textContent).not.toContain('Level complete!')
    expect(useGameStore.getState().stars).toBe(0)
    expect(useGameStore.getState().unlockedOrder).toBe(1)

    // The correct answer still works right after.
    click(answerButton('2'))
    advance(1200)
    expect(useGameStore.getState().stars).toBe(1)
  })
})
