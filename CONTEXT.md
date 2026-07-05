# Number Meadow — Session Context & Handoff

> Living continuation doc for Claude Code sessions. The [README](README.md) is the
> product/architecture reference; **this file is the state-of-play** — what's done,
> what's verified, what's next. Update it at the end of each working session.

_Last updated: 2026-07-05 · Branch: `main` · HEAD: `5c82b7c` (pushed to
[jhong03/EducationGame](https://github.com/jhong03/EducationGame)) — the working tree
is CLEAN; everything in the §7 session log is committed and pushed._

---

## 1. TL;DR — where we are

**The game serves the FULL 4–12 promise: 33 categories · 146 levels · 62 activity
types across all three bands** — and within the upper band, **ages 10, 11 and 12
climb different ladders** (30 / 41 / 52 visible levels via `minAge` tier rungs).
The last "still growing" fallback is gone.
- **Early band (4–6): complete and deep** — 10 categories / 46 levels: counting (incl.
  zero, ±1, count-down, count-by-tens), compare (more/fewer/equal/numerals), add
  (doubles, bonds), subtract (to zero), shapes (+sides, tap-all), patterns (AB→ABC),
  clock (o'clock/half-past, set-the-clock, day scenes), money (coins, make-amount,
  coin-compare), Puzzle Grove (odd-one-out, shadow match, who-left, belongs, position,
  size), Big & Small (size/height/weight).
- **Mid band (7–9): COMPLETE** — 12 chapters / 48 levels: Place Value (blocks to
  999, rounding, compare), Times Tables (groups → all-to-12 → tricky 6/7/8/9),
  Add & Subtract (to 1000 + **column written methods** with forced carry/borrow),
  Sharing (+remainders), Fractions (bar-model to eighths + **equivalence &
  same-denominator ops**), Measuring (units, area, perimeter + **reading partitioned
  scales/rulers**), Time Master (five-minute clock, elapsed), Money Math (change),
  Data & Graphs (read + **build from tallies**), Shape Lab, Number Detective
  (□-equations), Story Problems.
- **Upper band (10–12): OPEN and AGE-TIERED** — 11 chapters / 52 levels: Big Numbers
  (words→numerals to 9,999, round to 1000, thousands counting), Decimals
  (tenths/hundredths + fraction↔decimal↔percent), Percentages, Below Zero (number
  line, crossing zero, negative compare), Angles & Mirrors (right/acute/obtuse,
  symmetry lines), Big Calculations (short × in columns, order of operations),
  Ratios, Averages & Chance (mean + probability language), Volume & Units (metric
  hops, cube layers), Grid World (coordinates), Puzzle Peak (two-step stories).
  **Each chapter tops out with an age-11 rung and an age-12 rung** (mixed rounding,
  decimal traps, temperature gaps, angle sums, 3-digit column ×, double brackets,
  share-in-ratio, missing scores, chance fractions, reverse conversions, volume by
  formula, four-quadrant + translated coordinates, number riddles): age 10 sees 30
  levels, 11 sees 41, 12 sees all 52.
- **Systems all live:** category navigation (derived unlock, never re-locks), age gate
  + band filtering, **name profile** (asked after the gate, greets on the meadow,
  rides a live name+⭐ chip during play), placement check (ages 5–6 early, 11–12
  upper), pace profiler, **adaptive difficulty** (mastery-only: hard questions
  soften the next one, mastered replays ramp by pace), per-continent + SEA
  currency,
  **Sprint mode** (post-mastery high scores: ambient sun timer for early, m:ss
  countdown + 🔥 streak-doubling for mid), parent dashboard with gated reset
  (reset re-asks age → new-sibling handoff).

Resume by reading §7's last entries; the curriculum phases are ALL BUILT (0–6).
Next work is polish/systems: adaptive difficulty, spaced review, parent export,
recorded VO, PWA PNG icons (§5).

### Verified this session (all green)
| Gate | Command | Result |
|---|---|---|
| Unit + loop + app tests | `npm test` | **200 passed** across 10 files |
| Type-check + prod build | `npm run build` | **clean**, PWA `sw.js` generated |
| Lint | `npm run lint` (oxlint) | **clean** |

Node 20+ required (built/tested on Node 24). Dev server: `npm run dev` → http://localhost:5173.

---

## 2. What's built (module map + state)

Everything below is **done and tested/working** unless flagged. Structure follows the
brief's §8 exactly.

### Engine — subject-agnostic core (no math vocabulary in the game loop)
- [`engine/types.ts`](src/engine/types.ts) — `Band`, `ActivityType`, **`Category`**
  (skill strand; the navigation unit), `Level` (has `categoryId`; `order` is
  within-category), `Question` (a **discriminated union** keyed on `activity`, so each
  activity carries its own typed `payload`/`answer`/`options`), `Answer`,
  `ObjectGroup`, `GameState`, `LevelProgress`.
- [`engine/random.ts`](src/engine/random.ts) — injectable-RNG helpers so generators are
  deterministic under test.
- [`engine/generators/`](src/engine/generators/) — the `ActivityType → generator`
  registry ([`index.ts`](src/engine/generators/index.ts) exposes `generateQuestion(level)`).
  - [`count.ts`](src/engine/generators/count.ts) — n objects (1..max), 3 number options, one correct + clamped near distractors.
  - [`compare.ts`](src/engine/generators/compare.ts) — two differently-themed groups of **different** sizes; answer is the bigger side.
  - [`add.ts`](src/engine/generators/add.ts) — two groups summing ≤ max; 3 number options around the total.
  - [`subitize.ts`](src/engine/generators/subitize.ts) — like count but the group
    flashes for `flashMs` then hides (instant recognition, not counting).
  - [`match.ts`](src/engine/generators/match.ts) — numeral↔quantity: spoken/shown
    target, 3 same-theme groups, **answer is the matching group's index**.
  - [`sequence.ts`](src/engine/generators/sequence.ts) — "what comes next" arithmetic
    run; `step` param ready for skip-counting later.
  - [`subtract.ts`](src/engine/generators/subtract.ts) — `start − taken`, answer
    always ≥ 1 for this band; taken objects render faded.
  - [`shapeId.ts`](src/engine/generators/shapeId.ts) — "Find the circle!": 3 one-color
    shape cards, tapped index answers.
  - [`pattern.ts`](src/engine/generators/pattern.ts) — AB/AAB/ABB motif runs; options
    = the two motifs + an outsider.
  - [`clock.ts`](src/engine/generators/clock.ts) — analog clock; `step: 60|30`
    (o'clock / half-past); choices differ by hour only.
  - [`money.ts`](src/engine/generators/money.ts) — currency-agnostic coin values;
    `mixed: 0` unit-coin counting (tap-countable), `mixed: 1` two small coins to add.
  - **Early-expansion set** (one file each, same pattern): `oneMore`, `sameOrNot`,
    `numCompare`, `bond`, `sides`, `coinCompare`, `whoLeft`, `belongs`, `position`,
    `dayTime`, `sizeCompare`, `heightCompare`, `weightCompare`, `makeAmount`,
    `setClock`, `tapAll` (+`oddOneOut` size mode, `shadowMatch` silhouette-twin
    exclusion).
  - **Mid-band set**: `placeValue` (digit-swap distractor), `round` (nearest 10/100,
    rounds both ways), `multiply` (`TABLE_SETS` 1–4, adjacent-entry distractors),
    `divide` (always exact), `share`, `arith` (`op` 0/1), `fractionOf` (bar model),
    `unitPick` (same-dimension foils), `gridRect` (area/perimeter), `elapsed`,
    `change`, `graph` (count + most), `shapeSort`, `missing` (□-equations incl. ×),
    `leftover` (true remainders), `wordProblem` (templates in
    [`content/stories.ts`](src/content/stories.ts)). `clock` gained a five-minute
    mode (choices differ by MINUTE).
  - **Phase 4 set**: `fractionOp` (equivalence — the equivalent card provably unique
    by cross-multiplication; add-1-to-both / scaled-bottom-only traps — plus
    same-denominator ± with the added-the-denominators trap; prompts speak fraction
    WORDS via `fractionWord`), `readScale` (pointer always on an UNLABELED tick;
    neighbor-tick distractors), `buildGraph` (tally targets; boards digit-encoded
    `[2,3,1]→231` so one number rides the answer path; decoys are buildable
    near-misses), `columnOp` (forced ones-carry/borrow; distractors are the
    forgot-the-carry and per-column big-minus-small slips; `flipDigits` exported).
  - **Upper set (Phases 5–6)**: `findNumber` (prompt is WORDS via `numberWordBig`,
    numerals only on buttons; digit-swap decoys), `decimal` (0.7-vs-0.07 trap),
    `equivPick` (`EQUIV_TABLE` families; decoys are other rows' same-form values),
    `percentOf` (amounts are multiples of 20 → whole answers), `negatives` (read
    mode always on a negative tick; crossing mode carries the expression),
    `angle` (one card per family — exactly one can match), `symmetry`
    (side-count-confusion decoy), `orderOps` (naive evaluation provably ≠ answer),
    `ratio` (±one-group decoys), `mean` (built backward from a whole mean; the raw
    sum always a decoy), `chance` (fixed-order scale words), `convert` (both wrong
    powers of ten), `volume` (single-layer decoy), `coord` (x ≠ y forced so the
    (y,x) swap is always wrong). Plus upgrades: `columnOp` op:2 short ×,
    `round` nearest 1000, `numCompare` neg:1, `wordProblem` ops:3/4 two-step
    (regex-verified against `TWO_STEP_TEMPLATES` in tests).
  - **Age-tier set (11+/12+ rungs)**: new `angleSum` (line pair / triangle to 180°),
    `riddle` (undo ×k+c, then the bracketed (?+a)×b; the half-undone number is the
    decoy), `chanceFrac` (f/t with complement + odds decoys; t ≠ 2f enforced).
    Mode upgrades: `round` mix (10/100/1000 per question), `findNumber` digits:5
    (words via `numberWordBig` to 999,999), `numCompare` dec:1 (0.5-vs-0.35,
    longer-loses cases proven to occur), `arith` dec:1 (tenths; float identity
    exact BY CONSTRUCTION — single division, never summed as floats), `negatives`
    mode:2 (marked temperature gap; sign-blind decoy) & mode:3 (−a ± b),
    `orderOps` brackets:2, `columnOp` × at 3 digits, `ratio` share:1 (whole pile
    split; other-side share is the decoy), `mean` missing:1 (the stated mean is
    the decoy), `convert` reverse:1 (the ÷ direction), `volume` formula:1,
    `coord` quad:4 (sign-slip decoy) & translate:1 (wrong-direction/axis-mix),
    `percentOf` sets 3/4.
  - Every generator is seed-swept in
    [`generators.test.ts`](src/engine/generators.test.ts) (mulberry32 streams; the
    exactly-one-correct options contract is enforced throughout).
- [`engine/masteryGate.ts`](src/engine/masteryGate.ts) — pure `evaluateAnswer(...)`:
  is-correct, streak (climbs on correct, **never resets/penalizes** on wrong), and
  `cleared` when streak hits `masteryGoal`.
- [`engine/store.ts`](src/engine/store.ts) — Zustand + `persist` to `localStorage`
  (key `number-meadow/v1`, **version 2**, `migrate: migratePersistedState` — v1 saves
  keep their earned fields; level ids unchanged so cleared levels keep counting).
  Persists earned progress + settings via `partialize` (`stars`, `progress`, `muted`,
  `pace`, `age`, `name`, `currency`, `voiceId`, `bestScores`). Names go through ONE write
  path (`sanitizeName`: trim, 20-char cap, empty → null) from every entry point;
  reset clears `name` with `age` (the child profile). Sprint bests live in `bestScores`
  (`recordSprintScore` is forward-only; `categorySprintScore` sums a category).
  **There is no stored unlock state**: which levels are open is *derived*
  from `progress` by `unlockedUpTo` / `isLevelUnlocked` (consecutive-cleared prefix
  within a category, plus **a cleared level is always open** — it can never re-lock) —
  reshaping content never needs a child-data migration. **Forward-only** invariant: no
  action removes a star, relocks a level, or lowers a streak. `reset()` (ParentView's
  gated reset) wipes the child's progress **and the age** — the age gate re-asks and
  placement re-offers, so handing the device to a new sibling is one reset away;
  `pace` and `muted` (device/household settings) survive. The parent route renders
  above the age gate in `App.tsx` so the panel isn't yanked away mid-reset.
- [`engine/band.ts`](src/engine/band.ts) — **age → band mapping** (pure, tested):
  `BANDS` (early 4–6 / mid 7–9 / upper 10–12), `AGES`, `bandForAge` (clamps garbage to
  the nearest band, never undefined), `bandLabel`. The persisted `age` (household
  setting; survives reset; validated on migrate) drives which band's categories the
  meadow shows.
- [`engine/adaptive.ts`](src/engine/adaptive.ts) — **adaptive difficulty** (pure,
  tested; the calibration seam FILLED): `difficultyScale({lastTries, replay},
  pace)` → ×0.6/×0.8 easing after hard questions (instant recovery), replay
  ramps ×1.5 eager / ×1.25 steady / ×1 gentle; `adaptLevel` scales ONLY `max`
  (rounded, floored at 3; `column-op` excluded — its max is a digit MODE).
  Mastery play only: sprints and placement never adapt, the goal never changes.
- [`engine/pace.ts`](src/engine/pace.ts) — **learning-pace profiler** (pure, tested):
  5-question parent preferences quiz (`PACE_QUESTIONS`) → `scorePace` (0–3 gentle /
  4–7 steady / 8–10 eager, inputs clamped) → `PACE_PLANS` (levels per sitting, session
  length, tips). Non-clinical by design; stored locally only. Seam: adaptive difficulty
  can read `pace` later.

### Content — all the math lives here (data, not code)
- [`content/math.ts`](src/content/math.ts) — `MATH_SPINE` (full 3-band ladder as
  reference data) + **`CATEGORIES`** (**33** — 10 early: `counting` 🍎 / `comparing` 🎈 /
  `adding` 🍪 / `taking-away` 🐸 / `shapes` 🔷 / `patterns` 🧩 / `time` 🕐 / `money` 🪙 /
  `puzzle-grove` 🦉 / `big-small` 📏; 12 mid: `place-value` 🧱 / `times-tables` ✖️ /
  `number-crunch` ➕ / `sharing` 🍰 / `fractions` 🍕 / `measuring` 📐 / `time-mid` ⏰ /
  `money-mid` 💰 / `data` 📊 / `shape-lab` 🔺 / `detective` 🕵️ / `stories` 📖;
  11 upper: `big-numbers` 🔢 / `decimals-lab` 🔟 / `percents` 💯 / `below-zero` 🧊 /
  `angles` 📐 / `upper-crunch` 🧮 / `ratios` ⚖️ / `averages` 📈 / `volume-units` 📦 /
  `grid-world` 🗺️ / `puzzle-peak` 🧗).
  Level tables: `PHASE0_LEVELS` (early 1–5) + `PHASE1_LEVELS` (6–11) + `PHASE2_LEVELS`
  (12–21) + `EXPANSION_LEVELS` (22–46) + `PHASE3_LEVELS` (`math-mid-1..13`) +
  `PHASE3B_LEVELS` (`math-mid-14..38`) + `PHASE4_LEVELS` (`math-mid-39..48`) +
  `PHASE56_LEVELS` (`math-upper-1..30`) + `PHASE56B_LEVELS` (`math-upper-31..52`,
  the age-tier rungs: `upper11`/`upper12` helpers stamp `minAge`).
  **Ids are stable forever** — persisted progress is keyed on them; `makeLevel` is
  band-general and stamps `sprintSeconds` per activity. Helpers: `categoryById`,
  `categoriesForBand`, `levelsInCategory`, **`levelsInCategoryForAge`** (minAge
  prefix filter — what the child's map shows), `levelById`, `nextLevelAfter`
  (gap-tolerant AND age-aware: a rung above the child's tier is never "next"),
  `TRAIL` (flat list, **146 levels**).
- [`content/shapes.ts`](src/content/shapes.ts) — the 2D shape vocabulary (circle →
  heart), drawn by [`components/ShapeGlyph`](src/components/ShapeGlyph.tsx) in ONE
  color (shape, never color, is the discriminator).
- [`content/currency.ts`](src/content/currency.ts) — the currency seam: one core per
  continent (USD/EUR/GBP/SGD/AUD/ZAR) **plus the Southeast-Asia core set
  (MYR/IDR/THB/VND/PHP, user-requested 2026-07-05)** — 11 currencies. Money content
  stores plain small values; only rendering reads the persisted `currency` (device
  setting, picked in ParentView, survives reset). Real-world denominations are
  deliberately not modeled.
- [`content/words.ts`](src/content/words.ts) — number words 0–20 (`numberWord`,
  `capitalize`) + `fractionWord` ("3/4" → "three quarters"; TTS can't read a raw
  label) + `numberWordBig` (to 9,999 — find-number prints WORDS and hides the
  numerals in the buttons), shared by spoken prompts and the AudioManager.
- [`content/themes.ts`](src/content/themes.ts) — 15 countable objects, each with
  emoji + plural + a `kind` tag (food/animal/nature/toy) powering sorting play.
- [`content/world.ts`](src/content/world.ts) — weight pairs (heavier-first),
  day scenes, `MEASURE_OBJECTS` (thing + right unit + same-dimension foil),
  `SCALE_UNITS` (cm/g/ml — printed label + spoken name for read-scale),
  `CONVERT_PAIRS` (metric hops + factors), `CHANCE_LABELS`/`CHANCE_SCENARIOS`
  (the probability-language scale). [`content/shapes.ts`](src/content/shapes.ts)
  gained `SHAPE_SYMMETRY` (mirror-line counts as ShapeGlyph draws them);
  [`content/stories.ts`](src/content/stories.ts) gained `TWO_STEP_TEMPLATES`.
- [`content/stories.ts`](src/content/stories.ts) — word-problem templates
  (+/−/× with `{a}` `{b}` `{things}` placeholders).
- [`content/placement.ts`](src/content/placement.ts) — placement plans: early
  **5–6** (skip the counting grind) and upper **11–12** (prove the tiers below
  your own — age 11 probes the base tier's number-work in 5 checkpoints, age 12
  extends two probes into the 11+ rungs; each probe is the TOP rung of what it
  places, novel forms left as quick wins). Age 10 IS the base tier — no plan;
  mid starts fresh. Gap-free + minAge-visible by test.

### Audio
- [`audio/AudioManager.ts`](src/audio/AudioManager.ts) — the **only** place the game
  makes sound. `speak(text, style?) / sayNumber / sfx / setMuted / unlock /
  voiceChoices / setVoice / preview`. **Voice quality** (user feedback "too plain
  and robotic", fixed 2026-07-05): `rankVoices` surfaces the device's modern
  voices (Natural/Neural/Premium markers → known-good families → plain local;
  non-English never listed; pure + tested), auto mode follows the top rank, and
  the family can pick a favourite (persisted `voiceId`, mirrored from the store
  by App). **Four delivery styles** — `prompt` (clear) / `praise` (bright,
  quick) / `soft` (gentle — never scolding) / `count` (crisp) — plus ±4%
  rate/pitch jitter per utterance so repeats never sound like replayed samples.
  Synthesized Web-Audio SFX (`good/soft/pop/win`). Everything feature-detected +
  try/catch → silent, never crashes. **VO seam unchanged:** the `TODO: swap for
  recorded VO` block in `speak()` is still the one-block clip-playback swap.

### UI
- [`components/Twinkle.tsx`](src/components/Twinkle.tsx) — hand-built SVG star guide with
  a face; moods `happy` (idle bob) / `cheer` (correct) / `sad` (wrong), `beat` prop
  re-triggers reactions.
- [`components/Countable.tsx`](src/components/Countable.tsx) — a single tappable object;
  wiggles + shows its ordinal once counted.
- [`components/ProgressDots.tsx`](src/components/ProgressDots.tsx) — one dot per
  `masteryGoal`, fills as the in-attempt streak grows.
- [`components/Confetti.tsx`](src/components/Confetti.tsx) — CSS-keyframe burst, fired by
  a counter prop.
- [`components/MuteButton.tsx`](src/components/MuteButton.tsx) — always-visible toggle,
  reads/writes the persisted `muted` flag.
- [`screens/AgeScreen.tsx`](src/screens/AgeScreen.tsx) — **first-launch age gate**
  ("How old are you?", spoken; big numeral buttons 4–12; one tap, no confirm — a
  grown-up can correct it later). Shows whenever `age === null` (fresh installs and
  pre-age saves).
- [`screens/NameScreen.tsx`](src/screens/NameScreen.tsx) — "What's your name?",
  right after the age gate (spoken; typed by a grown-up or reading child,
  ALWAYS skippable). Purely cosmetic; placement (if any) follows from here.
  [`components/PlayerChip.tsx`](src/components/PlayerChip.tsx) — the name +
  LIVE star count pill on the Play/Sprint top bars (renders nothing unnamed).
- [`screens/Home.tsx`](src/screens/Home.tsx) — **category cards** on the meadow (one per
  strand of the child's **band**, always open, mini progress dots, tap speaks the
  category name); star counter; discreet "⚙️ For grown-ups" entry. The 🌱 "still
  growing" fallback (empty band → early meadow + spoken banner) is now UNREACHABLE —
  every band has content — but stays as the safety net for any future empty band.
  *(Replaced the old winding trail.)*
- [`screens/CategoryScreen.tsx`](src/screens/CategoryScreen.tsx) — one category's levels
  as a **grid of chunky tiles** (locked 🔒 / open+glowing / cleared ⭐); tap speaks the
  level name and starts it. Deliberately *not* a path.
- [`screens/PlayScreen.tsx`](src/screens/PlayScreen.tsx) — the mastery loop. Holds
  **transient** play state (current question, in-attempt streak, tap-count map,
  wrong-shake token); only earned progress goes to the store; `clearLevel` persists
  **synchronously** on the mastering answer (only navigation waits on the timer).
  Exports **`ActivityStage`** — the full 62-activity renderer switch + number-button
  row, shared verbatim by PlacementScreen and SprintScreen — plus `CountStage`/
  `CompareStage`, `ClockFace`, `CoinFace`, `ExprCard`. Phase 4 stages: shared
  `FractionBar`/`FractionCards` (fraction-of + fraction-op), `ReadScaleStage`
  (SVG ruler), `ColumnOpStage` (digit-aligned written layout; also renders ×),
  `BuildGraphStage` (+`TallyMarks`; tap towers wrap past the top, ✔️ submits the
  encoded board). Upper stages: `DecimalStage` (tenths bar / hundred-square),
  `NumberLineStage` (−max..max, zero glows coral; arrow only in read mode),
  `AngleGlyph`/`AngleStage` (SVG rays + arc cards), `RatioStage` (emoji rows +
  ? tile), `MeanStage` (score chips), `ChanceStage` (scenario + scale words),
  `VolumeStage` (layer grids; formula mode swaps to a dimensions card),
  `CoordStage` (SVG grid + ⭐, coordinate cards via FractionCards; `min < 0`
  opens all four quadrants), `NumberLineStage` gap-mode dots, `MeanStage`
  hidden-?-chip + stated-mean pill, `RatioStage` share-mode total banner.
  equiv-pick/percent-of/order-ops/convert/find-number/angle-sum/riddle ride
  ExprCard; symmetry reuses the ShapeGlyph display; chance-frac = story card +
  FractionCards. Correct → chime, Twinkle
  cheers, praise, confetti, dot fills, +1 star, next question (or cleared at goal).
  Wrong → soft tone, "Try again!", control shakes, **nothing lost** (mastery mode
  only — sprints move on instead).
- [`screens/SprintScreen.tsx`](src/screens/SprintScreen.tsx) — the high-score layer,
  unlocked per level by mastery. Early band: ambient sun-track timer, misses advance;
  end is always a celebration. Mid+ bands ("arcade"): visible m:ss countdown (coral
  ≤10s) + 🔥 streak bonus (3-in-a-row and beyond score double). Partial runs save;
  bests are forward-only.
- [`screens/ClearedScreen.tsx`](src/screens/ClearedScreen.tsx) — confetti + Twinkle
  cheering; "Next level" / "🏆 Sprint!" / back (celebrates the whole category on its
  last level).
- [`screens/ParentView.tsx`](src/screens/ParentView.tsx) — **adults-only** panel (the
  buyer). Kept deliberately SHORT: summary stats (stars / mastered X/146 /
  categories finished X/33), **Child's
  age** section (age chips → band; changing age never touches progress), **Money
  currency** picker, **Learning pace** section (the 5-question quiz → suggested
  session plan), **Twinkle's voice** picker (top-6 ranked device voices as chips,
  instant preview on tap; fallback note when a device has none),
  a **"Chapter progress" card → its own `ProgressPage`** (sticky
  header + back-to-settings; stats + all 33 categories' level lists with status
  pills — "Placed" distinct from "Mastered" — best streaks and 🏆 sprint bests;
  the grown-up sees FULL ladders incl. rungs above the child's tier), a
  local-only-storage privacy note, and **Reset all progress** gated behind a
  one-shot addition challenge — reset
  wipes progress **and the age** (gate re-asks; new-sibling handoff) while pace, mute
  and currency survive. Reached from a discreet "⚙️ For grown-ups" button on
  [`Home`](src/screens/Home.tsx). Deliberately the one screen that breaks the
  no-reading rule — it's for a reading adult.
- [`App.tsx`](src/App.tsx) — tiny hand-rolled router
  (`home | placement | category | play | sprint | cleared | parent`, keyed by **ids**
  not order), audio unlock + mute mirroring, and the **age gate**: `age === null`
  renders [`AgeScreen`](src/screens/AgeScreen.tsx) before any child-facing route
  (parent route sits above the gate); fresh profiles whose age has a plan
  (5–6 early, 11–12 upper) route through
  [`PlacementScreen`](src/screens/PlacementScreen.tsx) after the pick — probes
  render through the shared `ActivityStage`, so ANY activity can be a
  checkpoint and it looks exactly like real play. `PlayScreen`
  and `SprintScreen` are keyed by `level.id` for fresh mounts. Cleared→next stays
  inside the category; finishing a category's last level returns home.

### Theme / config
- [`theme/tokens.css`](src/theme/tokens.css) — the §5 palette as CSS custom properties
  (`--grape`, `--sun`, `--coral`, `--leaf`, `--ink`, `--cream`, sky gradient, …) + font.
- [`theme/animations.css`](src/theme/animations.css) — keyframes (pop-in, shake, bob,
  confetti). All motion is disabled under `prefers-reduced-motion`.
- Tailwind **v4** via `@tailwindcss/vite`. Rounded font = self-hosted **Fredoka**
  (`@fontsource`, no runtime CDN fetch).
- [`vite.config.ts`](vite.config.ts) — React + Tailwind + `vite-plugin-pwa`
  (`autoUpdate`, manifest with theme/background colors). Vitest config lives here too
  (jsdom, globals).

### Tests (200, all passing)
- [`audio/AudioManager.test.ts`](src/audio/AudioManager.test.ts) — the voice
  ranking heuristics (natural > known-good > plain local; English only; stable)
  and SKU-noise-free labels.
- [`engine/adaptive.test.ts`](src/engine/adaptive.test.ts) — the scale rule
  table, pass-through identities, and a sweep proving every scale the seam can
  emit still generates sound questions for every scalable level.
- [`engine/generators.test.ts`](src/engine/generators.test.ts) — the brief's required
  coverage: exactly one correct option, options never < 0, compare never equal, add
  totals never exceed max.
- [`engine/masteryGate.test.ts`](src/engine/masteryGate.test.ts) — streak climbs on
  correct, holds on wrong, clears at goal.
- [`engine/loop.test.ts`](src/engine/loop.test.ts) — the full-meadow loop (every level
  of every category auto-played to mastery via `generateQuestion` — covers ALL
  activities generically), derived-unlock rules, reset semantics, sprint scores,
  sprintSeconds sanity, persisted-state migration.
- [`engine/band.test.ts`](src/engine/band.test.ts) + [`engine/pace.test.ts`](src/engine/pace.test.ts) +
  [`content/placement.test.ts`](src/content/placement.test.ts) — the pure systems.
- [`App.test.tsx`](src/App.test.tsx) — integration: play loop, age gate, placement
  flows, band homes (age 9 = mid, age 11 = fallback), sprint (early + arcade streak),
  back-routes, grown-ups reset → age gate.
- [`screens/ParentView.test.tsx`](src/screens/ParentView.test.tsx) — stats/status
  counts pinned exactly (1/146, 0/33 …), currency picker (incl. the SEA set),
  pace quiz, Placed pill, gated reset.

---

## 3. Architecture invariants — do not break these

1. **The engine never contains subject vocabulary.** No "add"/"count" in the game loop —
   only activities + generators. If you're typing a math word inside `engine/` game
   logic, it belongs in `content/` or a generator.
2. **Content is data.** A new level using an existing activity = append one `Level` to
   `PHASE0_LEVELS`. A new activity = extend `ActivityType` + a `Question` variant, write
   a generator, register it, add a `PlayScreen` render branch. A new **subject** = same,
   plus its own content module. (See README "Adding a …" sections.)
3. **Forward-only progress.** Nothing ever penalizes: no lost stars, no relock, no streak
   decrement. Wrong answers only ever offer a retry.
4. **All sound goes through `AudioManager`.** Components never touch SpeechSynthesis /
   Web Audio directly — that's what keeps the recorded-VO swap a one-file change.
5. **Only earned progress persists.** Transient play state stays in `PlayScreen`; the
   store's `partialize` is the boundary.
6. **Reduced-motion + audio-first + ≥64px touch targets** are quality gates, not nice-to-haves.
7. **Unlock state is derived, never stored.** `progress` (cleared per stable level id) is
   the single source of truth; openness = consecutive-cleared prefix within a category
   (`unlockedUpTo`). Never reintroduce a stored `unlockedOrder`, and **never renumber
   level ids** — old saves are keyed on them.
8. **Categories are always open; gating lives inside a category.** Choosing a different
   skill is never "skipping ahead".
9. **Age tiers are prefixes.** `minAge` rungs may only be APPENDED at a category
   ladder's top (minAge non-decreasing along `order`, test-enforced). That keeps
   every age's visible ladder a clean prefix, so derived unlock (#7) needs no
   age-awareness — and a cleared rung survives any age change. Screens show the
   child `levelsInCategoryForAge(...)`; ParentView alone shows full ladders.
10. **Sprint is a layer, not the spine.** High-score mode unlocks only AFTER mastery,
   never replaces the mastery gate, and `bestScores` are forward-only (a worse run
   changes nothing). In the early band the sprint clock is **ambient** (a sun on a
   track — no countdown numerals) and every round ends in celebration; visible
   countdowns/streak bonuses are reserved for mid/upper (Phase 3+). Sprint misses
   score nothing and **advance to the next question** (no getting stuck) —
   retry-until-correct lives only in mastery mode.

---

## 4. Known gaps / loose ends (small, non-blocking)

None of these break Phase 0; they're the first things to consider next.

- ~~**No UI reset control.**~~ ✅ Done — wired into [`ParentView`](src/screens/ParentView.tsx)
  behind the addition gate.
- **PWA icons are SVG-only.** [`public/icon.svg`](public/icon.svg) +
  [`favicon.svg`](public/favicon.svg) only. Before any store/marketing launch, add
  rasterized PNGs (192/512, maskable) for widest install compatibility. Noted in README §PWA-icons.
- ~~**Adaptive difficulty has no dedicated seam module.**~~ ✅ Filled —
  [`engine/adaptive.ts`](src/engine/adaptive.ts), wired into mastery play only.
- **`sayNumber` word list covers 0–20**; beyond that it falls back to digits, which
  TTS reads correctly ("30" → "thirty") — fine in practice, extend words.ts if
  recorded VO ever lands.
- **Mid band relaxes the pre-reader rule deliberately** (7–9s read): expression cards,
  unit labels, story text. Prompts are still always spoken.
- **Praise selection uses `Math.random()`** in `PlayScreen` (UI-only, fine). Generators
  correctly use the injectable RNG in `random.ts` for determinism under test.

---

## 5. What's planned next (roadmap, in rough priority order)

Everything here is **out of scope for Phase 0** per the brief §10/§11 — listed so the
next session can pick up deliberately. Ship-later legal/product notes are already in the
[README](README.md) §Ship-later.

> **[CURRICULUM.md](CURRICULUM.md) is the master plan** — 12 strands × 3 bands from six
> national curricula, ALL SEVEN decisions locked (full spine incl. Probability &
> Financial Literacy · 3 bands · per-continent currency · phase flow · Puzzle Grove ·
> parent-tuned pacing · Sprint scoring). Its §5 phase table tracks build status:
> **ALL PHASES 0–6 ✅ BUILT** — the full 4–12 spine is playable.

### Near-term
1. **Parent dashboard extras:** progress **export** (CSV/JSON) for the teacher
   use-case, richer per-level stats (attempts, accuracy) once tracked. The
   Chapter-progress page is the natural home for the export button.

### Later (seams noted, not built)
3. **Spaced review** — a scheduler that re-surfaces older cleared skills.
4. **Mid placement plans** — early (5–6) and upper (11–12) placement are live and
   PlacementScreen now renders any activity via ActivityStage; a mid (8–9) plan
   is a pure content addition in [`content/placement.ts`](src/content/placement.ts)
   whenever the mid ladder earns a fast lane.
5. **New subjects** (reading, shapes-as-subject, …) — the engine is already
   subject-agnostic; more content modules + activities.
6. **Recorded human voice-over** — replace the TTS block at
   [AudioManager.ts:148](src/audio/AudioManager.ts#L148) with clip playback.
7. **Deeper upper enrichment** (long division, protractor measuring, pie charts,
   coordinates in four quadrants, logic grids) — strand rungs beyond the core spine.

### Pre-launch (product/legal — not engineering-blocked, keep in mind)
- **COPPA (US) / GDPR-K (EU)** constrain accounts, data collection, ads. Currently no
  backend/login/analytics — progress is local-only. Keep it that way until a privacy
  plan exists.
- **Content pipeline** — keep levels addable as data; ideally eventually authorable
  without code changes.
- **Rasterized PWA icons** (see §4).

---

## 6. How to pick up next session

1. `npm install` (if needed) → `npm test` should show **200 passing** → `npm run dev` to
   play the loop (age gate → pick the Counting card → Count to 3 → tap-count aloud →
   answer 3× to unlock the next tile).
2. Pick one item from §5. For anything touching generators/mastery, **write/extend the
   Vitest suite first** — a math game that generates a wrong "correct answer" is a
   product-killer.
3. Keep the §3 invariants. Commit in small, reviewable steps with clear messages.
4. **Update this file** (§1 status, §2 if modules change, §4/§5 as gaps close) before you
   stop, so the next handoff is seamless.

---

## 7. Session log

- **2026-07-02 — Phase 0 build.** Full playable slice (commit `593182b`). 29 tests.
- **2026-07-03 — Parent view + reset.** Added [`ParentView`](src/screens/ParentView.tsx)
  (progress summary + per-level status + gated **Reset all progress**), a discreet
  "⚙️ For grown-ups" entry on the map (now [`Home.tsx`](src/screens/Home.tsx)), and a `parent` route in
  [`App.tsx`](src/App.tsx). New [`ParentView.test.tsx`](src/screens/ParentView.test.tsx) +
  a map→parent→back route test. **33 tests, build & lint clean. Uncommitted** — see §6.3.
  Next obvious picks: adaptive-difficulty seam or extending the early band (§5.1–5.2).
- **2026-07-03 — Curriculum spine drafted.** [CURRICULUM.md](CURRICULUM.md): full 4–12
  math ladder (12 strands, ~30 activity types, 7-phase rollout) researched from six
  national curricula. **Awaiting user's pass** on its §6 decisions before building.
- **2026-07-03 — Category navigation (user-requested).** Replaced the single winding
  trail with **category-based level selection** (category = curriculum strand):
  [`Home`](src/screens/Home.tsx) cards → [`CategoryScreen`](src/screens/CategoryScreen.tsx)
  tile grid. New `Category` type; levels carry `categoryId` (+ within-category `order`,
  ids preserved); store drops `unlockedOrder` — unlock now **derived** from progress
  (persist bumped to v2, no runtime migrate: stale v1 dev saves start fresh).
  ClearedScreen celebrates per category. ParentView grouped by category.
- **2026-07-04 — Ultracode review + fixes.** 76-agent adversarial review of the refactor
  (24 raw → 16 confirmed findings). Fixed: `clearLevel` now persists **synchronously**
  (back-tap during the win fanfare no longer loses the clear); cleared levels can never
  re-lock (`isLevelUnlocked` OR-clause); `nextLevelAfter` tolerates order gaps; WCAG
  contrast (Home card text per-card, tile labels → ink-on-cream pills, StatusPill inks);
  top-bar controls 64px; locked tiles focusable + spoken "not yet"; tile tap-speech
  removed (was cancelled by the prompt); reset-gate focus restore; Twinkle hides on
  short viewports; docs de-staled. Tests hardened: **40 passing**, build & lint clean.
  **Uncommitted.**
- **2026-07-04 — Curriculum PASS + Phase 1 + pace profiler.** User locked all six
  [CURRICULUM.md §6](CURRICULUM.md) decisions (full 12-strand spine incl. Probability &
  Financial Literacy; 3 bands; per-continent currency seam; phase flow; Puzzle Grove;
  parent-tuned pacing). Built **Phase 1**: 4 new activities (`subitize`/`match`/
  `sequence`/`subtract`), 6 new levels (ids 6–11), new *Taking Away* 🐸 category,
  [`content/words.ts`](src/content/words.ts). Built the **learning-pace profiler**
  ([`engine/pace.ts`](src/engine/pace.ts) + PaceSection quiz in ParentView; `pace`
  persisted; reset preserves it). A 43-agent adversarial review (10 confirmed findings)
  then hardened it: sequence generator can no longer emit numbers past its bound
  (`effectiveMax` construction); subtract prompt grammar fixed ("One **goes** away",
  capitalized — it's spoken aloud); match/subtract param clamps; **MatchStage
  redesigned** so objects tap-count per group and a ✔️ button commits (tap-to-count
  never accidentally answers); subitize keyed per question (`role="img"` added);
  reduced-motion now zeroes `animation-delay` too (staggered pop-ins were invisible);
  match word contrast fixed; pace-quiz keyboard focus restored; `scorePace` ignores
  non-finite garbage. **56 tests passing**, build & lint clean. **Uncommitted.**
- **2026-07-04 — Age categorization.** First-launch **age gate**
  ([`AgeScreen`](src/screens/AgeScreen.tsx): spoken "How old are you?", numeral buttons
  4–12) → persisted `age` (household setting; validated on migrate; survives reset) →
  [`bandForAge`](src/engine/band.ts) → Home shows that band's categories; empty bands
  (mid/upper until Phase 3+) fall back to the early meadow with a spoken 🌱 "still
  growing" banner. Grown-ups change age via the new **Child's age** section in
  ParentView (never touches progress). A 22-agent review confirmed 4 defects, all
  fixed — headline: the mount-time prompt is **dropped by autoplay policies on fresh
  installs**, so any background tap on the gate now speaks the question from inside a
  gesture; the growing note no longer cancels the age echo and speaks once per session;
  replay button 64px. **62 tests passing**, build & lint clean. **Uncommitted.**
- **2026-07-04 — Placement check (calibration seam v1).** Ages 5+ with no progress get
  "Show me what you can do!" straight after the age gate
  ([`PlacementScreen`](src/screens/PlacementScreen.tsx), plans in
  [`content/placement.ts`](src/content/placement.ts)): age 5 probes count-to-5/10;
  6+ (incl. older kids in the early-meadow fallback) probes count-to-10 → compare →
  add-within-5. Each pass marks its rungs `cleared` + **`placed: true`** (a new
  `LevelProgress` flag — no stars, a distinct "Placed" pill in ParentView, and real
  mastery later erases the flag); the first miss ends warmly and the child starts right
  there; Skip always available; age 4 never sees it. Store gained `placeLevels` (never
  downgrades earned clears); plans are test-enforced to keep the derived-unlock prefix
  gap-free. **71 tests passing**, build & lint clean. **Uncommitted.**
- **2026-07-04 — Phase 2: the variety layer.** Four new categories on the meadow —
  **Shapes 🔷, Patterns 🧩, Clock Time 🕐, Money 🪙** (8 levels, ids 12–19) — with four
  new activities: `shape-id` (one-color SVG cards via
  [`ShapeGlyph`](src/components/ShapeGlyph.tsx)), `pattern` (AB/AAB/ABB), `clock`
  (SVG analog face; o'clock + half-past; deliberately does NOT speak the time — reading
  it is the skill), `money` (tap-countable unit coins / add two small coins). The
  **currency seam** landed per the locked decision: [`content/currency.ts`](src/content/currency.ts)
  (USD·EUR·GBP·SGD·AUD·ZAR), persisted `currency` device setting + ParentView picker;
  money values stay currency-agnostic. Seed-swept generator tests for all four.
  **82 tests passing**, build & lint clean. **Uncommitted.**
- **2026-07-04 — Puzzle Grove 🦉.** Strand L opens as its own category (locked decision
  #5): **Odd one out** ([`oddOneOut.ts`](src/engine/generators/oddOneOut.ts) — 3 alike +
  1 impostor, position seed-tested to vary) and **Shadow match**
  ([`shadowMatch.ts`](src/engine/generators/shadowMatch.ts) — emoji silhouette via CSS
  `brightness(0)`, revealed on the right answer; a silhouette-twin exclusion keeps
  apple/cookie — identical black circles — from ever co-occurring). Levels 20–21;
  9 categories / 21 levels total. **84 tests passing**, build & lint clean.
  **Uncommitted.**
- **2026-07-04 — Early-band expansion (user-approved tracks A+B+C+D).** The 4–6 band
  **more than doubles: 21 → 46 levels, 10 categories.** (A) Every category deepened:
  count-down & count-by-tens (`sequence` gained descending + decade-aligned modes),
  zero via `allowZero` (count + subtract), `one-more`, fewer/`same-or-not`/
  `num-compare`, doubles + `bond` (Make 5/10), `sides` (+pentagon/hexagon glyphs),
  ABC `pattern`s, `coin-compare`. (B) Puzzle Grove grew to 6 (who-left memory flash,
  belongs sorting-by-kind, first/middle/last position words, size odd-one-out) +
  Morning-or-night day scenes. (C) **Big & Small 📏** opened (size/height/weight
  comparisons; `content/world.ts` weight pairs). (D) Three interaction upgrades:
  **make-amount** (toggle coins to a spoken running total + ✔️), **set-clock**
  (tap-to-turn the hand — deliberately not drag; easier for small motor skills),
  **tap-all** (multi-select shape hunt that completes itself). THEMES grew to 15 with
  `kind` tags for sorting play. ~23 seed-swept invariant tests added; generic
  SideAnswer/CardPick stages keep the renderer count sane; ClockFace/CoinFace
  extracted. **107 tests passing**, build & lint clean. **Uncommitted.**
- **2026-07-04 — Sprint mode (the high-score direction, user-steered).** Scores + time
  limits arrived as a **post-mastery layer** (user picked the recommended design over a
  full pivot): every CLEARED level gains a 🏆 Sprint — as many questions as
  `level.sprintSeconds` allows (content data: 60s default, 90s for flash/build/confirm
  activities), +1 per correct, spoken running score. Early-band framing per pillar:
  ambient sun-track timer, wrong answers cost nothing, ending is always "You got N!"
  (+ "A new best!"). New: [`SprintScreen`](src/screens/SprintScreen.tsx);
  **`ActivityStage` extracted** from PlayScreen (all 24 activities render identically
  in both modes); `bestScores` in the store (forward-only, migrated, reset-wiped);
  entry points on ClearedScreen + CategoryScreen chips w/ per-level bests + category
  trophy total; ParentView "Sprint best" lines. Partial (backed-out) runs still save.
  Sprint misses advance to the next question (retry-until-correct is mastery-only).
  **112 tests passing**, build & lint clean.
- **2026-07-04 — Committed & pushed.** Everything above (ten increments since Phase 0)
  landed as **`14bef7a`** on `main` →
  [github.com/jhong03/EducationGame](https://github.com/jhong03/EducationGame). The
  per-increment "Uncommitted" notes above are historical. *Lesson recorded: commit per
  increment from now on — these overlapped too much in the same files to slice
  retroactively.*
- **2026-07-04 — Phase 3: the mid band opens (7–9).** Four `band: 'mid'` categories —
  **Place Value 🧱** (tens/ones → hundreds via base-ten-block renderer, rounding to
  ten), **Times Tables ✖️** (equal-groups visual → ×2/5/10 → ×3/4/6 → all-to-12;
  distractors are *adjacent table entries*), **Add & Subtract ➕** (bare-number `arith`
  within 20/100 on the new ExprCard), **Sharing 🍰** (fair-share visual + exact division
  facts). Ids live in their own `math-mid-1..13` space (`makeLevel` is band-general
  now). `bandForAge(7..9)` now serves real content — the "still growing" fallback
  remains only for `upper`. Place-value options always include the **digit-swap**
  misread (73↔37). **Mid sprints went arcade** per decision #7: visible m:ss countdown
  (coral under 10s) + 🔥 streak bonus (3-in-a-row and beyond score double); early
  sprints unchanged. Placement: ages 7+ skip the early plan (their band starts fresh).
  **121 tests passing**, build & lint clean. Committed & pushed as **`60e407f`**.
- **2026-07-04 — Mid deepening wave (user-directed: "7–9 is the most important
  phase").** The mid band **triples: 13 → 38 levels, 4 → 12 chapters.** Existing four
  deepened (compare/round to 999–1000, the tricky 6/7/8/9 tables, big sums, more
  division + **remainders** via `leftover`). Eight NEW chapters: **Fractions 🍕**
  (shaded-bar reading, halves→eighths, non-unit), **Measuring 📐** (`unit-pick` with
  same-dimension foils, area-by-squares + perimeter via `grid-rect`), **Time Master ⏰**
  (clock gained a five-minute mode — choices differ by MINUTE; `elapsed` hours between
  two faces), **Money Math 💰** (bigger coin sums + `change`), **Data & Graphs 📊**
  (block-graph `graph-count`/`graph-most`), **Shape Lab 🔺** (sides + `shape-sort` by
  property), **Number Detective 🕵️** (`missing` □-equations incl. ×; aligned
  skip-count trails), **Story Problems 📖** (`word-problem` from
  [`content/stories.ts`](src/content/stories.ts) templates). Also fixed in passing:
  `round` nearest-100 could only round DOWN (offset now spans the full gap,
  both-ways test added). Ids `math-mid-14..38`; **22 categories / 84 levels** total.
  **133 tests passing**, build & lint clean. Committed & pushed as **`6ea2ab2`**.
- **2026-07-04 — Handoff true-up before chat compaction.** This file audited
  end-to-end against the code (§1 TL;DR, §2 module map incl. all generators /
  SprintScreen / ActivityStage / store fields, §4 gaps, §5 roadmap now pointing at
  Phase 4 + upper band, §7 hashes). If you are resuming from a compacted chat:
  **this document + [CURRICULUM.md](CURRICULUM.md) are the source of truth.**
- **2026-07-04 — Reset re-asks the age.** User-reported: once an age is persisted, the
  gate never reappears (correct for returning players, but there was NO in-app path
  back to it). `reset()` now clears `age` too (pace/mute survive) → closing the
  grown-ups panel after a reset lands on the age gate, and placement re-offers on the
  fresh profile — the "new sibling" handoff. Parent route moved above the gate in
  `App.tsx` (no mid-panel yank); reset copy says so. **73 tests passing**, build &
  lint clean. **Uncommitted.**
- **2026-07-04 — Phase 4: written methods & constructions — the mid band is
  complete.** Four new activities close CURRICULUM.md §5 Phase 4: **column-op**
  (column +/− with a FORCED ones-carry/borrow; distractors are the real slips —
  forgot-the-carry = answer−10, per-column big-minus-small `flipDigits`),
  **fraction-op** (equivalence — the equivalent card provably unique by
  cross-multiplication, add-1-to-both / scaled-bottom-only traps — plus
  same-denominator ± with the added-the-denominators trap; prompts speak fraction
  words via new `fractionWord`), **read-scale** (partitioned ruler/scale SVG; the
  pointer only ever sits on an UNLABELED tick, so the child counts divisions),
  **build-graph** (tally chart → tap towers up, wrap past the top → ✔️; boards
  digit-encoded so one number rides the ordinary answer path). 10 levels
  (`math-mid-39..48`) deepen Add & Subtract, Fractions, Measuring, Data & Graphs →
  **22 categories / 94 levels / 45 activities**. In passing: the round card's caption
  now says "nearest hundred" on nearest-100 levels (was hardcoded "ten");
  `FractionBar`/`FractionCards` extracted so fraction-of/fraction-op render
  identically. **139 tests passing** (seed sweeps for all four incl. carry/borrow
  forcing and decoy buildability), build & lint clean. Committed & pushed as
  **`6d5c539`** (+ docs `9e8384f`).
- **2026-07-05 — Phases 5–6: the upper band opens — ALL CURRICULUM PHASES BUILT.**
  The 10–12 band arrives whole: **11 categories / 30 levels (`math-upper-1..30`) /
  14 new activities**, each around its signature misconception — **find-number**
  (prompt speaks/prints WORDS via `numberWordBig`, numerals only on the buttons;
  digit-swap decoys), **decimal** (tenths bar & hundred-square; the 0.7-vs-0.07
  trap), **equiv-pick** (fraction↔decimal↔percent families), **percent-of** (whole
  answers by construction), **negatives** (line-read always on a negative tick;
  crossing-zero mode keeps the line as support), **angle** (SVG rays+arc, one card
  per family), **symmetry** (`SHAPE_SYMMETRY`; side-count confusion decoy),
  **order-ops** (the left-to-right evaluation is provably never the answer),
  **ratio** (one-group-off decoys), **mean** (whole by construction; the raw sum
  always offered), **chance** (certain/maybe/impossible as a FIXED-order scale),
  **convert** (both wrong powers of ten), **volume** (layers of cubes; single-layer
  decoy), **coord** (x≠y forced so the (y,x) swap is always wrong). Upgrades:
  `column-op` op:2 = short multiplication (forced ones-carry + dropped-carry decoy),
  `round` to 1000, `num-compare` below zero, `word-problem` two-step stories
  (`TWO_STEP_TEMPLATES`, regex-verified in tests). The age-11 test flipped from
  "growing note" to the real upper meadow; upper sprints inherit the arcade rails.
  **33 categories / 124 levels / 59 activities · 157 tests passing**, build & lint
  clean. Committed & pushed as **`1833abe`** (+ docs `698a08d`).
- **2026-07-05 — Southeast-Asia currencies (user-requested).** The seam gains the
  region's core set: **MYR (RM) · IDR (Rp) · THB (฿) · VND (₫) · PHP (₱)** — 11
  currencies in the picker. No generator/progress change (amounts stay small
  abstract values by design). Committed as **`00dac49`**.
- **2026-07-05 — Upper age tiers (user-directed: "significantly different
  difficulties for each age 10, 11 and 12").** Every upper category ladder now
  tops out with an **age-11 rung and an age-12 rung** (`Level.minAge`,
  `math-upper-31..52`): age 10 sees **30** upper levels, 11 sees **41**, 12 sees
  **52**. Tier rungs are APPENDED only (minAge monotone along order,
  test-enforced), so each age's ladder is a clean PREFIX and derived unlock is
  untouched; `levelsInCategoryForAge` feeds Home dots + CategoryScreen tiles, and
  `nextLevelAfter(level, age)` ends a 10-year-old's ladder at their tier (the
  cleared→next route passes the age). Three new activities — **angle-sum**
  (line-pair/triangle to 180°), **riddle** ("I'm thinking of a number"; the
  half-undone value is the decoy), **chance-frac** (f/t vs complement + odds) —
  plus 12 generator mode upgrades (mixed rounding, 5-digit number words,
  decimal compare/sums with exact-by-construction floats, temperature gaps +
  minus sums on the marked line, 3-digit column ×, double brackets, share-in-
  ratio, missing-score means, reverse conversions, volume by formula,
  four-quadrant + translate coordinates, harder percent sets).
  **33 categories / 146 levels / 62 activities · 180 tests passing** (tier
  sweeps, prefix/monotonicity invariants, per-age visibility 30/41/52, App-level
  "rungs appear with age"), build & lint clean. Committed & pushed as
  **`5c82b7c`** (+ docs `befe1d8`).
- **2026-07-05 — Upper placement: 11/12-year-olds probe past the tiers below
  them.** [`PlacementScreen`](src/screens/PlacementScreen.tsx) swapped its
  hand-rolled count/compare forms for the shared **`ActivityStage`** — any of
  the 62 activities can now be a checkpoint, rendered exactly like real play
  (early plans render identically through the same path). New plans: **age 11**
  proves the base tier's grindy number-work in 5 checkpoints (round-to-1000,
  thousands ladder, hundredths, easy percents, the number line — each probe the
  TOP rung of what it places); **age 12** extends two probes into the 11+ rungs
  (the decimal ladder through "longer isn't bigger", the calculation ladder
  through "giant times"). Novel forms (angles, coordinates, riddles, chance)
  stay as quick wins. Age 10 has no plan — it IS the base tier. First-miss-ends-
  warmly, Skip, no-stars, never-downgrade all unchanged; App routing needed
  zero changes (already generic on `placementPlanFor`). **183 tests passing**
  (12-deeper-than-11, minAge visibility, gap-free extended to upper, full App
  flow), build & lint clean. Committed & pushed as **`72447ec`** (+ docs
  `e3bcbf9`).
- **2026-07-05 — Parent settings split (user-requested: "settings page shouldn't
  be so long").** The 33-category × 146-level breakdown moved off the grown-ups
  screen into its own **`ProgressPage`** (sticky header, back-to-settings),
  reached via a "Chapter progress" card. Settings is now a short scroll:
  stats · age · currency · pace · progress card · privacy · reset. Unchanged
  content, new home. **184 tests passing** (settings-stays-short + navigation
  round-trip), build & lint clean. Committed & pushed as **`d402e58`** (+ docs
  `4f8d7d5`).
- **2026-07-05 — Player names (user-requested).** New
  [`NameScreen`](src/screens/NameScreen.tsx) after the age gate ("What's your
  name?", spoken with an echo-respecting delay; typed by a grown-up, ALWAYS
  skippable — pre-readers add it later via the new **Child's name** section in
  settings). `name` joins the persisted child profile (one `sanitizeName`
  write path: trim/20-cap/empty→null; migrated; reset clears it with the age).
  Shown: **"Hi {name}!" on the meadow** (+ spoken once per session, same latch
  pattern as the growing note) and a **`PlayerChip`** (name + LIVE star count)
  on the Play and Sprint top bars — stars tick up as answers land, so the chip
  is the in-play status. **189 tests passing** (store semantics, the full
  age→name→meadow flow, skip path, live star tick, settings save/clear),
  build & lint clean. Committed & pushed as **`9e7857b`** (+ docs `5a72377`).
- **2026-07-05 — Adaptive difficulty: the LAST seam fills.** New
  [`engine/adaptive.ts`](src/engine/adaptive.ts) (pure): a question that took
  2 tries makes the next gentler (×0.8), 3+ gentler still (×0.6) — recovery is
  instant; replaying a mastered level ramps UP by pace (eager ×1.5, steady
  ×1.25, gentle never). Invisible to the child. Scope: **mastery play only**
  (sprints stay fair, placement stays canonical, the goal never changes);
  only `max` scales (floored at 3; `column-op` excluded — its max is a digit
  mode); `replay` is the at-mount cleared state so mastering mid-attempt
  can't ramp its own attempt. **195 tests passing** across 9 files (rule
  table + a sweep proving every emitted scale still generates sound questions
  for every scalable level), build & lint clean. Committed & pushed as
  **`9219091`** (+ docs `0378228`).
- **2026-07-05 — Voice overhaul (user feedback: "too plain and robotic").**
  Three fixes inside the AudioManager seam: **(1) ranked voices** —
  `rankVoices` prefers the device's modern Natural/Neural voices over the
  browser default (auto mode follows the top rank); **(2) a family picker** —
  "Twinkle's voice" in the grown-ups panel (top-6 chips, friendly labels via
  `voiceLabel`, instant preview; persisted `voiceId` device setting that
  survives reset); **(3) delivery styles** — `prompt`/`praise`/`soft`/`count`
  presets replace the single flat rate/pitch, applied across every call site
  (cheers bright, "Try again!" gentle, numbers crisp), with ±4% per-utterance
  jitter so repeated lines never sound like replayed samples. Recorded-VO seam
  untouched. **200 tests passing** across 10 files, build & lint clean.
  Committed & pushed as **`677a7b7`** (+ this docs true-up).
