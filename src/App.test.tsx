import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
import { useGameStore, isLevelUnlocked } from './engine/store'
import { levelsInCategory } from './content/math'
import type { CountQuestion } from './engine/types'

/**
 * Full-loop integration test through the real React components (spec §9, step
 * 7): pick a category → open its first level → answer to mastery → land on the
 * cleared screen with the category's next level unlocked. The generator is
 * mocked to a fixed question so the test knows which button is correct;
 * everything else — routing, mastery gate, store, feedback timers — is the real
 * thing. Audio no-ops in jsdom (no SpeechSynthesis / AudioContext), which the
 * AudioManager tolerates.
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
  // Most tests start past the first-launch age gate (the gate has its own test).
  useGameStore.setState({ age: 5 })
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

/** The Home card for a category (its aria-label ends with a progress count). */
function categoryCard(name: string): HTMLButtonElement | null {
  return (
    [...container.querySelectorAll('button')].find((b) =>
      b.getAttribute('aria-label')?.startsWith(`${name},`),
    ) ?? null
  )
}

function buttonByText(text: string): HTMLButtonElement | null {
  return (
    [...container.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === text,
    ) ?? null
  )
}

function click(el: HTMLElement | null) {
  if (!el) throw new Error('element not found')
  act(() => el.click())
}

