# Number Meadow — Session Context & Handoff

> Living continuation doc for Claude Code sessions. The [README](README.md) is the
> product/architecture reference; **this file is the state-of-play** — what's done,
> what's verified, what's next. Update it at the end of each working session.

_Last updated: 2026-07-04 · Branch: `main` · HEAD: `6ea2ab2` (pushed to
[jhong03/EducationGame](https://github.com/jhong03/EducationGame)) — the working tree
is CLEAN; everything in the §7 session log is committed and pushed._

---

## 1. TL;DR — where we are

**The game serves ages 4–9 for real: 22 categories · 84 levels · 41 activity types.**
- **Early band (4–6): complete and deep** — 10 categories / 46 levels: counting (incl.
  zero, ±1, count-down, count-by-tens), compare (more/fewer/equal/numerals), add
  (doubles, bonds), subtract (to zero), shapes (+sides, tap-all), patterns (AB→ABC),
  clock (o'clock/half-past, set-the-clock, day scenes), money (coins, make-amount,
  coin-compare), Puzzle Grove (odd-one-out, shadow match, who-left, belongs, position,
  size), Big & Small (size/height/weight).
- **Mid band (7–9): open and rich** — 12 chapters / 38 levels: Place Value (blocks to
  999, rounding, compare), Times Tables (groups → all-to-12 → tricky 6/7/8/9),
  Add & Subtract (to 1000), Sharing (+remainders), Fractions (bar-model to eighths),
  Measuring (units, area, perimeter), Time Master (five-minute clock, elapsed), Money
  Math (change), Data & Graphs, Shape Lab, Number Detective (□-equations), Story
  Problems.
- **Upper band (10–12): not started** — the last "still growing" fallback (Phases 4–6).
- **Systems all live:** category navigation (derived unlock, never re-locks), age gate
  + band filtering, placement check (ages 5–6), pace profiler, per-continent currency,
  **Sprint mode** (post-mastery high scores: ambient sun timer for early, m:ss
  countdown + 🔥 streak-doubling for mid), parent dashboard with gated reset
  (reset re-asks age → new-sibling handoff).

Resume by reading §7's last entries; next work: Phase 4 leftovers (fraction
equivalence/ops, read-scale, build-graph) or Phases 5–6 (upper band).

### Verified this session (all green)
| Gate | Command | Result |
|---|---|---|
| Unit + loop + app tests | `npm test` | **133 passed** across 8 files |
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
  `pace`, `age`, `currency`, `bestScores`). Sprint bests live in `bestScores`
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
- [`engine/pace.ts`](src/engine/pace.ts) — **learning-pace profiler** (pure, tested):
  5-question parent preferences quiz (`PACE_QUESTIONS`) → `scorePace` (0–3 gentle /
  4–7 steady / 8–10 eager, inputs clamped) → `PACE_PLANS` (levels per sitting, session
  length, tips). Non-clinical by design; stored locally only. Seam: adaptive difficulty
  can read `pace` later.

### Content — all the math lives here (data, not code)
- [`content/math.ts`](src/content/math.ts) — `MATH_SPINE` (full 3-band ladder as
  reference data) + **`CATEGORIES`** (**22** — 10 early: `counting` 🍎 / `comparing` 🎈 /
  `adding` 🍪 / `taking-away` 🐸 / `shapes` 🔷 / `patterns` 🧩 / `time` 🕐 / `money` 🪙 /
  `puzzle-grove` 🦉 / `big-small` 📏; 12 mid: `place-value` 🧱 / `times-tables` ✖️ /
  `number-crunch` ➕ / `sharing` 🍰 / `fractions` 🍕 / `measuring` 📐 / `time-mid` ⏰ /
  `money-mid` 💰 / `data` 📊 / `shape-lab` 🔺 / `detective` 🕵️ / `stories` 📖).
  Level tables: `PHASE0_LEVELS` (early 1–5) + `PHASE1_LEVELS` (6–11) + `PHASE2_LEVELS`
  (12–21) + `EXPANSION_LEVELS` (22–46) + `PHASE3_LEVELS` (`math-mid-1..13`) +
  `PHASE3B_LEVELS` (`math-mid-14..38`). **Ids are stable forever** — persisted
  progress is keyed on them; `makeLevel` is band-general and stamps `sprintSeconds`
  per activity. Helpers: `categoryById`, `categoriesForBand`, `levelsInCategory`,
  `levelById`, `nextLevelAfter` (gap-tolerant), `TRAIL` (flat list, **84 levels**).
