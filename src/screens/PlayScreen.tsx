import { useEffect, useRef, useState } from 'react'
import type { Answer, Level, ObjectGroup, Question } from '../engine/types'
import { generateQuestion } from '../engine/generators'
import { evaluateAnswer } from '../engine/masteryGate'
import { useGameStore } from '../engine/store'
import { audio } from '../audio/AudioManager'
import Twinkle, { type TwinkleMood } from '../components/Twinkle'
import Countable from '../components/Countable'
import ProgressDots from '../components/ProgressDots'
import Confetti from '../components/Confetti'
import MuteButton from '../components/MuteButton'

/**
 * PlayScreen (spec §5) — Twinkle + one activity, with tap-to-count as the core
 * learning moment. Transient play state (current question, in-attempt streak,
 * which objects have been counted) lives here; only earned progress goes to the
 * store. Mounted with `key={level.id}` by App, so each level starts fresh.
 *
 * Safe failure: a wrong answer plays a soft tone, shakes the control, and lets
 * the child immediately retry the SAME question. Nothing is lost.
 */

interface PlayScreenProps {
  level: Level
  onExit: () => void // back to the trail
  onCleared: () => void // reached the mastery goal
}

const PRAISE = ['Yes!', 'You did it!', 'Great job!', 'Woohoo!', 'Nice counting!', 'Well done!']
const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)]

type Phase = 'answering' | 'celebrating'