/** Type into a controlled input (React reads the value off the native event). */
function typeInto(input: HTMLInputElement | null, text: string) {
  if (!input) throw new Error('input not found')
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )!.set!
  act(() => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('full play loop', () => {
  it('opens Counting → Level 1, reaches mastery, shows the cleared screen, unlocks Level 2', () => {
    // Home shows the category cards; open Counting.
    const card = categoryCard('Counting')
    expect(card).not.toBeNull()
    click(card)

    // Category screen: first level open, second locked (focusable but inert —
    // tapping it speaks "not yet" and does NOT navigate).
    const node = buttonByAria('Count to 3')
    expect(node).not.toBeNull()
    const locked = buttonByAria('Count to 5, locked')
    expect(locked?.getAttribute('aria-disabled')).toBe('true')
    click(locked)
    expect(buttonByAria('Back to the meadow')).not.toBeNull() // still on the tiles

    click(node)

    // On the play screen: answer correctly to the mastery goal (3).
    for (let i = 0; i < 4; i++) {
      const two = buttonByAria('2')
      expect(two, `answer button present on rep ${i}`).not.toBeNull()
      click(two)
      advance(1200) // let the celebrate→advance timer fire
    }

    // Cleared screen appeared — with the sprint door now open.
    expect(container.textContent).toContain('Level complete')
    expect(buttonByText('🏆 Sprint')).not.toBeNull()

    // Store reflects the win, and the next level in the category derives open.
    const state = useGameStore.getState()
    expect(state.stars).toBe(4)
    expect(state.progress['math-early-1'].cleared).toBe(true)
    const counting = levelsInCategory('counting')
    expect(isLevelUnlocked(counting[1], counting, state.progress)).toBe(true)
    expect(isLevelUnlocked(counting[2], counting, state.progress)).toBe(false)

    // "Next level" goes straight into Count to 5 — prove WHICH level loaded by
    // mastering it and checking level 2's progress record.
    click(buttonByText('Next level'))
    expect(buttonByAria('Back to the levels')).not.toBeNull()
    for (let i = 0; i < 4; i++) {
      click(buttonByAria('2'))
      advance(1200)
    }
    expect(useGameStore.getState().progress['math-early-2'].cleared).toBe(true)
  })

  it('back buttons return to the level tiles, which render the earned unlock', () => {
    click(categoryCard('Counting'))
    click(buttonByAria('Count to 3'))

    // Mid-level back-out → straight back to the tiles, nothing lost.
    click(buttonByAria('Back to the levels'))
    expect(buttonByAria('Back to the meadow')).not.toBeNull()
    expect(buttonByAria('Count to 3')).not.toBeNull()

    // Clear level 1, then take the "Pick a level" path from the cleared screen.
    click(buttonByAria('Count to 3'))
    for (let i = 0; i < 4; i++) {
      click(buttonByAria('2'))
      advance(1200)
    }
    click(buttonByText('Pick a level'))

    // The RENDERED tiles reflect the new unlock: level 2 open, level 3 locked.
    expect(buttonByAria('Count to 5')).not.toBeNull()
    expect(buttonByAria('Count to 5, locked')).toBeNull()
    expect(buttonByAria('Count to 10, locked')?.getAttribute('aria-disabled')).toBe('true')
  })

  it('a wrong answer keeps the child on the same question with no progress lost', () => {
    click(categoryCard('Counting'))
    click(buttonByAria('Count to 3'))

    // Tap a wrong number.
    click(buttonByAria('1'))
    advance(900)

    // Still on the play screen (no cleared text), nothing awarded.
    expect(container.textContent).not.toContain('Level complete!')
    expect(useGameStore.getState().stars).toBe(0)

    // The correct answer still works right after.
    click(buttonByAria('2'))
    advance(1200)
    expect(useGameStore.getState().stars).toBe(1)
  })

  it('finishing a category’s last level celebrates the category', () => {
    // Seed all but the last More-or-Less rung; master the final one (the
    // mocked generator serves the same fixed question regardless of activity).
    act(() => {
      useGameStore.setState({
        progress: {
          'math-early-4': { cleared: true, bestStreak: 3 },
          'math-early-26': { cleared: true, bestStreak: 3 },
          'math-early-27': { cleared: true, bestStreak: 3 },
        },
      })
    })
    click(categoryCard('More or Less'))
    click(buttonByAria('Bigger number'))
    for (let i = 0; i < 4; i++) {
      click(buttonByAria('2'))
      advance(1200)
    }
    expect(container.textContent).toContain('You finished More or Less!')
    // No next level — the button leads back to the meadow instead.
    expect(buttonByText('Next level')).toBeNull()
    click(buttonByText('Back to the meadow'))
    expect(categoryCard('Counting')).not.toBeNull()
  })

  it('asks age, then name, then shows their meadow with a greeting', () => {
    act(() => {
      useGameStore.setState({ age: null, name: null }) // fresh household
    })
    expect(container.textContent).toContain('How old are you?')
    expect(categoryCard('Counting')).toBeNull() // nothing else renders yet

    click(buttonByAria('4 years old'))
    expect(useGameStore.getState().age).toBe(4)

    // The name screen follows — a grown-up types it, ✔️ confirms.
    expect(container.textContent).toContain("What's your name?")
    typeInto(container.querySelector('input'), 'Maya')
    click(buttonByAria("Done, that's my name"))
    expect(useGameStore.getState().name).toBe('Maya')

    // Age 4 has no placement plan — straight into the meadow, greeted.
    expect(categoryCard('Counting')).not.toBeNull() // early-band meadow
    expect(container.textContent).toContain('Welcome back, Maya')
  })

  it('ages 5+ get the placement check: passes place rungs, the first miss starts them there', () => {
    act(() => {
      useGameStore.setState({ age: null, progress: {} }) // fresh household
    })
    click(buttonByAria('6 years old'))
    click(buttonByAria('Skip name')) // the name step is always skippable

    // The placement check appears instead of the meadow.
    expect(container.textContent).toContain('Show me what you can do!')

    // Checkpoint 1 (mocked question, correct answer 2): pass.
    click(buttonByAria('2'))
    advance(1000)
    let state = useGameStore.getState()
    expect(state.progress['math-early-1']?.cleared).toBe(true)
    expect(state.progress['math-early-3']?.placed).toBe(true)
    expect(state.stars).toBe(0) // placement grants position, never rewards

    // Checkpoint 2: miss → gentle end, nothing further placed.
    click(buttonByAria('1'))
    advance(1300)
    state = useGameStore.getState()
    expect(state.progress['math-early-4']).toBeUndefined()
    expect(categoryCard('Counting')).not.toBeNull() // back on the meadow

    // The placed rungs render as open: rung 4 is the first playable.
    click(categoryCard('Counting'))
    expect(buttonByAria('Quick peek!')).not.toBeNull()
    expect(buttonByAria('Count to 3')).not.toBeNull() // placed levels stay replayable
  })

  it('skipping placement lands on the meadow with nothing placed', () => {
    act(() => {
      useGameStore.setState({ age: null, progress: {} })
    })
    click(buttonByAria('5 years old'))
    click(buttonByAria('Skip name'))
    expect(container.textContent).toContain('Show me what you can do!')
    expect(useGameStore.getState().name).toBeNull()
    click(buttonByAria('Skip, start from the beginning'))
    expect(useGameStore.getState().progress).toEqual({})
    expect(categoryCard('Counting')).not.toBeNull()
  })

  it('a fresh 12-year-old gets the UPPER placement check and skips proven rungs', () => {
    act(() => {
      useGameStore.setState({ age: null, progress: {} }) // fresh household
    })
    click(buttonByAria('12 years old'))
    click(buttonByAria('Skip name'))
    expect(container.textContent).toContain('Show me what you can do!')

    // Checkpoint 1 (mocked question, correct answer 2): places the first
    // Big Numbers rungs — the grindy number-work an older starter skips.
    click(buttonByAria('2'))
    advance(1000)
    let state = useGameStore.getState()
    expect(state.progress['math-upper-1']?.placed).toBe(true)
    expect(state.progress['math-upper-2']?.placed).toBe(true)
    expect(state.stars).toBe(0) // placement grants position, never rewards

    // Checkpoint 2: miss → gentle end on the upper meadow, nothing further.
    click(buttonByAria('1'))
    advance(1300)
    state = useGameStore.getState()
    expect(state.progress['math-upper-3']).toBeUndefined()
    expect(categoryCard('Big Numbers')).not.toBeNull()

    // The placed rungs render as open: rung 3 is the first playable.
    click(categoryCard('Big Numbers'))
    expect(buttonByAria('Bigger number')).not.toBeNull()
    expect(buttonByAria('Find the number')).not.toBeNull() // placed stays replayable
  })

  it('the daily warm-up resurfaces earned levels and replays them on tap', () => {
    act(() => {
      useGameStore.setState({
        progress: {
          'math-early-1': { cleared: true, bestStreak: 3, attempts: 6, correct: 4 },
          'math-early-2': { cleared: true, bestStreak: 3, attempts: 6, correct: 6 },
        },
      })
    })
    expect(container.textContent).toContain('Today’s warm-up')
    // Shakiest first: 67% Count to 3 leads 100% Count to 5.
    click(buttonByAria('Warm up: Count to 3'))
    expect(container.textContent).toContain('How many apples?') // straight into play
    click(buttonByAria('Back to the levels'))
  })

  it('feedback is WORDS on screen: Try again! on a miss, a praise word on a hit', () => {
    click(categoryCard('Counting'))
    click(buttonByAria('Count to 3'))
    click(buttonByAria('1')) // wrong — the mocked answer is 2
    expect(container.textContent).toContain('Try again!')
    click(buttonByAria('2')) // correct
    expect(container.textContent).toMatch(
      /Yes!|You did it!|Great job!|Woohoo!|Nice counting!|Well done!/,
    )
    advance(1100) // settle the celebration timer
  })

  it('the player chip shows the name and LIVE stars while playing', () => {
    act(() => {
      useGameStore.setState({ name: 'Maya' }) // age 5 from the suite setup
    })
    click(categoryCard('Counting'))
    click(buttonByAria('Count to 3'))
    expect(container.querySelector('[aria-label="Maya, 0 stars"]')).not.toBeNull()

    click(buttonByAria('2')) // correct → a star lands immediately
    expect(container.querySelector('[aria-label="Maya, 1 star"]')).not.toBeNull()
    advance(1100) // let the celebration timer settle
  })

  it('a mid-band child (age 9) gets the mid meadow — Phase 3 content, no fallback', () => {
    act(() => {
      useGameStore.setState({ age: 9 })
    })
    expect(categoryCard('Place Value')).not.toBeNull()
    expect(categoryCard('Times Tables')).not.toBeNull()
    expect(categoryCard('Counting')).toBeNull() // early meadow is the early band's
    expect(container.textContent).not.toContain('still growing')
  })

  it('an upper-band child (age 11) sees the upper meadow — no growing note anywhere', () => {
    act(() => {
      useGameStore.setState({ age: 11 }) // upper — real content since Phases 5–6
    })
    expect(categoryCard('Big Numbers')).not.toBeNull()
    expect(categoryCard('Puzzle Peak')).not.toBeNull()
    expect(categoryCard('Counting')).toBeNull() // the early meadow is the early band's
    expect(container.textContent).not.toContain('still growing')
  })

  it('ages 10, 11 and 12 climb DIFFERENT ladders: the tier rungs appear with age', () => {
    act(() => {
      useGameStore.setState({ age: 10 })
    })
    click(categoryCard('Grid World'))
    expect(container.textContent).toContain('Treasure map')
    expect(container.textContent).not.toContain('All four corners') // 11+
    expect(container.textContent).not.toContain('Slide the star') // 12+

    act(() => {
      useGameStore.setState({ age: 11 })
    })
    expect(container.textContent).toContain('All four corners')
    expect(container.textContent).not.toContain('Slide the star')

    act(() => {
      useGameStore.setState({ age: 12 })
    })
    expect(container.textContent).toContain('Treasure map')
    expect(container.textContent).toContain('All four corners')
    expect(container.textContent).toContain('Slide the star')
  })

  it('mid sprint is arcade: visible countdown and a 🔥 double-score streak', () => {
    act(() => {
      useGameStore.setState({
        age: 9,
        progress: { 'math-mid-1': { cleared: true, bestStreak: 3 } },
      })
    })
    click(categoryCard('Place Value'))
    click(buttonByAria('Sprint Tens and ones'))

    // The countdown is visible (early sprints never show numerals).
    expect(container.textContent).toMatch(/\d:\d\d/)

    // Four straight corrects: 1 + 1 + 2 + 2 (third-in-a-row doubles).
    for (let i = 0; i < 4; i++) {
      click(buttonByAria('2'))
      advance(500)
    }
    advance(60_000)
    expect(container.textContent).toContain('You got 6!')
    expect(useGameStore.getState().bestScores['math-mid-1']).toBe(6)
  })

  it('sprint mode: scores climb, bests persist forward-only, endings always celebrate', () => {
    // A mastered level exposes its sprint chip on the category screen.
    act(() => {
      useGameStore.setState({
        progress: { 'math-early-1': { cleared: true, bestStreak: 3 } },
      })
    })
    click(categoryCard('Counting'))
    click(buttonByAria('Sprint Count to 3'))

    // In the round: correct, then a MISS (which scores nothing and moves on
    // to a fresh question), then another correct.
    click(buttonByAria('2'))
    advance(500) // between-question beat
    click(buttonByAria('1')) // wrong — round advances, score unchanged
    advance(600)
    expect(container.querySelector('[aria-label="1 correct so far"]')).not.toBeNull()
    expect(buttonByAria('2')?.disabled).toBe(false) // fresh question, answerable
    click(buttonByAria('2'))
    advance(500)

    // The clock runs out → celebration, never failure.
    advance(60_000)
    expect(container.textContent).toContain('You got 2!')
    expect(container.textContent).toContain('A new best!')
    expect(useGameStore.getState().bestScores['math-early-1']).toBe(2)

    // Again — a worse round cannot lower the best.
    click(buttonByText('🏆 Again'))
    click(buttonByAria('2'))
    advance(500)
    advance(60_000)
    expect(container.textContent).toContain('You got 1!')
    expect(useGameStore.getState().bestScores['math-early-1']).toBe(2)

    // Back to the levels — the chip now shows the best.
    click(buttonByText('Back to the levels'))
    expect(buttonByAria('Sprint Count to 3')?.textContent).toContain('2')
    expect(container.textContent).toContain('🏆') // category header total
  })

  it('routes from home into the grown-ups panel and back', () => {
    click(buttonByAria('For grown-ups'))
    expect(container.textContent).toContain('For grown-ups')
    expect(container.textContent).toContain('Progress is saved on this device only')

    click(buttonByAria('Done, back to the meadow'))
    // Back home: the category cards are showing again.
    expect(categoryCard('Counting')).not.toBeNull()
  })

  it('resetting from the grown-ups panel re-asks the age on the way out', () => {
    click(buttonByAria('For grown-ups'))
    click(buttonByText('Reset all progress'))

    // Pass the addition gate ("a + b = ?").
    const m = container.textContent?.match(/(\d+)\s*\+\s*(\d+)\s*=/)
    expect(m).not.toBeNull()
    click(buttonByAria(String(Number(m![1]) + Number(m![2]))))

    // Reset done: age cleared, but the adult stays in the panel…
    expect(useGameStore.getState().age).toBeNull()
    expect(container.textContent).toContain('Progress reset')

    // …and meets the age gate on the way out.
    click(buttonByText('Back to the start'))
    expect(container.textContent).toContain('How old are you?')
  })

  it('first mastery mints a diamond, shown on the cleared screen', () => {
    click(categoryCard('Counting'))
    click(buttonByAria('Count to 3'))
    for (let i = 0; i < 4; i++) {
      click(buttonByAria('2'))
      advance(1200)
    }
    // The reward reads out on the cleared screen…
    expect(container.textContent).toContain('for your garden')
    // …and exactly one diamond was minted (first mastery, chapter not yet done).
    expect(useGameStore.getState().diamonds).toBe(1)
  })

  it('the garden card opens the garden, and the shop spends earned stars', () => {
    act(() => {
      useGameStore.setState({ stars: 50 })
    })
    click(buttonByAria('My Garden'))
    expect(container.textContent).toContain('My Garden')

    click(buttonByAria('Open the shop'))
    click(buttonByAria('Buy Blossom for 5 stars'))
    // Bought one Blossom; the star WALLET spent 5 but lifetime earned is intact.
    expect(useGameStore.getState().owned['plant-blossom']).toBe(1)
    expect(useGameStore.getState().starsSpent).toBe(5)
    expect(useGameStore.getState().stars).toBe(50)
  })

  it('a topic class teaches the concept, then hands off to practice', () => {
    act(() => {
      useGameStore.setState({ age: 9 }) // mid band — Fractions has a lesson
    })
    click(categoryCard('Fractions'))

    // The "what is this?" class is offered on the category screen.
    const learn = buttonByAria('Learn what Fractions is')
    expect(learn).not.toBeNull()
    click(learn)

    // The class explains the idea, step by step.
    expect(container.textContent).toContain('part of a whole')
    expect(container.textContent).toContain('Step 1 of 3')
    click(buttonByText('Next ›')) // → step 2
    click(buttonByText('Next ›')) // → step 3 (last)

    // "Let's try it!" opens FREE PRACTICE — answers there don't count.
    click(buttonByText("Let's try it! ✏️"))
    expect(container.textContent).toContain('How many apples?')
    click(buttonByAria('2')) // correct, but practice is stakes-free
    advance(1100)
    expect(useGameStore.getState().stars).toBe(0)

    // Ready for the real thing → a real level, where answers DO earn.
    click(buttonByAria("I'm ready to play for real"))
    click(buttonByAria('2'))
    advance(50)
    expect(useGameStore.getState().stars).toBeGreaterThan(0)
  })
})
