# Number Meadow — Session Context & Handoff

> Living continuation doc for Claude Code sessions. The [README](README.md) is the
> product/architecture reference; **this file is the state-of-play** — what's done,
> what's verified, what's next. Update it at the end of each working session.

_Last updated: 2026-07-05 · Branch: `main` · HEAD: `7dfab57` (committed & pushed to
[jhong03/EducationGame](https://github.com/jhong03/EducationGame)) — working tree CLEAN.
**Recent arc (see §7): warm-premium redesign → Garden reward economy → real 3D garden →
free-placement garden → lesson/class system → practice mode → deeper mastery goals. 247
tests green, build & lint clean.** Resume pointers: the DEV-only 🔧 button in the garden
header (`import.meta.env.DEV`-gated) grants currency for auditing the 3D item models
(several are still stylised approximations — iterate from user screenshots); mastery
goals are tunable in `MASTERY_OVERRIDE` (math.ts). **The user plans to publish to the
GOOGLE PLAY STORE — see §5's "Google Play Store launch" checklist (TWA/PWA wrap; the
app's local-only, no-data, no-ads, no-SDK design makes kids'-app compliance the easy
path; the real gaps are HTTPS hosting + rasterized PNG icons + a privacy-policy page).**_

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
  rides a live name+⭐ chip during play), placement check (**5–6 / 8–9 / 11–12** —
  every band's older starters), pace profiler, **adaptive difficulty**
  (mastery-only: hard questions soften the next one, mastered replays ramp by
  pace), **lifetime accuracy stats** (per-level attempts/correct, mastery only),
  **daily warm-up** (spaced review v1: shakiest earned skills resurface each
  day), **progress export** (CSV/JSON from the Chapter-progress page),
  per-continent + SEA currency,
  **Sprint mode** (post-mastery high scores: ambient sun timer for early, m:ss
  countdown + 🔥 streak-doubling for mid), parent dashboard with gated reset
  (reset re-asks age → new-sibling handoff).

Resume by reading §7's last entries; the curriculum phases are ALL BUILT (0–6).
Next work is polish/systems: adaptive difficulty, spaced review, parent export,
recorded VO, PWA PNG icons (§5).

### Verified this session (all green)
| Gate | Command | Result |
|---|---|---|
| Unit + loop + app tests | `npm test` | **217 passed** across 11 files |
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
  `pace`, `age`, `name`, `currency`, `bestScores`). `LevelProgress` carries
  optional **lifetime `attempts`/`correct` counters** (bumped by `recordAnswer`
  on every MASTERY answer — sprints don't count; every other write carries
  them through). Names go through ONE write
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
- [`engine/warmup.ts`](src/engine/warmup.ts) — **daily warm-up picker** (spaced
  review v1; pure, content-free): up to 3 EARNED-mastered levels, shakiest
  lifetime accuracy first (never-measured last), date-seeded tie rotation,
  one-per-category spread. Home renders the card; replays ride the adaptive
  replay ramp. No timestamps in the save — "spaced" ≈ daily reshuffle +
  accuracy priority.
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
  `capitalize`) + `fractionWord` ("3/4" → "three quarters") + `numberWordBig`
  (to 999,999 — find-number prints WORDS and hides the numerals in the
  buttons) + `PRAISE` (the on-screen cheer pool). All printed in prompts.
- [`content/themes.ts`](src/content/themes.ts) — 15 countable objects, each with
  emoji + plural + a `kind` tag (food/animal/nature/toy) powering sorting play.
- [`content/world.ts`](src/content/world.ts) — weight pairs (heavier-first),
  day scenes, `MEASURE_OBJECTS` (thing + right unit + same-dimension foil),
  `SCALE_UNITS` (cm/g/ml — printed label + long name for read-scale),
  `CONVERT_PAIRS` (metric hops + factors), `CHANCE_LABELS`/`CHANCE_SCENARIOS`
  (the probability-language scale). [`content/shapes.ts`](src/content/shapes.ts)
  gained `SHAPE_SYMMETRY` (mirror-line counts as ShapeGlyph draws them);
  [`content/stories.ts`](src/content/stories.ts) gained `TWO_STEP_TEMPLATES`.
