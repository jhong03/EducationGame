import { useEffect } from 'react'
import type { Band } from '../engine/types'
import { useGameStore, hasCleared } from '../engine/store'
import { categoriesForBand, levelsInCategoryForAge } from '../content/math'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * Home — pick a skill category. Replaces the old single winding trail: one big
 * friendly card per category (curriculum strand), each showing its progress as
 * dots. Categories are always open — the mastery gate lives *inside* each one —
 * so a child chooses WHAT to practise, never WHERE on a path they're stuck.
 *
 * Only the child's age band's categories show. A band with no content yet
 * (mid/upper until Phases 3+) falls back to the early meadow with a gentle,
 * spoken "still growing" note — never an empty dead-end screen.
 *
 * Audio-first: tapping a card speaks the category name, so a pre-reader
 * navigates by icon + voice alone.
 */

interface HomeProps {
  band: Band
  onSelectCategory: (categoryId: string) => void
  onOpenParent: () => void
}

const GROWING_NOTE = 'This part of the meadow is still growing! Play here for now.'

// Session latch: the growing note is spoken once per app session, not on
// every return to Home (the banner itself stays visible throughout).
let growingNoteSpoken = false

// Same latch pattern for the name greeting — "Hi Maya!" once per session,
// not on every trip back to the meadow.
let greetingSpoken = false

/**
 * Card colors cycle through the theme's chunky-button pairs. Text color is
 * per-card for WCAG contrast: cream passes on grape (4.1:1) but not on the
 * lighter coral/leaf, where ink does (4.0:1 / 4.5:1 — large bold text).
 */
const CARD_COLORS = [
  { bg: 'var(--grape)', shadow: 'var(--grape-dp)', text: 'var(--cream)' },
  { bg: 'var(--coral)', shadow: 'var(--coral-dp)', text: 'var(--ink)' },
  { bg: 'var(--leaf)', shadow: 'var(--leaf-dp)', text: 'var(--ink)' },
] as const