- [`content/shapes.ts`](src/content/shapes.ts) — the 2D shape vocabulary (circle →
  heart), drawn by [`components/ShapeGlyph`](src/components/ShapeGlyph.tsx) in ONE
  color (shape, never color, is the discriminator).
- [`content/currency.ts`](src/content/currency.ts) — the per-continent currency seam
  (USD/EUR/GBP/SGD/AUD/ZAR). Money content stores plain values; only rendering reads
  the persisted `currency` (device setting, picked in ParentView, survives reset).
- [`content/words.ts`](src/content/words.ts) — number words 0–20 (`numberWord`,
  `capitalize`), shared by spoken prompts and the AudioManager. Swap to localise.
- [`content/themes.ts`](src/content/themes.ts) — 15 countable objects, each with
  emoji + plural + a `kind` tag (food/animal/nature/toy) powering sorting play.
- [`content/world.ts`](src/content/world.ts) — weight pairs (heavier-first),
  day scenes, `MEASURE_OBJECTS` (thing + right unit + same-dimension foil).
- [`content/stories.ts`](src/content/stories.ts) — word-problem templates
  (+/−/× with `{a}` `{b}` `{things}` placeholders).
- [`content/placement.ts`](src/content/placement.ts) — placement plans (ages 5–6
  only; 7+ start fresh in their own band), gap-free by test.

### Audio
- [`audio/AudioManager.ts`](src/audio/AudioManager.ts) — the **only** place the game
  makes sound. `speak / sayNumber / sfx / setMuted / unlock`. TTS (SpeechSynthesis,
  rate 0.9 / pitch 1.2) + synthesized Web-Audio SFX (`good/soft/pop/win` as
  gain-enveloped oscillator notes). Everything feature-detected + try/catch → silent,
  never crashes, on unsupported devices. `unlock()` resumes the AudioContext on first
  gesture (wired in [`App.tsx`](src/App.tsx)).
  **VO seam:** `TODO: swap for recorded VO` at [AudioManager.ts:148](src/audio/AudioManager.ts#L148) —
  replace that block with clip playback; no component changes needed.

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
- [`screens/Home.tsx`](src/screens/Home.tsx) — **category cards** on the meadow (one per
  strand of the child's **band**, always open, mini progress dots, tap speaks the
  category name); star counter; discreet "⚙️ For grown-ups" entry. A band with no
  content yet (mid/upper until Phase 3+) falls back to the early meadow with a spoken
  🌱 "still growing" banner — never a dead end. *(Replaced the old winding trail.)*
- [`screens/CategoryScreen.tsx`](src/screens/CategoryScreen.tsx) — one category's levels
  as a **grid of chunky tiles** (locked 🔒 / open+glowing / cleared ⭐); tap speaks the
  level name and starts it. Deliberately *not* a path.
- [`screens/PlayScreen.tsx`](src/screens/PlayScreen.tsx) — the mastery loop. Holds
  **transient** play state (current question, in-attempt streak, tap-count map,
  wrong-shake token); only earned progress goes to the store; `clearLevel` persists
  **synchronously** on the mastering answer (only navigation waits on the timer).
  Exports **`ActivityStage`** — the full 41-activity renderer switch + number-button
  row, shared verbatim by PlacementScreen and SprintScreen — plus `CountStage`/
  `CompareStage`, `ClockFace`, `CoinFace`, `ExprCard`. Correct → chime, Twinkle
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
  buyer). Summary stats (stars / mastered X/84 / categories finished X/22), **Child's
  age** section (age chips → band; changing age never touches progress), **Money
  currency** picker, **Learning pace** section (the 5-question quiz → suggested
  session plan), per-category level lists with status pills ("Placed" is distinct
  from "Mastered") + best streaks + 🏆 sprint bests, a local-only-storage privacy
  note, and **Reset all progress** gated behind a one-shot addition challenge — reset
  wipes progress **and the age** (gate re-asks; new-sibling handoff) while pace, mute
  and currency survive. Reached from a discreet "⚙️ For grown-ups" button on
  [`Home`](src/screens/Home.tsx). Deliberately the one screen that breaks the
  no-reading rule — it's for a reading adult.