- [`content/stories.ts`](src/content/stories.ts) — word-problem templates
  (+/−/× with `{a}` `{b}` `{things}` placeholders).
- [`content/placement.ts`](src/content/placement.ts) — placement plans for every
  band's older starters: early **5–6** (skip the counting grind), mid **8–9**
  (tens-and-ones → tables → adding; 9 probes deeper), upper **11–12** (the
  tiers below your own; 12 reaches into the 11+ rungs). Band floors (4, 7, 10)
  start fresh. Each probe is the TOP rung of what it places. Gap-free +
  minAge-visible by test.

### Audio
- [`audio/AudioManager.ts`](src/audio/AudioManager.ts) — the **only** place the game
  makes sound, and **the game is VOICELESS by design (user direction
  2026-07-05: all voiceovers removed)**. What remains: the synthesized
  Web-Audio SFX palette (`good/soft/pop/win`), `setMuted`, and `unlock()`
  (AudioContext resume on first gesture). Every instruction is PRINTED, praise
  is chime + on-screen word pills, counting shows ordinals visually. Because
  this seam is still the single door to sound, a voice layer could return
  without touching game code (the whole TTS/clip era lives in git history —
  Piper pipeline included). Feature-detected + try/catch → never crashes.

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
  ("How old are you?" printed big; numeral buttons 4–12; one tap, no confirm — a
  grown-up can correct it later). Shows whenever `age === null` (fresh installs and
  pre-age saves).
- [`screens/NameScreen.tsx`](src/screens/NameScreen.tsx) — "What's your name?",
  right after the age gate (typed by a grown-up or reading child,
  ALWAYS skippable). Purely cosmetic; placement (if any) follows from here.
  [`components/PlayerChip.tsx`](src/components/PlayerChip.tsx) — the name +
  LIVE star count pill on the Play/Sprint top bars (renders nothing unnamed).
- [`screens/Home.tsx`](src/screens/Home.tsx) — **category cards** on the meadow (one per
  strand of the child's **band**, always open, mini progress dots); star counter;
  "Hi {name}! 👋" under the title; **🔄 Today's warm-up card** (chips replay
  earned levels directly); discreet "⚙️ For grown-ups" entry. The 🌱 "still
  growing" fallback (empty band → early meadow + banner) is now UNREACHABLE —
  every band has content — but stays as the safety net for any future empty band.
  *(Replaced the old winding trail.)*