export default function Home({ band, onSelectCategory, onOpenParent }: HomeProps) {
  const progress = useGameStore((s) => s.progress)
  const stars = useGameStore((s) => s.stars)
  const age = useGameStore((s) => s.age) // gates the age-tier rungs off the dots
  const name = useGameStore((s) => s.name)

  // The child's band, or the early meadow while their band has no content yet.
  const bandCategories = categoriesForBand(band)
  const growing = bandCategories.length === 0
  const categories = growing ? categoriesForBand('early') : bandCategories

  // Say the "still growing" note aloud once per session — the child can't
  // read it. The generous delay lets the age-pick echo ("ten!") finish first:
  // speak() cancels any in-flight utterance, and this screen mounts right
  // after that echo starts on an older child's first launch.
  useEffect(() => {
    if (!growing || growingNoteSpoken) return
    const id = setTimeout(() => {
      growingNoteSpoken = true
      audio.speak(GROWING_NOTE)
    }, 1800)
    return () => clearTimeout(id)
  }, [growing])

  // Greet the child by name once per session. The delay clears any in-flight
  // speech from the name/age flow this screen can mount right after.
  useEffect(() => {
    if (!name || greetingSpoken) return
    const id = setTimeout(() => {
      greetingSpoken = true
      audio.speak(`Hi ${name}!`)
    }, 1200)
    return () => clearTimeout(id)
  }, [name])

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Sun */}
      <div
        className="absolute z-0 rounded-full"
        style={{
          top: '11%',
          right: '7%',
          width: 'clamp(56px, 14vw, 96px)',
          height: 'clamp(56px, 14vw, 96px)',
          background: 'var(--sun)',
          opacity: 0.9,
          filter: 'blur(0.5px)',
        }}
        aria-hidden="true"
      />

      {/* Hills along the bottom */}
      <svg
        className="absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 78 Q30 68 55 74 Q80 80 100 71 L100 100 L0 100 Z" fill="var(--leaf)" />
        <path d="M0 88 Q35 80 60 86 Q82 91 100 85 L100 100 L0 100 Z" fill="var(--leaf-dp)" />
      </svg>

      {/* Top bar: star counter + mute. */}
      <div className="safe-pt z-20 flex items-center justify-between p-4">
        <div
          className="flex items-center gap-2 rounded-full bg-cream/80 px-4 py-2 shadow-md backdrop-blur"
          role="img"
          aria-label={`${stars} stars`}
        >
          <span style={{ fontSize: 24 }} aria-hidden="true">
            ⭐
          </span>
          <span className="font-bold text-ink" style={{ fontSize: 22 }}>
            {stars}
          </span>
        </div>
        <MuteButton />
      </div>

      <h1
        className="z-10 text-center font-bold text-ink drop-shadow-sm"
        style={{ fontSize: 'clamp(28px, 7vw, 44px)' }}
      >
        Number Meadow
      </h1>
      {name && (
        <p
          className="z-10 text-center font-bold text-ink/70"
          style={{ fontSize: 'clamp(16px, 4.2vw, 22px)' }}
        >
          Hi {name}! 👋
        </p>
      )}

      {/* Category cards. NB: the cards sit in an inner `m-auto` wrapper instead
          of `justify-center` on the scroll container — centered AND fully
          scrollable when they overflow a short viewport. */}
      <main className="z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
        <div className="m-auto flex w-full flex-col items-center gap-3 sm:gap-4">
        {growing && (
          <p
            className="max-w-sm rounded-2xl bg-cream/80 px-4 py-2 text-center text-sm font-bold text-ink/80 shadow-sm"
            role="status"
          >
            🌱 {GROWING_NOTE}
          </p>
        )}
        {categories.map((category, i) => {
          const levels = levelsInCategoryForAge(category.id, age)
          const done = levels.filter((l) => hasCleared(progress, l.id)).length
          const color = CARD_COLORS[i % CARD_COLORS.length]
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                audio.unlock()
                audio.sfx('pop')
                audio.speak(category.name)
                onSelectCategory(category.id)
              }}
              aria-label={`${category.name}, ${done} of ${levels.length} finished`}
              className="flex w-full max-w-sm items-center gap-4 rounded-3xl px-5 py-4 transition-transform active:translate-y-1"
              style={{
                background: color.bg,
                boxShadow: `0 6px 0 ${color.shadow}`,
                border: '4px solid var(--cream)',
                minHeight: 84,
              }}
            >
              <span
                className="grid shrink-0 place-items-center rounded-full bg-cream"
                style={{ width: 58, height: 58, fontSize: 32 }}
                aria-hidden="true"
              >
                {category.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <span
                  className="truncate font-bold drop-shadow-sm"
                  style={{ fontSize: 'clamp(22px, 5.5vw, 28px)', color: color.text }}
                >
                  {category.name}
                </span>
                {/* Progress dots: one per level, filled when cleared. */}
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  {levels.map((l) => {
                    const done2 = hasCleared(progress, l.id)
                    return (
                      <span
                        key={l.id}
                        className="rounded-full"
                        style={{
                          width: 12,
                          height: 12,
                          background: done2 ? 'var(--sun)' : 'var(--cream)',
                          opacity: done2 ? 1 : 0.45,
                        }}
                      />
                    )
                  })}
                </span>
              </span>
              <span aria-hidden="true" style={{ fontSize: 26 }}>
                ➡️
              </span>
            </button>
          )
        })}
        </div>
      </main>

      {/* Twinkle waves from the hill. */}
      <div className="pointer-events-none z-10 flex items-end justify-between px-4">
        <Twinkle mood="happy" size={96} />
        {/* Discreet "grown-ups" corner — small and muted so it doesn't invite a
            child's tap; the destructive reset behind it is gated anyway. */}
        <button
          type="button"
          onClick={onOpenParent}
          aria-label="For grown-ups"
          className="safe-pb pointer-events-auto mb-1 flex items-center gap-1.5 rounded-full bg-cream/60 px-4 text-ink/70 shadow-sm backdrop-blur transition-transform active:scale-90"
          style={{ minHeight: 56 }}
        >
          <span aria-hidden="true" style={{ fontSize: 20 }}>
            ⚙️
          </span>
          <span className="text-sm font-bold">For grown-ups</span>
        </button>
      </div>
    </div>
  )
}
