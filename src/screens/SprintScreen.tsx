import { useEffect, useRef, useState } from 'react'
import type { Answer, Level, Question } from '../engine/types'
import { generateQuestion } from '../engine/generators'
import { isCorrect } from '../engine/masteryGate'
import { useGameStore } from '../engine/store'
import { audio } from '../audio/AudioManager'
import Twinkle, { type TwinkleMood } from '../components/Twinkle'
import Confetti from '../components/Confetti'
import MuteButton from '../components/MuteButton'
import PlayerChip from '../components/PlayerChip'
import { ActivityStage } from './PlayScreen'

/**
 * SprintScreen — the high-score layer (approved 2026-07-04). Unlocked by
 * MASTERING a level first; never part of the unlock spine. As many questions
 * as the round allows (level.sprintSeconds, content data), +1 per correct.
 *
 * Early-band framing, by design pillar: the clock is AMBIENT — a sun drifting
 * along a track, no countdown numerals — a wrong answer scores nothing and
 * the round simply moves to the next question (no getting stuck), and the
 * ending is ALWAYS a celebration ("You got nine!"), never a game over.
 * Mid/upper bands will layer visible countdowns + streak bonuses in Phase 3.
 */

interface SprintScreenProps {
  level: Level
  onExit: () => void
}

type SprintPhase = 'running' | 'between' | 'done'