- [`screens/CategoryScreen.tsx`](src/screens/CategoryScreen.tsx) — one category's levels
  as a **grid of chunky tiles** (locked 🔒 / open+glowing / cleared ⭐); tapping a
  locked tile answers with a soft boop + padlock shake (focus preserved).
  Deliberately *not* a path.
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
  session plan), a **"Chapter progress" card → its own `ProgressPage`** (sticky
  header + back-to-settings; stats, a **"Save a copy" export row (CSV/JSON
  via [`export/progressReport.ts`](src/export/progressReport.ts)** — pure
  builders, name-slugged dated filenames, proper CSV quoting), and all 33
  categories' level lists with status pills — "Placed" distinct from
  "Mastered" — best streaks, **"N answers · X% right" accuracy lines**, and
  🏆 sprint bests; the grown-up sees FULL ladders incl. rungs above the
  child's tier), a
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

### Theme / config — the warm-premium design system (redesigned 2026-07-05)
- [`theme/tokens.css`](src/theme/tokens.css) — the **warm & premium** palette + system
  as CSS custom properties: deep-plum ink (`--ink`/`--ink-soft`/`--ink-faint`), warm
  ivory canvas (`--sky-1/2`, `--cream`, `--cream-2`), de-candied accents (`--grape`
  amethyst, `--sun` gold, `--coral` dusty-rose, `--leaf` sage, `--clay`), refined `-dp`
  edge tints, **soft layered elevation** (`--e1/--e2/--e3`, `--e-ring`), premium
  **gradient fills** (`--grape-grad`, `--sun-grad`, …, `--surface-grad`), a **radius
  scale** (`--r-sm..--r-xl`, `--r-pill`), hairlines (`--line`, `--line-strong`,
  `--tint`), and the **type pairing** (`--font-display` Fredoka + `--font-text`
  Manrope). All aliased into Tailwind v4 via `@theme inline` (`bg-grape`,
  `text-ink-soft`, `font-text`, …).
- [`index.css`](src/index.css) — imports both faces, a refined focus ring (crisp
  amethyst line + soft gold halo), and the **premium utility layer**: `.u-card`
  (elevated ivory surface), `.u-glass` (frosted top-bar pill), `.u-eyebrow`
  (uppercase tracked label — the key "grown-up software" tell), `.u-rule`, `.font-text`.
- [`theme/animations.css`](src/theme/animations.css) — keyframes softened for the
  premium feel (calmer pop/bob/cheer; the open-tile `glow` is now a soft breathing
  lift + faint gold ring, not a sticker). All motion disabled under
  `prefers-reduced-motion`.
- **The old "kindergarten" tells are gone**: hard `0 6px 0` sticker shadows → soft
  ambient/inset "tactile key" shadows; `4px solid cream` chunky borders → hairlines;
  candy primaries → refined gradients; emoji stripped from chrome/labels (kept & framed
  for kid content); cartoon hills/sun → a subtle light-and-horizon backdrop; flat
  single-weight type → a real Fredoka-display / Manrope-text hierarchy. Every screen +
  shared component restyled; Twinkle redrawn (token colours, soft sheen + drop shadow,
  calmer face). Colour-mixing via `color-mix(in srgb, …)` for accent tints.
- Tailwind **v4** via `@tailwindcss/vite`. Fonts self-hosted via `@fontsource`
  (Fredoka + **Manrope**, no runtime CDN fetch).
- [`vite.config.ts`](vite.config.ts) — React + Tailwind + `vite-plugin-pwa`
  (`autoUpdate`, manifest with theme/background colors). Vitest config lives here too
  (jsdom, globals).

### Tests (217, all passing)
- [`engine/warmup.test.ts`](src/engine/warmup.test.ts) — earned-only picking,
  shakiest-first, category spread, same-day determinism.
- [`export/progressReport.test.ts`](src/export/progressReport.test.ts) —
  full-coverage rows, status parity with the panel, accuracy math, CSV
  escaping + field-count sweep, JSON round-trip, filename slugs.
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
6. **Reduced-motion + chime-feedback + generous touch targets** are quality gates, not
   nice-to-haves. Since the 2026-07-05 redesign the target standard is explicit: the
   **primary answer surfaces** a child taps to play (number keys, level tiles, category
   cards, age buttons) stay **≥64px**; secondary chrome (back/mute glass pills) is
   **≥56px** — still comfortably above WCAG 2.5.5. (The game is VOICELESS by user
   direction — every instruction is printed; SFX carry the moment-to-moment feedback.)
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
- **The game is voiceless** (user direction 2026-07-05) — a few early-band prompts
  (heavier/lighter, first/last, one-more/fewer) rely on a grown-up reading the
  printed question to a pre-reader. The AudioManager seam still exists, so a
  voice layer could return from git history if ever wanted.
- **Mid band relaxes the pre-reader rule deliberately** (7–9s read): expression cards,
  unit labels, story text. Prompts are printed on every screen.
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
1. ~~**Parent dashboard extras**~~ ✅ Done — CSV/JSON export from the
   Chapter-progress page + lifetime attempts/accuracy per level.

### Later (seams noted, not built)
2. ~~**Spaced review**~~ ✅ Done (v1) — the daily warm-up
   ([`engine/warmup.ts`](src/engine/warmup.ts)). A v2 with real timestamps
   (`lastPlayedAt` per level) would enable true spacing intervals.
3. ~~**Mid placement plans**~~ ✅ Done — ages 8–9 probe past the mid basics.
4. **New subjects** (reading, shapes-as-subject, …) — the engine is already
   subject-agnostic; more content modules + activities.
5. ~~**Recorded voice-over clips**~~ RETIRED — the game is voiceless by user
   direction (2026-07-05). The Piper pipeline and hybrid playback live in git
   history (`a691f55`/`e4c10d9`) should voice ever return.
6. **Deeper upper enrichment** (long division, protractor measuring, pie charts,
   logic grids) — strand rungs beyond the core spine.
7. **Multiple named profiles** (siblings without reset) — a real store
   restructure (per-profile progress maps); a decision, not a chore.

### Pre-launch (product/legal — not engineering-blocked, keep in mind)
- **COPPA (US) / GDPR-K (EU)** constrain accounts, data collection, ads. Currently no
  backend/login/analytics — progress is local-only. Keep it that way until a privacy
  plan exists.
- **Content pipeline** — keep levels addable as data; ideally eventually authorable
  without code changes.
- **Rasterized PWA icons** (see §4).

#### 🎯 Google Play Store launch (user's plan, 2026-07-05) — TWA/PWA path
The app is a PWA, so the standard route is a **Trusted Web Activity (TWA)** wrapper
(via **Bubblewrap** CLI or **PWABuilder**) that ships the installed PWA as an Android
`.aab`. **Strong position already**: local-only, no accounts, no backend, no analytics,
no third-party SDKs, no ads, offline-capable — which makes the kids'-app compliance the
*easy* path. Engineering/store checklist for next session(s):
1. **Deploy the PWA to stable HTTPS hosting** (a real domain) — required before wrapping.
2. **Rasterized PNG icons** (192 + 512 **maskable**) — currently SVG-only (§4). Also need
   a Play **512×512 icon**, **1024×500 feature graphic**, and phone/tablet **screenshots**.
3. **Wrap with Bubblewrap/PWABuilder** → `.aab`; host **`/.well-known/assetlinks.json`**
   (Digital Asset Links) so the app verifies the domain and drops the URL bar.
4. **Play App Signing** + keystore; meet Play's **target API level**.
5. **Kids'-app policy** — this is a children's education app, so complete Play's
   **Families policy / "Designed for Families"** setup, **content rating** (IARC → likely
   Everyone), **target audience = children/mixed**.
6. **Privacy Policy URL** (REQUIRED) — write one that states the truth: *no data
   collected, no accounts, no ads, everything on-device*. Wire the **Data Safety** form to
   match ("no data collected/shared").
7. Keep it clean: **do NOT add analytics/ads/third-party SDKs** — that's what keeps
   COPPA/GDPR-K + Families compliance trivial. If monetising later, revisit (the garden's
   diamonds are earned, not real-money — see the garden entries).

---

## 6. How to pick up next session

1. `npm install` (if needed) → `npm test` should show **217 passing** → `npm run dev` to
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
  Committed & pushed as **`677a7b7`** (+ docs `41552dc`).
- **2026-07-05 — Recorded-VO hybrid: the playback pipeline lands.** `speak()`
  now plays a recorded mp3 for any FIXED line in the
  [`voClips.ts`](src/audio/voClips.ts) manifest (13 lines, keyed by EXACT
  spoken text → zero call-site changes) and falls through to styled TTS for
  dynamic sentences and any missing/refused clip (per-line negative
  memoization — an empty `public/vo/` costs nothing). Mute stops clips;
  latest-line-wins spans both channels; jsdom gated out via `canPlayType`.
  Workbox precaches mp3 (+fonts, 7→25 entries) for offline; `PRAISE` moved to
  [`content/words.ts`](src/content/words.ts). **Clip generation attempted via
  Higgs `generate_audio` (seed_audio, "Skye" preset) but BLOCKED: free plan,
  0 credits (~1.3 needed for 13 clips)** — the manifest + `public/vo/README.md`
  recording sheet are the generation script for when credits exist. **202
  tests passing**, build & lint clean. Committed & pushed as **`e4c10d9`**
  (+ docs `cf6d3a4`).
- **2026-07-05 — VO pack GENERATED with Piper (user direction: "just use
  piper, like my Jarvis dashboard").** All 13 clips real and shipped (156KB
  total): the Jarvis app's bundled `piper.exe` + a freshly-downloaded
  **`en_GB-jenny_dioco-medium`** voice (warm UK female — Twinkle's own; Alan
  stays Jarvis's), driven by [`tools/vo/generate-vo.sh`](tools/vo/generate-vo.sh)
  (per-mood `length_scale`: praise 0.92 / comfort 1.06 / prompts 1.0; ffmpeg
  edge-silence trim + `loudnorm` to one level; mono mp3 q4). The hybrid seam
  lit up with ZERO code changes — praise/comfort/milestones/big prompts now
  play recorded audio, dynamic sentences stay on ranked styled TTS. Model
  (~63MB) gitignored with its download URL in the script. PWA precache 25→38
  entries (clips offline). **202 tests passing**, build & lint clean.
  Committed & pushed as **`a691f55`** (+ docs `bbf6c07`).
- **2026-07-05 — VO pack energized (user: first pass "way too robotic").**
  Regenerated with expressive prosody (noise_scale 0.8–0.85, noise_w 0.9–0.95,
  cheer pacing 0.82) + a character chain: **formant-lifting pitch-up** via
  asetrate (cheer ≈+2.7 semitones — deliberately young/cartoon-guide; not
  rubberband, which keeps the voice adult), +6% cheer tempo, treble sparkle,
  punchy compression, −16 LUFS. Cheers now 0.26–0.55s bursts. Spoken text may
  deviate where it reads better ("Woo-hoo!") — app keys/files unchanged.
  Tuning knobs live in `preset()` in
  [`tools/vo/generate-vo.sh`](tools/vo/generate-vo.sh). Committed & pushed as
  **`0b3c502`** (+ docs `a8eec94`).
- **2026-07-05 — Voice-overlap fix (user-reported: two voices at once on level
  complete).** Root cause: stopping a clip whose `play()` promise was still
  pending made its AbortError rejection look like a broken clip — poisoning it
  AND speaking the STALE line via TTS over the new one (cascading on
  cleared-screen transitions). Now: our own aborts are normal flow (no poison,
  no fallback), superseded elements stay silent, only genuine failures on the
  CURRENT clip fall back; `unlock()` warms the whole 156KB pack on first
  gesture (no pending-fetch window); `rankVoices` nudges **en-GB** so
  auto-picked narration matches the clip accent — one character across both
  channels. **203 tests passing**, build & lint clean. Committed & pushed as
  **`3e089ee`** (+ docs `af15f2e`).
- **2026-07-05 — Praise unvoiced (user direction): chimes + on-screen words.**
  Correct/wrong feedback no longer SPEAKS: PlayScreen pops a praise word next
  to Twinkle (sun pill, `flash` state) on hits and a gentle "Try again!" pill
  on misses; the good/soft/win chimes stay as the pre-reader audio signal.
  ClearedScreen, sprint end and placement "Yes!" also went silent (their
  screens print the words). VO pack slimmed 13→5 clips (guidance + the two
  big prompts). What still speaks: question prompts, tap-counting, the sprint
  running score, guidance, greetings — the INFORMATIONAL voice. **205 tests
  passing** (words-on-screen flow + praise-is-unvoiced pins), build & lint
  clean. Committed & pushed as **`da99fb1`** (+ docs `def3610`).
- **2026-07-05 — THE MEADOW GOES VOICELESS (user direction: "remove all
  voiceovers").** AudioManager slims to the SFX palette (`good/soft/pop/win`,
  `setMuted`, `unlock`) — still the single sound seam, so a voice layer could
  return without touching game code. Every screen communicates visually +
  chime: printed prompts (🔊 replay buttons removed), tap-counting pops with
  ordinal badges, sprint scores tick silently in the chip, placement sign-offs
  show as TEXT in the prompt slot, locked tiles boop + shake their padlock
  (focus preserved), Age/Name gates are printed questions, Home drops the
  greeting/growing speech and category-name speech. ParentView loses the voice
  picker; `voiceId` retired from the store (old saves drop it on migrate).
  Deleted: voClips.ts, `public/vo/` clips, `tools/vo/`, the voice test suites;
  stale "spoken" comments trued up. **Known trade-off flagged**: a few
  early-band prompts now need a grown-up to read them to a pre-reader.
  **197 tests passing** across 9 files, build & lint clean. Committed & pushed
  as **`c7d6ae0`** (+ docs `b49727a`/`31989d1`).
- **2026-07-05 — The polish queue lands: four increments, one session.**
  **(1) Mid placement** (`d9d16d3`): ages 8–9 probe past the mid basics (8:
  tens-and-ones/first-tables/add-20 in 3 checkpoints; 9 deeper in 4); every
  band now fast-lanes its older starters (5–6 / 8–9 / 11–12), floors 4/7/10
  start fresh. **(2) Lifetime stats** (`d559be8`): `LevelProgress` gains
  `attempts`/`correct`, bumped by `recordAnswer` on every MASTERY answer
  (sprints excluded); all other writes carry the counters; the panel reads
  "N answers · X% right". **(3) Progress export** (`e61938b`):
  [`export/progressReport.ts`](src/export/progressReport.ts) (pure) + a "Save
  a copy" row on ProgressPage — CSV (proper quoting; comma-bearing level
  names) and JSON (metadata + rows), name-slugged dated filenames, panel-
  parity statuses, null accuracy never fakes 0%. **(4) Spaced review v1**
  (`bcd8d2c`): [`engine/warmup.ts`](src/engine/warmup.ts) — a daily
  "Today's warm-up" card on Home: up to 3 earned-mastered levels, shakiest
  accuracy first, date-seeded rotation, one-per-category; replays ride the
  adaptive ramp. **217 tests passing** across 11 files, build & lint clean
  (+ this docs true-up).
- **2026-07-05 — WARM-PREMIUM UI/UX REDESIGN (user direction: "the design looks
  like kindergarten — make it high-class so parents believe it's a quality
  app").** Confirmed direction with the user first (Warm & premium · refine —
  not remove — the Number Meadow world). Rebuilt the whole visual system, not
  just colours. **Foundation**: [`tokens.css`](src/theme/tokens.css) retuned to a
  boutique palette (deep-plum ink w/ soft/faint tiers, warm ivory canvas,
  de-candied amethyst/gold/dusty-rose/sage + clay), plus NEW elevation
  (`--e1/2/3`, `--e-ring`), gradient fills, radius scale, hairlines, and a
  **Fredoka-display + Manrope-text** pairing (`@fontsource/manrope` added); a
  premium utility layer in [`index.css`](src/index.css) (`.u-card`/`.u-glass`/
  `.u-eyebrow`); softened [`animations.css`](src/theme/animations.css). Because
  every screen reads these tokens, the palette shift cascaded across all 62
  activity stages for free. **Hand-crafted** the marquee surfaces: Home (ivory
  category cards w/ tinted medallions + segmented meters, a light-and-horizon
  backdrop replacing the cartoon hills/sun), Category tiles (locked/open/cleared
  states), the shared number-answer keys (gradient + inset "tactile key" shadow —
  the old `0 6px 0` sticker look is gone app-wide, incl. a sweep of ~15 stage
  buttons + `4px cream` borders → hairlines), Play/Sprint/Placement chrome
  (glass pills, Manrope, refined prompts), Cleared/Age/Name screens, and the
  **parent dashboard** (Manrope throughout, elevated cards, metric stats, tinted
  status pills, refined toggles/inputs/export — the buyer's quality-judgment
  screen). Redrew **Twinkle** (token colours, radial sheen + drop shadow, calmer
  face); refined ProgressDots/PlayerChip/MuteButton/Confetti/Countable. Emoji
  removed from chrome & button labels (kept, framed, for kid content). Copy
  nudged premium ("Hi X!" → eyebrow "Welcome back, X"; decorative 🗺️/🌈/➡️
  dropped from buttons) — App.test.tsx assertions updated to match (behaviour
  identical). **217 tests passing** across 11 files, build & lint clean. Committed
  & pushed (with the garden work) as **`79d3242`**.
- **2026-07-05 — GARDEN REWARD ECONOMY (user request: "kids earn stars &
  diamonds to buy stuff… a sandbox garden like the old Facebook games").**
  Confirmed the shape with the user first: a **creative sandbox** (buy · place ·
  rearrange; NO timers/chores/wilting/loss — the old FB charm without the dark
  patterns) and **mastery-earned diamonds** (no real money — keeps the local-
  only/no-collection posture). Two currencies: **stars** = effort (1/correct,
  already earned) buy plants/toys/decor; **diamonds** = skill buy pets & big
  builds. New: [`content/garden.ts`](src/content/garden.ts) (46-item catalogue,
  data-only, stable ids — plants/toys/decorations/pets/builds; effort→star,
  skill→diamond by test), [`engine/rewards.ts`](src/engine/rewards.ts)
  (`diamondsForMastery`: +1 first mastery, +5 chapter-complete, 0 on replay/
  placement — pure/tested). **Store (persist v2→v3)** gained `diamonds`,
  `starsSpent`/`diamondsSpent`, `owned` (id→count), `garden` (slot→id), and
  `awardDiamonds`/`buyItem`/`placeItem`/`removeItem` + selectors
  `starBalance`/`diamondBalance`/`availableCount`. **FORWARD-ONLY UPHELD**: the
  lifetime earned `stars`/`diamonds` never drop — spending accrues into
  `*Spent`, so a wallet = earned − spent while the parent's earned metrics stay
  intact; migration defaults old saves to an empty garden; reset wipes it with
  the child profile. **Reward hook**: PlayScreen mints diamonds on genuine first
  mastery (captured pre-clear) and threads the amount to
  [`ClearedScreen`](src/screens/ClearedScreen.tsx) (a "💎 +N for your garden"
  pill). **UI**: [`GardenScreen`](src/screens/GardenScreen.tsx) — a 30-slot plot
  (tap a tray item → tap an empty cell to place; tap a placed item to lift it
  back — no drag, nothing lost; pets idle-bob for life) + an in-screen **Shop**
  overlay (sections by kind, buy-on-tap, dimmed when unaffordable, owned-count
  badges), all in the warm-premium system. Home gained a **🌻 My Garden** entry
  card; the kid-facing star/diamond numbers (Home chip, PlayerChip, garden) now
  show the spendable **wallet** (parent dashboard still shows lifetime earned).
  New `garden` route in App. **241 tests passing** across 14 files
  (garden catalogue, rewards rule, wallet/plot/migration store tests, + garden
  integration in App.test), build & lint clean. Committed & pushed as **`79d3242`**.
- **2026-07-05 — GARDEN GOES 3D (user: the flat grid was "too effortless… I
  expected a 3D garden like real life, pets moving, plants in pots").** Confirmed
  direction: **real stylized 3D** (react-three-fiber) — set the honest
  expectation that photoreal isn't feasible in a kids' PWA; the target is a
  charming low-poly world. **The economy/shop/rewards are untouched** — only the
  plot VIEW changed. New deps: `three` `@react-three/fiber@9` (React 19)
  `@react-three/drei` + `@types/three`. New: **procedural low-poly models**
  ([`screens/garden3d/models.tsx`](src/screens/garden3d/models.tsx)) built purely
  from three primitives (NO asset pipeline) — plants-in-terracotta-pots,
  critters (long/round/pointy ears, flyers, shells, a horned unicorn), toys,
  decorations, buildings; each of the 46 items maps to an archetype tinted by an
  appearance table. **The scene**
  ([`screens/garden3d/Garden3D.tsx`](src/screens/garden3d/Garden3D.tsx)): grass
  ground + mown bed, hemisphere + sun light with soft shadows, warm fog, drag-to-
  orbit camera (constrained via drei `OrbitControls`), **tap the ground to plant**
  (raycast → snap to a 5×6 grid slot; `e.delta` guard ignores camera drags), a
  gold target-ring while placing, **pets wander** the lawn (per-pet `useFrame`
  stroll-and-pause + facing + bob) and are tapped to lift; honours
  `prefers-reduced-motion` (pets hold still). **GardenScreen** now frames a DOM
  HUD (header wallet, tray, shop) around the 3D center; the store slot-model is
  reused verbatim (place/remove/availableCount). **Perf/robustness**: the 3D
  scene is **code-split + lazy-loaded** ([`webgl.ts`](src/screens/garden3d/webgl.ts)
  gates it on WebGL support) so the core bundle stays ~110KB gz (3D chunk 243KB
  gz loads only in the garden); a **2D fallback plot** stands in with no WebGL —
  which is also why the jsdom tests still pass (three is never imported there).
  PWA: the 3D chunk is **excluded from precache** (globIgnores) and CacheFirst-
  cached on first garden visit, so install stays light. **241 tests still green**
  (the 3D path is exercised via the fallback), build & lint clean. Committed &
  pushed as **`79d3242`**.
- **2026-07-05 — 3D-garden art pass + camera + tuning (screenshot-driven, since
  the render can't be seen from here).** Iterated the low-poly models from the
  user's screenshots: rebuilt the **slide** (proper guard-rail handrails + roof
  + ladder), **yo-yo** (twin discs on an axle), **kite** (was scattered — now a
  fixed-anchor sail with a tail threaded on a spine + a taut ground string,
  gentle wind-sway only), **sandcastle** (towers/crenellations/gate/windows/
  flags), **bird nest** (twiggy bowl + eggs), **bunting** (grounded poles, flags
  hanging vertically), **rainbow** (stands vertical over the spot),
  **fountain** (looping water jets), **bridge** (arched footbridge),
  **carousel** (spinning horses under a striped canopy), **pagoda** (3 flared
  tiers). **Real bug fixed**: `deco-stone` (`rock`) and `deco-clock` (`clock`)
  had no model case so they fell through to `pillar` — identical to the statue;
  added distinct **stepping stone**, and a **working garden clock** that faces
  forward and tells the real system time (hour/minute/second hands from
  `new Date()` each frame; second hand snaps per-second under reduced motion).
  New/redone creatures: **chick** (dedicated model — cone beak/wings/tuft/tail,
  no longer a yellow snowman), **bee** (striped body + buzzing wings, distinct
  from the butterfly), **butterfly** now flies with a fluttering aerial path
  (`FlyingPet`) vs ground `WanderingPet`, **hedgehog** spines redistributed over
  the whole back dome pointing radially out (+ ears/feet). **Fairy lights**
  reworked twice → now floating **4-point sparkle stars** (billboarded via drei,
  additive glow, spin + twinkle). Added **real-world relative sizing**
  (`modelScale` — buildings dwarf pets). **Camera** (release-ready for PC +
  tablet): drei `OrbitControls` with explicit `mouseButtons`/`touches` — PC
  left-drag orbits, right-drag pans, wheel zooms; touch one-finger orbits, two
  fingers pan + pinch-zoom; **pan clamped** near the garden; tap-to-place still
  works via the drag-vs-tap `e.delta` guard. Added a **DEV-only 🔧 currency
  button** in the garden header (`import.meta.env.DEV`-gated — never ships) for
  auditing every item. Refactor: appearance data/sizing split into
  [`garden3d/appearance.ts`](src/screens/garden3d/appearance.ts) (lint-clean
  component module). **241 tests still green**, build & lint clean. Committed &
  pushed as **`79d3242`**.
- **2026-07-05 — Garden free-placement + a teaching layer (lessons → practice) +
  deeper mastery.** Several increments, all verified (**247 tests**, build & lint
  clean): **(1) Yo-yo model fix** (a stray group rotation had tipped it into a
  blob). **(2) FREE-PLACEMENT GARDEN** — dropped the fixed 5×6 slot grid; the
  store's `garden` is now **positioned instances** (`PlacedItem[]` `{key,itemId,
  x,z}`, persist **v3→v4** migration converts old slot maps to positions), items
  drop at the exact tapped point with a pointer-following ring, each item is its
  own hitbox, and a **float layer** (`content/garden.ts` `floatHeight`/`isFloating`
  — fairy lights + balloon) renders floating items in the air vs on the ground;
  bigger roam/pan area. **(3) LESSON/CLASS SYSTEM** — `content/lessons.ts` (data:
  8 illustrated classes for fractions/times-tables/place-value/percents/
  below-zero/money/time/angles), `components/LessonVisual.tsx` (fraction-bar, dot
  array, base-ten, hundred-grid, number-line, coins, clock, angle figures),
  `screens/LessonScreen.tsx` (paged, premium, voiceless). A **📖 "What is this?"**
  button on the category screen (for lessoned strands) opens the class. **(4)
  PRACTICE MODE** — `screens/PracticeScreen.tsx`: after a class, "Let's try it!"
  opens **endless stakes-free practice** (no stars/diamonds/mastery/progress;
  reveals the answer after 2 misses), then **"I'm ready!"** hands off to the real
  level. New App routes `lesson` + `practice`. **(5) MASTERY GOALS RAISED** —
  `masteryGoalFor(band, category)` in math.ts: base **4/5/6** by band with
  per-chapter overrides (tables/place-value/fractions 6; decimals/percents/ratios
  7); `MASTERY_OVERRIDE` is the one place to retune. Committed & pushed as
  **`7dfab57`**.
