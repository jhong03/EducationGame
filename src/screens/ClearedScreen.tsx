import { useEffect, useState } from 'react'
import type { Level } from '../engine/types'
import { audio } from '../audio/AudioManager'
import Twinkle from '../components/Twinkle'
import Confetti from '../components/Confetti'
import MuteButton from '../components/MuteButton'

/**
 * Level-cleared screen (spec §5). Confetti, Twinkle cheering, and two choices:
 * the next level or back to the level picker. If it was the category's last
 * level, we celebrate finishing the whole category instead.
 */

interface ClearedScreenProps {
  level: Level
  categoryName: string
  isLast: boolean // no next level in this category
  onBack: () => void
  onNext: () => void
  /** Mastery just proved — the sprint (high-score) door opens right here. */
  onSprint: () => void
}

export default function ClearedScreen({
  level,
  categoryName,
  isLast,
  onBack,
  onNext,
  onSprint,
}: ClearedScreenProps) {
  const [confetti, setConfetti] = useState(0)

  useEffect(() => {
    audio.sfx('win')
    audio.speak(isLast ? `You finished ${categoryName}!` : 'Level complete!', 'praise')
    setConfetti((c) => c + 1)
    // a second burst for extra sparkle
    const id = setTimeout(() => setConfetti((c) => c + 1), 700)
    return () => clearTimeout(id)
  }, [isLast, categoryName])

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2 px-6">
      <Confetti fire={confetti} pieces={40} />

      <div className="absolute right-4 top-4 z-20">
        <MuteButton />
      </div>

      <Twinkle mood="cheer" beat={confetti} size={168} className="anim-rise" />

      <h1
        className="anim-rise text-center font-bold text-ink drop-shadow-sm"
        style={{ fontSize: 'clamp(30px, 8vw, 52px)' }}
      >
        {isLast ? `You finished ${categoryName}!` : 'Level complete!'}
      </h1>

      <p
        className="anim-rise text-center font-semibold text-ink/75"
        style={{ fontSize: 'clamp(18px, 5vw, 26px)' }}
      >
        {isLast
          ? 'Every level done — amazing! 🌟'
          : `Great work on “${level.name}”.`}
      </p>

      <div className="anim-rise flex flex-col items-center gap-3">
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-3xl bg-grape px-10 font-bold text-cream transition-transform active:translate-y-1"
            style={{
              height: 'clamp(64px, 16vw, 80px)',
              fontSize: 'clamp(22px, 6vw, 30px)',
              boxShadow: '0 6px 0 var(--grape-dp)',
            }}
          >
            Next level ➡️
          </button>
        )}
        <button
          type="button"
          onClick={onSprint}
          className="rounded-3xl bg-sun px-10 font-bold text-ink transition-transform active:translate-y-1"
          style={{
            height: 'clamp(60px, 14vw, 72px)',
            fontSize: 'clamp(20px, 5vw, 26px)',
            boxShadow: '0 6px 0 rgba(233,166,59,0.9)',
          }}
        >
          🏆 Sprint!
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-3xl bg-cream px-10 font-bold text-ink transition-transform active:translate-y-1"
          style={{
            height: 'clamp(60px, 14vw, 72px)',
            fontSize: 'clamp(20px, 5vw, 26px)',
            boxShadow: '0 6px 0 rgba(74,58,107,0.15)',
          }}
        >
          {isLast ? '🌈 Back to the meadow' : '🗺️ Pick a level'}
        </button>
      </div>
    </div>
  )
}
