import { useEffect, useRef, useState } from 'react'
import type { Answer, Level, Question } from '../engine/types'
import { PRAISE } from '../content/words'
import { generateQuestion } from '../engine/generators'
import { isCorrect } from '../engine/masteryGate'
import { audio } from '../audio/AudioManager'
import Twinkle, { type TwinkleMood } from '../components/Twinkle'
import Confetti from '../components/Confetti'
import MuteButton from '../components/MuteButton'
import { ActivityStage } from './PlayScreen'

/**
 * PracticeScreen — free, stakes-free practice after a lesson. It loops questions
 * for a topic forever: nothing is recorded (no stars, no diamonds, no mastery,
 * no progress), so the child can try things out until they feel ready. Getting
 * one wrong twice reveals the answer (a teaching moment), never a penalty. The
 * always-present "I'm ready!" button hands off to the real levels.
 */

interface PracticeScreenProps {
  level: Level
  onReady: () => void // "I'm ready!" → the actual levels (where answers count)
  onExit: () => void // back to the level picker
}

const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)]

type Phase = 'answering' | 'celebrating' | 'revealing'

export default function PracticeScreen({ level, onReady, onExit }: PracticeScreenProps) {
  const [question, setQuestion] = useState<Question>(() => generateQuestion(level))
  const [phase, setPhase] = useState<Phase>('answering')
  const [tries, setTries] = useState(0)
  const [mood, setMood] = useState<TwinkleMood>('happy')
  const [beat, setBeat] = useState(0)
  const [confetti, setConfetti] = useState(0)
  const [flash, setFlash] = useState<{ text: string; cheer: boolean } | null>(null)
  const [wrong, setWrong] = useState<Answer | null>(null)
  const [shakeToken, setShakeToken] = useState(0)
  const [gotRight, setGotRight] = useState(0) // encouragement only — not saved

  const countedRef = useRef<Record<string, number>>({})
  const [counted, setCounted] = useState<Record<string, number>>({})

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function loadNext() {
    countedRef.current = {}
    setCounted({})
    setWrong(null)
    setFlash(null)
    setMood('happy')
    setTries(0)
    setPhase('answering')
    setQuestion(generateQuestion(level))
  }

  function tapObject(key: string) {
    if (countedRef.current[key] !== undefined) return
    const n = Object.keys(countedRef.current).length + 1
    countedRef.current = { ...countedRef.current, [key]: n }
    setCounted(countedRef.current)
    audio.sfx('pop')
  }

  function answer(given: Answer) {
    if (phase !== 'answering') return

    if (isCorrect(question, given)) {
      setPhase('celebrating')
      setWrong(null)
      audio.sfx('good')
      setFlash({ text: pickPraise(), cheer: true })
      setMood('cheer')
      setBeat((b) => b + 1)
      setConfetti((c) => c + 1)
      setGotRight((g) => g + 1)
      later(loadNext, 1000)
      return
    }

    // Wrong — no penalty. Retry; after two misses, reveal the answer to teach.
    const t = tries + 1
    setTries(t)
    audio.sfx('soft')
    setMood('sad')
    setBeat((b) => b + 1)
    setWrong(given)
    setShakeToken((s) => s + 1)

    if (t >= 2) {
      setPhase('revealing')
      setFlash({ text: 'Here’s the answer! ✨', cheer: false })
      later(loadNext, 1700)
    } else {
      setFlash({ text: 'Try again!', cheer: false })
      later(() => {
        setMood('happy')
        setFlash((f) => (f && !f.cheer ? null : f))
      }, 850)
    }
  }

  const highlightCorrect = phase === 'celebrating' || phase === 'revealing'

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-sky-1 to-sky-2">
      <Confetti fire={confetti} />

      {/* Top bar: back · practice chip · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to the levels"
          className="u-glass flex shrink-0 items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
            ‹
          </span>
          <span className="hidden font-text font-semibold text-ink-soft sm:inline">Levels</span>
        </button>

        <span
          className="u-glass flex items-center gap-1.5 rounded-full px-3.5 font-text font-bold text-ink-soft"
          style={{ height: 44, fontSize: 14 }}
          role="status"
        >
          <span aria-hidden="true">✏️</span>
          Practice
          {gotRight > 0 && (
            <span className="text-ink" aria-label={`${gotRight} right`}>
              · 🎯 {gotRight}
            </span>
          )}
        </span>

        <MuteButton />
      </header>

      {/* Center stage */}
      <main className="safe-pb flex min-h-0 flex-1 flex-col items-center justify-between gap-2 overflow-y-auto px-4">
        <div className="flex flex-col items-center">
          <Twinkle mood={mood} beat={beat} size={96} />
          {flash && (
            <p
              key={beat}
              role="status"
              className="anim-pop mt-2 rounded-full px-5 py-1 font-bold"
              style={{
                fontSize: 'clamp(18px, 4.6vw, 24px)',
                color: flash.cheer ? 'var(--ink)' : 'var(--ink-soft)',
                background: flash.cheer ? 'var(--sun-grad)' : 'rgba(255,253,248,0.8)',
                border: flash.cheer ? 'none' : '1px solid var(--line)',
                boxShadow: 'var(--e2)',
              }}
            >
              {flash.text}
            </p>
          )}
          <p
            className="mt-2 max-w-md text-center font-semibold text-ink"
            style={{ fontSize: 'clamp(18px, 5vw, 26px)', lineHeight: 1.3 }}
          >
            {question.prompt}
          </p>
        </div>

        <ActivityStage
          question={question}
          disabled={phase !== 'answering'}
          wrong={wrong}
          shakeToken={shakeToken}
          highlightCorrect={highlightCorrect}
          counted={counted}
          onTapObject={tapObject}
          onAnswer={answer}
        />
      </main>

      {/* Footer: the "ready for the real thing" hand-off. */}
      <div className="safe-pb z-20 flex flex-col items-center gap-1 border-t border-[color:var(--line)] bg-sky-1/85 px-5 pt-3 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => {
            audio.unlock()
            audio.sfx('pop')
            onReady()
          }}
          aria-label="I'm ready to play for real"
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-2xl px-6 font-bold text-cream transition-all active:translate-y-0.5"
          style={{
            height: 58,
            fontSize: 'clamp(18px, 5vw, 22px)',
            background: 'var(--leaf-grad)',
            boxShadow:
              '0 5px 14px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -3px 0 var(--leaf-dp)',
          }}
        >
          I’m ready! Play for real ›
        </button>
        <p className="font-text text-xs font-medium text-ink-faint">
          Practice is just for trying — nothing counts here yet.
        </p>
      </div>
    </div>
  )
}
