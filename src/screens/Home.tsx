import type { Band } from '../engine/types'
import { useGameStore, hasCleared, starBalance, diamondBalance } from '../engine/store'
import { pickWarmup } from '../engine/warmup'
import { categoriesForBand, levelsInCategoryForAge } from '../content/math'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * Home — pick a skill category. One refined card per category (curriculum
 * strand), each showing its progress. Categories are always open — the mastery
 * gate lives *inside* each one — so a child chooses WHAT to practise, never
 * WHERE on a path they're stuck.
 *
 * Only the child's age band's categories show. A band with no content yet
 * falls back to the early meadow with a gentle "still growing" banner —
 * never an empty dead-end screen.
 *
 * Voiceless by design (2026-07-05): a pre-reader navigates by icon and the
 * pop chime; every word on screen is there for readers and grown-ups.
 */

interface HomeProps {
  band: Band
  onSelectCategory: (categoryId: string) => void
  onSelectLevel: (levelId: string) => void // warm-up chips replay a level
  onOpenParent: () => void
  onOpenGarden: () => void
}

const GROWING_NOTE = 'This part of the meadow is still growing. Play here for now.'

/**
 * Each card draws one refined accent — used only for its icon medallion tint
 * and its progress meter, never as a full candy fill. The ivory card body does
 * the heavy lifting; the accent is a whisper of color. This is the single
 * biggest shift away from the old solid-block cards.
 */
const ACCENTS = [
  'var(--grape)',
  'var(--coral)',
  'var(--leaf)',
  'var(--clay)',
  'var(--sun-dp)',
] as const

