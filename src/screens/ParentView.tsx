import { useEffect, useRef, useState } from 'react'
import { useGameStore, hasCleared, isLevelUnlocked } from '../engine/store'
import { CATEGORIES, TRAIL, categoriesForBand, levelsInCategory } from '../content/math'
import { PACE_PLANS, PACE_QUESTIONS, planFor } from '../engine/pace'
import { AGES, bandForAge, bandLabel } from '../engine/band'
import { CURRENCIES, currencyById } from '../content/currency'
import { audio } from '../audio/AudioManager'

/**
 * "For grown-ups" — an adults-only progress panel (spec §11: the parent/teacher
 * is often the actual buyer). This screen is the one deliberate exception to the
 * game's no-reading rule: it's for a reading adult, never shown to the child in
 * normal play, and reached only via the discreet corner button on the map.
 *
 * The only destructive action — resetting all progress — sits behind a small
 * addition challenge. Adding is the last, hardest rung of the 4–6 band (Level
 * 5), so a pre-reader can't clear their own progress by mashing buttons, while a
 * grown-up passes it instantly. On-theme, keyboard-accessible, no PIN to forget.
 */

interface ParentViewProps {
  onClose: () => void
}

interface Gate {
  a: number
  b: number
  answer: number
  options: number[]
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A fresh addition gate: two addends in 2–8, three distinct answer options. */
function makeGate(): Gate {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 2 + Math.floor(Math.random() * 7)
  const answer = a + b
  const distractors = new Set<number>()
  while (distractors.size < 2) {
    const delta = (1 + Math.floor(Math.random() * 3)) * (Math.random() < 0.5 ? -1 : 1)
    const d = answer + delta
    if (d > 0 && d !== answer) distractors.add(d)
  }
  return { a, b, answer, options: shuffle([answer, ...distractors]) }
}

type Mode = 'view' | 'confirm' | 'done'

export default function ParentView({ onClose }: ParentViewProps) {
  const stars = useGameStore((s) => s.stars)
  const progress = useGameStore((s) => s.progress)
  const reset = useGameStore((s) => s.reset)

  const [mode, setMode] = useState<Mode>('view')
  const [gate, setGate] = useState<Gate>(makeGate)
  const [wrongToken, setWrongToken] = useState(0) // re-key the shaken button
  // The chapter-by-chapter breakdown lives on its own page — 33 categories ×
  // 146 levels would bury the settings below a scroll of pills.
  const [showProgress, setShowProgress] = useState(false)

  // A wrong gate tap re-keys (remounts) the option buttons, which would dump
  // keyboard focus onto <body>; put it back on the first fresh option.
  const gateOptionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (wrongToken > 0) gateOptionsRef.current?.querySelector('button')?.focus()
  }, [wrongToken])

  // "Mastered" counts only EARNED clears; placement grants position, not credit.
  const masteredCount = TRAIL.filter(
    (l) => hasCleared(progress, l.id) && !progress[l.id]?.placed,
  ).length
  const finishedCategories = CATEGORIES.filter((c) =>
    levelsInCategory(c.id).every((l) => hasCleared(progress, l.id)),
  ).length

  function tapGate(value: number) {
    if (value === gate.answer) {
      reset()
      setMode('done')
    } else {
      setGate(makeGate())
      setWrongToken((t) => t + 1)
    }
  }

  if (showProgress) {
    return <ProgressPage onBack={() => setShowProgress(false)} />
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Header */}
      <header className="safe-pt sticky top-0 z-10 flex items-center justify-between gap-2 bg-sky-1/70 p-4 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          aria-label="Done, back to the meadow"
          className="flex items-center gap-2 rounded-full bg-cream px-5 py-2 font-bold text-ink shadow-md transition-transform active:scale-95"
        >
          <span aria-hidden="true">⬅️</span>
          <span>Done</span>
        </button>
        <h1 className="font-bold text-ink" style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>
          For grown-ups
        </h1>
      </header>

      <main className="safe-pb mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
        {/* Summary */}
        <section className="grid grid-cols-3 gap-3" aria-label="Progress summary">
          <Stat value={String(stars)} label="Stars" icon="⭐" />
          <Stat value={`${masteredCount}/${TRAIL.length}`} label="Mastered" icon="🏅" />
          <Stat
            value={`${finishedCategories}/${CATEGORIES.length}`}
            label="Categories"
            icon="🌈"
          />
        </section>

        {/* Child's name → the meadow greeting + in-play status chip */}
        <NameSection />

        {/* Child's age → which band of the meadow they see */}
        <AgeSection />

        {/* Family currency → what the Money coins show */}
        <CurrencySection />

        {/* Twinkle's voice → which TTS voice speaks, with instant preview */}
        <VoiceSection />

        {/* Learning pace: quiz → suggested session plan */}
        <PaceSection />

        {/* The full chapter-by-chapter breakdown lives on its own page. */}
        <section aria-label="Chapter progress">
          <button
            type="button"
            onClick={() => setShowProgress(true)}
            aria-label="Chapter progress"
            className="flex w-full items-center gap-3 rounded-3xl bg-cream/70 p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
          >
            <span aria-hidden="true" style={{ fontSize: 24 }}>
              📚
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">Chapter progress</span>
              <span className="block text-sm font-semibold text-ink/70">
                Every chapter and level — status, best streaks and sprint scores
              </span>
            </span>
            <span aria-hidden="true" className="font-bold text-ink/50" style={{ fontSize: 22 }}>
              →
            </span>
          </button>
        </section>

        {/* Privacy note — reassurance for the buying adult (spec §11). */}
        <p className="px-2 text-center text-sm font-semibold text-ink/60">
          Progress is saved on this device only. No account, no sign-in, and
          nothing is collected or sent anywhere.
        </p>

        {/* Reset */}
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-cream/70 p-4">
          {mode === 'view' && (
            <button
              type="button"
              onClick={() => {
                setGate(makeGate())
                setMode('confirm')
              }}
              className="rounded-2xl bg-cream px-6 py-3 font-bold text-coral shadow-md transition-transform active:scale-95"
              style={{ border: '2px solid var(--coral)' }}
            >
              Reset all progress
            </button>
          )}

          {mode === 'confirm' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center font-semibold text-ink/80">
                This erases every star and unlocked level, and the game will
                ask the child’s age again — perfect for handing over to a new
                player. To confirm, tap the answer:
              </p>
              <p className="font-bold text-ink" style={{ fontSize: 'clamp(28px, 8vw, 40px)' }}>
                {gate.a} + {gate.b} = ?
              </p>
              <div ref={gateOptionsRef} className="flex flex-wrap items-center justify-center gap-3">
                {gate.options.map((opt) => (
                  <button
                    // Re-key on each wrong tap so the shuffled row re-mounts fresh.
                    key={`${opt}-${wrongToken}`}
                    type="button"
                    onClick={() => tapGate(opt)}
                    aria-label={String(opt)}
                    className="grid place-items-center rounded-2xl bg-grape font-bold text-cream transition-transform active:translate-y-1"
                    style={{
                      minWidth: 72,
                      height: 68,
                      fontSize: 30,
                      boxShadow: '0 5px 0 var(--grape-dp)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="rounded-2xl bg-cream px-5 py-2 font-bold text-ink shadow-sm transition-transform active:scale-95"
              >
                Cancel
              </button>
            </div>
          )}

          {mode === 'done' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center font-bold text-ink">
                Progress reset — the game will ask the child’s age next. 🌱
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-grape px-6 py-3 font-bold text-cream shadow-md transition-transform active:scale-95"
                style={{ boxShadow: '0 5px 0 var(--grape-dp)' }}
              >
                Back to the start
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

/**
 * Chapter progress — the full per-category, per-level breakdown (status
 * pills, best streaks, sprint bests). Its own page so the settings screen
 * stays a short scroll; reached via the "Chapter progress" card.
 */
function ProgressPage({ onBack }: { onBack: () => void }) {
  const stars = useGameStore((s) => s.stars)
  const progress = useGameStore((s) => s.progress)
  const bestScores = useGameStore((s) => s.bestScores)

  // "Mastered" counts only EARNED clears; placement grants position, not credit.
  const masteredCount = TRAIL.filter(
    (l) => hasCleared(progress, l.id) && !progress[l.id]?.placed,
  ).length
  const finishedCategories = CATEGORIES.filter((c) =>
    levelsInCategory(c.id).every((l) => hasCleared(progress, l.id)),
  ).length

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-sky-1 to-sky-2">
      <header className="safe-pt sticky top-0 z-10 flex items-center justify-between gap-2 bg-sky-1/70 p-4 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to settings"
          className="flex items-center gap-2 rounded-full bg-cream px-5 py-2 font-bold text-ink shadow-md transition-transform active:scale-95"
        >
          <span aria-hidden="true">⬅️</span>
          <span>Settings</span>
        </button>
        <h1 className="font-bold text-ink" style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>
          Chapter progress
        </h1>
      </header>

      <main className="safe-pb mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
        <section className="grid grid-cols-3 gap-3" aria-label="Progress summary">
          <Stat value={String(stars)} label="Stars" icon="⭐" />
          <Stat value={`${masteredCount}/${TRAIL.length}`} label="Mastered" icon="🏅" />
          <Stat
            value={`${finishedCategories}/${CATEGORIES.length}`}
            label="Categories"
            icon="🌈"
          />
        </section>

        {CATEGORIES.map((category) => {
          const levels = levelsInCategory(category.id)
          return (
            <section
              key={category.id}
              className="flex flex-col gap-2 rounded-3xl bg-cream/70 p-3"
              aria-label={`${category.name} progress`}
            >
              <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {category.icon}
                </span>
                {category.name}
              </h2>
              {levels.map((level) => {
                const cleared = hasCleared(progress, level.id)
                const unlocked = isLevelUnlocked(level, levels, progress)
                const best = progress[level.id]?.bestStreak ?? 0
                const status = cleared
                  ? progress[level.id]?.placed
                    ? 'Placed'
                    : 'Mastered'
                  : unlocked
                    ? 'In progress'
                    : 'Locked'
                return (
                  <div
                    key={level.id}
                    className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2"
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                      style={{ background: unlocked ? 'var(--sky-2)' : 'var(--locked)', fontSize: 24 }}
                      aria-hidden="true"
                    >
                      {unlocked ? level.icon : '🔒'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{level.name}</p>
                      {best > 0 && (
                        <p className="text-sm font-semibold text-ink/60">
                          Best: {best} in a row
                        </p>
                      )}
                      {(bestScores[level.id] ?? 0) > 0 && (
                        <p className="text-sm font-semibold text-ink/60">
                          🏆 Sprint best: {bestScores[level.id]}
                        </p>
                      )}
                    </div>
                    <StatusPill status={status} />
                  </div>
                )
              })}
            </section>
          )
        })}
      </main>
    </div>
  )
}

/**
 * Child's name — greets on the meadow and rides the in-play status chip.
 * Cosmetic only; saved locally like everything else. Saving an empty field
 * clears it.
 */
function NameSection() {
  const name = useGameStore((s) => s.name)
  const setName = useGameStore((s) => s.setName)
  const [draft, setDraft] = useState(name ?? '')

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-cream/70 p-4"
      aria-label="Child's name"
    >
      <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          🧒
        </span>
        Child’s name
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setName(draft)
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={20}
          autoComplete="off"
          autoCapitalize="words"
          aria-label="Child's name input"
          placeholder="Add a name"
          className="min-w-0 flex-1 rounded-2xl bg-cream px-4 font-bold text-ink shadow-sm outline-none"
          style={{ height: 48, fontSize: 17 }}
        />
        <button
          type="submit"
          aria-label="Save name"
          className="rounded-2xl bg-grape px-5 font-bold text-cream shadow-sm transition-transform active:scale-95"
          style={{ height: 48, boxShadow: '0 4px 0 var(--grape-dp)' }}
        >
          Save
        </button>
      </form>
      <p className="px-1 text-sm font-semibold text-ink/70">
        {name ? (
          <>
            Playing as <strong>{name}</strong> — greeted on the meadow, and shown
            with their stars while playing. Saving an empty box clears it.
          </>
        ) : (
          'Not set — add a name and the meadow says hello with it.'
        )}
      </p>
    </section>
  )
}

/**
 * Child's age — drives which band of content the meadow shows. Changing it
 * never touches progress (progress is keyed by level id), so families can
 * move freely as a child grows or siblings share a device.
 */
function AgeSection() {
  const age = useGameStore((s) => s.age)
  const setAge = useGameStore((s) => s.setAge)
  const band = age !== null ? bandForAge(age) : 'early'
  const hasContent = categoriesForBand(band).length > 0

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-cream/70 p-4"
      aria-label="Child's age"
    >
      <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          🎂
        </span>
        Child’s age
      </h2>
      <div className="flex flex-wrap gap-2">
        {AGES.map((a) => {
          const selected = a === age
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAge(a)}
              aria-pressed={selected}
              aria-label={`${a} years old`}
              className="grid place-items-center rounded-2xl font-bold shadow-sm transition-transform active:scale-95"
              style={{
                width: 48,
                height: 48,
                fontSize: 20,
                background: selected ? 'var(--grape)' : 'var(--cream)',
                color: selected ? 'var(--cream)' : 'var(--ink)',
                boxShadow: selected ? '0 4px 0 var(--grape-dp)' : undefined,
              }}
            >
              {a}
            </button>
          )
        })}
      </div>
      <p className="px-1 text-sm font-semibold text-ink/70">
        {age !== null ? (
          <>
            Showing the <strong>{bandLabel(band)}</strong> meadow.
            {!hasContent &&
              ' Content for this age group is on the way — the younger meadow shows for now.'}
          </>
        ) : (
          'Not set yet — the game will ask on the next start.'
        )}
      </p>
    </section>
  )
}

/**
 * Family currency — what the Money category's coins and answers display.
 * Content stores plain values, so switching currency never touches progress.
 */
function CurrencySection() {
  const currency = useGameStore((s) => s.currency)
  const setCurrency = useGameStore((s) => s.setCurrency)
  const active = currencyById(currency)

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-cream/70 p-4"
      aria-label="Family currency"
    >
      <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          🪙
        </span>
        Money currency
      </h2>
      <div className="flex flex-wrap gap-2">
        {CURRENCIES.map((c) => {
          const selected = c.id === active.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCurrency(c.id)}
              aria-pressed={selected}
              aria-label={c.name}
              className="flex items-center gap-1.5 rounded-2xl px-3 font-bold shadow-sm transition-transform active:scale-95"
              style={{
                height: 48,
                fontSize: 15,
                background: selected ? 'var(--grape)' : 'var(--cream)',
                color: selected ? 'var(--cream)' : 'var(--ink)',
                boxShadow: selected ? '0 4px 0 var(--grape-dp)' : undefined,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>
                {c.flag}
              </span>
              {c.id}
            </button>
          )
        })}
      </div>
      <p className="px-1 text-sm font-semibold text-ink/70">
        Coins in the Money games show <strong>{active.symbol}</strong> ({active.name}).
      </p>
    </section>
  )
}

