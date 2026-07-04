import { useEffect, useRef, useState } from 'react'
import type { Answer, Level, ObjectGroup, Question } from '../engine/types'
import { numberWord } from '../content/words'
import { shapeById } from '../content/shapes'
import { currencyById } from '../content/currency'
import ShapeGlyph from '../components/ShapeGlyph'
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

/** Activities whose stage IS the answer surface (tap a card/side/panel), so
 *  the number-button row is not rendered. */
const INDEX_ANSWER_ACTIVITIES = new Set<Question['activity']>([
  'compare',
  'match',
  'shape-id',
  'pattern',
  'clock',
  'odd-one-out',
  'shadow-match',
  'same-or-not',
  'num-compare',
  'coin-compare',
  'who-left',
  'belongs',
  'position',
  'day-time',
  'size-compare',
  'height-compare',
  'weight-compare',
  'make-amount', // its stage carries its own ✔️ submit
  'set-clock', // ditto
  'tap-all', // completes itself when the last one is found
])

/** Narrow to the value-answer activities that use the number-button row. */
function hasNumberButtons(
  q: Question,
): q is Extract<
  Question,
  {
    activity:
      | 'count'
      | 'add'
      | 'subitize'
      | 'sequence'
      | 'subtract'
      | 'money'
      | 'one-more'
      | 'bond'
      | 'sides'
      | 'place-value'
      | 'round'
      | 'multiply'
      | 'divide'
      | 'share'
      | 'arith'
  }
> {
  return !INDEX_ANSWER_ACTIVITIES.has(q.activity)
}

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
      // Persist the clear IMMEDIATELY — the celebration timer below is
      // cancelled on unmount, and a back-tap during the fanfare must never
      // lose earned progress (only navigation belongs on the delay).
      if (outcome.cleared) clearLevel(level.id, outcome.streak)

      later(
        () => {
          if (outcome.cleared) {
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
          aria-label="Back to the levels"
          className="flex items-center gap-1 rounded-full bg-cream/85 px-4 shadow-md backdrop-blur transition-transform active:scale-90"
          style={{ height: 64 }}
        >
          <span aria-hidden="true" style={{ fontSize: 24 }}>
            ⬅️
          </span>
          <span className="hidden font-bold text-ink sm:inline">Levels</span>
        </button>

        <ProgressDots total={level.masteryGoal} filled={streak} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => audio.speak(question.prompt)}
            aria-label="Hear the question again"
            className="grid place-items-center rounded-full bg-grape text-cream shadow-md transition-transform active:scale-90"
            style={{ width: 64, height: 64, fontSize: 26 }}
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
    </div>
  )
}

/**
 * ActivityStage — the complete answering surface for ANY activity: the stage
 * renderer plus (where applicable) the number-button row. Shared verbatim by
 * mastery play (PlayScreen) and Sprint mode, so a question looks and feels
 * identical in both.
 */
