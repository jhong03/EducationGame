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
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-1 to-sky-2 px-6">
      <div className="safe-pt absolute right-4 top-4 z-10">
        <MuteButton />
      </div>

      <Twinkle mood="happy" beat={0} size={116} />
      <h1
        className="text-center font-bold text-ink"
        style={{ fontSize: 'clamp(26px, 7vw, 40px)' }}
      >
        {PROMPT}
      </h1>
      <p className="max-w-sm text-center text-sm font-semibold text-ink/60">
        A grown-up can type it — or skip and add it later in the settings.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (trimmed) onDone(trimmed)
        }}
        className="flex w-full max-w-sm flex-col items-center gap-4"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          autoComplete="off"
          autoCapitalize="words"
          aria-label="Your name"
          placeholder="Your name"
          className="w-full rounded-3xl bg-cream px-5 text-center font-bold text-ink shadow-md outline-none"
          style={{ height: 72, fontSize: 26 }}
        />
        <button
          type="submit"
          disabled={!trimmed}
          aria-label="Done, that's my name"
          className="flex items-center gap-2 rounded-3xl bg-grape px-8 font-bold text-cream shadow-md transition-transform active:translate-y-1"
          style={{
            height: 68,
            fontSize: 22,
            boxShadow: '0 6px 0 var(--grape-dp)',
            opacity: trimmed ? 1 : 0.55,
          }}
        >
          <span aria-hidden="true">✔️</span>
          Done
        </button>
      </form>

      <button
        type="button"
        onClick={() => onDone(null)}
        aria-label="Skip name"
        className="rounded-full bg-cream/60 px-4 py-2 text-sm font-bold text-ink/60 shadow-sm backdrop-blur transition-transform active:scale-95"
      >
        Skip
      </button>
    </div>
  )
}