/**
 * Twinkle's voice — which of the device's speech voices reads the game.
 * The list is ranked (modern natural voices first) and every tap previews
 * instantly, so picking a favourite takes seconds. "Auto" follows the
 * best-ranked voice; the pick is a device setting and survives reset.
 */
function VoiceSection() {
  const voiceId = useGameStore((s) => s.voiceId)
  const setVoiceId = useGameStore((s) => s.setVoiceId)
  const [choices, setChoices] = useState(() => audio.voiceChoices())

  // Voices populate asynchronously in most browsers — refresh when they land.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const refresh = () => setChoices(audio.voiceChoices())
    refresh()
    try {
      window.speechSynthesis.addEventListener?.('voiceschanged', refresh)
      return () => window.speechSynthesis.removeEventListener?.('voiceschanged', refresh)
    } catch {
      /* voice list just stays as-is */
    }
  }, [])

  function pick(id: string | null) {
    setVoiceId(id)
    audio.setVoice(id) // apply now — don't wait for the store mirror
    audio.preview() // hear it immediately
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-cream/70 p-4"
      aria-label="Twinkle's voice"
    >
      <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          🗣️
        </span>
        Twinkle’s voice
      </h2>
      {choices.length === 0 ? (
        <p className="px-1 text-sm font-semibold text-ink/70">
          This device offers no extra voices — the built-in one is used.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pick(null)}
              aria-pressed={voiceId === null}
              aria-label="Automatic voice"
              className="rounded-2xl px-4 font-bold shadow-sm transition-transform active:scale-95"
              style={{
                height: 48,
                fontSize: 15,
                background: voiceId === null ? 'var(--grape)' : 'var(--cream)',
                color: voiceId === null ? 'var(--cream)' : 'var(--ink)',
                boxShadow: voiceId === null ? '0 4px 0 var(--grape-dp)' : undefined,
              }}
            >
              ✨ Auto
            </button>
            {choices.map((c) => {
              const selected = c.id === voiceId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  aria-pressed={selected}
                  aria-label={`Voice: ${c.label}`}
                  className="rounded-2xl px-4 font-bold shadow-sm transition-transform active:scale-95"
                  style={{
                    height: 48,
                    fontSize: 15,
                    background: selected ? 'var(--grape)' : 'var(--cream)',
                    color: selected ? 'var(--cream)' : 'var(--ink)',
                    boxShadow: selected ? '0 4px 0 var(--grape-dp)' : undefined,
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <p className="px-1 text-sm font-semibold text-ink/70">
            Tap one to hear it. Questions and hints are spoken; cheers come as
            chimes and words on the screen.
          </p>
        </>
      )}
    </section>
  )
}

/**
 * "How does your child like to learn?" — a short preferences quiz (5 friendly
 * questions, answered by the grown-up) that suggests a session pace: how many
 * levels per sitting and for how long. Not a clinical assessment — just enough
 * signal to match the game's pacing to the child. Stored locally only.
 */
function PaceSection() {
  const pace = useGameStore((s) => s.pace)
  const setPace = useGameStore((s) => s.setPace)

  // null = not taking the quiz; otherwise the index of the current question.
  const [step, setStep] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])

  // Each step renders a fresh set of answer buttons, which would dump keyboard
  // focus onto <body>; keep it on the first option of the new question.
  const answersRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (step !== null && step > 0) answersRef.current?.querySelector('button')?.focus()
  }, [step])

  function answerCurrent(value: number) {
    const next = [...answers, value]
    if (next.length >= PACE_QUESTIONS.length) {
      setPace(planFor(next).pace)
      setStep(null)
      setAnswers([])
    } else {
      setAnswers(next)
      setStep(next.length)
    }
  }

  const plan = pace ? PACE_PLANS[pace] : null

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-cream/70 p-4"
      aria-label="Learning pace"
    >
      <h2 className="flex items-center gap-2 px-1 font-bold text-ink">
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          🐢
        </span>
        Learning pace
      </h2>

      {/* Taking the quiz */}
      {step !== null && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink/60">
            Question {step + 1} of {PACE_QUESTIONS.length}
          </p>
          <p className="font-semibold text-ink">{PACE_QUESTIONS[step].text}</p>
          <div ref={answersRef} className="flex flex-col gap-2">
            {PACE_QUESTIONS[step].answers.map((text, i) => (
              <button
                key={`${step}-${i}`}
                type="button"
                onClick={() => answerCurrent(i)}
                className="rounded-2xl bg-cream px-4 py-3 text-left font-semibold text-ink shadow-sm transition-transform active:scale-[0.98]"
              >
                {text}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(null)
              setAnswers([])
            }}
            className="self-start rounded-2xl px-3 py-1 text-sm font-bold text-ink/60"
          >
            Cancel
          </button>
        </div>
      )}

      {/* No profile yet */}
      {step === null && !plan && (
        <div className="flex flex-col items-start gap-3">
          <p className="font-semibold text-ink/80">
            Answer five quick questions about how your child likes to play, and
            we’ll suggest a session plan that fits them.
          </p>
          <button
            type="button"
            onClick={() => {
              setAnswers([])
              setStep(0)
            }}
            className="rounded-2xl bg-grape px-5 py-3 font-bold text-cream shadow-md transition-transform active:scale-95"
            style={{ boxShadow: '0 5px 0 var(--grape-dp)' }}
          >
            Find our pace
          </button>
        </div>
      )}

      {/* Profile set: the suggested plan */}
      {step === null && plan && (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-ink" style={{ fontSize: 18 }}>
            {plan.title}
          </p>
          <p className="font-semibold text-ink/80">
            {plan.levelsPerSession} level{plan.levelsPerSession > 1 ? 's' : ''} per
            sitting · {plan.sessionLength}
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm font-semibold text-ink/70">
            {plan.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAnswers([])
              setStep(0)
            }}
            className="self-start rounded-2xl bg-cream px-4 py-2 text-sm font-bold text-ink shadow-sm transition-transform active:scale-95"
          >
            Retake the quiz
          </button>
        </div>
      )}
    </section>
  )
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-cream/80 py-3">
      <span aria-hidden="true" style={{ fontSize: 24 }}>
        {icon}
      </span>
      <span className="font-bold text-ink" style={{ fontSize: 24 }}>
        {value}
      </span>
      <span className="text-sm font-semibold text-ink/60">{label}</span>
    </div>
  )
}

function StatusPill({
  status,
}: {
  status: 'Mastered' | 'Placed' | 'In progress' | 'Locked'
}) {
  // All use ink text — cream-on-leaf (2.1:1) and cream-on-grey (1.6:1)
  // failed WCAG for this small text; ink passes ≥4.5:1 on each background.
  // "Placed" (skipped via the age check, not yet mastered) is the plain one.
  const style =
    status === 'Mastered'
      ? { background: 'var(--sun)', color: 'var(--ink)' }
      : status === 'Placed'
        ? { background: 'var(--cream)', color: 'var(--ink)' }
        : status === 'In progress'
          ? { background: 'var(--sky-2)', color: 'var(--ink)' }
          : { background: 'var(--locked)', color: 'var(--ink)' }
  return (
    <span
      className="shrink-0 rounded-full px-3 py-1 text-sm font-bold"
      style={style}
    >
      {status}
    </span>
  )
}