export default function SprintScreen({ level, onExit }: SprintScreenProps) {
  const recordSprintScore = useGameStore((s) => s.recordSprintScore)
  const prevBest = useRef(useGameStore.getState().bestScores[level.id] ?? 0)

  const [question, setQuestion] = useState<Question>(() => generateQuestion(level))
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<SprintPhase>('running')
  const [mood, setMood] = useState<TwinkleMood>('happy')
  const [beat, setBeat] = useState(0)
  const [confetti, setConfetti] = useState(0)
  const [wrong, setWrong] = useState<Answer | null>(null)
  const [shakeToken, setShakeToken] = useState(0)
  const [remainingPct, setRemainingPct] = useState(100)
  const [remainingSec, setRemainingSec] = useState(level.sprintSeconds)
  const [round, setRound] = useState(0) // bumping re-arms the clock ("Again!")
  const [streak, setStreak] = useState(0)

  // Older bands earned a REAL scoreboard (decision #7): visible countdown and
  // a 🔥 streak bonus (3+ in a row → +2 each). Early keeps the ambient sun.
  const arcade = level.band !== 'early'

  // Tap-to-count bookkeeping (same shape as PlayScreen).
  const countedRef = useRef<Record<string, number>>({})
  const [counted, setCounted] = useState<Record<string, number>>({})

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // The round clock: one hard stop + a soft half-second tick for the sun bar.
  const scoreRef = useRef(0)
  const doneRef = useRef(false)
  useEffect(() => {
    const total = level.sprintSeconds * 1000
    const startedAt = Date.now()
    const tick = setInterval(() => {
      const left = Math.max(0, total - (Date.now() - startedAt))
      setRemainingPct((left / total) * 100)
      setRemainingSec(Math.ceil(left / 1000))
    }, 500)
    const stop = setTimeout(() => finishRound(), total)
    return () => {
      clearInterval(tick)
      clearTimeout(stop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id, level.sprintSeconds, round])

  function finishRound() {
    if (doneRef.current) return
    doneRef.current = true
    recordSprintScore(level.id, scoreRef.current)
    setPhase('done')
    setMood('cheer')
    setBeat((b) => b + 1)
    setConfetti((c) => c + 1)
    // The end is words + chime (user direction): the score was spoken as it
    // climbed, and the done screen prints "You got N!" in big type.
    audio.sfx('win')
  }

  function loadNext() {
    countedRef.current = {}
    setCounted({})
    setWrong(null)
    setPhase('running')
    setQuestion(generateQuestion(level))
  }

  function tapObject(key: string) {
    if (countedRef.current[key] !== undefined) return // already counted
    const n = Object.keys(countedRef.current).length + 1
    countedRef.current = { ...countedRef.current, [key]: n }
    setCounted(countedRef.current)
    audio.sfx('pop') // the ordinal badge on the object shows the number
  }

  function answer(given: Answer) {
    if (phase !== 'running' || doneRef.current) return
    if (isCorrect(question, given)) {
      const nextStreak = streak + 1
      // Arcade bands: the third-in-a-row and beyond are worth double.
      const gain = arcade && nextStreak >= 3 ? 2 : 1
      const next = score + gain
      scoreRef.current = next
      setScore(next)
      setStreak(nextStreak)
      setPhase('between')
      setMood('cheer')
      setBeat((b) => b + 1)
      audio.sfx('good') // the score chip ticks up — that IS the celebration
      later(() => {
        if (!doneRef.current) {
          setMood('happy')
          loadNext()
        }
      }, 400)
    } else {
      setStreak(0)
      // Sprint pace: a miss scores nothing and the round MOVES ON — no
      // getting stuck on one question while the sun drifts. (Mastery mode
      // keeps retry-until-correct; that's where the learning loop lives.)
      setPhase('between')
      audio.sfx('soft')
      setWrong(given)
      setShakeToken((t) => t + 1)
      later(() => {
        if (!doneRef.current) loadNext()
      }, 550)
    }
  }

  function exitSaving() {
    // A partial run still counts (forward-only — it can only ever improve).
    if (!doneRef.current) recordSprintScore(level.id, scoreRef.current)
    onExit()
  }

  const best = Math.max(prevBest.current, score)

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-sky-1 to-sky-2">
      <Confetti fire={confetti} />

      {/* Top bar: back · player chip · score jar · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={exitSaving}
            aria-label="Back to the levels"
            className="u-glass flex shrink-0 items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
            style={{ height: 56 }}
          >
            <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
              ‹
            </span>
            <span className="hidden font-text font-semibold text-ink-soft sm:inline">
              Levels
            </span>
          </button>
          <PlayerChip />
        </div>

        <div
          className="u-glass flex items-center gap-2 rounded-full px-5"
          style={{ height: 56 }}
          role="status"
          aria-label={`${score} correct so far`}
        >
          <span aria-hidden="true" style={{ fontSize: 22 }}>
            {arcade && streak >= 3 ? '🔥' : '🏆'}
          </span>
          <span className="font-text font-bold tabular-nums text-ink" style={{ fontSize: 26 }}>
            {score}
          </span>
          {arcade && (
            <span
              className="ml-1 font-text font-bold tabular-nums"
              style={{ fontSize: 18, color: remainingSec <= 10 ? 'var(--coral)' : 'var(--ink-soft)' }}
              aria-label={`${remainingSec} seconds left`}
            >
              {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        <MuteButton />
      </header>

      {/* Time track: ambient sun for the early band; the arcade bands also
          get the numeric countdown up in the scoreboard. */}
      <div className="z-10 px-5" aria-hidden="true">
        <div
          className="relative h-2.5 w-full overflow-visible rounded-full"
          style={{ background: 'var(--tint)' }}
        >
          <div
            className="h-2.5 rounded-full"
            style={{
              width: `${remainingPct}%`,
              background: 'var(--sun-grad)',
              transition: 'width 0.5s linear',
            }}
          />
          <span
            className="absolute -top-2.5"
            style={{
              left: `calc(${remainingPct}% - 12px)`,
              fontSize: 20,
              transition: 'left 0.5s linear',
            }}
          >
            🌞
          </span>
        </div>
      </div>

      {phase !== 'done' ? (
        <main className="safe-pb flex min-h-0 flex-1 flex-col items-center justify-between gap-2 overflow-y-auto px-4 pt-2">
          <div className="flex flex-col items-center">
            <Twinkle mood={mood} beat={beat} size={88} />
            <p
              className="mt-2 max-w-md text-center font-semibold text-ink"
              style={{ fontSize: 'clamp(16px, 4.5vw, 24px)', lineHeight: 1.3 }}
            >
              {question.prompt}
            </p>
          </div>

          <ActivityStage
            question={question}
            disabled={phase !== 'running'}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={false}
            counted={counted}
            onTapObject={tapObject}
            onAnswer={answer}
          />
        </main>
      ) : (
        <main className="safe-pb flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6">
          <Twinkle mood="cheer" beat={beat} size={128} className="anim-rise" />
          <h1
            className="anim-rise text-center font-bold text-ink"
            style={{ fontSize: 'clamp(28px, 7.5vw, 46px)', letterSpacing: '-0.015em' }}
          >
            You got {score}!
          </h1>
          <p
            className="anim-rise flex items-center gap-2 text-center font-text font-semibold text-ink-soft"
            style={{ fontSize: 'clamp(17px, 4.5vw, 24px)' }}
          >
            <span aria-hidden="true">🏆</span>
            {score >= best && score > 0 && score > prevBest.current
              ? 'A new best!'
              : `Best: ${best}`}
          </p>
          <div className="anim-rise flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Fresh round, same level — bumping `round` re-arms the clock.
                doneRef.current = false
                scoreRef.current = 0
                prevBest.current = useGameStore.getState().bestScores[level.id] ?? 0
                setScore(0)
                setStreak(0)
                setConfetti(0)
                setRemainingPct(100)
                setRemainingSec(level.sprintSeconds)
                setMood('happy')
                setRound((r) => r + 1)
                loadNext()
              }}
              className="rounded-2xl px-10 font-bold text-cream transition-all active:translate-y-0.5"
              style={{
                height: 'clamp(62px, 16vw, 78px)',
                fontSize: 'clamp(21px, 6vw, 28px)',
                background: 'var(--grape-grad)',
                boxShadow:
                  '0 6px 16px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 0 var(--grape-dp)',
              }}
            >
              <span aria-hidden="true">🏆</span> Again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="u-card px-10 font-bold text-ink-soft transition-all active:translate-y-px"
              style={{
                height: 'clamp(58px, 14vw, 70px)',
                fontSize: 'clamp(19px, 5vw, 24px)',
              }}
            >
              Back to the levels
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
