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
  /** Diamonds this mastery just minted (garden skill currency); 0 = none. */
  earnedDiamonds: number
  isLast: boolean // no next level in this category
  onBack: () => void
  onNext: () => void
  /** Mastery just proved — the sprint (high-score) door opens right here. */
  onSprint: () => void
}

export default function ClearedScreen({
  level,
  categoryName,
  earnedDiamonds,
  isLast,
  onBack,
  onNext,
  onSprint,
}: ClearedScreenProps) {
  const [confetti, setConfetti] = useState(0)

  useEffect(() => {
    // Praise is words + chime now (user direction): the screen's big title
    // says it, the win arpeggio celebrates it — no voice on top.
    audio.sfx('win')
    setConfetti((c) => c + 1)
    // a second burst for extra sparkle
    const id = setTimeout(() => setConfetti((c) => c + 1), 700)
    return () => clearTimeout(id)
  }, [isLast, categoryName])

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2 px-6">
      <Confetti fire={confetti} pieces={40} />

      {/* Warm celebratory light. */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: '-12%',
          width: '80%',
          height: '52%',
          background:
            'radial-gradient(circle at 50% 40%, rgba(227,169,60,0.3), rgba(227,169,60,0) 68%)',
        }}
        aria-hidden="true"
      />

      <div className="absolute right-4 top-4 z-20">
        <MuteButton />
      </div>

      <Twinkle mood="cheer" beat={confetti} size={132} className="anim-rise" />

      <header className="z-10 flex flex-col items-center gap-1.5 text-center">
        <p className="u-eyebrow anim-rise" style={{ fontSize: 12 }}>
          {isLast ? 'Category complete' : 'Level complete'}
        </p>
        <h1
          className="anim-rise font-bold text-ink"
          style={{ fontSize: 'clamp(30px, 8vw, 50px)', letterSpacing: '-0.015em', lineHeight: 1.05 }}
        >
          {isLast ? `You finished ${categoryName}!` : 'Beautifully done!'}
        </h1>
        <p
          className="anim-rise font-text font-medium text-ink-soft"
          style={{ fontSize: 'clamp(16px, 4.4vw, 21px)' }}
        >
          {isLast ? 'Every level mastered — amazing. 🌟' : `Great work on “${level.name}”.`}
        </p>
      </header>

      {earnedDiamonds > 0 && (
        <p
          role="status"
          className="anim-rise z-10 flex items-center gap-2 rounded-full px-5 py-1.5 font-bold text-ink"
          style={{
            fontSize: 'clamp(15px, 4.2vw, 19px)',
            background: 'color-mix(in srgb, #57b0d4 20%, var(--cream))',
            border: '1px solid color-mix(in srgb, #57b0d4 40%, transparent)',
            boxShadow: 'var(--e2)',
          }}
        >
          <span aria-hidden="true">💎</span>
          +{earnedDiamonds} diamond{earnedDiamonds === 1 ? '' : 's'} for your garden!
        </p>
      )}

      <div className="anim-rise z-10 flex w-full max-w-xs flex-col items-stretch gap-3">
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center justify-center gap-2 rounded-2xl px-8 font-bold text-cream transition-all active:translate-y-0.5"
            style={{
              height: 'clamp(60px, 15vw, 74px)',
              fontSize: 'clamp(20px, 5.4vw, 26px)',
              background: 'var(--grape-grad)',
              boxShadow:
                '0 6px 16px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 0 var(--grape-dp)',
            }}
          >
            Next level
          </button>
        )}
        <button
          type="button"
          onClick={onSprint}
          className="flex items-center justify-center gap-2 rounded-2xl px-8 font-bold text-ink transition-all active:translate-y-0.5"
          style={{
            height: 'clamp(56px, 13vw, 68px)',
            fontSize: 'clamp(18px, 5vw, 24px)',
            background: 'var(--sun-grad)',
            boxShadow:
              '0 6px 16px rgba(197,137,31,0.28), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 0 var(--sun-dp)',
          }}
        >
          <span aria-hidden="true">🏆</span> Sprint
        </button>
        <button
          type="button"
          onClick={onBack}
          className="u-card flex items-center justify-center px-8 font-bold text-ink-soft transition-all active:translate-y-px"
          style={{ height: 'clamp(56px, 13vw, 68px)', fontSize: 'clamp(17px, 4.6vw, 22px)' }}
        >
          {isLast ? 'Back to the meadow' : 'Pick a level'}
        </button>
      </div>
    </div>
  )
}
