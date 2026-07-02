# Number Meadow 🌟

A warm, audio-first counting game for young children (ages 4–6, Phase 0). Tap
friendly objects to count them aloud, help Twinkle the star up a storybook hill,
and never lose — every mistake is a gentle "try again."

Number Meadow is Phase 0 of a larger, subject-agnostic learning game. Math is the
first subject; the engine is built so new subjects and activities are added as
**data**, not by rewriting the game loop.

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run preview    # preview the production build
npm test           # run the Vitest suite once
npm run test:watch # watch mode
```

Requires Node 20+ (built and tested on Node 24).

## Design pillars

- **Audio-first.** Every prompt is spoken; numbers are read aloud on tap. A
  pre-reader can play with no adult reading anything on screen.
- **Tactile counting.** Counting is physical and audible — tap an object, it
  wiggles and says its number. This is the core learning moment.
- **Safe failure.** Free retries, gentle feedback, no score penalty, no "game
  over." Progress only ever moves forward.
- **Slow, earned progress.** Levels are mastery-gated; a child advances only
  after demonstrating the skill.
- **One cohesive world.** A soft storybook palette, not the clashing primary
  rainbow most kids' apps default to.

## Architecture: content is data, the engine is code

The most important rule: **the engine never contains subject vocabulary.** It
does not know what "add" or "count" *means* — it only knows there are activities,
each with a generator that turns params into a `Question`.

```
Subject (math)
  └─ Trail (ordered levels for one age band)
       └─ Level (skill rung: activity + params + mastery goal)
            └─ Question (generated on the fly by the level's activity)
```

```
src/
  engine/            # subject-agnostic core (no math words in the game loop)
    types.ts         # Level, Question (discriminated union), GameState, …
    random.ts        # injectable-RNG helpers (testable generators)
    generators/      # ActivityType → generator registry (count/compare/add)
    masteryGate.ts   # pure: is-correct, streak, cleared (never penalizes)
    store.ts         # Zustand + persist (only earned progress survives refresh)
    *.test.ts        # generator, mastery, store-loop, and full-App tests
  content/           # ALL the math lives here
    math.ts          # the skill spine + the five Phase 0 levels (as data)
    themes.ts        # the countable objects (apple, duck, …)
  audio/
    AudioManager.ts  # the ONLY place the game makes sound (TTS + Web Audio)
  components/        # Twinkle, Countable, ProgressDots, Confetti, MuteButton
  screens/           # HomeMap, PlayScreen, ClearedScreen
  theme/             # tokens.css (palette), animations.css (keyframes)
```

### Adding a level

Append a `Level` to `PHASE0_LEVELS` in [`src/content/math.ts`](src/content/math.ts).
If it uses an existing activity (`count`/`compare`/`add`), that's the whole
change — no engine edits.

### Adding an activity

1. Add the string to `ActivityType` and a `Question` variant in
   [`src/engine/types.ts`](src/engine/types.ts).
2. Write a generator in `src/engine/generators/` and register it in
   [`generators/index.ts`](src/engine/generators/index.ts).
3. Add a renderer branch in [`PlayScreen`](src/screens/PlayScreen.tsx).

### Adding a subject

Same as above — subjects are just more content + activities. The engine, store,
and screens are already subject-agnostic.

## Audio

All sound goes through the `AudioManager` singleton
([`src/audio/AudioManager.ts`](src/audio/AudioManager.ts)): `speak`, `sayNumber`,
`sfx`, `setMuted`. Today it uses the browser's SpeechSynthesis (TTS) and Web
Audio (synthesized SFX). Every call is feature-detected and wrapped in try/catch,
so the game stays silent — never crashes — on devices without them.

> **Recorded voice-over seam:** to swap TTS for recorded human clips, replace the
> body of `speak`/`sayNumber` (look for the `TODO: swap for recorded VO` marker).
> No game component needs to change.

## Tech stack

Vite · React · TypeScript · Tailwind CSS v4 (+ CSS custom-property theme tokens) ·
Zustand (persisted to `localStorage`) · Web Audio + SpeechSynthesis · Vitest ·
vite-plugin-pwa · self-hosted Fredoka font (`@fontsource`, no runtime CDN fetch).

The game is an installable PWA (add to home screen on phone or desktop).

## Accessibility & quality

- Responsive from ~320px phones to desktop; touch targets ≥ 64px.
- Keyboard playable with a visible focus ring.
- `prefers-reduced-motion` is honored globally (animations become instant).
- Nothing important is conveyed by text alone — icons + audio carry the game.
- Pure logic (generators, mastery gate) and the full play loop are unit-tested.

---

## Ship-later reminders (not part of Phase 0)

These are deliberately **out of scope** now but noted so Phase 0 choices don't
paint us into a corner:

- **Child-privacy law.** This targets under-13s. COPPA (US) and GDPR-K (EU) will
  constrain accounts, data collection, and ads. There is intentionally no
  backend, login, or analytics yet — progress is local-only in `localStorage`.
- **The parent/teacher is often the buyer.** A progress/dashboard view for adults
  is a likely future requirement (and a purchase driver). Keep progress data
  clean and exportable.
- **Content as a pipeline.** New levels should keep being addable as data (see
  `content/`), ideally eventually authored without code changes.
- **Recorded voice-over.** TTS is a placeholder; the `AudioManager` seam is ready
  for professional VO clips.
- **Engine seams left for later phases:** adaptive difficulty (difficulty is
  fixed per level today), spaced review (re-surfacing older cleared skills), and
  calibration/placement (a start-of-app assessment that sets `unlockedOrder`).
- **PWA icons.** The manifest currently ships a single scalable SVG icon
  (`public/icon.svg`). Before store/marketing launch, add rasterized PNG icons
  (192/512, maskable) for the widest install-surface compatibility.
```
