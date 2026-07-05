import { useState } from 'react'
import Twinkle from '../components/Twinkle'
import MuteButton from '../components/MuteButton'

/**
 * NameScreen — "What's your name?", right after the age gate. Purely
 * cosmetic and always skippable: a grown-up types it (or a reading child),
 * a pre-reader skips and adds it later in the For-grown-ups panel. The name
 * greets on the meadow and rides the status chip during play.
 */

interface NameScreenProps {
  onDone: (name: string | null) => void
}

const PROMPT = "What's your name?"

export default function NameScreen({ onDone }: NameScreenProps) {
  const [value, setValue] = useState('')

  const trimmed = value.trim()

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2 px-6">
      {/* Soft warm light overhead. */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: '-18%',
          width: '70%',
          height: '46%',
          background:
            'radial-gradient(circle at 50% 45%, rgba(227,169,60,0.22), rgba(227,169,60,0) 70%)',
        }}
        aria-hidden="true"
      />
      <div className="safe-pt absolute right-4 top-4 z-10">
        <MuteButton />
      </div>

      <Twinkle mood="happy" beat={0} size={96} />
      <header className="z-10 text-center">
        <p className="u-eyebrow" style={{ fontSize: 12 }}>
          Nice to meet you
        </p>
        <h1
          className="font-bold text-ink"
          style={{ fontSize: 'clamp(26px, 7vw, 40px)', letterSpacing: '-0.01em' }}
        >
          {PROMPT}
        </h1>
      </header>
      <p className="z-10 max-w-sm text-center font-text text-sm font-medium text-ink-soft">
        A grown-up can type it — or skip and add it later in the settings.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (trimmed) onDone(trimmed)
        }}
        className="z-10 flex w-full max-w-sm flex-col items-center gap-4"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          autoComplete="off"
          autoCapitalize="words"
          aria-label="Your name"
          placeholder="Your name"
          className="w-full rounded-2xl bg-cream px-5 text-center font-bold text-ink outline-none"
          style={{
            height: 68,
            fontSize: 24,
            border: '1px solid var(--line)',
            boxShadow: 'var(--e2)',
          }}
        />
        <button
          type="submit"
          disabled={!trimmed}
          aria-label="Done, that's my name"
          className="flex items-center gap-2 rounded-2xl px-8 font-bold text-cream transition-all active:translate-y-0.5"
          style={{
            height: 64,
            fontSize: 21,
            background: 'var(--grape-grad)',
            boxShadow:
              '0 6px 16px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 0 var(--grape-dp)',
            opacity: trimmed ? 1 : 0.5,
          }}
        >
          Done
        </button>
      </form>

      <button
        type="button"
        onClick={() => onDone(null)}
        aria-label="Skip name"
        className="u-glass z-10 rounded-full px-5 py-2 font-text text-sm font-semibold text-ink-soft transition-transform active:scale-95"
      >
        Skip for now
      </button>
    </div>
  )
}