export default function PlayScreen({ level, onExit, onCleared }: PlayScreenProps) {
  const awardStar = useGameStore((s) => s.awardStar)
  const recordStreak = useGameStore((s) => s.recordStreak)
  const clearLevel = useGameStore((s) => s.clearLevel)

  const [question, setQuestion] = useState<Question>(() => generateQuestion(level))
  const [streak, setStreak] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [mood, setMood] = useState<TwinkleMood>('happy')
  const [beat, setBeat] = useState(0)
  const [confetti, setConfetti] = useState(0)

  // Tap-to-count bookkeeping. Ref is the source of truth (event handlers read
  // it synchronously); state mirrors it for rendering.
  const countedRef = useRef<Record<string, number>>({})
  const [counted, setCounted] = useState<Record<string, number>>({})

  // Wrong-answer shake target (value or side) + a token to restart the shake.
  const [wrong, setWrong] = useState<Answer | null>(null)
  const [shakeToken, setShakeToken] = useState(0)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }
  useEffect(
    () => () => timers.current.forEach(clearTimeout),
    [],
  )

  const bumpBeat = () => setBeat((b) => b + 1)

  // Speak the prompt whenever a new question appears.
  useEffect(() => {
    const id = setTimeout(() => audio.speak(question.prompt), 250)
    return () => clearTimeout(id)
  }, [question])

  function loadNextQuestion() {
    countedRef.current = {}
    setCounted({})
    setWrong(null)
    setMood('happy')
    setPhase('answering')
    setQuestion(generateQuestion(level))
  }

  function tapObject(key: string) {
    const existing = countedRef.current[key]
    if (existing !== undefined) {
      audio.sayNumber(existing) // re-tap: say its number again
      return
    }
    const n = Object.keys(countedRef.current).length + 1
    countedRef.current = { ...countedRef.current, [key]: n }
    setCounted(countedRef.current)
    audio.sfx('pop')
    audio.sayNumber(n)
  }

  function answer(given: Answer) {
    if (phase !== 'answering') return
    const outcome = evaluateAnswer(question, given, streak, level.masteryGoal)

    if (outcome.correct) {
      setPhase('celebrating')
      setStreak(outcome.streak)
      setWrong(null)
      audio.sfx(outcome.cleared ? 'win' : 'good')
      audio.speak(pickPraise())
      setMood('cheer')
      bumpBeat()
      setConfetti((c) => c + 1)
      awardStar()
      recordStreak(level.id, outcome.streak)

      later(
        () => {
          if (outcome.cleared) {
            clearLevel(level.id, level.order, outcome.streak)
            onCleared()
          } else {
            loadNextQuestion()
          }
        },
        outcome.cleared ? 950 : 1050,
      )
    } else {
      // Safe failure — nothing lost, just try again.
      audio.sfx('soft')
      audio.speak('Try again!')
      setMood('sad')
      bumpBeat()
      setWrong(given)
      setShakeToken((t) => t + 1)
      later(() => setMood('happy'), 850)
    }
  }

  const highlightCorrect = phase === 'celebrating'

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-sky-1 to-sky-2">
      <Confetti fire={confetti} />

      {/* Top bar: back · progress · replay · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to the map"
          className="flex items-center gap-1 rounded-full bg-cream/85 px-4 shadow-md backdrop-blur transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" style={{ fontSize: 22 }}>
            ⬅️
          </span>
          <span className="hidden font-bold text-ink sm:inline">Map</span>
        </button>

        <ProgressDots total={level.masteryGoal} filled={streak} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => audio.speak(question.prompt)}
            aria-label="Hear the question again"
            className="grid place-items-center rounded-full bg-grape text-cream shadow-md transition-transform active:scale-90"
            style={{ width: 56, height: 56, fontSize: 24 }}
          >
            <span aria-hidden="true">🔊</span>
          </button>
          <MuteButton />
        </div>
      </header>

      {/* Center stage */}
      <main className="safe-pb flex min-h-0 flex-1 flex-col items-center justify-between gap-2 overflow-y-auto px-4">
        <div className="flex flex-col items-center">
          <Twinkle mood={mood} beat={beat} size={116} />
          <p
            className="mt-1 text-center font-semibold text-ink/80"
            style={{ fontSize: 'clamp(18px, 5vw, 26px)' }}
          >
            {question.prompt}
          </p>
        </div>

        {/* Activity */}
        <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4">
          {question.activity === 'compare' ? (
            <CompareStage
              question={question}
              disabled={phase !== 'answering'}
              wrong={wrong}
              shakeToken={shakeToken}
              highlightCorrect={highlightCorrect}
              onPick={answer}
            />
          ) : (
            <CountStage
              question={question}
              counted={counted}
              onTapObject={tapObject}
            />
          )}
        </div>

        {/* Number answer buttons (count / add) */}
        {question.activity !== 'compare' && (
          <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
            {question.options.map((opt) => {
              const isWrong = wrong === opt
              const isRight = highlightCorrect && opt === question.answer
              return (
                <button
                  // Re-key the wrong button on each wrong tap so the shake replays.
                  key={`${opt}-${isWrong ? shakeToken : 'base'}`}
                  type="button"
                  disabled={phase !== 'answering'}
                  onClick={() => answer(opt)}
                  aria-label={`${opt}`}
                  className={`grid place-items-center rounded-3xl font-bold text-cream transition-transform active:translate-y-1 ${
                    isWrong ? 'anim-shake' : ''
                  }`}
                  style={{
                    minWidth: 'clamp(78px, 24vw, 110px)',
                    height: 'clamp(78px, 20vw, 104px)',
                    fontSize: 'clamp(34px, 9vw, 46px)',
                    background: isRight ? 'var(--leaf)' : 'var(--grape)',
                    boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'var(--grape-dp)'}`,
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

/** Renders the object groups for count/add with tap-to-count. */
function CountStage({
  question,
  counted,
  onTapObject,
}: {
  question: Question
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  if (question.activity === 'count') {
    return (
      <GroupCluster
        group={question.payload.group}
        keyPrefix="c"
        startIndex={0}
        counted={counted}
        onTapObject={onTapObject}
      />
    )
  }
  if (question.activity === 'add') {
    const { left, right } = question.payload
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <GroupCluster group={left} keyPrefix="l" startIndex={0} counted={counted} onTapObject={onTapObject} />
        <span
          className="font-bold text-coral"
          style={{ fontSize: 'clamp(36px, 9vw, 52px)' }}
          aria-hidden="true"
        >
          +
        </span>
        <GroupCluster
          group={right}
          keyPrefix="r"
          startIndex={left.count}
          counted={counted}
          onTapObject={onTapObject}
        />
      </div>
    )
  }
  return null
}

/** A cluster of tappable objects, all of one theme. */
function GroupCluster({
  group,
  keyPrefix,
  startIndex,
  counted,
  onTapObject,
}: {
  group: ObjectGroup
  keyPrefix: string
  startIndex: number
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1 rounded-3xl bg-cream/40 p-2"
      style={{ maxWidth: 'min(90vw, 360px)' }}
    >
      {Array.from({ length: group.count }, (_, i) => {
        const key = `${keyPrefix}-${i}`
        return (
          <Countable
            key={key}
            emoji={group.theme.emoji}
            counted={counted[key] !== undefined}
            ordinal={counted[key]}
            index={startIndex + i}
            onTap={() => onTapObject(key)}
          />
        )
      })}
    </div>
  )
}

/** Two side panels for compare; tapping a side is the answer. */
function CompareStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'compare' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (side: 'left' | 'right') => void
}) {
  const sides: Array<'left' | 'right'> = ['left', 'right']
  return (
    <div className="flex w-full items-stretch justify-center gap-3 sm:gap-6">
      {sides.map((side) => {
        const group = question.payload[side]
        const isWrong = wrong === side
        const isRight = highlightCorrect && question.answer === side
        return (
          <button
            // Only the wrong side remounts (to replay its shake); the other stays put.
            key={`${side}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(side)}
            aria-label={`this group of ${group.theme.plural}`}
            className={`flex flex-1 flex-wrap content-center items-center justify-center gap-1 rounded-3xl p-3 transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            }`}
            style={{
              minHeight: 'clamp(140px, 34vw, 220px)',
              maxWidth: 240,
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              border: '4px solid var(--cream)',
            }}
          >
            {Array.from({ length: group.count }, (_, i) => (
              <span
                key={i}
                className="anim-pop"
                style={{
                  fontSize: 'clamp(26px, 7vw, 40px)',
                  lineHeight: 1,
                  animationDelay: `${i * 55}ms`,
                }}
                aria-hidden="true"
              >
                {group.theme.emoji}
              </span>
            ))}
          </button>
        )
      })}
    </div>
  )
}
