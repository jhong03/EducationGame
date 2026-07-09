import { useState } from 'react'
import type { Lesson } from '../content/lessons'
import { audio } from '../audio/AudioManager'
import LessonVisual from '../components/LessonVisual'
import MuteButton from '../components/MuteButton'
import ProgressDots from '../components/ProgressDots'
import Twinkle from '../components/Twinkle'

/**
 * LessonScreen — a short illustrated "class" that teaches what a topic IS before
 * the child practises it. Steps through a lesson's printed explanations (each
 * with a simple figure), then hands off to practice with "Let's try it!".
 *
 * Voiceless by design: everything is on screen for a reading child or a grown-up
 * to read aloud. No answers here — it's teaching, not testing.
 */

interface LessonScreenProps {
  lesson: Lesson
  icon: string // the category's icon, for the cover
  onDone: () => void // finished → go practise
  onBack: () => void // leave early
}

export default function LessonScreen({ lesson, icon, onDone, onBack }: LessonScreenProps) {
  const [step, setStep] = useState(0)
  const total = lesson.steps.length
  const current = lesson.steps[step]
  const last = step === total - 1

  function next() {
    audio.unlock()
    audio.sfx('pop')
    if (last) onDone()
    else setStep((s) => s + 1)
  }

  function back() {
    audio.sfx('soft')
    if (step === 0) onBack()
    else setStep((s) => s - 1)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Header */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the levels"
          className="u-glass flex shrink-0 items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
            ‹
          </span>
          <span className="hidden font-text font-semibold text-ink-soft sm:inline">Levels</span>
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid shrink-0 place-items-center rounded-xl"
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              fontSize: 22,
              background: 'color-mix(in srgb, var(--grape) 14%, var(--cream))',
            }}
          >
            {icon}
          </span>
          <h1
            className="truncate font-bold text-ink"
            style={{ fontSize: 'clamp(18px, 4.8vw, 24px)', letterSpacing: '-0.01em' }}
          >
            {lesson.title}
          </h1>
        </div>
        <MuteButton />
      </header>

      {/* Body */}
      <main className="z-10 flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pb-4">
        <div className="m-auto flex w-full max-w-md flex-col items-center gap-4">
          <p className="u-eyebrow" style={{ fontSize: 11 }}>
            Class · Step {step + 1} of {total}
          </p>

          {current.visual && (
            <div className="u-card grid w-full place-items-center px-4 py-6">
              <LessonVisual v={current.visual} />
            </div>
          )}

          <p
            className="text-center font-semibold text-ink"
            style={{ fontSize: 'clamp(18px, 5vw, 24px)', lineHeight: 1.4 }}
          >
            {current.text}
          </p>

          {current.example && (
            <p
              className="rounded-full px-5 py-2 text-center font-bold text-ink"
              style={{
                fontSize: 'clamp(17px, 4.6vw, 22px)',
                background: 'color-mix(in srgb, var(--sun) 22%, var(--cream))',
                border: '1px solid color-mix(in srgb, var(--sun) 40%, transparent)',
              }}
            >
              {current.example}
            </p>
          )}
        </div>
      </main>

      {/* Footer: progress + navigation */}
      <div className="safe-pb z-20 flex flex-col items-center gap-3 border-t border-[color:var(--line)] bg-sky-1/85 px-5 pt-3 backdrop-blur-lg">
        <ProgressDots total={total} filled={step + 1} />
        <div className="flex w-full max-w-md items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            className="u-card flex items-center gap-1.5 px-5 font-semibold text-ink-soft transition-transform active:scale-95"
            style={{ height: 56 }}
          >
            <span aria-hidden="true">‹</span>
            {step === 0 ? 'Exit' : 'Back'}
          </button>

          {/* Twinkle cheers the class on from the middle. */}
          <div className="pointer-events-none hidden sm:block">
            <Twinkle mood="happy" size={56} />
          </div>

          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-2xl px-6 font-bold text-cream transition-all active:translate-y-0.5"
            style={{
              height: 56,
              background: last ? 'var(--leaf-grad)' : 'var(--grape-grad)',
              boxShadow: `0 5px 14px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -3px 0 ${
                last ? 'var(--leaf-dp)' : 'var(--grape-dp)'
              }`,
            }}
          >
            {last ? "Let's try it! ✏️" : 'Next ›'}
          </button>
        </div>
      </div>
    </div>
  )
}