export function ActivityStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  counted,
  onTapObject,
  onAnswer,
}: {
  question: Question
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  counted: Record<string, number>
  onTapObject: (key: string) => void
  onAnswer: (given: Answer) => void
}) {
  const currencyId = useGameStore((s) => s.currency)
  return (
    <>
      {/* Activity */}
      <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4">
        {question.activity === 'compare' ? (
          <CompareStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'match' ? (
          <MatchStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'subitize' ? (
          <SubitizeStage
            key={question.id} // fresh flash state per question — no stale ❓ frame
            question={question}
            revealToken={shakeToken}
            celebrate={highlightCorrect}
          />
        ) : question.activity === 'sequence' ? (
          <SequenceStage question={question} celebrate={highlightCorrect} />
        ) : question.activity === 'subtract' ? (
          <SubtractStage question={question} counted={counted} onTapObject={onTapObject} />
        ) : question.activity === 'shape-id' ? (
          <ShapeStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'pattern' ? (
          <PatternStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'clock' ? (
          <ClockStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'money' ? (
          <MoneyStage question={question} counted={counted} onTapObject={onTapObject} />
        ) : question.activity === 'odd-one-out' ? (
          <OddOneOutStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'shadow-match' ? (
          <ShadowStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'same-or-not' ? (
          <SameOrNotStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'num-compare' ||
          question.activity === 'coin-compare' ||
          question.activity === 'size-compare' ||
          question.activity === 'height-compare' ||
          question.activity === 'weight-compare' ? (
          <SideAnswerStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'who-left' ? (
          <WhoLeftStage
            key={question.id} // fresh flash per question
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'belongs' ||
          question.activity === 'position' ||
          question.activity === 'day-time' ? (
          <CardPickStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'bond' ? (
          <BondStage question={question} counted={counted} onTapObject={onTapObject} />
        ) : question.activity === 'sides' ? (
          <div className="grid place-items-center rounded-3xl bg-cream/60 p-5">
            <ShapeGlyph shapeId={question.payload.shapeId} size={120} />
          </div>
        ) : question.activity === 'make-amount' ? (
          <MakeAmountStage
            key={question.id}
            question={question}
            disabled={disabled}
            onSubmit={onAnswer}
          />
        ) : question.activity === 'set-clock' ? (
          <SetClockStage
            key={question.id}
            question={question}
            disabled={disabled}
            onSubmit={onAnswer}
          />
        ) : question.activity === 'tap-all' ? (
          <TapAllStage
            key={question.id}
            question={question}
            disabled={disabled}
            onComplete={onAnswer}
            onWrongTap={() => onAnswer(-1)}
          />
        ) : question.activity === 'place-value' ? (
          <PlaceValueStage value={question.payload.value} />
        ) : question.activity === 'round' ? (
          <ExprCard text={`${question.payload.value}`} sub="round to the nearest ten" />
        ) : question.activity === 'multiply' ? (
          question.payload.visual ? (
            <MultiplyStage question={question} />
          ) : (
            <ExprCard text={`${question.payload.a} × ${question.payload.b}`} />
          )
        ) : question.activity === 'divide' ? (
          <ExprCard text={`${question.payload.n} ÷ ${question.payload.b}`} />
        ) : question.activity === 'arith' ? (
          <ExprCard
            text={`${question.payload.a} ${question.payload.op === '+' ? '+' : '−'} ${question.payload.b}`}
          />
        ) : question.activity === 'share' ? (
          <ShareStage question={question} />
        ) : (
          <CountStage question={question} counted={counted} onTapObject={onTapObject} />
        )}
      </div>

      {/* Number answer buttons (all number-answer activities) */}
      {hasNumberButtons(question) && (
        <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
          {question.options.map((opt) => {
            const isWrong = wrong === opt
            const isRight = highlightCorrect && opt === question.answer
            // Money answers carry the family's currency symbol.
            const label =
              question.activity === 'money'
                ? `${currencyById(currencyId).symbol}${opt}`
                : `${opt}`
            return (
              <button
                // Re-key the wrong button on each wrong tap so the shake replays.
                key={`${opt}-${isWrong ? shakeToken : 'base'}`}
                type="button"
                disabled={disabled}
                onClick={() => onAnswer(opt)}
                aria-label={label}
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
                {label}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/** Renders the object groups for count/add with tap-to-count.
 *  (Exported for reuse by the placement check, which asks the same forms.) */
export function CountStage({
  question,
  counted,
  onTapObject,
}: {
  question: Question
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  if (question.activity === 'count' || question.activity === 'one-more') {
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

/**
 * Subitize: the group flashes for `flashMs`, then hides behind a ❓ card. A
 * wrong answer re-flashes it (revealToken bumps); the celebration reveals it.
 */
function SubitizeStage({
  question,
  revealToken,
  celebrate,
}: {
  question: Extract<Question, { activity: 'subitize' }>
  revealToken: number
  celebrate: boolean
}) {
  const [visible, setVisible] = useState(true)
  const { group, flashMs } = question.payload

  useEffect(() => {
    setVisible(true)
    const id = setTimeout(() => setVisible(false), flashMs)
    return () => clearTimeout(id)
  }, [question.id, revealToken, flashMs])

  const show = visible || celebrate
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1 rounded-3xl bg-cream/40 p-4"
      style={{ maxWidth: 'min(90vw, 360px)', minHeight: 110 }}
      // role="img" so the label is actually exposed to assistive tech (a
      // bare div's aria-label is ignored).
      role="img"
      aria-label={show ? `${group.count} ${group.theme.plural}` : 'hidden — answer from memory'}
    >
      {show ? (
        Array.from({ length: group.count }, (_, i) => (
          <span
            key={i}
            className="anim-pop"
            style={{ fontSize: 'clamp(34px, 9vw, 48px)', lineHeight: 1, animationDelay: `${i * 40}ms` }}
            aria-hidden="true"
          >
            {group.theme.emoji}
          </span>
        ))
      ) : (
        <span aria-hidden="true" style={{ fontSize: 'clamp(40px, 11vw, 56px)' }}>
          ❓
        </span>
      )}
    </div>
  )
}

/** Sequence: the shown run as chips, then a "?" chip for the missing number. */
function SequenceStage({
  question,
  celebrate,
}: {
  question: Extract<Question, { activity: 'sequence' }>
  celebrate: boolean
}) {
  const { shown } = question.payload
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {shown.map((n, i) => (
        <span
          key={i}
          className="anim-pop grid place-items-center rounded-2xl bg-cream font-bold text-ink shadow-md"
          style={{
            minWidth: 'clamp(58px, 15vw, 76px)',
            height: 'clamp(58px, 15vw, 76px)',
            fontSize: 'clamp(26px, 7vw, 36px)',
            animationDelay: `${i * 90}ms`,
          }}
        >
          {n}
        </span>
      ))}
      <span
        className="grid place-items-center rounded-2xl font-bold text-cream"
        style={{
          minWidth: 'clamp(58px, 15vw, 76px)',
          height: 'clamp(58px, 15vw, 76px)',
          fontSize: 'clamp(26px, 7vw, 36px)',
          background: celebrate ? 'var(--leaf)' : 'var(--grape)',
          boxShadow: `0 5px 0 ${celebrate ? 'var(--leaf-dp)' : 'var(--grape-dp)'}`,
        }}
      >
        {celebrate ? question.answer : '?'}
      </span>
    </div>
  )
}

/**
 * Subtract: `taken` objects at the end fade out ("go away"); the remaining
 * ones stay tap-to-countable — counting what's LEFT is the learning moment.
 */
function SubtractStage({
  question,
  counted,
  onTapObject,
}: {
  question: Extract<Question, { activity: 'subtract' }>
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  const { group, taken } = question.payload
  const remaining = group.count - taken
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1 rounded-3xl bg-cream/40 p-2"
      style={{ maxWidth: 'min(90vw, 380px)' }}
    >
      {/* The ones that stay — tappable, countable. */}
      <GroupCluster
        group={{ theme: group.theme, count: remaining }}
        keyPrefix="keep"
        startIndex={0}
        counted={counted}
        onTapObject={onTapObject}
      />
      {/* The ones that go away — faded, inert, clearly "leaving". */}
      <span className="flex items-center gap-0.5 px-1" aria-hidden="true">
        {Array.from({ length: taken }, (_, i) => (
          <span
            key={i}
            className="anim-pop"
            style={{
              fontSize: 'clamp(26px, 7vw, 40px)',
              lineHeight: 1,
              opacity: 0.3,
              filter: 'grayscale(0.9)',
              animationDelay: `${(remaining + i) * 55}ms`,
            }}
          >
            {group.theme.emoji}
          </span>
        ))}
        <span className="font-bold text-coral" style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>
          👋
        </span>
      </span>
    </div>
  )
}

/**
 * Match (numeral ↔ quantity): a big numeral card and one group per option.
 * The game's conventions hold: objects are TAP-TO-COUNT (per group, counting
 * restarts at one), and the chunky ✔️ button under a group is what commits it
 * as the answer — tapping objects can never accidentally answer.
 */
function MatchStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'match' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { target, groups } = question.payload

  // Per-group tap-to-count bookkeeping (ref = sync source of truth for rapid
  // taps; state mirrors it for rendering). Fresh per question.
  const countedRef = useRef<Record<string, number>>({})
  const [counted, setCounted] = useState<Record<string, number>>({})
  useEffect(() => {
    countedRef.current = {}
    setCounted({})
  }, [question.id])

  function tapObject(groupIndex: number, i: number) {
    const key = `${groupIndex}-${i}`
    const existing = countedRef.current[key]
    if (existing !== undefined) {
      audio.sayNumber(existing)
      return
    }
    // Ordinal within THIS group only — each pile is counted from one.
    const n =
      Object.keys(countedRef.current).filter((k) => k.startsWith(`${groupIndex}-`))
        .length + 1
    countedRef.current = { ...countedRef.current, [key]: n }
    setCounted(countedRef.current)
    audio.sfx('pop')
    audio.sayNumber(n)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* The numeral being matched — big, with its word for the grown-up. */}
      <div className="flex items-center gap-3">
        <span
          className="grid place-items-center rounded-2xl bg-cream font-bold text-ink shadow-md"
          style={{
            minWidth: 'clamp(64px, 16vw, 84px)',
            height: 'clamp(64px, 16vw, 84px)',
            fontSize: 'clamp(34px, 9vw, 48px)',
          }}
        >
          {target}
        </span>
        <span className="font-semibold text-ink" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
          {numberWord(target)}
        </span>
      </div>

      <div className="flex w-full items-stretch justify-center gap-2 sm:gap-4">
        {groups.map((group, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <div
              // Only the wrong panel remounts (to replay its shake); the
              // counted map lives above, so ordinals survive the remount.
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              className={`flex flex-1 flex-col items-center gap-2 ${isWrong ? 'anim-shake' : ''}`}
              style={{ maxWidth: 170 }}
            >
              <div
                className="flex w-full flex-1 flex-wrap content-center items-center justify-center gap-0.5 rounded-3xl p-2"
                style={{
                  minHeight: 'clamp(96px, 24vw, 150px)',
                  background: isRight ? 'var(--leaf)' : 'var(--cream)',
                  border: '4px solid var(--cream)',
                  boxShadow: '0 4px 0 rgba(74,58,107,0.12)',
                }}
              >
                {Array.from({ length: group.count }, (_, i) => (
                  <Countable
                    key={`${index}-${i}`}
                    emoji={group.theme.emoji}
                    counted={counted[`${index}-${i}`] !== undefined}
                    ordinal={counted[`${index}-${i}`]}
                    index={i}
                    onTap={() => tapObject(index, i)}
                    size="sm"
                  />
                ))}
              </div>
              {/* THE answer control for this group — same "button answers"
                  language as the number buttons. */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(index)}
                aria-label={`choose the group of ${group.count} ${group.theme.plural}`}
                className="grid place-items-center rounded-full text-cream transition-transform active:translate-y-1"
                style={{
                  width: 64,
                  height: 64,
                  fontSize: 26,
                  background: isRight ? 'var(--leaf)' : 'var(--grape)',
                  boxShadow: `0 5px 0 ${isRight ? 'var(--leaf-dp)' : 'var(--grape-dp)'}`,
                }}
              >
                <span aria-hidden="true">✔️</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Two side panels for compare; tapping a side is the answer.
 *  (Exported for reuse by the placement check.) */
export function CompareStage({
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

/**
 * Shape cards: every glyph in the SAME color so shape is the only
 * discriminator. Tapping a card answers with its index (panel = answer,
 * matching the compare convention; nothing here invites counting).
 */
function ShapeStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'shape-id' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  return (
    <div className="flex w-full items-stretch justify-center gap-3 sm:gap-5">
      {question.payload.shapeIds.map((shapeId, index) => {
        const isWrong = wrong === index
        const isRight = highlightCorrect && question.answer === index
        return (
          <button
            key={`${index}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(index)}
            aria-label={shapeById(shapeId)?.name ?? shapeId}
            className={`grid flex-1 place-items-center rounded-3xl p-3 transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            }`}
            style={{
              minHeight: 'clamp(110px, 30vw, 160px)',
              maxWidth: 150,
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              border: '4px solid var(--cream)',
            }}
          >
            <ShapeGlyph
              shapeId={shapeId}
              size={84}
              fill={isRight ? 'var(--cream)' : 'var(--grape)'}
            />
          </button>
        )
      })}
    </div>
  )
}

/** Pattern run as chips + a ? chip; the motif buttons ARE the answers. */
function PatternStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'pattern' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { sequence, optionMotifs } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-3xl bg-cream/40 p-3">
        {sequence.map((motif, i) => (
          <span
            key={i}
            className="anim-pop"
            style={{
              fontSize: 'clamp(26px, 7vw, 40px)',
              lineHeight: 1,
              animationDelay: `${i * 70}ms`,
            }}
            aria-hidden="true"
          >
            {motif}
          </span>
        ))}
        <span
          className="grid place-items-center rounded-2xl font-bold text-cream"
          style={{
            width: 'clamp(44px, 11vw, 56px)',
            height: 'clamp(44px, 11vw, 56px)',
            fontSize: 'clamp(22px, 6vw, 30px)',
            background: highlightCorrect ? 'var(--leaf)' : 'var(--grape)',
            boxShadow: `0 4px 0 ${highlightCorrect ? 'var(--leaf-dp)' : 'var(--grape-dp)'}`,
          }}
          aria-hidden="true"
        >
          {highlightCorrect ? optionMotifs[question.answer] : '?'}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        {optionMotifs.map((motif, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={`choice ${index + 1}`}
              className={`grid place-items-center rounded-3xl transition-transform active:translate-y-1 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                width: 'clamp(72px, 20vw, 96px)',
                height: 'clamp(72px, 20vw, 96px)',
                fontSize: 'clamp(34px, 9vw, 48px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              }}
            >
              <span aria-hidden="true">{motif}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** An analog clock face + time-choice buttons ("3:00" style numerals). */
function ClockStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'clock' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { hour, minute, choices } = question.payload
  const timeLabel = (h: number, m: number) => `${h}:${m === 0 ? '00' : '30'}`

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <ClockFace hour={hour} minute={minute} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        {choices.map((choice, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={timeLabel(choice.hour, choice.minute)}
              className={`grid place-items-center rounded-3xl font-bold text-cream transition-transform active:translate-y-1 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                minWidth: 'clamp(88px, 26vw, 120px)',
                height: 'clamp(72px, 18vw, 96px)',
                fontSize: 'clamp(26px, 7vw, 36px)',
                background: isRight ? 'var(--leaf)' : 'var(--grape)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'var(--grape-dp)'}`,
              }}
            >
              {timeLabel(choice.hour, choice.minute)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Coins on the table. Single-value coins stay tap-to-countable (counting IS
 * the skill); mixed-value coins show their values and the child adds them
 * with the number buttons below.
 */
function MoneyStage({
  question,
  counted,
  onTapObject,
}: {
  question: Extract<Question, { activity: 'money' }>
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  const currencyId = useGameStore((s) => s.currency)
  const symbol = currencyById(currencyId).symbol
  const { coins } = question.payload
  const countable = coins.every((v) => v === 1)

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-cream/40 p-3"
      style={{ maxWidth: 'min(90vw, 380px)' }}
    >
      {coins.map((value, i) => {
        const key = `coin-${i}`
        const ordinal = counted[key]
        const size = countable ? 'clamp(56px, 14vw, 76px)' : 'clamp(76px, 20vw, 96px)'
        const face = (
          <CoinFace
            value={value}
            symbol={symbol}
            fontSize={countable ? 'clamp(17px, 4.5vw, 22px)' : 'clamp(24px, 6vw, 32px)'}
          />
        )
        return countable ? (
          <button
            key={key}
            type="button"
            onClick={() => onTapObject(key)}
            aria-label={ordinal !== undefined ? `counted ${ordinal}` : 'tap to count'}
            className="anim-pop relative transition-transform active:scale-90"
            style={{ width: size, height: size, animationDelay: `${i * 60}ms` }}
          >
            {face}
            {ordinal !== undefined && (
              <span
                className="anim-pop absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-coral font-bold text-cream shadow"
                style={{ fontSize: 15 }}
              >
                {ordinal}
              </span>
            )}
          </button>
        ) : (
          <span
            key={key}
            className="anim-pop relative inline-block"
            style={{ width: size, height: size, animationDelay: `${i * 60}ms` }}
            role="img"
            aria-label={`a ${symbol}${value} coin`}
          >
            {face}
          </span>
        )
      })}
    </div>
  )
}

/** Odd one out: a row of alike things and one impostor — tap the impostor. */
function OddOneOutStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'odd-one-out' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      {question.payload.items.map((item, index) => {
        const isWrong = wrong === index
        const isRight = highlightCorrect && question.answer === index
        return (
          <button
            key={`${index}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(index)}
            aria-label={item.name}
            className={`grid place-items-center rounded-3xl transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            } anim-pop`}
            style={{
              width: 'clamp(76px, 20vw, 104px)',
              height: 'clamp(76px, 20vw, 104px)',
              fontSize: 'clamp(40px, 11vw, 58px)',
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              animationDelay: `${index * 70}ms`,
            }}
          >
            <span aria-hidden="true">{item.emoji}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Shadow match: a silhouette up top, the real things below — tap its owner. */
function ShadowStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'shadow-match' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { targetEmoji, choices } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* The shadow: same emoji, blacked out. Revealed on the right answer. */}
      <div
        className="grid place-items-center rounded-3xl bg-cream/70"
        style={{ width: 'clamp(104px, 28vw, 140px)', height: 'clamp(104px, 28vw, 140px)' }}
        role="img"
        aria-label="a mystery shadow"
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 'clamp(56px, 15vw, 80px)',
            lineHeight: 1,
            filter: highlightCorrect ? 'none' : 'brightness(0) opacity(0.72)',
            transition: 'filter 0.3s',
          }}
        >
          {targetEmoji}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        {choices.map((choice, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={choice.name}
              className={`grid place-items-center rounded-3xl transition-transform active:scale-95 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                width: 'clamp(76px, 20vw, 100px)',
                height: 'clamp(76px, 20vw, 100px)',
                fontSize: 'clamp(38px, 10vw, 54px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              }}
            >
              <span aria-hidden="true">{choice.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A soft analog clock face (shared by read-the-clock and set-the-clock). */
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  return (
    <svg
      width="min(46vw, 190px)"
      height="min(46vw, 190px)"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`a clock showing ${hour}:${minute === 0 ? '00' : minute}`}
    >
      <circle cx="50" cy="50" r="46" fill="var(--cream)" stroke="var(--grape)" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const isQuarter = i % 3 === 0
        const r1 = isQuarter ? 36 : 39
        return (
          <line
            key={i}
            x1={50 + r1 * Math.sin(a)}
            y1={50 - r1 * Math.cos(a)}
            x2={50 + 42 * Math.sin(a)}
            y2={50 - 42 * Math.cos(a)}
            stroke="var(--ink)"
            strokeWidth={isQuarter ? 3 : 1.6}
            strokeLinecap="round"
          />
        )
      })}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="27"
        stroke="var(--ink)"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="16"
        stroke="var(--coral)"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 50 50)`}
      />
      <circle cx="50" cy="50" r="4" fill="var(--ink)" />
    </svg>
  )
}

/** A golden coin face showing its value (shared by all money stages). */
function CoinFace({
  value,
  symbol,
  fontSize,
}: {
  value: number
  symbol: string
  fontSize: string
}) {
  return (
    <span
      className="grid h-full w-full place-items-center rounded-full font-bold text-ink"
      style={{
        background: 'var(--sun)',
        border: '4px solid var(--cream)',
        boxShadow: '0 4px 0 rgba(233,166,59,0.9)',
        fontSize,
      }}
    >
      {symbol}
      {value}
    </span>
  )
}

/** Two display groups + "same!" / "not the same!" judgement buttons. */
function SameOrNotStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'same-or-not' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (value: number) => void
}) {
  const { left, right } = question.payload
  const renderGroup = (group: ObjectGroup) => (
    <div
      className="flex flex-1 flex-wrap content-center items-center justify-center gap-0.5 rounded-3xl bg-cream/70 p-2"
      style={{ minHeight: 'clamp(90px, 24vw, 140px)', maxWidth: 190 }}
      role="img"
      aria-label={`${group.count} ${group.theme.plural}`}
    >
      {Array.from({ length: group.count }, (_, i) => (
        <span
          key={i}
          className="anim-pop"
          style={{ fontSize: 'clamp(22px, 6vw, 34px)', lineHeight: 1.1, animationDelay: `${i * 45}ms` }}
          aria-hidden="true"
        >
          {group.theme.emoji}
        </span>
      ))}
    </div>
  )

  const buttons: Array<{ value: number; label: string; icon: string }> = [
    { value: 1, label: 'the same', icon: '🟰' },
    { value: 0, label: 'not the same', icon: '❌' },
  ]
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-stretch justify-center gap-3">
        {renderGroup(left)}
        {renderGroup(right)}
      </div>
      <div className="flex items-center justify-center gap-3">
        {buttons.map(({ value, label, icon }) => {
          const isWrong = wrong === value
          const isRight = highlightCorrect && question.answer === value
          return (
            <button
              key={`${value}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(value)}
              aria-label={label}
              className={`grid place-items-center rounded-3xl transition-transform active:translate-y-1 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                width: 'clamp(84px, 24vw, 110px)',
                height: 'clamp(72px, 18vw, 92px)',
                fontSize: 'clamp(30px, 8vw, 42px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              }}
            >
              <span aria-hidden="true">{icon}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Generic two-sided answer stage for every "tap the correct side" activity:
 * numeral compare, coin compare, big/small, tall/short, heavy/light.
 */
function SideAnswerStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<
    Question,
    { activity: 'num-compare' | 'coin-compare' | 'size-compare' | 'height-compare' | 'weight-compare' }
  >
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (side: 'left' | 'right') => void
}) {
  const currencyId = useGameStore((s) => s.currency)
  const symbol = currencyById(currencyId).symbol

  function sideContent(side: 'left' | 'right') {
    switch (question.activity) {
      case 'num-compare': {
        const n = question.payload[side]
        return {
          aria: `the number ${n}`,
          node: (
            <span className="font-bold text-ink" style={{ fontSize: 'clamp(48px, 14vw, 72px)' }}>
              {n}
            </span>
          ),
        }
      }
      case 'coin-compare': {
        const v = question.payload[side]
        return {
          aria: `a ${symbol}${v} coin`,
          node: (
            <span style={{ width: 'clamp(72px, 19vw, 96px)', height: 'clamp(72px, 19vw, 96px)', display: 'inline-block' }}>
              <CoinFace value={v} symbol={symbol} fontSize="clamp(22px, 6vw, 30px)" />
            </span>
          ),
        }
      }
      case 'size-compare': {
        const big = question.payload.bigSide === side
        return {
          aria: `a ${big ? 'big' : 'small'} ${question.payload.item.name}`,
          node: (
            <span aria-hidden="true" style={{ fontSize: big ? 'clamp(64px, 17vw, 92px)' : 'clamp(30px, 8vw, 44px)', lineHeight: 1 }}>
              {question.payload.item.emoji}
            </span>
          ),
        }
      }
      case 'height-compare': {
        const blocks = question.payload[side]
        return {
          aria: `a tower of ${blocks} blocks`,
          node: (
            <span className="flex flex-col-reverse items-center" aria-hidden="true">
              {Array.from({ length: blocks }, (_, i) => (
                <span
                  key={i}
                  className="rounded-md"
                  style={{
                    width: 'clamp(30px, 8vw, 40px)',
                    height: 'clamp(14px, 3.6vw, 18px)',
                    background: 'var(--grape)',
                    border: '2px solid var(--cream)',
                    marginTop: 1,
                  }}
                />
              ))}
            </span>
          ),
        }
      }
      case 'weight-compare': {
        const item = question.payload[side]
        return {
          aria: item.name,
          node: (
            <span aria-hidden="true" style={{ fontSize: 'clamp(48px, 13vw, 68px)', lineHeight: 1 }}>
              {item.emoji}
            </span>
          ),
        }
      }
    }
  }

  const sides: Array<'left' | 'right'> = ['left', 'right']
  return (
    <div className="flex w-full items-stretch justify-center gap-3 sm:gap-6">
      {sides.map((side) => {
        const isWrong = wrong === side
        const isRight = highlightCorrect && question.answer === side
        const { aria, node } = sideContent(side)
        return (
          <button
            key={`${side}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(side)}
            aria-label={aria}
            className={`flex flex-1 items-end justify-center rounded-3xl p-4 pb-5 transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            }`}
            style={{
              minHeight: 'clamp(130px, 34vw, 200px)',
              maxWidth: 210,
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              border: '4px solid var(--cream)',
            }}
          >
            {node}
          </button>
        )
      })}
    </div>
  )
}

/** Friends flash, then one hides — pick who's gone from the same faces. */
function WhoLeftStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'who-left' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { items, missing, flashMs } = question.payload
  const [revealed, setRevealed] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setRevealed(false), flashMs)
    return () => clearTimeout(id)
  }, [flashMs])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* The scene: everyone during the flash, a gap where the friend was. */}
      <div
        className="flex items-center justify-center gap-3 rounded-3xl bg-cream/60 p-4"
        style={{ minHeight: 100 }}
      >
        {items.map((item, i) => {
          const gone = !revealed && i === missing && !highlightCorrect
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{
                fontSize: 'clamp(40px, 11vw, 56px)',
                lineHeight: 1,
                opacity: gone ? 0 : 1,
                transition: 'opacity 0.4s',
              }}
            >
              {gone ? '💨' : item.emoji}
            </span>
          )
        })}
      </div>

      {/* Only answerable once the friend has slipped away. */}
      <div className="flex items-center justify-center gap-3">
        {items.map((item, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled || revealed}
              onClick={() => onPick(index)}
              aria-label={item.name}
              className={`grid place-items-center rounded-3xl transition-transform active:scale-95 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                width: 'clamp(72px, 19vw, 96px)',
                height: 'clamp(72px, 19vw, 96px)',
                fontSize: 'clamp(34px, 9vw, 48px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
                opacity: revealed ? 0.45 : 1,
              }}
            >
              <span aria-hidden="true">{item.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Generic card row for belongs / position / day-time picks. */
function CardPickStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'belongs' | 'position' | 'day-time' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const cards =
    question.activity === 'belongs'
      ? question.payload.choices
      : question.activity === 'position'
        ? question.payload.items
        : question.payload.scenes

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Belongs shows its "these go together" pair above the choices. */}
      {question.activity === 'belongs' && (
        <div className="flex items-center gap-2 rounded-3xl bg-cream/60 px-5 py-3">
          {question.payload.shown.map((item, i) => (
            <span key={i} aria-hidden="true" style={{ fontSize: 'clamp(34px, 9vw, 48px)', lineHeight: 1 }}>
              {item.emoji}
            </span>
          ))}
          <span className="font-bold text-ink/60" style={{ fontSize: 'clamp(22px, 6vw, 30px)' }} aria-hidden="true">
            + ?
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {cards.map((card, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={card.name}
              className={`grid place-items-center rounded-3xl transition-transform active:scale-95 ${
                isWrong ? 'anim-shake' : ''
              } anim-pop`}
              style={{
                width: 'clamp(80px, 22vw, 104px)',
                height: 'clamp(80px, 22vw, 104px)',
                fontSize: 'clamp(38px, 10vw, 54px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
                animationDelay: `${index * 70}ms`,
              }}
            >
              <span aria-hidden="true">{card.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Bond: the target as a big numeral chip, the shown group, number buttons below. */
function BondStage({
  question,
  counted,
  onTapObject,
}: {
  question: Extract<Question, { activity: 'bond' }>
  counted: Record<string, number>
  onTapObject: (key: string) => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
          Make
        </span>
        <span
          className="grid place-items-center rounded-2xl bg-cream font-bold text-ink shadow-md"
          style={{
            minWidth: 'clamp(56px, 14vw, 72px)',
            height: 'clamp(56px, 14vw, 72px)',
            fontSize: 'clamp(30px, 8vw, 42px)',
          }}
        >
          {question.payload.target}
        </span>
      </div>
      <GroupCluster
        group={question.payload.group}
        keyPrefix="b"
        startIndex={0}
        counted={counted}
        onTapObject={onTapObject}
      />
    </div>
  )
}

/** Make-amount: tap coins to build the target (running total spoken), then ✔️. */
function MakeAmountStage({
  question,
  disabled,
  onSubmit,
}: {
  question: Extract<Question, { activity: 'make-amount' }>
  disabled: boolean
  onSubmit: (total: number) => void
}) {
  const currencyId = useGameStore((s) => s.currency)
  const symbol = currencyById(currencyId).symbol
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next)
    audio.sfx('pop')
    audio.sayNumber(next.size) // the running total IS the learning moment
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-cream/40 p-3"
        style={{ maxWidth: 'min(90vw, 380px)' }}
      >
        {Array.from({ length: question.payload.coinCount }, (_, i) => {
          const on = selected.has(i)
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => toggle(i)}
              aria-pressed={on}
              aria-label={on ? 'picked coin — tap to put back' : 'tap to pick this coin'}
              className="anim-pop relative transition-transform active:scale-90"
              style={{
                width: 'clamp(52px, 13vw, 68px)',
                height: 'clamp(52px, 13vw, 68px)',
                animationDelay: `${i * 50}ms`,
                transform: on ? 'translateY(-6px)' : undefined,
                filter: on ? 'none' : 'saturate(0.75)',
              }}
            >
              <CoinFace value={1} symbol={symbol} fontSize="clamp(15px, 4vw, 19px)" />
              {on && (
                <span
                  className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-leaf text-cream shadow"
                  style={{ fontSize: 13 }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={disabled || selected.size === 0}
        onClick={() => onSubmit(selected.size)}
        aria-label={`done — I picked ${selected.size}`}
        className="grid place-items-center rounded-full text-cream transition-transform active:translate-y-1"
        style={{
          width: 72,
          height: 72,
          fontSize: 30,
          background: 'var(--grape)',
          boxShadow: '0 6px 0 var(--grape-dp)',
          opacity: selected.size === 0 ? 0.55 : 1,
        }}
      >
        <span aria-hidden="true">✔️</span>
      </button>
    </div>
  )
}

/** Set-clock: turn the hour hand with a big button, then confirm. */
function SetClockStage({
  question,
  disabled,
  onSubmit,
}: {
  question: Extract<Question, { activity: 'set-clock' }>
  disabled: boolean
  onSubmit: (hour: number) => void
}) {
  const [hour, setHour] = useState(question.payload.startHour)

  function turn() {
    const next = (hour % 12) + 1
    setHour(next)
    audio.sfx('pop')
    audio.sayNumber(next)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ClockFace hour={hour} minute={0} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={turn}
          aria-label="turn the clock hand forward one hour"
          className="grid place-items-center rounded-full text-cream transition-transform active:rotate-12 active:scale-95"
          style={{
            width: 84,
            height: 84,
            fontSize: 34,
            background: 'var(--coral)',
            boxShadow: '0 6px 0 var(--coral-dp)',
          }}
        >
          <span aria-hidden="true">🔄</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit(hour)}
          aria-label={`done — the clock shows ${hour} o'clock`}
          className="grid place-items-center rounded-full text-cream transition-transform active:translate-y-1"
          style={{
            width: 72,
            height: 72,
            fontSize: 30,
            background: 'var(--grape)',
            boxShadow: '0 6px 0 var(--grape-dp)',
          }}
        >
          <span aria-hidden="true">✔️</span>
        </button>
      </div>
    </div>
  )
}

/** Tap-all: find every target shape; finding the last one answers itself. */
function TapAllStage({
  question,
  disabled,
  onComplete,
  onWrongTap,
}: {
  question: Extract<Question, { activity: 'tap-all' }>
  disabled: boolean
  onComplete: (count: number) => void
  onWrongTap: () => void
}) {
  const { shapeIds, targetId, count } = question.payload
  const [found, setFound] = useState<Set<number>>(new Set())

  function tap(i: number) {
    if (found.has(i)) return
    if (shapeIds[i] === targetId) {
      const next = new Set(found)
      next.add(i)
      setFound(next)
      audio.sfx('pop')
      audio.sayNumber(next.size)
      if (next.size >= count) onComplete(count)
    } else {
      onWrongTap()
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {shapeIds.map((shapeId, i) => {
        const isFound = found.has(i)
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || isFound}
            onClick={() => tap(i)}
            aria-label={`${shapeById(shapeId)?.name ?? shapeId}${isFound ? ', found' : ''}`}
            className="anim-pop relative grid place-items-center rounded-3xl transition-transform active:scale-95"
            style={{
              width: 'clamp(76px, 20vw, 100px)',
              height: 'clamp(76px, 20vw, 100px)',
              background: isFound ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 5px 0 ${isFound ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              animationDelay: `${i * 55}ms`,
            }}
          >
            <ShapeGlyph shapeId={shapeId} size={56} fill={isFound ? 'var(--cream)' : 'var(--grape)'} />
            {isFound && (
              <span
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-sun text-ink shadow"
                style={{ fontSize: 13 }}
                aria-hidden="true"
              >
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** A big expression card ("17 + 8", "3 × 5") — the mid band's symbol stage. */
function ExprCard({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-cream/80 px-8 py-6 shadow-md">
      <span
        className="font-bold text-ink"
        style={{ fontSize: 'clamp(44px, 12vw, 68px)', lineHeight: 1.1 }}
      >
        {text}
      </span>
      {sub && (
        <span className="font-semibold text-ink/60" style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

/** Base-ten blocks: flats of 100, rods of 10, single units. */
function PlaceValueStage({ value }: { value: number }) {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const ones = value % 10

  const grid = (deg: number, cell: number) =>
    `repeating-linear-gradient(${deg}deg, var(--cream) 0 1.5px, transparent 1.5px ${cell}px)`

  return (
    <div
      className="flex flex-wrap items-end justify-center gap-3 rounded-3xl bg-cream/40 p-4"
      style={{ maxWidth: 'min(92vw, 420px)' }}
      role="img"
      aria-label="base-ten blocks — count the hundreds, tens and ones"
    >
      {Array.from({ length: hundreds }, (_, i) => (
        <span
          key={`h${i}`}
          className="anim-pop rounded-md"
          aria-hidden="true"
          style={{
            width: 62,
            height: 62,
            background: 'var(--grape)',
            backgroundImage: `${grid(0, 6.2)}, ${grid(90, 6.2)}`,
            border: '2px solid var(--cream)',
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <span
          key={`t${i}`}
          className="anim-pop rounded-md"
          aria-hidden="true"
          style={{
            width: 15,
            height: 62,
            background: 'var(--coral)',
            backgroundImage: grid(0, 6.2),
            border: '2px solid var(--cream)',
            animationDelay: `${(hundreds + i) * 60}ms`,
          }}
        />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <span
          key={`o${i}`}
          className="anim-pop rounded-md"
          aria-hidden="true"
          style={{
            width: 15,
            height: 15,
            background: 'var(--sun)',
            border: '2px solid var(--cream)',
            animationDelay: `${(hundreds + tens + i) * 60}ms`,
          }}
        />
      ))}
    </div>
  )
}

/** Multiplication as equal groups: a boxes, b things in each. */
function MultiplyStage({
  question,
}: {
  question: Extract<Question, { activity: 'multiply' }>
}) {
  const { a, b, theme } = question.payload
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {Array.from({ length: a }, (_, g) => (
        <span
          key={g}
          className="anim-pop flex flex-wrap items-center justify-center gap-0.5 rounded-2xl bg-cream/80 p-2"
          style={{ maxWidth: 120, animationDelay: `${g * 90}ms` }}
          role="img"
          aria-label={`a group of ${b} ${theme.plural}`}
        >
          {Array.from({ length: b }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ fontSize: 'clamp(18px, 5vw, 26px)', lineHeight: 1.1 }}>
              {theme.emoji}
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}

/** Sharing: the pile up top, the empty plates waiting below. */
function ShareStage({
  question,
}: {
  question: Extract<Question, { activity: 'share' }>
}) {
  const { total, plates, theme } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="flex flex-wrap items-center justify-center gap-0.5 rounded-3xl bg-cream/60 p-3"
        style={{ maxWidth: 'min(90vw, 360px)' }}
        role="img"
        aria-label={`${total} ${theme.plural} to share`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="anim-pop"
            aria-hidden="true"
            style={{ fontSize: 'clamp(18px, 5vw, 26px)', lineHeight: 1.1, animationDelay: `${i * 35}ms` }}
          >
            {theme.emoji}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3" role="img" aria-label={`${plates} plates`}>
        {Array.from({ length: plates }, (_, i) => (
          <span key={i} aria-hidden="true" style={{ fontSize: 'clamp(34px, 9vw, 46px)' }}>
            🍽️
          </span>
        ))}
      </div>
    </div>
  )
}
