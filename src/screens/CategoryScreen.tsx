import type { Category } from '../engine/types'
import {
  useGameStore,
  hasCleared,
  isLevelUnlocked,
  categorySprintScore,
} from '../engine/store'
import { levelsInCategoryForAge } from '../content/math'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * CategoryScreen — the levels of one category as a grid of big chunky tiles
 * (deliberately NOT a winding path). Tile states mirror the old trail nodes:
 * locked (grey 🔒), open (its icon, glowing to invite a tap), cleared (star
 * badge). Tapping an open tile starts it (PlayScreen speaks the prompt right
 * away — that is the audio affordance). Locked tiles stay focusable and answer
 * a tap with a gentle spoken "not yet", so a pre-reader is never met with
 * silence.
 */

interface CategoryScreenProps {
  category: Category
  onSelectLevel: (levelId: string) => void
  onSelectSprint: (levelId: string) => void
  onBack: () => void
}

export default function CategoryScreen({
  category,
  onSelectLevel,
  onSelectSprint,
  onBack,
}: CategoryScreenProps) {
  const progress = useGameStore((s) => s.progress)
  const bestScores = useGameStore((s) => s.bestScores)
  const age = useGameStore((s) => s.age)
  // Only this child's tier of the ladder — age-gated rungs aren't teased.
  const levels = levelsInCategoryForAge(category.id, age)
  const trophyTotal = categorySprintScore(levels, bestScores)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Top bar: back · category name · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the meadow"
          className="flex items-center gap-1 rounded-full bg-cream/85 px-4 shadow-md backdrop-blur transition-transform active:scale-90"
          style={{ height: 64 }}
        >
          <span aria-hidden="true" style={{ fontSize: 24 }}>
            ⬅️
          </span>
          <span className="hidden font-bold text-ink sm:inline">Meadow</span>
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" style={{ fontSize: 28 }}>
            {category.icon}
          </span>
          <h1
            className="truncate font-bold text-ink"
            style={{ fontSize: 'clamp(22px, 6vw, 32px)' }}
          >
            {category.name}
          </h1>
          {trophyTotal > 0 && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full bg-cream/85 px-3 py-1 font-bold text-ink shadow-sm"
              role="img"
              aria-label={`category high score ${trophyTotal}`}
              style={{ fontSize: 16 }}
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
        <div className="grid w-full max-w-sm grid-cols-2 justify-items-center gap-4">
          {levels.map((level) => {
            const unlocked = isLevelUnlocked(level, levels, progress)
            const cleared = hasCleared(progress, level.id)
            const glow = unlocked && !cleared
            return (
              <div key={level.id} className="flex w-full flex-col items-stretch gap-2">
              <button
                type="button"
                aria-disabled={!unlocked}
                onClick={() => {
                  audio.unlock()
                  if (!unlocked) {
                    // Focusable + audible even when locked: a pre-reader taps
                    // and hears WHY nothing opens, instead of dead silence.
                    audio.sfx('soft')
                    audio.speak('Not yet! Finish the level before it.', 'soft')
                    return
                  }
                  audio.sfx('pop')
                  // (No name speech here — PlayScreen speaks the real prompt
                  // ~250ms after mount, which would cancel it mid-word.)
                  onSelectLevel(level.id)
                }}
                aria-label={unlocked ? level.name : `${level.name}, locked`}
                className={`relative flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl p-3 transition-transform ${
                  unlocked ? 'active:scale-95' : 'cursor-not-allowed'
                } ${glow ? 'anim-glow' : ''}`}
                style={{
                  minHeight: 'clamp(110px, 30vw, 140px)',
                  background: unlocked ? 'var(--grape)' : 'var(--locked)',
                  boxShadow: glow
                    ? undefined
                    : `0 6px 0 ${unlocked ? 'var(--grape-dp)' : 'var(--locked-dp)'}`,
                  border: '4px solid var(--cream)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 'clamp(34px, 9vw, 46px)', lineHeight: 1 }}>
                  {unlocked ? level.icon : '🔒'}
                </span>
                {/* Ink-on-cream pill: readable on grape AND locked-grey tiles
                    (cream text was 1.6:1 on grey — invisible). */}
                <span
                  className="rounded-full bg-cream px-2.5 py-0.5 font-bold text-ink"
                  style={{ fontSize: 'clamp(13px, 3.6vw, 16px)' }}
                >
                  {level.name}
                </span>
                {cleared && (
                  <span
                    className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-sun text-ink shadow"
                    style={{ fontSize: 16 }}
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
                  className="flex items-center justify-center gap-1.5 rounded-full bg-sun font-bold text-ink shadow-sm transition-transform active:translate-y-0.5"
                  style={{ height: 56, boxShadow: '0 4px 0 rgba(233,166,59,0.9)' }}
                >
                  <span aria-hidden="true" style={{ fontSize: 20 }}>
                    🏆
                  </span>
                  <span style={{ fontSize: 17 }}>{bestScores[level.id] ?? 0}</span>
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
        <Twinkle mood="happy" size={88} />
      </div>
    </div>
  )
}
