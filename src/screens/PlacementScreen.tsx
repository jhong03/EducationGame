import { useEffect, useRef, useState } from 'react'
import type { Answer, Question } from '../engine/types'
import { generateQuestion } from '../engine/generators'
import { isCorrect } from '../engine/masteryGate'
import { useGameStore } from '../engine/store'
import { placementPlanFor, probeLevel } from '../content/placement'
import { audio } from '../audio/AudioManager'
import Twinkle, { type TwinkleMood } from '../components/Twinkle'
import ProgressDots from '../components/ProgressDots'
import MuteButton from '../components/MuteButton'
import { ActivityStage } from './PlayScreen'

/**
 * PlacementScreen — "Show me what you can do!" (the calibration seam).
 * Runs once, straight after the age gate, for ages with a plan (early 5–6,
 * upper 11–12). One question per checkpoint: a correct answer places the
 * child past rungs they clearly know (cleared+placed, no stars); the FIRST
 * miss ends the check warmly and they simply start there. Nothing here can
 * be lost — it only ever moves the start forward, and skipping is always
 * fine. Probes render through the shared ActivityStage, so ANY activity can
 * be a checkpoint and it looks exactly like real play.
 *
 * Speech works here without caveats: this screen always mounts from the age
 * tap, so user activation is already granted.
 */

interface PlacementScreenProps {
  age: number
  onDone: () => void
}

const INTRO = 'Show me what you can do!'

export default function PlacementScreen({ age, onDone }: PlacementScreenProps) {
  const placeLevels = useGameStore((s) => s.placeLevels)
  const plan = placementPlanFor(age)

  const [step, setStep] = useState(0)
  const [passed, setPassed] = useState(0)
  const [phase, setPhase] = useState<'answering' | 'transition'>('answering')
  const [mood, setMood] = useState<TwinkleMood>('happy')
  const [beat, setBeat] = useState(0)
  const [question, setQuestion] = useState<Question | null>(() => {
    const level = plan.length ? probeLevel(plan[0]) : undefined
    return level ? generateQuestion(level) : null
  })

  // Tap-to-count bookkeeping, same shape as PlayScreen.
  const countedRef = useRef<Record<string, number>>({})
  const [counted, setCounted] = useState<Record<string, number>>({})
  // The warm sign-off ("Wow! Off you go!") shows as TEXT while we linger.
  const [closing, setClosing] = useState<string | null>(null)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Defensive: no plan (or a probe id that no longer resolves) → straight in.
  useEffect(() => {
    if (!question) onDone()
  }, [question, onDone])

  if (!question) return null

  function tapObject(key: string) {
    if (countedRef.current[key] !== undefined) return // already counted
    const n = Object.keys(countedRef.current).length + 1
    countedRef.current = { ...countedRef.current, [key]: n }
    setCounted(countedRef.current)
    audio.sfx('pop') // the ordinal badge on the object shows the number
  }

  function finish(message: string) {
    setClosing(message) // shown in the prompt slot while we linger
    later(onDone, 1100)
  }

  function answer(given: Answer) {
    if (phase !== 'answering' || !question) return
    setPhase('transition')

    if (isCorrect(question, given)) {
      audio.sfx('good')
      setMood('cheer')
      setBeat((b) => b + 1)
      placeLevels(plan[step].places)
      setPassed((p) => p + 1)

      const nextStep = step + 1
      if (nextStep < plan.length) {
        // Praise is chime-only here too; Twinkle's cheer carries the moment.
        later(() => {
          const level = probeLevel(plan[nextStep])
          if (!level) {
            onDone()
            return
          }
          countedRef.current = {}
          setCounted({})
          setStep(nextStep)
          setMood('happy')
          setQuestion(generateQuestion(level))
          setPhase('answering')
        }, 900)
      } else {
        finish('Wow! Off you go!')
      }
    } else {
      // A miss is only information — start here, cheerfully.
      audio.sfx('soft')
      setMood('happy')
      setBeat((b) => b + 1)
      finish("That's okay! We'll start here.")
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Top bar: progress through the checkpoints + mute. */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <ProgressDots total={plan.length} filled={passed} />
        <MuteButton />
      </header>

      <main className="safe-pb flex min-h-0 flex-1 flex-col items-center justify-between gap-2 overflow-y-auto px-4">
        <div className="flex flex-col items-center">
          <Twinkle mood={mood} beat={beat} size={92} />
          <p
            className="mt-2 max-w-md text-center font-semibold text-ink"
            style={{ fontSize: 'clamp(17px, 4.5vw, 24px)', lineHeight: 1.3 }}
          >
            {closing ?? `${step === 0 ? `${INTRO} ` : ''}${question.prompt}`}
          </p>
        </div>

        {/* The probe question, in the game's own visual language — the same
            stage every activity uses in real play. Misses end the check, so
            wrong-shake props stay inert. */}
        <ActivityStage
          question={question}
          disabled={phase !== 'answering'}
          wrong={null}
          shakeToken={0}
          highlightCorrect={false}
          counted={counted}
          onTapObject={tapObject}
          onAnswer={answer}
        />

        {/* Adults' escape hatch — starting at the very beginning is always fine. */}
        <button
          type="button"
          onClick={onDone}
          aria-label="Skip, start from the beginning"
          className="u-glass mb-1 rounded-full px-5 py-2 font-text text-sm font-semibold text-ink-soft transition-transform active:scale-95"
        >
          Skip
        </button>
      </main>
    </div>
  )
}