export default function Home({
  band,
  onSelectCategory,
  onSelectLevel,
  onOpenParent,
  onOpenGarden,
}: HomeProps) {
  const progress = useGameStore((s) => s.progress)
  const stars = useGameStore((s) => s.stars)
  const starsSpent = useGameStore((s) => s.starsSpent)
  const diamonds = useGameStore((s) => s.diamonds)
  const diamondsSpent = useGameStore((s) => s.diamondsSpent)
  const age = useGameStore((s) => s.age) // gates the age-tier rungs off the meter
  const name = useGameStore((s) => s.name)
  // Kid-facing numbers are the spendable WALLET (earned − spent); the parent
  // dashboard keeps the lifetime-earned totals as the progress metric.
  const starWallet = starBalance({ stars, starsSpent })
  const diamondWallet = diamondBalance({ diamonds, diamondsSpent })

  // The child's band, or the early meadow while their band has no content yet.
  const bandCategories = categoriesForBand(band)
  const growing = bandCategories.length === 0
  const categories = growing ? categoriesForBand('early') : bandCategories

  // Today's warm-up: a daily mix of earned-mastered levels, shakiest first
  // (spaced review v1 — see engine/warmup.ts). Replays ride the adaptive
  // replay ramp, so review is gently harder than the first pass was.
  const warmup = pickWarmup(
    categories.flatMap((c) => levelsInCategoryForAge(c.id, age)),
    progress,
    new Date().toDateString(),
  )

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* A hint of nature, refined: a soft warm light top-right and a misty
          sage horizon at the foot of the screen — atmosphere, not cartoon. */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: '-14%',
          right: '-12%',
          width: '58%',
          height: '46%',
          background:
            'radial-gradient(circle at 60% 40%, rgba(227,169,60,0.28), rgba(227,169,60,0) 68%)',
        }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[36%] w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--leaf)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--leaf)" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <path d="M0 16 Q28 6 52 12 Q78 19 100 9 L100 40 L0 40 Z" fill="url(#horizon)" />
      </svg>

      {/* Top bar: star counter + mute. */}
      <div className="safe-pt z-20 flex items-center justify-between p-4">
        <div
          className="u-glass flex items-center gap-3 rounded-full px-4 py-2"
          role="img"
          aria-label={`${starWallet} stars to spend${
            diamondWallet > 0 ? `, ${diamondWallet} diamonds` : ''
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: 18 }} aria-hidden="true">
              ⭐
            </span>
            <span className="font-text font-bold tabular-nums text-ink" style={{ fontSize: 17 }}>
              {starWallet}
            </span>
          </span>
          {diamondWallet > 0 && (
            <span className="flex items-center gap-1.5">
              <span style={{ fontSize: 16 }} aria-hidden="true">
                💎
              </span>
              <span className="font-text font-bold tabular-nums text-ink" style={{ fontSize: 17 }}>
                {diamondWallet}
              </span>
            </span>
          )}
        </div>
        <MuteButton />
      </div>

      <header className="z-10 px-6 pt-1 text-center">
        <p className="u-eyebrow" style={{ fontSize: 'clamp(10px, 2.6vw, 12px)' }}>
          {name ? `Welcome back, ${name}` : 'A place to grow'}
        </p>
        <h1
          className="font-bold text-ink"
          style={{ fontSize: 'clamp(30px, 7.4vw, 46px)', letterSpacing: '-0.01em', lineHeight: 1.05 }}
        >
          Number Meadow
        </h1>
      </header>

      {/* Category cards. NB: the cards sit in an inner `m-auto` wrapper instead
          of `justify-center` on the scroll container — centered AND fully
          scrollable when they overflow a short viewport. */}
      <main className="z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        <div className="m-auto flex w-full max-w-md flex-col items-stretch gap-3">
          {/* The reward destination — where earned stars & diamonds get spent. */}
          <button
            type="button"
            onClick={() => {
              audio.unlock()
              audio.sfx('pop')
              onOpenGarden()
            }}
            aria-label="My Garden"
            className="group flex w-full items-center gap-4 rounded-3xl px-4 py-3.5 text-left transition-all active:translate-y-px"
            style={{
              minHeight: 82,
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--leaf) 18%, var(--cream)), color-mix(in srgb, var(--sun) 16%, var(--cream)))',
              border: '1px solid var(--line)',
              boxShadow: 'var(--e2)',
            }}
          >
            <span
              className="grid shrink-0 place-items-center rounded-2xl bg-cream"
              style={{ width: 58, height: 58, fontSize: 30, boxShadow: 'var(--e1)' }}
              aria-hidden="true"
            >
              🌻
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className="font-bold text-ink"
                style={{ fontSize: 'clamp(19px, 4.8vw, 23px)', letterSpacing: '-0.01em' }}
              >
                My Garden
              </span>
              <span className="font-text font-semibold text-ink-soft" style={{ fontSize: 13 }}>
                {starWallet > 0 || diamondWallet > 0
                  ? `Spendables ⭐ ${starWallet}${diamondWallet > 0 ? ` · 💎 ${diamondWallet}` : ''}`
                  : 'Earn stars to grow your garden'}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-ink-faint transition-transform group-active:translate-x-0.5"
              style={{ fontSize: 22 }}
            >
              ›
            </span>
          </button>

          {growing && (
            <p
              className="u-card mx-auto max-w-sm px-4 py-2 text-center font-text text-sm font-semibold text-ink-soft"
              role="status"
            >
              🌱 {GROWING_NOTE}
            </p>
          )}

          {warmup.length > 0 && (
            <section
              aria-label="Today's warm-up"
              className="u-card w-full p-3"
            >
              <p
                className="u-eyebrow flex items-center gap-1.5 px-1 pb-2"
                style={{ fontSize: 11 }}
              >
                <span aria-hidden="true">🔄</span> Today’s warm-up
              </p>
              <div className="flex flex-col gap-1.5">
                {warmup.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => {
                      audio.unlock()
                      audio.sfx('pop')
                      onSelectLevel(level.id)
                    }}
                    aria-label={`Warm up: ${level.name}`}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-left transition-transform active:scale-[0.98]"
                    style={{ background: 'var(--tint)' }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                      {level.icon}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate font-text font-semibold text-ink"
                      style={{ fontSize: 14 }}
                    >
                      {level.name}
                    </span>
                    <span aria-hidden="true" className="font-bold text-ink-faint">
                      ↻
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {categories.map((category, i) => {
            const levels = levelsInCategoryForAge(category.id, age)
            const done = levels.filter((l) => hasCleared(progress, l.id)).length
            const accent = ACCENTS[i % ACCENTS.length]
            const complete = done === levels.length && levels.length > 0
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  audio.unlock()
                  audio.sfx('pop')
                  onSelectCategory(category.id)
                }}
                aria-label={`${category.name}, ${done} of ${levels.length} finished`}
                className="u-card group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-all active:translate-y-px"
                style={{ minHeight: 88 }}
              >
                {/* Icon medallion — a soft tint of the card's accent. */}
                <span
                  className="grid shrink-0 place-items-center rounded-2xl"
                  style={{
                    width: 60,
                    height: 60,
                    fontSize: 30,
                    background: `color-mix(in srgb, ${accent} 15%, var(--cream))`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 22%, transparent)`,
                  }}
                  aria-hidden="true"
                >
                  {category.icon}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span
                    className="truncate font-bold text-ink"
                    style={{ fontSize: 'clamp(19px, 4.8vw, 23px)', letterSpacing: '-0.01em' }}
                  >
                    {category.name}
                  </span>

                  {/* Segmented progress meter — one segment per level, filled in
                      the card's accent. Discrete like the old dots, but reads as
                      a considered "quality app" progress bar. */}
                  <span className="flex items-center gap-2" aria-hidden="true">
                    <span className="flex flex-1 items-center gap-1">
                      {levels.map((l) => (
                        <span
                          key={l.id}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            background: hasCleared(progress, l.id) ? accent : 'var(--line-strong)',
                            maxWidth: 22,
                          }}
                        />
                      ))}
                    </span>
                    <span
                      className="shrink-0 font-text font-semibold tabular-nums"
                      style={{ fontSize: 12, color: complete ? accent : 'var(--ink-faint)' }}
                    >
                      {complete ? '✓ Done' : `${done}/${levels.length}`}
                    </span>
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="shrink-0 text-ink-faint transition-transform group-active:translate-x-0.5"
                  style={{ fontSize: 22 }}
                >
                  ›
                </span>
              </button>
            )
          })}
        </div>
      </main>

      {/* Twinkle waves from the corner + a discreet grown-ups entry. */}
      <div className="pointer-events-none z-10 flex items-end justify-between px-4">
        <Twinkle mood="happy" size={76} />
        {/* Discreet "grown-ups" corner — small and muted so it doesn't invite a
            child's tap; the destructive reset behind it is gated anyway. */}
        <button
          type="button"
          onClick={onOpenParent}
          aria-label="For grown-ups"
          className="u-glass safe-pb pointer-events-auto mb-1 flex items-center gap-1.5 rounded-full px-4 font-text text-ink-soft transition-transform active:scale-90"
          style={{ minHeight: 52 }}
        >
          <span aria-hidden="true" style={{ fontSize: 17 }}>
            ⚙️
          </span>
          <span className="text-sm font-semibold">For grown-ups</span>
        </button>
      </div>
    </div>
  )
}