- [`App.tsx`](src/App.tsx) — tiny hand-rolled router
  (`home | placement | category | play | sprint | cleared | parent`, keyed by **ids**
  not order), audio unlock + mute mirroring, and the **age gate**: `age === null`
  renders [`AgeScreen`](src/screens/AgeScreen.tsx) before any child-facing route
  (parent route sits above the gate); ages 5–6 with no progress route through
  [`PlacementScreen`](src/screens/PlacementScreen.tsx) after the pick. `PlayScreen`
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

### Tests (133, all passing)
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
  counts pinned exactly (1/84, 0/22 …), currency picker, pace quiz, Placed pill,
  gated reset.

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
9. **Sprint is a layer, not the spine.** High-score mode unlocks only AFTER mastery,
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
- **Adaptive difficulty has no dedicated seam module** — difficulty is fixed per level
  via `params`. The clean seam is that generators already take `params`; a Phase-1 nudge
  would vary `params` (e.g. `max`) within a level based on recent accuracy. `PlayScreen`
  already tracks the in-attempt streak that such logic would read.
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
> Phases 0–3.5 ✅ built; Phases 4–6 remain.

### Near-term
1. **Phase 4 (mid leftovers):** fraction equivalence & same-denominator ops
   (`fraction-op`), reading scales/rulers (`read-scale`), constructing graphs
   (`build-graph`), column written methods.
2. **Phases 5–6: open the upper band (10–12)** — decimals, %, ratio, negatives,
   angles/protractor, volume, averages, order of operations, multi-step problems —
   removes the last "still growing" fallback. Upper sprints already have arcade rails.
3. **Adaptive difficulty (last unfilled seam).** Nudge generator `params` within a
   level from recent accuracy; can also read the pace profile.
4. **Parent dashboard extras:** progress **export** (CSV/JSON) for the teacher
   use-case, richer per-level stats (attempts, accuracy) once tracked.

### Later (seams noted, not built)
5. **Spaced review** — a scheduler that re-surfaces older cleared skills.
6. **Mid/upper placement plans** — early's placement (ages 5–6) is live; add probe
   plans for 7+ once the mid ladder is tall enough to be worth skipping.
7. **New subjects** (reading, shapes-as-subject, …) — the engine is already
   subject-agnostic; more content modules + activities.
8. **Recorded human voice-over** — replace the TTS block at
   [AudioManager.ts:148](src/audio/AudioManager.ts#L148) with clip playback.

### Pre-launch (product/legal — not engineering-blocked, keep in mind)
- **COPPA (US) / GDPR-K (EU)** constrain accounts, data collection, ads. Currently no
  backend/login/analytics — progress is local-only. Keep it that way until a privacy
  plan exists.
- **Content pipeline** — keep levels addable as data; ideally eventually authorable
  without code changes.
- **Rasterized PWA icons** (see §4).

---

## 6. How to pick up next session

1. `npm install` (if needed) → `npm test` should show **133 passing** → `npm run dev` to
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
