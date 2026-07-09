import { useState } from 'react'
import type { Category } from '../engine/types'
import {
  useGameStore,
  hasCleared,
  isLevelUnlocked,
  categorySprintScore,
} from '../engine/store'
import { levelsInCategoryForAge } from '../content/math'
import { hasLesson } from '../content/lessons'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * CategoryScreen — the levels of one category as a grid of refined tiles
 * (deliberately NOT a winding path). Three states, each visually distinct:
 * locked (muted stone, dashed, a padlock), open (ivory card, a breathing gold
 * ring inviting a tap), cleared (ivory card with a sage medallion + gold star).
 * Locked tiles stay focusable and answer a tap with a soft boop and a padlock
 * shake — "not yet" without a voice, never dead silence.
 */

interface CategoryScreenProps {
  category: Category
  onSelectLevel: (levelId: string) => void
  onSelectSprint: (levelId: string) => void
  onLearn: () => void
  onBack: () => void
}

export default function CategoryScreen({
  category,
  onSelectLevel,
  onSelectSprint,
  onLearn,
  onBack,
}: CategoryScreenProps) {
  const progress = useGameStore((s) => s.progress)
  const bestScores = useGameStore((s) => s.bestScores)
  const age = useGameStore((s) => s.age)
  // Only this child's tier of the ladder — age-gated rungs aren't teased.
  const levels = levelsInCategoryForAge(category.id, age)
  const trophyTotal = categorySprintScore(levels, bestScores)
  // A tap on a locked tile shakes its padlock (visual "not yet") — the
  // token re-triggers the animation on repeat taps without remounting the
  // button (keyboard focus stays put).
  const [shake, setShake] = useState<{ id: string; token: number } | null>(null)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Top bar: back · category name · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the meadow"
          className="u-glass flex items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
            ‹
          </span>
          <span className="hidden font-text font-semibold text-ink-soft sm:inline">
            Meadow
          </span>
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid shrink-0 place-items-center rounded-xl"
            aria-hidden="true"
            style={{
              width: 42,
              height: 42,
              fontSize: 22,
              background: 'color-mix(in srgb, var(--grape) 14%, var(--cream))',
            }}
          >
            {category.icon}
          </span>
          <h1
            className="truncate font-bold text-ink"
            style={{ fontSize: 'clamp(20px, 5.4vw, 28px)', letterSpacing: '-0.01em' }}
          >
            {category.name}
          </h1>
          {trophyTotal > 0 && (
            <span
              className="u-glass flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-text font-bold text-ink"
              role="img"
              aria-label={`category high score ${trophyTotal}`}
              style={{ fontSize: 14 }}
            >
              <span aria-hidden="true">🏆</span>
              {trophyTotal}
            </span>
          )}
        </div>

        <MuteButton />
      </header>

      {/* Level tiles */}
      <main className="safe-pb z-10 flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-4">
        {/* "What is this?" class — for the harder / real-world strands. */}
        {hasLesson(category.id) && (
          <button
            type="button"
            onClick={() => {
              audio.unlock()
              audio.sfx('pop')
              onLearn()
            }}
            aria-label={`Learn what ${category.name} is`}
            className="flex w-full max-w-md items-center gap-3 rounded-3xl px-4 py-3 text-left transition-all active:translate-y-px"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--grape) 16%, var(--cream)), color-mix(in srgb, var(--sun) 14%, var(--cream)))',
              border: '1px solid var(--line)',
              boxShadow: 'var(--e2)',
            }}
          >
            <span
              className="grid shrink-0 place-items-center rounded-2xl bg-cream"
              style={{ width: 48, height: 48, fontSize: 24, boxShadow: 'var(--e1)' }}
              aria-hidden="true"
            >
              📖
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className="font-bold text-ink"
                style={{ fontSize: 'clamp(16px, 4.4vw, 19px)' }}
              >
                {levels.some((l) => hasCleared(progress, l.id))
                  ? 'What is this?'
                  : 'New here? Learn it first'}
              </span>
              <span className="font-text font-semibold text-ink-soft" style={{ fontSize: 13 }}>
                A quick class on {category.name}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-faint" style={{ fontSize: 22 }}>
              ›
            </span>
          </button>
        )}

        <div className="grid w-full max-w-md grid-cols-2 justify-items-center gap-3.5">
          {levels.map((level) => {
            const unlocked = isLevelUnlocked(level, levels, progress)
            const cleared = hasCleared(progress, level.id)
            const glow = unlocked && !cleared
            const accent = cleared ? 'var(--leaf)' : 'var(--grape)'
            return (
              <div key={level.id} className="flex w-full flex-col items-stretch gap-2">
                <button
                  type="button"
                  aria-disabled={!unlocked}
                  onClick={() => {
                    audio.unlock()
                    if (!unlocked) {
                      // Focusable + responsive even when locked: the soft boop
                      // and a padlock shake say "not yet" without a voice.
                      audio.sfx('soft')
                      setShake((s) => ({ id: level.id, token: (s?.token ?? 0) + 1 }))
                      return
                    }
                    audio.sfx('pop')
                    onSelectLevel(level.id)
                  }}
                  aria-label={unlocked ? level.name : `${level.name}, locked`}
                  className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-3xl p-3 transition-all ${
                    unlocked ? 'u-card active:translate-y-px' : 'cursor-not-allowed'
                  } ${glow ? 'anim-glow' : ''}`}
                  style={{
                    minHeight: 'clamp(112px, 30vw, 142px)',
                    ...(unlocked
                      ? {}
                      : {
                          background: 'var(--cream-2)',
                          border: '1.5px dashed var(--line-strong)',
                        }),
                  }}
                >
                  {/* Icon medallion — accent tint (sage when mastered, amethyst
                      when open); muted stone when still locked. */}
                  <span
                    key={shake?.id === level.id ? shake.token : 'base'}
                    aria-hidden="true"
                    className={`grid place-items-center rounded-2xl ${
                      shake?.id === level.id ? 'anim-shake' : ''
                    }`}
                    style={{
                      width: 'clamp(52px, 14vw, 64px)',
                      height: 'clamp(52px, 14vw, 64px)',
                      fontSize: 'clamp(28px, 7.5vw, 38px)',
                      lineHeight: 1,
                      opacity: unlocked ? 1 : 0.55,
                      background: unlocked
                        ? `color-mix(in srgb, ${accent} 15%, var(--cream))`
                        : 'transparent',
                    }}
                  >
                    {unlocked ? level.icon : '🔒'}
                  </span>
                  <span
                    className="text-center font-text font-semibold"
                    style={{
                      fontSize: 'clamp(13px, 3.5vw, 15px)',
                      color: unlocked ? 'var(--ink)' : 'var(--ink-faint)',
                    }}
                  >
                    {level.name}
                  </span>
                  {cleared && (
                    <span
                      className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full bg-sun text-ink"
                      style={{ fontSize: 15, boxShadow: 'var(--e2)' }}
                      aria-hidden="true"
                    >
                      ⭐
                    </span>
                  )}
                </button>

                {/* Mastery opens the sprint door: the 🏆 chip replays this
                    level as a timed high-score round. */}
                {cleared && (
                  <button
                    type="button"
                    onClick={() => {
                      audio.unlock()
                      audio.sfx('pop')
                      onSelectSprint(level.id)
                    }}
                    aria-label={`Sprint ${level.name}`}
                    className="flex items-center justify-center gap-1.5 rounded-full font-text font-bold text-sun-dp transition-transform active:translate-y-px"
                    style={{
                      height: 46,
                      background: 'color-mix(in srgb, var(--sun) 16%, var(--cream))',
                      border: '1px solid color-mix(in srgb, var(--sun) 40%, transparent)',
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 17 }}>
                      🏆
                    </span>
                    <span style={{ fontSize: 15 }}>{bestScores[level.id] ?? 0}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Twinkle keeps the child company (hidden on very short viewports so
          she never sits on top of a tile — see .corner-buddy in index.css). */}
      <div className="corner-buddy pointer-events-none absolute bottom-2 left-3 z-10">
        <Twinkle mood="happy" size={72} />
      </div>
    </div>
  )
}
