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
  'fraction-of', // fraction cards
  'unit-pick', // unit cards
  'graph-most', // tap a column
  'shape-sort', // tap a shape card
  'fraction-op', // fraction cards
  'build-graph', // its stage carries its own ✔️ submit
  'decimal', // decimal cards
  'equiv-pick', // equivalence cards
  'angle', // tap an angle card
  'chance', // tap a scale word
  'coord', // coordinate cards
  'chance-frac', // fraction cards
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
      | 'grid-rect'
      | 'elapsed'
      | 'change'
      | 'graph-count'
      | 'missing'
      | 'leftover'
      | 'word-problem'
      | 'read-scale'
      | 'column-op'
      | 'find-number'
      | 'percent-of'
      | 'negatives'
      | 'symmetry'
      | 'order-ops'
      | 'ratio'
      | 'mean'
      | 'convert'
      | 'volume'
      | 'angle-sum'
      | 'riddle'
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
          <ExprCard
            text={`${question.payload.value}`}
            sub={`round to the nearest ${question.payload.nearest === 100 ? 'hundred' : 'ten'}`}
          />
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
        ) : question.activity === 'fraction-of' ? (
          <FractionStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'unit-pick' ? (
          <UnitPickStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'grid-rect' ? (
          <GridRectStage question={question} />
        ) : question.activity === 'elapsed' ? (
          <div className="flex items-center justify-center gap-3">
            <ClockFace hour={question.payload.startHour} minute={0} />
            <span aria-hidden="true" className="font-bold text-ink/60" style={{ fontSize: 32 }}>
              →
            </span>
            <ClockFace hour={question.payload.endHour} minute={0} />
          </div>
        ) : question.activity === 'change' ? (
          <ChangeStage question={question} />
        ) : question.activity === 'graph-count' || question.activity === 'graph-most' ? (
          <GraphStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'shape-sort' ? (
          <ShapeSortStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'missing' ? (
          <ExprCard text={question.payload.text} />
        ) : question.activity === 'leftover' ? (
          <ExprCard text={`${question.payload.n} ÷ ${question.payload.b}`} sub="how many are left over?" />
        ) : question.activity === 'word-problem' ? (
          <div
            className="max-w-md rounded-3xl bg-cream/85 px-6 py-5 text-center font-semibold text-ink shadow-md"
            style={{ fontSize: 'clamp(18px, 4.8vw, 24px)', lineHeight: 1.45 }}
          >
            {question.payload.story}
          </div>
        ) : question.activity === 'fraction-op' ? (
          <FractionOpStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'read-scale' ? (
          <ReadScaleStage question={question} />
        ) : question.activity === 'build-graph' ? (
          <BuildGraphStage
            key={question.id}
            question={question}
            disabled={disabled}
            onSubmit={onAnswer}
          />
        ) : question.activity === 'column-op' ? (
          <ColumnOpStage question={question} />
        ) : question.activity === 'find-number' ? (
          <ExprCard text="👂" sub="listen for the number, then find it below" />
        ) : question.activity === 'decimal' ? (
          <DecimalStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'equiv-pick' ? (
          <div className="flex w-full flex-col items-center gap-5">
            <ExprCard text={question.payload.shown} />
            <FractionCards
              labels={question.payload.optionLabels}
              answer={question.answer}
              disabled={disabled}
              wrong={wrong}
              shakeToken={shakeToken}
              highlightCorrect={highlightCorrect}
              onPick={onAnswer}
            />
          </div>
        ) : question.activity === 'percent-of' ? (
          <ExprCard text={`${question.payload.pct}% of ${question.payload.of}`} />
        ) : question.activity === 'negatives' ? (
          <NumberLineStage question={question} />
        ) : question.activity === 'angle' ? (
          <AngleStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'symmetry' ? (
          <div className="grid place-items-center rounded-3xl bg-cream/60 p-5">
            <ShapeGlyph shapeId={question.payload.shapeId} size={120} />
          </div>
        ) : question.activity === 'order-ops' ? (
          <ExprCard text={question.payload.text} />
        ) : question.activity === 'ratio' ? (
          <RatioStage question={question} />
        ) : question.activity === 'mean' ? (
          <MeanStage question={question} />
        ) : question.activity === 'chance' ? (
          <ChanceStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
        ) : question.activity === 'convert' ? (
          <ExprCard
            text={`${question.payload.amount} ${question.payload.from} = ? ${question.payload.to}`}
          />
        ) : question.activity === 'volume' ? (
          question.payload.drawn ? (
            <VolumeStage question={question} />
          ) : (
            <ExprCard
              text={`${question.payload.w} × ${question.payload.h} × ${question.payload.d}`}
              sub="cubes long × tall × deep"
            />
          )
        ) : question.activity === 'angle-sum' ? (
          <ExprCard
            text={`${question.payload.parts.map((p) => `${p}°`).join(' + ')} + ?° = ${question.payload.total}°`}
            sub={
              question.payload.parts.length === 2
                ? 'the three angles of a triangle'
                : 'angles on a straight line'
            }
          />
        ) : question.activity === 'riddle' ? (
          <ExprCard text={question.payload.text} />
        ) : question.activity === 'chance-frac' ? (
          <div className="flex w-full flex-col items-center gap-5">
            <div
              className="max-w-md rounded-3xl bg-cream/85 px-6 py-5 text-center font-semibold text-ink shadow-md"
              style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', lineHeight: 1.45 }}
            >
              {question.payload.scenario}
            </div>
            <FractionCards
              labels={question.payload.optionLabels}
              answer={question.answer}
              disabled={disabled}
              wrong={wrong}
              shakeToken={shakeToken}
              highlightCorrect={highlightCorrect}
              onPick={onAnswer}
            />
          </div>
        ) : question.activity === 'coord' ? (
          <CoordStage
            question={question}
            disabled={disabled}
            wrong={wrong}
            shakeToken={shakeToken}
            highlightCorrect={highlightCorrect}
            onPick={onAnswer}
          />
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
  const timeLabel = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`

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

/** A partitioned bar with `num` of `den` cells shaded + fraction cards. */
/** One partitioned bar with `num` of `den` pieces shaded. */
function FractionBar({ num, den, height = 64 }: { num: number; den: number; height?: number }) {
  return (
    <div
      className="flex w-full max-w-sm overflow-hidden rounded-2xl"
      style={{ height, border: '4px solid var(--ink)' }}
      role="img"
      aria-label={`a bar cut into ${den} equal pieces with ${num} shaded`}
    >
      {Array.from({ length: den }, (_, i) => (
        <span
          key={i}
          className="h-full flex-1"
          style={{
            background: i < num ? 'var(--grape)' : 'var(--cream)',
            borderRight: i < den - 1 ? '3px solid var(--ink)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/** The tappable fraction cards, shared by fraction-of and fraction-op. */
function FractionCards({
  labels,
  answer,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  labels: string[]
  answer: number
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {labels.map((label, index) => {
        const isWrong = wrong === index
        const isRight = highlightCorrect && answer === index
        return (
          <button
            key={`${index}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(index)}
            aria-label={label.replace('/', ' over ')}
            className={`grid place-items-center rounded-3xl font-bold transition-transform active:translate-y-1 ${
              isWrong ? 'anim-shake' : ''
            }`}
            style={{
              minWidth: 'clamp(80px, 22vw, 104px)',
              height: 'clamp(72px, 18vw, 92px)',
              fontSize: 'clamp(26px, 7vw, 36px)',
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              color: 'var(--ink)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function FractionStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'fraction-of' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { num, den, optionLabels } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <FractionBar num={num} den={den} />
      <FractionCards
        labels={optionLabels}
        answer={question.answer}
        disabled={disabled}
        wrong={wrong}
        shakeToken={shakeToken}
        highlightCorrect={highlightCorrect}
        onPick={onPick}
      />
    </div>
  )
}

/** Equivalence (one labeled bar) or same-denominator add/subtract (two bars). */
function FractionOpStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'fraction-op' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { op, aNum, bNum, den, optionLabels } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {op === 'same' ? (
        <div className="flex w-full flex-col items-center gap-2">
          <FractionBar num={aNum} den={den} />
          <span
            className="rounded-full bg-cream/85 px-4 py-1 font-bold text-ink"
            style={{ fontSize: 'clamp(20px, 5.5vw, 26px)' }}
          >
            {aNum}/{den}
          </span>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-1.5">
          <FractionBar num={aNum} den={den} height={48} />
          <span
            className="font-bold text-ink/70"
            style={{ fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 }}
            aria-hidden="true"
          >
            {op === 'add' ? '+' : '−'}
          </span>
          <FractionBar num={bNum} den={den} height={48} />
        </div>
      )}
      <FractionCards
        labels={optionLabels}
        answer={question.answer}
        disabled={disabled}
        wrong={wrong}
        shakeToken={shakeToken}
        highlightCorrect={highlightCorrect}
        onPick={onPick}
      />
    </div>
  )
}

/** The thing to measure + unit cards (cm / m / kg / g / l / ml). */
function UnitPickStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'unit-pick' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { object, unitLabels } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-1 rounded-3xl bg-cream/70 px-8 py-4">
        <span aria-hidden="true" style={{ fontSize: 'clamp(48px, 13vw, 64px)', lineHeight: 1 }}>
          {object.emoji}
        </span>
        <span className="font-semibold text-ink/70" style={{ fontSize: 'clamp(14px, 3.8vw, 18px)' }}>
          {object.name}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {unitLabels.map((label, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={label}
              className={`grid place-items-center rounded-3xl font-bold transition-transform active:translate-y-1 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                minWidth: 'clamp(76px, 20vw, 96px)',
                height: 'clamp(68px, 17vw, 88px)',
                fontSize: 'clamp(24px, 6.5vw, 32px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                color: 'var(--ink)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A w×h rectangle of grid squares (area) or with a dashed walk (perimeter). */
function GridRectStage({
  question,
}: {
  question: Extract<Question, { activity: 'grid-rect' }>
}) {
  const { w, h, mode } = question.payload
  const cell = 'clamp(26px, 7vw, 38px)'
  return (
    <div
      className="rounded-2xl p-2"
      style={{
        border: mode === 'perimeter' ? '4px dashed var(--coral)' : '4px solid transparent',
      }}
      role="img"
      aria-label={`a rectangle ${w} squares wide and ${h} squares tall`}
    >
      <div
        className="grid overflow-hidden rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${w}, ${cell})`,
          gridAutoRows: cell,
          border: '3px solid var(--ink)',
        }}
      >
        {Array.from({ length: w * h }, (_, i) => (
          <span
            key={i}
            className="anim-pop"
            style={{
              background: 'var(--grape)',
              opacity: mode === 'area' ? 0.85 : 0.35,
              border: '1.5px solid var(--cream)',
              animationDelay: `${i * 20}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Price tag and payment — the change question, in the family's currency. */
function ChangeStage({
  question,
}: {
  question: Extract<Question, { activity: 'change' }>
}) {
  const currencyId = useGameStore((s) => s.currency)
  const symbol = currencyById(currencyId).symbol
  const { price, paid } = question.payload
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1 rounded-3xl bg-cream/85 px-6 py-4 shadow-md">
        <span aria-hidden="true" style={{ fontSize: 34 }}>
          🏷️
        </span>
        <span className="font-bold text-ink" style={{ fontSize: 'clamp(26px, 7vw, 36px)' }}>
          {symbol}
          {price}
        </span>
      </div>
      <span className="font-bold text-ink/50" style={{ fontSize: 30 }} aria-hidden="true">
        →
      </span>
      <div className="flex flex-col items-center gap-1 rounded-3xl bg-cream/85 px-6 py-4 shadow-md">
        <span aria-hidden="true" style={{ fontSize: 34 }}>
          💵
        </span>
        <span className="font-bold text-ink" style={{ fontSize: 'clamp(26px, 7vw, 36px)' }}>
          {symbol}
          {paid}
        </span>
      </div>
    </div>
  )
}

/** Block-graph columns; in "most" mode the columns themselves are the answer. */
function GraphStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'graph-count' | 'graph-most' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const tappable = question.activity === 'graph-most'
  const items = question.payload.items
  const target = question.activity === 'graph-count' ? question.payload.targetIndex : -1

  return (
    <div className="flex items-end justify-center gap-4 rounded-3xl bg-cream/40 p-4">
      {items.map((item, index) => {
        const isWrong = tappable && wrong === index
        const isRight = tappable && highlightCorrect && question.answer === index
        const column = (
          <>
            <span className="flex flex-col-reverse items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: item.value }, (_, i) => (
                <span
                  key={i}
                  className="anim-pop rounded-sm"
                  style={{
                    width: 'clamp(26px, 7vw, 34px)',
                    height: 'clamp(16px, 4.2vw, 20px)',
                    background: isRight ? 'var(--leaf)' : 'var(--grape)',
                    border: '2px solid var(--cream)',
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: 'clamp(24px, 6.5vw, 32px)',
                lineHeight: 1,
                outline: index === target ? '3px solid var(--coral)' : 'none',
                borderRadius: 8,
              }}
            >
              {item.emoji}
            </span>
          </>
        )
        return tappable ? (
          <button
            key={`${index}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(index)}
            aria-label={`the ${item.name} column`}
            className={`flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            }`}
          >
            {column}
          </button>
        ) : (
          <span
            key={index}
            className="flex flex-col items-center gap-1.5 p-1.5"
            role="img"
            aria-label={`${item.value} ${item.name} blocks`}
          >
            {column}
          </span>
        )
      })}
    </div>
  )
}

/** Shape cards to sort by side count. */
function ShapeSortStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'shape-sort' }>
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
              minHeight: 'clamp(100px, 26vw, 150px)',
              maxWidth: 150,
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              border: '4px solid var(--cream)',
            }}
          >
            <ShapeGlyph shapeId={shapeId} size={76} fill={isRight ? 'var(--cream)' : 'var(--grape)'} />
          </button>
        )
      })}
    </div>
  )
}

