import { useEffect } from 'react'
import { AGES } from '../engine/band'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * AgeScreen — the one-time first-launch gate: "How old are you?". Audio-first:
 * the question is spoken, the answers are big numerals a pre-reader can
 * recognise, and tapping one speaks it back and enters the meadow. A grown-up
 * can change the age later in the For-grown-ups panel, so a mis-tap is never
 * fatal — one tap, no confirm step, no reading.
 */

interface AgeScreenProps {
  onPick: (age: number) => void
}

const PROMPT = 'How old are you?'

export default function AgeScreen({ onPick }: AgeScreenProps) {
  // Try to speak the prompt on mount — but on a FRESH install this screen
  // renders before any user gesture, and browsers (Chrome 71+, iOS Safari)
  // silently drop speech without user activation. So this attempt is
  // best-effort only; the guaranteed path is the background-tap handler
  // below, which runs inside a gesture and therefore always may speak.
  useEffect(() => {
    const id = setTimeout(() => audio.speak(PROMPT), 400)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      className="relative flex h-full w-full flex-col items-center overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2"
      // Any poke that isn't a button re-asks the question out loud. For a
      // pre-reader on first launch this is the recovery from the dropped
      // mount-time prompt: their first curious tap grants audio activation
      // AND asks the question.
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        audio.unlock()
        audio.speak(PROMPT)
      }}
    >
      {/* Hills along the bottom */}
      <svg
        className="absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 80 Q30 70 55 76 Q80 82 100 73 L100 100 L0 100 Z" fill="var(--leaf)" />
        <path d="M0 90 Q35 82 60 88 Q82 93 100 87 L100 100 L0 100 Z" fill="var(--leaf-dp)" />
      </svg>

      <div className="safe-pt z-20 flex w-full items-center justify-end p-4">
        <MuteButton />
      </div>

      <main className="z-10 flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-6 pb-6">
        <div className="m-auto flex w-full max-w-sm flex-col items-center gap-4">
          <Twinkle mood="happy" size={104} />

          <h1
            className="text-center font-bold text-ink drop-shadow-sm"
            style={{ fontSize: 'clamp(26px, 7vw, 40px)' }}
          >
            How old are you?
          </h1>

          <button
            type="button"
            onClick={() => {
              audio.unlock()
              audio.speak(PROMPT)
            }}
            aria-label="Hear the question again"
            className="grid place-items-center rounded-full bg-cream/85 shadow-md transition-transform active:scale-90"
            style={{ width: 64, height: 64, fontSize: 26 }}
          >
            <span aria-hidden="true">🔊</span>
          </button>

          {/* One big numeral per age, 3×3 — numerals need no reading. */}
          <div className="grid w-full grid-cols-3 gap-3">
            {AGES.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => {
                  audio.unlock()
                  audio.sfx('pop')
                  audio.sayNumber(age)
                  onPick(age)
                }}
                aria-label={`${age} years old`}
                className="grid place-items-center rounded-3xl font-bold text-cream transition-transform active:translate-y-1"
                style={{
                  height: 'clamp(72px, 18vw, 92px)',
                  fontSize: 'clamp(30px, 8vw, 42px)',
                  background: 'var(--grape)',
                  boxShadow: '0 6px 0 var(--grape-dp)',
                  border: '4px solid var(--cream)',
                }}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
