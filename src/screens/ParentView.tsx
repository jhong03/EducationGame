import { useEffect, useRef, useState } from 'react'
import { useGameStore, hasCleared, isLevelUnlocked } from '../engine/store'
import { CATEGORIES, TRAIL, categoriesForBand, levelsInCategory } from '../content/math'
import { PACE_PLANS, PACE_QUESTIONS, planFor } from '../engine/pace'
import { AGES, bandForAge, bandLabel } from '../engine/band'
import { CURRENCIES, currencyById } from '../content/currency'
import {
  buildProgressReport,
  filenamePrefix,
  toCsv,
  toJson,
} from '../export/progressReport'

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
    <div className="font-text relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Header */}
      <header className="safe-pt sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[color:var(--line)] bg-sky-1/85 p-4 backdrop-blur-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Done, back to the meadow"
          className="u-glass flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-ink-soft transition-transform active:scale-95"
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>‹</span>
          <span>Done</span>
        </button>
        <h1 className="font-bold text-ink" style={{ fontSize: 'clamp(19px, 4.6vw, 25px)', letterSpacing: '-0.01em' }}>
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

        {/* Learning pace: quiz → suggested session plan */}
        <PaceSection />

        {/* The full chapter-by-chapter breakdown lives on its own page. */}
        <section aria-label="Chapter progress">
          <button
            type="button"
            onClick={() => setShowProgress(true)}
            aria-label="Chapter progress"
            className="flex w-full items-center gap-3 u-card p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
          >
            <span aria-hidden="true" style={{ fontSize: 24 }}>
              📚
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">Chapter progress</span>
              <span className="block text-sm font-semibold text-ink-soft">
                Every chapter and level — status, best streaks and sprint scores
              </span>
            </span>
            <span aria-hidden="true" className="font-bold text-ink-faint" style={{ fontSize: 22 }}>
              →
            </span>
          </button>
        </section>

        {/* Privacy note — reassurance for the buying adult (spec §11). */}
        <p className="px-2 text-center text-sm font-semibold text-ink-soft">
          Progress is saved on this device only. No account, no sign-in, and
          nothing is collected or sent anywhere.
        </p>

        {/* Reset */}
        <section className="flex flex-col items-center gap-3 u-card p-4">
          {mode === 'view' && (
            <button
              type="button"
              onClick={() => {
                setGate(makeGate())
                setMode('confirm')
              }}
              className="rounded-xl px-6 py-3 font-semibold transition-transform active:scale-95"
              style={{
                background: 'color-mix(in srgb, var(--coral) 12%, var(--cream))',
                color: 'var(--coral-dp)',
                border: '1px solid color-mix(in srgb, var(--coral) 40%, transparent)',
              }}
            >
              Reset all progress
            </button>
          )}

          {mode === 'confirm' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center font-semibold text-ink">
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
                      boxShadow: '0 4px 12px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)',
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
                style={{ boxShadow: '0 4px 12px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)' }}
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
/** Save a text file from the browser; quietly does nothing where unsupported. */
function downloadFile(filename: string, mime: string, content: string) {
  try {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    /* jsdom / very old browsers — nothing to save */
  }
}

function ProgressPage({ onBack }: { onBack: () => void }) {
  const stars = useGameStore((s) => s.stars)
  const progress = useGameStore((s) => s.progress)
  const bestScores = useGameStore((s) => s.bestScores)
  const name = useGameStore((s) => s.name)
  const age = useGameStore((s) => s.age)

  // "Mastered" counts only EARNED clears; placement grants position, not credit.
  const masteredCount = TRAIL.filter(
    (l) => hasCleared(progress, l.id) && !progress[l.id]?.placed,
  ).length
  const finishedCategories = CATEGORIES.filter((c) =>
    levelsInCategory(c.id).every((l) => hasCleared(progress, l.id)),
  ).length

  function exportAs(kind: 'csv' | 'json') {
    const report = buildProgressReport(
      { name, age, stars, progress, bestScores },
      new Date().toISOString(),
    )
    const date = report.exportedAt.slice(0, 10)
    const base = `${filenamePrefix(name)}number-meadow-progress-${date}`
    if (kind === 'csv') downloadFile(`${base}.csv`, 'text/csv', toCsv(report))
    else downloadFile(`${base}.json`, 'application/json', toJson(report))
  }

  return (
    <div className="font-text relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-sky-1 to-sky-2">
      <header className="safe-pt sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[color:var(--line)] bg-sky-1/85 p-4 backdrop-blur-lg">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to settings"
          className="u-glass flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-ink-soft transition-transform active:scale-95"
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>‹</span>
          <span>Settings</span>
        </button>
        <h1 className="font-bold text-ink" style={{ fontSize: 'clamp(19px, 4.6vw, 25px)', letterSpacing: '-0.01em' }}>
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

        {/* Export — the teacher/parent take-away copy. */}
        <section
          className="flex flex-wrap items-center gap-2 u-card p-4"
          aria-label="Save a copy"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-ink">Save a copy</span>
            <span className="block text-sm font-semibold text-ink-soft">
              Every level with status, streaks and accuracy — straight from this
              device.
            </span>
          </span>
          <button
            type="button"
            onClick={() => exportAs('csv')}
            aria-label="Download CSV"
            className="rounded-2xl bg-grape px-4 font-bold text-cream shadow-sm transition-transform active:scale-95"
            style={{ height: 48, background: 'var(--grape-grad)', boxShadow: '0 4px 12px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)' }}
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportAs('json')}
            aria-label="Download JSON"
            className="rounded-xl bg-cream px-4 font-semibold text-ink transition-transform active:scale-95"
            style={{ height: 48, border: '1px solid var(--line)', boxShadow: 'var(--e1)' }}
          >
            JSON
          </button>
        </section>

        {CATEGORIES.map((category) => {
          const levels = levelsInCategory(category.id)
          return (
            <section
              key={category.id}
              className="flex flex-col gap-2 u-card p-3"
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
                const attempts = progress[level.id]?.attempts ?? 0
                const accuracy =
                  attempts > 0
                    ? Math.round(((progress[level.id]?.correct ?? 0) / attempts) * 100)
                    : null
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
                    className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: unlocked
                          ? 'color-mix(in srgb, var(--grape) 13%, var(--cream))'
                          : 'var(--locked)',
                        fontSize: 22,
                      }}
                      aria-hidden="true"
                    >
                      {unlocked ? level.icon : '🔒'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{level.name}</p>
                      {best > 0 && (
                        <p className="text-sm font-semibold text-ink-soft">
                          Best: {best} in a row
                        </p>
                      )}
                      {accuracy !== null && (
                        <p className="text-sm font-semibold text-ink-soft">
                          {attempts} answer{attempts === 1 ? '' : 's'} · {accuracy}% right
                        </p>
                      )}
                      {(bestScores[level.id] ?? 0) > 0 && (
                        <p className="text-sm font-semibold text-ink-soft">
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
      className="flex flex-col gap-3 u-card p-4"
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
          className="min-w-0 flex-1 rounded-xl bg-cream px-4 font-semibold text-ink outline-none"
          style={{ height: 48, fontSize: 16, border: '1px solid var(--line)', boxShadow: 'var(--e1)' }}
        />
        <button
          type="submit"
          aria-label="Save name"
          className="rounded-2xl bg-grape px-5 font-bold text-cream shadow-sm transition-transform active:scale-95"
          style={{ height: 48, boxShadow: '0 4px 12px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)' }}
        >
          Save
        </button>
      </form>
      <p className="px-1 text-sm font-semibold text-ink-soft">
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
      className="flex flex-col gap-3 u-card p-4"
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
                background: selected ? 'var(--grape-grad)' : 'var(--cream)',
                color: selected ? 'var(--cream)' : 'var(--ink-soft)',
                border: selected ? '1px solid transparent' : '1px solid var(--line)',
                boxShadow: selected
                  ? '0 3px 10px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)'
                  : 'var(--e1)',
              }}
            >
              {a}
            </button>
          )
        })}
      </div>
      <p className="px-1 text-sm font-semibold text-ink-soft">
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
      className="flex flex-col gap-3 u-card p-4"
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
                background: selected ? 'var(--grape-grad)' : 'var(--cream)',
                color: selected ? 'var(--cream)' : 'var(--ink-soft)',
                border: selected ? '1px solid transparent' : '1px solid var(--line)',
                boxShadow: selected
                  ? '0 3px 10px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)'
                  : 'var(--e1)',
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
      <p className="px-1 text-sm font-semibold text-ink-soft">
        Coins in the Money games show <strong>{active.symbol}</strong> ({active.name}).
      </p>
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
      className="flex flex-col gap-3 u-card p-4"
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
          <p className="text-sm font-semibold text-ink-soft">
            Question {step + 1} of {PACE_QUESTIONS.length}
          </p>
          <p className="font-semibold text-ink">{PACE_QUESTIONS[step].text}</p>
          <div ref={answersRef} className="flex flex-col gap-2">
            {PACE_QUESTIONS[step].answers.map((text, i) => (
              <button
                key={`${step}-${i}`}
                type="button"
                onClick={() => answerCurrent(i)}
                className="rounded-xl px-4 py-3 text-left font-semibold text-ink transition-transform active:scale-[0.98]"
                style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}
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
            className="self-start rounded-2xl px-3 py-1 text-sm font-bold text-ink-soft"
          >
            Cancel
          </button>
        </div>
      )}

      {/* No profile yet */}
      {step === null && !plan && (
        <div className="flex flex-col items-start gap-3">
          <p className="font-semibold text-ink">
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
            style={{ boxShadow: '0 4px 12px rgba(46,35,64,0.16), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 var(--grape-dp)' }}
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
          <p className="font-semibold text-ink">
            {plan.levelsPerSession} level{plan.levelsPerSession > 1 ? 's' : ''} per
            sitting · {plan.sessionLength}
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm font-semibold text-ink-soft">
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
    <div className="u-card flex flex-col items-center gap-0.5 py-3.5">
      <span aria-hidden="true" style={{ fontSize: 17 }}>
        {icon}
      </span>
      <span
        className="font-bold tabular-nums text-ink"
        style={{ fontSize: 'clamp(19px, 5.5vw, 24px)', letterSpacing: '-0.02em' }}
      >
        {value}
      </span>
      <span className="u-eyebrow" style={{ fontSize: 10 }}>
        {label}
      </span>
    </div>
  )
}

function StatusPill({
  status,
}: {
  status: 'Mastered' | 'Placed' | 'In progress' | 'Locked'
}) {
  // Tinted pills with dark ink text — a light accent wash reads premium while
  // ink keeps contrast comfortably ≥4.5:1 on every background (colored text on
  // a tint would have failed for text this small). Locked is the muted one.
  const accent =
    status === 'Mastered'
      ? 'var(--sun)'
      : status === 'Placed'
        ? 'var(--grape)'
        : status === 'In progress'
          ? 'var(--leaf)'
          : null
  const style = accent
    ? {
        background: `color-mix(in srgb, ${accent} 18%, var(--cream))`,
        color: 'var(--ink)',
        border: `1px solid color-mix(in srgb, ${accent} 32%, transparent)`,
      }
    : { background: 'var(--cream-2)', color: 'var(--ink-faint)', border: '1px solid var(--line)' }
  return (
    <span
      className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
      style={style}
    >
      {status}
    </span>
  )
}