/** A partitioned ruler/scale with a pointer — the child reads the tick. */
function ReadScaleStage({
  question,
}: {
  question: Extract<Question, { activity: 'read-scale' }>
}) {
  const { max, step, labelEvery, value, unit } = question.payload
  const W = 340
  const H = 84
  const PAD = 22
  const x = (v: number) => PAD + (v / max) * (W - 2 * PAD)
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-3xl bg-cream/85 px-4 pb-3 pt-4 shadow-md"
      role="img"
      aria-label={`a ${unit} scale from 0 to ${max} with an arrow pointing at one of the small marks`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'min(88vw, 440px)' }} aria-hidden="true">
        <polygon
          points={`${x(value) - 9},14 ${x(value) + 9},14 ${x(value)},30`}
          fill="var(--coral)"
        />
        <line
          x1={PAD}
          y1={48}
          x2={W - PAD}
          y2={48}
          stroke="var(--ink)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {ticks.map((v) => {
          const major = v % labelEvery === 0
          return (
            <g key={v}>
              <line
                x1={x(v)}
                y1={48}
                x2={x(v)}
                y2={major ? 34 : 39}
                stroke="var(--ink)"
                strokeWidth={major ? 3 : 2}
                strokeLinecap="round"
              />
              {major && (
                <text
                  x={x(v)}
                  y={68}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={700}
                  fill="var(--ink)"
                >
                  {v}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <span className="rounded-full bg-sun px-3 py-0.5 font-bold text-ink" style={{ fontSize: 14 }}>
        {unit}
      </span>
    </div>
  )
}

/** The written method: operands stacked in columns over a rule, ? below. */
function ColumnOpStage({
  question,
}: {
  question: Extract<Question, { activity: 'column-op' }>
}) {
  const { a, b, op } = question.payload
  const width = Math.max(String(a).length, String(b).length)
  const cell = 'clamp(34px, 9vw, 48px)'
  const digitRow = (n: number, sign?: string) => (
    <div className="flex">
      <span className="text-center text-ink/70" style={{ width: cell }}>
        {sign ?? ''}
      </span>
      {String(n)
        .padStart(width, ' ')
        .split('')
        .map((c, i) => (
          <span key={i} className="text-center" style={{ width: cell }}>
            {c === ' ' ? '' : c}
          </span>
        ))}
    </div>
  )
  return (
    <div
      className="flex flex-col items-center rounded-3xl bg-cream/80 px-8 py-5 shadow-md"
      role="img"
      aria-label={`${a} ${op === '+' ? 'plus' : 'minus'} ${b}, written in columns`}
    >
      <div
        className="flex flex-col items-end font-bold text-ink"
        style={{ fontSize: 'clamp(36px, 9.5vw, 54px)', lineHeight: 1.15 }}
      >
        {digitRow(a)}
        {digitRow(b, op === '+' ? '+' : '−')}
        <div className="my-1 w-full rounded-full" style={{ height: 5, background: 'var(--ink)' }} />
        <div className="flex w-full justify-center text-ink/45">?</div>
      </div>
    </div>
  )
}

/** Tally marks: groups of five — four strokes and the diagonal gate. */
function TallyMarks({ count }: { count: number }) {
  const groups: number[] = []
  for (let left = count; left > 0; left -= 5) groups.push(Math.min(left, 5))
  return (
    <span className="flex items-center gap-2" role="img" aria-label={`a tally of ${count}`}>
      {groups.map((g, gi) => (
        <span key={gi} className="relative flex items-center px-0.5" style={{ gap: 4 }}>
          {Array.from({ length: Math.min(g, 4) }, (_, i) => (
            <span
              key={i}
              style={{ width: 3.5, height: 24, background: 'var(--ink)', borderRadius: 2 }}
            />
          ))}
          {g === 5 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -3,
                right: -3,
                top: '50%',
                height: 3.5,
                background: 'var(--ink)',
                borderRadius: 2,
                transform: 'rotate(-24deg)',
              }}
            />
          )}
        </span>
      ))}
    </span>
  )
}

