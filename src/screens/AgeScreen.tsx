import { AGES } from '../engine/band'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * AgeScreen — the one-time first-launch gate: "How old are you?". The
 * question is printed big, the answers are big numerals a pre-reader can
 * recognise, and tapping one pops and enters the meadow. A grown-up can
 * change the age later in the For-grown-ups panel, so a mis-tap is never
 * fatal — one tap, no confirm step.
 */

interface AgeScreenProps {
  onPick: (age: number) => void
}

export default function AgeScreen({ onPick }: AgeScreenProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
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

          {/* One big numeral per age, 3×3 — numerals need no reading. */}
          <div className="grid w-full grid-cols-3 gap-3">
            {AGES.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => {
                  audio.unlock()
                  audio.sfx('pop')
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
