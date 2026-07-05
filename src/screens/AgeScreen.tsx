import { AGES } from '../engine/band'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * AgeScreen — the one-time first-launch gate: "How old are you?". The
 * question is printed big, the answers are big numerals a pre-reader can
 * recognise, and tapping one enters the meadow. A grown-up can change the age
 * later in the For-grown-ups panel, so a mis-tap is never fatal — one tap, no
 * confirm step.
 */

interface AgeScreenProps {
  onPick: (age: number) => void
}

export default function AgeScreen({ onPick }: AgeScreenProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* A hint of nature, refined: soft warm light + a misty sage horizon. */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: '-16%',
          left: '-10%',
          width: '60%',
          height: '46%',
          background:
            'radial-gradient(circle at 50% 45%, rgba(227,169,60,0.26), rgba(227,169,60,0) 68%)',
        }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[34%] w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="horizon-age" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--leaf)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--leaf)" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <path d="M0 18 Q30 8 54 14 Q80 21 100 11 L100 40 L0 40 Z" fill="url(#horizon-age)" />
      </svg>

      <div className="safe-pt z-20 flex w-full items-center justify-end p-4">
        <MuteButton />
      </div>

      <main className="z-10 flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-6 pb-6">
        <div className="m-auto flex w-full max-w-sm flex-col items-center gap-5">
          <Twinkle mood="happy" size={88} />

          <header className="text-center">
            <p className="u-eyebrow" style={{ fontSize: 12 }}>
              Let’s begin
            </p>
            <h1
              className="font-bold text-ink"
              style={{ fontSize: 'clamp(28px, 7.4vw, 42px)', letterSpacing: '-0.01em' }}
            >
              How old are you?
            </h1>
          </header>

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
                className="grid place-items-center rounded-3xl font-bold text-cream transition-all active:translate-y-0.5"
                style={{
                  height: 'clamp(72px, 18vw, 92px)',
                  fontSize: 'clamp(30px, 8vw, 42px)',
                  background: 'var(--grape-grad)',
                  boxShadow:
                    '0 6px 16px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 0 var(--grape-dp)',
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