/** Build-graph: tap columns up to match the tally chart, then confirm. */
function BuildGraphStage({
  question,
  disabled,
  onSubmit,
}: {
  question: Extract<Question, { activity: 'build-graph' }>
  disabled: boolean
  onSubmit: (encoded: number) => void
}) {
  const { items, maxHeight } = question.payload
  const [built, setBuilt] = useState<number[]>(() => items.map(() => 0))

  function tapColumn(i: number) {
    const next = [...built]
    next[i] = (next[i] + 1) % (maxHeight + 1) // past the top wraps to 0 — always correctable
    setBuilt(next)
    audio.sfx('pop')
    audio.sayNumber(next[i])
  }

  const encoded = built.reduce((acc, h) => acc * 10 + h, 0)

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* The data to match — a tally chart. */}
      <div className="flex items-end justify-center gap-5 rounded-3xl bg-cream/85 px-5 py-3 shadow-md">
        {items.map((item, i) => (
          <span key={i} className="flex flex-col items-center gap-1.5">
            <TallyMarks count={item.value} />
            <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1 }}>
              {item.emoji}
            </span>
            <span className="sr-only">{`${item.value} ${item.name}`}</span>
          </span>
        ))}
      </div>

      {/* The board being built. */}
      <div className="flex items-end justify-center gap-4 rounded-3xl bg-cream/40 p-4">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => tapColumn(i)}
            aria-label={`the ${item.name} tower — ${built[i]} blocks so far`}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-transform active:scale-95"
          >
            <span className="flex flex-col-reverse items-center gap-0.5">
              {Array.from({ length: maxHeight }, (_, r) => (
                <span
                  key={r}
                  className="rounded-sm"
                  style={{
                    width: 'clamp(26px, 7vw, 34px)',
                    height: 'clamp(16px, 4.2vw, 20px)',
                    background: r < built[i] ? 'var(--grape)' : 'transparent',
                    border: r < built[i] ? '2px solid var(--cream)' : '2px dashed rgba(74,58,107,0.3)',
                  }}
                />
              ))}
            </span>
            <span
              aria-hidden="true"
              style={{ fontSize: 'clamp(24px, 6.5vw, 32px)', lineHeight: 1 }}
            >
              {item.emoji}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(encoded)}
        aria-label="done — check my graph"
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
  )
}

/** Tenths bar or hundred-square, then decimal cards. */
function DecimalStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'decimal' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { num, den, optionLabels } = question.payload
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {den === 10 ? (
        <FractionBar num={num} den={10} />
      ) : (
        <div
          className="grid overflow-hidden rounded-xl"
          style={{
            gridTemplateColumns: 'repeat(10, clamp(14px, 3.4vw, 22px))',
            gridAutoRows: 'clamp(14px, 3.4vw, 22px)',
            border: '3px solid var(--ink)',
          }}
          role="img"
          aria-label={`a hundred-square with ${num} parts shaded`}
        >
          {Array.from({ length: 100 }, (_, i) => (
            <span
              key={i}
              style={{
                background: i < num ? 'var(--grape)' : 'var(--cream)',
                border: '1px solid rgba(74,58,107,0.25)',
              }}
            />
          ))}
        </div>
      )}
      <FractionCards
        labels={optionLabels}
        answer={question.answer}
        disabled={disabled}
        wrong={wrong}
        shakeToken={shakeToken}
        highlightCorrect={highlightCorrect}
        onPick={onPick}
      />
    </div>
  )
}

/** The −max..max number line; zero glows coral. Arrow only in read mode;
 *  gap mode marks its two temperatures as dots instead. */
function NumberLineStage({
  question,
}: {
  question: Extract<Question, { activity: 'negatives' }>
}) {
  const { min, max, value, expr, marks } = question.payload
  const W = 360
  const PAD = 16
  const x = (v: number) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD)
  const ticks: number[] = []
  for (let v = min; v <= max; v++) ticks.push(v)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {expr && <ExprCard text={expr} />}
      <div
        className="rounded-3xl bg-cream/85 px-3 pb-2 pt-3 shadow-md"
        role="img"
        aria-label={
          marks
            ? `a number line from ${min} to ${max} with dots at ${marks[0]} and ${marks[1]}`
            : expr
              ? `a number line from ${min} to ${max} to help you count below zero`
              : `a number line from ${min} to ${max} with an arrow on one tick`
        }
      >
        <svg viewBox={`0 0 ${W} 74`} style={{ width: 'min(90vw, 460px)' }} aria-hidden="true">
          {!expr && !marks && (
            <polygon
              points={`${x(value) - 8},10 ${x(value) + 8},10 ${x(value)},25`}
              fill="var(--coral)"
            />
          )}
          {marks?.map((m, i) => (
            <circle
              key={i}
              cx={x(m)}
              cy={42}
              r={7}
              fill={i === 0 ? 'var(--grape)' : 'var(--coral)'}
              stroke="var(--cream)"
              strokeWidth={2.5}
            />
          ))}
          <line
            x1={PAD}
            y1={42}
            x2={W - PAD}
            y2={42}
            stroke="var(--ink)"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          {ticks.map((v) => {
            const major = v % 5 === 0
            return (
              <g key={v}>
                <line
                  x1={x(v)}
                  y1={42}
                  x2={x(v)}
                  y2={major ? 30 : 35}
                  stroke={v === 0 ? 'var(--coral)' : 'var(--ink)'}
                  strokeWidth={v === 0 ? 3 : major ? 2.5 : 1.5}
                />
                {major && (
                  <text
                    x={x(v)}
                    y={62}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill={v === 0 ? 'var(--coral)' : 'var(--ink)'}
                  >
                    {v}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/** Two rays and an arc — an angle drawn, never labeled. */
function AngleGlyph({ degrees }: { degrees: number }) {
  const cx = 46
  const cy = 66
  const r = 40
  const ar = 16
  const rad = (degrees * Math.PI) / 180
  const ex = cx + r * Math.cos(rad)
  const ey = cy - r * Math.sin(rad)
  const ax = cx + ar * Math.cos(rad)
  const ay = cy - ar * Math.sin(rad)
  return (
    <svg viewBox="0 0 96 80" style={{ width: '100%', maxWidth: 96 }} aria-hidden="true">
      <path
        d={`M ${cx + ar} ${cy} A ${ar} ${ar} 0 0 0 ${ax} ${ay}`}
        fill="none"
        stroke="var(--coral)"
        strokeWidth={3}
      />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="var(--grape)" strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--grape)" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

/** Three drawn angles; tap the one the prompt asked for. */
function AngleStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'angle' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const kindOf = (deg: number) =>
    deg === 90 ? 'a right angle' : deg < 90 ? 'a sharp angle' : 'a wide angle'
  return (
    <div className="flex w-full items-stretch justify-center gap-3 sm:gap-5">
      {question.payload.degrees.map((deg, index) => {
        const isWrong = wrong === index
        const isRight = highlightCorrect && question.answer === index
        return (
          <button
            key={`${index}-${isWrong ? shakeToken : 'base'}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(index)}
            aria-label={kindOf(deg)}
            className={`grid flex-1 place-items-center rounded-3xl p-3 transition-transform active:scale-95 ${
              isWrong ? 'anim-shake' : ''
            }`}
            style={{
              minHeight: 'clamp(96px, 25vw, 140px)',
              maxWidth: 140,
              background: isRight ? 'var(--leaf)' : 'var(--cream)',
              boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
            }}
          >
            <AngleGlyph degrees={deg} />
          </button>
        )
      })}
    </div>
  )
}

/** "a for every b", then the scaled row with a ? — count the partner group. */
function RatioStage({ question }: { question: Extract<Question, { activity: 'ratio' }> }) {
  const { a, b, scaledA, aEmoji, bEmoji, aName, bName, total } = question.payload
  const row = (emoji: string, count: number) => (
    <span className="flex flex-wrap items-center justify-center gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ fontSize: 'clamp(20px, 5vw, 26px)', lineHeight: 1 }}>
          {emoji}
        </span>
      ))}
    </span>
  )
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-2">
      <div
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-cream/85 px-5 py-3 shadow-md"
        role="img"
        aria-label={`${a} ${aName} for every ${b} ${bName}`}
      >
        {row(aEmoji, a)}
        <span className="font-bold text-ink/50" aria-hidden="true">
          with
        </span>
        {row(bEmoji, b)}
      </div>
      <span aria-hidden="true" className="font-bold text-ink/50" style={{ fontSize: 24 }}>
        ↓
      </span>
      {total !== undefined ? (
        // Share mode: the combined pile is known; how many are a's kind?
        <div
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-cream/85 px-5 py-3 shadow-md"
          role="img"
          aria-label={`${total} altogether — how many ${aName}?`}
        >
          <span className="font-bold text-ink" style={{ fontSize: 'clamp(26px, 7vw, 34px)' }}>
            {total}
          </span>
          <span className="font-bold text-ink/50" aria-hidden="true">
            altogether —
          </span>
          <span aria-hidden="true" style={{ fontSize: 'clamp(20px, 5vw, 26px)', lineHeight: 1 }}>
            {aEmoji}
          </span>
          <span
            className="grid place-items-center rounded-xl bg-sun font-bold text-ink"
            style={{ width: 40, height: 40, fontSize: 22 }}
            aria-hidden="true"
          >
            ?
          </span>
        </div>
      ) : (
        <div
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-cream/85 px-5 py-3 shadow-md"
          role="img"
          aria-label={`${scaledA} ${aName} with how many ${bName}?`}
        >
          {row(aEmoji, scaledA)}
          <span className="font-bold text-ink/50" aria-hidden="true">
            with
          </span>
          <span
            className="grid place-items-center rounded-xl bg-sun font-bold text-ink"
            style={{ width: 40, height: 40, fontSize: 22 }}
            aria-hidden="true"
          >
            ?
          </span>
        </div>
      )}
    </div>
  )
}

/** The score chips whose mean is wanted; missing mode hides one behind ?. */
function MeanStage({ question }: { question: Extract<Question, { activity: 'mean' }> }) {
  const { values, hiddenIndex, mean } = question.payload
  const shown = values.filter((_, i) => i !== hiddenIndex)
  return (
    <div className="flex flex-col items-center gap-3">
      {hiddenIndex !== undefined && (
        <span
          className="rounded-full bg-cream/85 px-4 py-1 font-bold text-ink shadow-sm"
          style={{ fontSize: 'clamp(15px, 4vw, 19px)' }}
        >
          mean = {mean}
        </span>
      )}
      <div
        className="flex items-center justify-center gap-3"
        role="img"
        aria-label={
          hiddenIndex === undefined
            ? `the scores are ${values.join(', ')}`
            : `the scores are ${shown.join(', ')} and one hidden score`
        }
      >
        {values.map((v, i) => {
          const hidden = i === hiddenIndex
          return (
            <span
              key={i}
              className={`anim-pop grid place-items-center rounded-2xl font-bold text-ink shadow-md ${
                hidden ? 'bg-sun' : 'bg-cream/85'
              }`}
              style={{
                width: 'clamp(56px, 14vw, 72px)',
                height: 'clamp(56px, 14vw, 72px)',
                fontSize: 'clamp(26px, 7vw, 34px)',
                animationDelay: `${i * 60}ms`,
              }}
            >
              {hidden ? '?' : v}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** A scenario and the three scale words — certain, maybe, impossible. */
function ChanceStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'chance' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        className="max-w-md rounded-3xl bg-cream/85 px-6 py-5 text-center font-semibold text-ink shadow-md"
        style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', lineHeight: 1.45 }}
      >
        {question.payload.scenario}
      </div>
      <div className="flex w-full max-w-md items-stretch justify-center gap-2.5">
        {question.payload.optionLabels.map((label, index) => {
          const isWrong = wrong === index
          const isRight = highlightCorrect && question.answer === index
          return (
            <button
              key={`${index}-${isWrong ? shakeToken : 'base'}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(index)}
              aria-label={label}
              className={`flex-1 rounded-3xl px-2 py-4 font-bold transition-transform active:translate-y-1 ${
                isWrong ? 'anim-shake' : ''
              }`}
              style={{
                minHeight: 64,
                fontSize: 'clamp(15px, 4vw, 20px)',
                background: isRight ? 'var(--leaf)' : 'var(--cream)',
                color: 'var(--ink)',
                boxShadow: `0 6px 0 ${isRight ? 'var(--leaf-dp)' : 'rgba(74,58,107,0.15)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** `d` identical w×h layers, side by side — count all the cubes. */
function VolumeStage({ question }: { question: Extract<Question, { activity: 'volume' }> }) {
  const { w, h, d } = question.payload
  const cell = 'clamp(20px, 5vw, 30px)'
  return (
    <div
      className="flex items-center justify-center gap-3"
      role="img"
      aria-label={`${d} identical layers, each ${w} cubes wide and ${h} cubes tall`}
    >
      {Array.from({ length: d }, (_, layer) => (
        <div key={layer} className="flex flex-col items-center gap-1">
          <div
            className="grid overflow-hidden rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${w}, ${cell})`,
              gridAutoRows: cell,
              border: '3px solid var(--ink)',
            }}
          >
            {Array.from({ length: w * h }, (_, i) => (
              <span
                key={i}
                className="anim-pop"
                style={{
                  background: 'var(--grape)',
                  opacity: 0.85,
                  border: '1.5px solid var(--cream)',
                  animationDelay: `${(layer * w * h + i) * 15}ms`,
                }}
              />
            ))}
          </div>
          <span className="font-semibold text-ink/60" style={{ fontSize: 12 }}>
            layer {layer + 1}
          </span>
        </div>
      ))}
    </div>
  )
}

/** A first-quadrant grid with a star; pick its coordinates. */
function CoordStage({
  question,
  disabled,
  wrong,
  shakeToken,
  highlightCorrect,
  onPick,
}: {
  question: Extract<Question, { activity: 'coord' }>
  disabled: boolean
  wrong: Answer | null
  shakeToken: number
  highlightCorrect: boolean
  onPick: (index: number) => void
}) {
  const { x: px, y: py, size, optionLabels } = question.payload
  const min = question.payload.min ?? 0 // < 0 opens all four quadrants
  const W = 240
  const PAD = 26
  const step = (W - PAD - 10) / (size - min)
  const gx = (v: number) => PAD + (v - min) * step
  const gy = (v: number) => W - PAD - (v - min) * step
  const fourQuad = min < 0
  const labelSize = fourQuad ? 10 : 12
  const lines: number[] = []
  for (let i = min; i <= size; i++) lines.push(i)
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="rounded-3xl bg-cream/85 p-2 shadow-md"
        role="img"
        aria-label={
          fourQuad
            ? 'a four-quadrant grid with a star — minus means left or down'
            : 'a grid with a star at one point — across first, then up'
        }
      >
        <svg viewBox={`0 0 ${W} ${W}`} style={{ width: 'min(62vw, 260px)' }} aria-hidden="true">
          {lines.map((i) => (
            <g key={i}>
              <line
                x1={gx(min)}
                y1={gy(i)}
                x2={gx(size)}
                y2={gy(i)}
                stroke={i === 0 ? 'var(--ink)' : 'rgba(74,58,107,0.25)'}
                strokeWidth={i === 0 ? 3 : 1.5}
              />
              <line
                x1={gx(i)}
                y1={gy(min)}
                x2={gx(i)}
                y2={gy(size)}
                stroke={i === 0 ? 'var(--ink)' : 'rgba(74,58,107,0.25)'}
                strokeWidth={i === 0 ? 3 : 1.5}
              />
              {(!fourQuad || i !== 0) && (
                <text
                  x={gx(i)}
                  y={gy(0) + 16}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fontWeight={700}
                  fill="var(--ink)"
                >
                  {i}
                </text>
              )}
              {i !== 0 && (
                <text
                  x={gx(0) - 11}
                  y={gy(i) + 4}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fontWeight={700}
                  fill="var(--ink)"
                >
                  {i}
                </text>
              )}
            </g>
          ))}
          <text x={gx(px)} y={gy(py) + 7} textAnchor="middle" fontSize={22}>
            ⭐
          </text>
        </svg>
      </div>
      <FractionCards
        labels={optionLabels}
        answer={question.answer}
        disabled={disabled}
        wrong={wrong}
        shakeToken={shakeToken}
        highlightCorrect={highlightCorrect}
        onPick={onPick}
      />
    </div>
  )
}
