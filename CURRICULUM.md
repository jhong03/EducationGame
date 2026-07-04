# Number Meadow — Math Curriculum Spine (ages 4–12)

**Status: APPROVED 2026-07-04** (user pass on all six §6 decisions — see the locked
answers there). This is the map we build from; approved slices become data in
[`content/math.ts`](src/content/math.ts) (see [CONTEXT.md](CONTEXT.md) for how
content-as-data works). **Phase 1 is built.**

> **How to read this doc.** §1 sets up bands and sources. §2 is the 12 strands at a
> glance. §3 is the meat — each strand's rung-by-rung progression with the countries
> that anchor it and the game activity that would render it. §4 lists the new activity
> types the engine would need. §5 is a suggested phased rollout. §6 flags the decisions
> I need **you** to make. If you only read two things, read §2 and §6.

---

## 1. Bands, grades, and sources

### Age bands (kept aligned to the existing engine)
The engine already uses three bands. Real school systems start at different ages, so
these are **approximate** equivalences, not exact:

| Band | Ages | US grade | England year | Singapore | Japan | Rough label |
|---|---|---|---|---|---|---|
| `early` | 4–6 | Pre-K–G1 | Reception–Y2 | (K)–P1 | (幼)–G1 | Pre-reader / number sense |
| `mid` | 7–9 | G2–G4 | Y3–Y5 | P2–P4 | G2–G4 | Fluent operations |
| `upper` | 10–12 | G5–G7 | Y6–Y8 | P5–P6 | G5–G6 | Rational numbers & reasoning |

> **Open question (see §6):** three bands may be too coarse for a 9-year span. I can
> split each into two "sub-trails" (~1.5 years each) so difficulty climbs more gently.
> The data model already supports this — it's just more `Level` rows.

### Curricula researched (the anchors used below)
- **CCSS** — US Common Core State Standards for Math (K–5): domains *Counting & Cardinality, Operations & Algebraic Thinking, Number & Operations in Base Ten, Number & Operations—Fractions, Measurement & Data, Geometry*.
- **NC** — England National Curriculum (2014) KS1–KS2, plus **EYFS** Early Learning Goals (*Number*, *Numerical Patterns*).
- **SG** — Singapore MOE Primary Mathematics syllabus (2021 revision, full rollout by 2026): strands *Number & Algebra, Measurement & Geometry, Statistics*.
- **AC** — Australian Curriculum v9.0: six strands *Number, Algebra, Measurement, Space, Statistics, Probability*.
- **JP** — Japan MEXT Course of Study (elementary): domains *Numbers & Calculations, Geometric Figures, Measurement/Change & Relations, Data Handling*.
- **ON** — Ontario Curriculum (2020): strands *Number, Algebra (incl. coding), Data, Spatial Sense, Financial Literacy, + Mathematical Processes/SEL*.
- Cross-checked against **Ireland** (Primary Maths Curriculum), **Finland** (2016 core), and **India** (NCERT/NCF) for outliers; noted only where they diverge.

Sources are linked at the bottom (§7).

### Convergence (what everyone agrees on)
Every framework above organizes primary math into the same broad territory:
**number & place value → the four operations → fractions/decimals/percentages →
measurement → geometry/space → data (+ probability) → patterns/early algebra →
reasoning/problem-solving.** The disagreements are almost entirely about **timing**
(which year a topic lands) and **emphasis** (Ontario's dedicated *Financial Literacy*;
Australia's first-class *Probability*; Singapore's famous *bar-model* problem solving).
That convergence is what makes a single spine possible.

---

## 2. The strands at a glance

Twelve strands cover the user's list (counting, sequences, = − × ÷, fractions, decimals,
angles, 2D/3D shapes, measurement/volume/weight, mixed calculations, time, IQ teasers)
and everything the national curricula add:

| # | Strand | Spans | Covers your ask |
|---|---|---|---|
| A | **Counting & Cardinality** | early | "one by one counting" |
| B | **Number & Place Value** | early→upper | reading/writing numbers, tens & ones, negatives |
| C | **Addition & Subtraction** | early→mid | "basics of + −" |
| D | **Multiplication & Division** | mid→upper | "basics of × ÷", times tables |
| E | **Fractions, Decimals & Percentages** | mid→upper | "fractions, decimals" |
| F | **Patterns, Sequences & Early Algebra** | early→upper | "sequences" |
| G | **Money & Financial Literacy** | early→upper | (Ontario strand; real-world) |
| H | **Measurement — Length, Mass, Capacity/Volume, Temperature** | early→upper | "measurements (volume & weights)" |
| I | **Time** | early→upper | "time" |
| J | **Geometry — 2D & 3D Shapes, Angles, Position** | early→upper | "angles, 2D 3D shapes" |
| K | **Data & Chance (Statistics & Probability)** | mid→upper | graphs, average, likelihood |
| L | **Reasoning, Logic & Brain Teasers** | early→upper | "IQ brain teasers" + word problems / "mixed calculations" |

Strand **L** is the "IQ" strand: it's not a single national topic but is drawn from the
*Mathematical Processes* (Ontario), *Proficiencies* (Australia), and *Problem-Solving
pentagon* (Singapore) that every curriculum embeds — plus classic age-appropriate puzzle
forms. "Mixed calculations" lives partly here (multi-step problems) and partly as a
capstone activity in C/D/E.

---

## 3. Strand-by-strand progression

Format per row: **rung** · what the child does · **anchor** (where it lands
internationally) · **activity** (how the game would render it; `count`/`compare`/`add`
already exist, others are proposed in §4). "MG" = suggested mastery goal.

### A. Counting & Cardinality  *(early)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| A1 | Count to 3 · tap to count aloud | EYFS, CCSS-K | `count` ✅ *(built)* |
| A2 | Count to 5 | EYFS, CCSS-K | `count` ✅ |
| A3 | Count to 10 | EYFS, CCSS-K, SG-P1 | `count` ✅ |
| A4 | Subitize (recognise 1–5 *without* counting) | EYFS, AC-F | `subitize` (flash a group briefly) |
| A5 | Numeral ↔ quantity (match "7" to 7 things) | CCSS-K, NC-Y1 | `match` |
| A6 | Count to 20, then 100 (by tens) | EYFS, CCSS-K/1, SG-P1 | `count`, `sequence` |
| A7 | One more / one fewer | EYFS, NC-Y1 | `compare`/`add` variants |

### B. Number & Place Value  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| B1 | Compare quantities: more / less / equal | EYFS, CCSS-K | `compare` ✅ |
| B2 | Order numbers to 20 | NC-Y1, SG-P1 | `order` |
| B3 | Tens & ones (place value to 100) | CCSS-1, NC-Y2, JP-G1 | `place-value` |
| B4 | Numbers to 1,000 · hundreds/tens/ones | CCSS-2, NC-Y3 | `place-value` |
| B5 | Numbers to 10,000+ · read, write, order | CCSS-2/3, NC-Y4, SG-P3 | `place-value`, `order` |
| B6 | Rounding (to 10, 100, 1000) | CCSS-3, NC-Y4 | `round` |
| B7 | Negative numbers / integers (number line) | NC-Y6, CCSS-6, AC-Y6 | `number-line` |
| B8 | Roman numerals *(UK-specific enrichment)* | NC-Y3/4 | `match` |

### C. Addition & Subtraction  *(early → mid)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| C1 | Add within 5 (combine two groups) | EYFS, CCSS-K | `add` ✅ *(built)* |
| C2 | Number bonds to 10 | EYFS, SG-P1, JP-G1 | `add`/`bond` |
| C3 | Add & subtract within 20 | CCSS-1, NC-Y1/2, JP-G1 | `add`, `subtract` |
| C4 | Add & subtract within 100 (2-digit) | CCSS-2, NC-Y2/3, SG-P2 | `subtract`, `column-op` |
| C5 | Column add/subtract with regrouping (to 1000+) | CCSS-2/3, NC-Y3/4 | `column-op` |
| C6 | Mental strategies (bridging, near-doubles) | NC-Y3, SG, AC | `add`/`subtract` timed |
| C7 | Inverse relationship (check − with +) | NC-Y2, CCSS-1 | `mixed` |

### D. Multiplication & Division  *(mid → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| D1 | Skip-count 2s, 5s, 10s | CCSS-2, NC-Y2, JP-G2 | `sequence` |
| D2 | Multiplication as equal groups / arrays | CCSS-3, NC-Y2, JP-G2 | `array`, `multiply` |
| D3 | Times tables 2, 5, 10 | NC-Y2, SG-P2 | `multiply` |
| D4 | Times tables to 12 (full recall) | NC-Y4, CCSS-3, JP-G2 (9×9) | `multiply` timed |
| D5 | Division as sharing / grouping | CCSS-3, NC-Y3, JP-G3 | `divide`, `share` |
| D6 | Division with remainders | CCSS-4, NC-Y4 | `divide` |
| D7 | Multi-digit × (long multiplication) | CCSS-4/5, NC-Y5/6, SG-P4 | `column-op` |
| D8 | Long division (÷ 1- then 2-digit) | CCSS-5/6, NC-Y6, SG-P4 | `column-op` |
| D9 | Factors, multiples, primes | CCSS-4, NC-Y5, SG-P4 | `sort-logic`, `pick` |

### E. Fractions, Decimals & Percentages  *(mid → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| E1 | Halves & quarters of a shape/group | NC-Y1/2, JP-G2, SG-P2 | `fraction-of` |
| E2 | Unit fractions & simple non-unit (⅓, ¾) | CCSS-3, NC-Y3 | `fraction-of`, `match` |
| E3 | Fractions on a number line · equivalence | CCSS-3/4, NC-Y3/4 | `number-line`, `match` |
| E4 | Add/subtract fractions (same denominator) | CCSS-4, NC-Y4, SG-P3 | `fraction-op` |
| E5 | Decimals: tenths & hundredths | CCSS-4, NC-Y4, SG-P4 | `place-value`, `match` |
| E6 | Fraction ↔ decimal ↔ percentage equivalence | CCSS-4/5, NC-Y5, AC-Y5, SG-P5 | `match` |
| E7 | ×/÷ fractions; +/− unlike denominators | CCSS-5/6, NC-Y5/6, SG-P5/6 | `fraction-op` |
| E8 | Percentages of amounts | CCSS-6, NC-Y6, SG-P5/6 | `percent-of` |
| E9 | Ratio & proportion | NC-Y6, SG-P6, CCSS-6 | `ratio` |

### F. Patterns, Sequences & Early Algebra  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| F1 | Copy & extend a repeating pattern (AB, ABB) | EYFS, AC-F, ON-1 | `pattern` |
| F2 | Odd & even; doubles; equal sharing | EYFS, NC-Y2 | `sort-logic`, `pick` |
| F3 | Number sequences (count on/back in steps) | NC-Y2/3, JP | `sequence` |
| F4 | Find the missing number ( □ + 3 = 7 ) | CCSS-1, JP-G3, NC-Y2 | `missing` |
| F5 | Function machines / input–output rules | NC-Y6, ON, AC | `machine` |
| F6 | Simple expressions & substitution (letters) | CCSS-6, SG-P6, JP-G6, NC-Y6 | `missing`, `evaluate` |
| F7 | Solve one-step equations | CCSS-6, NC-Y6 | `evaluate` |
| F8 | Coordinate grid (plot points) | CCSS-5, NC-Y4/6, ON | `grid` |

### G. Money & Financial Literacy  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| G1 | Recognise coins & notes | NC-Y1, SG-P1, ON-1 | `match`, `count` |
| G2 | Count/make an amount | NC-Y2, SG-P1/2 | `add`, `make-amount` |
| G3 | Give change | NC-Y2/3, SG-P2 | `subtract`, `make-amount` |
| G4 | Budgets & spending choices | ON-4+ (Financial Literacy) | `mixed`, `sort-logic` |
| G5 | Unit price / best buy; simple interest | ON-6, SG-P5 | `compare`, `percent-of` |

> Ontario is the only researched curriculum with money as an explicit strand; the others
> fold it into measurement/number. It's kept separate here because it's motivating and
> real-world — and a likely selling point to parents.

### H. Measurement — Length, Mass, Capacity/Volume, Temperature  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| H1 | Compare directly: longer/shorter, heavier/lighter, holds more/less | EYFS, CCSS-K, AC-F | `compare` ✅ variant |
| H2 | Measure with non-standard units (cubes, hand-spans) | NC-Y1, JP-G1, ON | `measure` |
| H3 | Standard units: cm/m, g/kg, ml/l | NC-Y2/3, SG-P2, CCSS-2 | `measure`, `read-scale` |
| H4 | Read scales & rulers (partitioned) | CCSS-2/3, NC-Y3 | `read-scale` |
| H5 | Perimeter of shapes | CCSS-3, NC-Y3/4, SG-P3 | `compute` |
| H6 | Area (count squares → formula) | CCSS-3/4, NC-Y4/5, SG-P4 | `compute`, `grid` |
| H7 | **Volume & capacity** (cubes → formula) | CCSS-5, NC-Y5/6, SG-P5 | `compute`, `grid` |
| H8 | Convert units (mm↔cm↔m; g↔kg; ml↔l) | NC-Y4/5, SG-P4/5 | `convert` |
| H9 | Temperature; negative on a scale | AC, ON, NC-Y6 | `read-scale`, `number-line` |

### I. Time  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| I1 | Sequence the day; before/after; days & months | EYFS, NC-Y1, SG-P1 | `order`, `sequence` |
| I2 | O'clock & half past | NC-Y1, SG-P1 (moved P2→P1) | `clock` |
| I3 | Quarter past/to; to 5 minutes | NC-Y2, SG-P2 | `clock` |
| I4 | Tell time to the minute | CCSS-3, NC-Y3 | `clock` |
| I5 | 12- & 24-hour clock | NC-Y3/4, SG-P3 | `clock`, `convert` |
| I6 | Durations & elapsed time; timetables | CCSS-3, NC-Y4/5, SG-P4 | `compute`, `mixed` |

### J. Geometry — 2D & 3D Shapes, Angles, Position  *(early → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| J1 | Name common **2D shapes** (circle, square, triangle, rectangle) | EYFS, CCSS-K, JP-G1 | `shape-id` |
| J2 | Name common **3D shapes** (cube, sphere, cone, cylinder) | CCSS-K/1, NC-Y1, SG-P1 | `shape-id` |
| J3 | Sort shapes by property (sides, corners) | CCSS-1/2, NC-Y2, AC | `sort-logic` |
| J4 | Symmetry (lines of symmetry) | NC-Y2/4, JP-G3, SG-P4 | `symmetry`, `pick` |
| J5 | **Angles**: full/half/quarter turns; right angles | NC-Y3/4, CCSS-4, JP-G4 | `angle` |
| J6 | Compare & classify angles (acute/obtuse); measure with protractor | CCSS-4, NC-Y5, SG-P5 | `angle`, `measure` |
| J7 | Properties of triangles & quadrilaterals; angle sums | CCSS-5, NC-Y5/6, SG-P5/6 | `compute`, `sort-logic` |
| J8 | Position & direction; coordinates; translation/reflection | CCSS-5, NC-Y4/6, AC | `grid` |
| J9 | 3D: nets, faces/edges/vertices | CCSS-6, NC-Y6, SG-P5 | `shape-id`, `match` |

### K. Data & Chance (Statistics & Probability)  *(mid → upper)*
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| K1 | Sort into groups; Venn/Carroll diagrams | NC-Y1/2, ON, IE | `sort-logic` |
| K2 | Pictograms & block/bar graphs (read) | CCSS-1/2, NC-Y2/3, SG-P1 | `read-graph` |
| K3 | Tally & construct a bar chart | CCSS-2/3, NC-Y3 | `read-graph`, `build-graph` |
| K4 | Tables & line graphs | CCSS-4/5, NC-Y4/5, SG-P4 | `read-graph` |
| K5 | Average: mean (then mode/median/range) | CCSS-6, NC-Y6, SG-P5 | `compute` |
| K6 | Pie charts | NC-Y6, SG-P6 | `read-graph` |
| K7 | **Probability**: likely/certain/impossible → simple fractions | AC-F→Y6, CCSS-7, ON | `pick`, `ratio` |

> Note: **Singapore primary has no probability** (starts secondary); **Australia** teaches
> chance language from Foundation. If we localize, probability rungs are toggle-able.

### L. Reasoning, Logic & Brain Teasers ("IQ")  *(early → upper)*
Drawn from the reasoning/problem-solving processes every curriculum embeds, plus classic
puzzle forms. This is the "smart fun" strand.
| Rung | Skill | Anchor | Activity |
|---|---|---|---|
| L1 | Odd-one-out; same/different; sorting by rule | ON-Processes, AC-Reasoning | `odd-one-out` ✅, `shadow-match` ✅ *(built — Puzzle Grove)* |
| L2 | Continue the pattern (shape/number/size) | EYFS, AC | `pattern`, `sequence` |
| L3 | Simple logic ("if… then"); matching pairs; mazes | ON, IE (early) | `logic`, `match` |
| L4 | **Word problems** — one-step (add/sub/mul/div) | all curricula | `word-problem` |
| L5 | **Mixed / multi-step problems** (choose the operations) | CCSS, NC, SG bar-model | `word-problem`, `mixed` |
| L6 | Number puzzles: magic squares, target sums, Ken-Ken-lite | enrichment | `puzzle-grid` |
| L7 | Logic grids, analogies, sequences (classic IQ items) | enrichment | `logic`, `sequence` |
| L8 | Spatial reasoning: tangrams, nets, rotations, cube-counting | AC-Space, ON-Spatial | `spatial`, `grid` |

---

## 4. Activity types the engine would need

Today the engine has **3** generators (`count`, `compare`, `add`). The spine above needs
roughly these additional activity types. Each is a generator + a `Question` variant +
a `PlayScreen` render branch (the "add an activity" recipe in
[CONTEXT.md §3](CONTEXT.md)). Grouped by how much new UI they need:

**Reuse the number-button / tap-group pattern (cheap):**
`subtract`, `multiply`, `divide`, `bond`, `missing`, `round`, `sequence`, `evaluate`,
`percent-of`, `compute` (generic "work out the value").

**Tap-to-select from choices (cheap):**
`match` (numeral↔quantity, equivalences), `pick` (odd-one-out, factors), `order`
(drag/tap into order), `sort-logic` (bucket items by rule), `shape-id`.

**New bespoke interactions (more UI):**
`subitize` (flash-then-hide), `place-value` (base-ten blocks), `array`/`share` (grouping
grids), `fraction-of` & `fraction-op` (partitioned shapes/bars — Singapore bar model),
`number-line`, `clock` (draggable hands), `measure`/`read-scale` (ruler/scale), `angle`
(turn/protractor), `grid`/`coordinate`, `symmetry`, `read-graph`/`build-graph`,
`make-amount` (coins), `convert`, `pattern`, `machine` (function machine), `word-problem`
(illustrated + spoken), `puzzle-grid`, `logic`, `spatial`.

> Reality check: that's ~30 activity types for the *full* 4–12 vision. We do **not**
> build them all at once — §5 sequences them so each phase ships a coherent, playable
> band. The architecture's whole point is that these slot in as data + one generator
> each, without touching the game loop.

---

## 5. Suggested phased rollout

Each phase = a shippable, mastery-gated trail. Ordered so every phase is playable on its
own and reuses as much prior UI as possible.

| Phase | Band | Content | New activities | Why here |
|---|---|---|---|---|
| **0 ✅** | early | Count to 3/5/10, compare, add-within-5 (5 levels) | — | *Done & shipped* |
| **1 ✅** | early | Number sense finished: subitize, numeral↔quantity (match), counting on (sequence), add-to-10, Taking Away ×2 (6 levels, ids 6–11) | `subitize`, `match`, `sequence`, `subtract` | *Built 2026-07-04* |
| **2 ✅** | early | Shapes ×2, Patterns ×2, Clock Time (o'clock/half-past), Money ×2 + currency seam, **Puzzle Grove** (odd-one-out, shadow-match) — 10 levels, ids 12–21 | `shape-id`, `pattern`, `clock`, `money`, `odd-one-out`, `shadow-match` | *Built 2026-07-04, complete* |
| **2.5 ✅** | early | **Expansion wave (A+B+C+D)** — every category deepened (zero, ±1, count-down/by-tens, fewer/equal/numeral compare, doubles, bonds 5/10, shape sides, ABC patterns, coin compare), Puzzle Grove ×4 more, day scenes, **Big & Small 📏** chapter, make-amount / set-clock / tap-all interactions — 25 levels, ids 22–46 → **46 total** | 16 new activity types | *Built 2026-07-04 — the early band is content-rich* |
| **3 ✅** | mid | Mid band opened: Place Value ×3 (blocks to 999 + rounding), Times Tables ×4 (equal groups → all-to-12, adjacent-entry distractors), Add & Subtract ×4 (numeric within 20/100), Sharing ×2 (fair share + exact division) — 13 levels (`math-mid-1..13`) + **arcade sprints** (m:ss countdown, 🔥 3-streak doubles) | `place-value`, `round`, `multiply`, `divide`, `share`, `arith` | *Built 2026-07-04 — column written-method + arrays deferred to the mid deepening wave* |
| **4** | mid | Fractions (halves→equivalence), measurement (units, perimeter/area), data (pictograms/bar) | `fraction-of`, `fraction-op`, `measure`, `read-scale`, `read-graph` | Core mid-band |
| **5** | mid→upper | Decimals, percentages, angles, symmetry, coordinates, word problems | `percent-of`, `angle`, `symmetry`, `grid`, `word-problem` | Bridges into upper |
| **6** | upper | Long ×/÷, ratio, negative numbers, volume, averages, multi-step problems, logic/IQ | `ratio`, `number-line`, `compute`, `mixed`, `logic`, `spatial` | Completes 10–12 |

Rough scale: **~70–90 levels** total across the three bands if we keep Phase-0's
granularity (one skill per rung, MG 3). Fewer if we bundle; more if we split bands (§6).

---

## 6. Decisions — LOCKED (user pass, 2026-07-04)

1. **Scope: the full 12-strand spine is approved**, explicitly including *Probability*
   and *Financial Literacy* — "vital for kids to learn".
2. **Bands: keep 3** (`early`/`mid`/`upper`), as in the engine today.
3. **Localization: core-country currency per continent.** The money strand (G) ships a
   currency seam, not one locale: a grown-up picks the family's currency in the
   ParentView area. v1 set (one core per continent): 🇺🇸 USD (Americas), 🇪🇺 EUR + 🇬🇧 GBP
   (Europe), 🇸🇬 SGD (Asia, matching the syllabus we anchor on), 🇦🇺 AUD (Oceania),
   🇿🇦 ZAR (Africa). Denominations live in `content/currency.ts` (build with Phase 2's
   money levels). Units stay metric for v1; spelling "math".
4. **Build order: follow the phase flow.** ✅ **Phase 1 built 2026-07-04** — subitize,
   numeral↔quantity (match), counting on (sequence), add-to-10, and a new *Taking Away*
   (subtract) category; ids `math-early-6..11`. Phase 2 (shapes, patterns, time, money)
   is next.
5. **IQ / brain teasers: yes — as "Puzzle Grove".** With category navigation, strand L
   becomes its own playful category on the meadow (first-class *and* a distinct area).
   Built alongside Phase 2+ content.
6. **Pacing: parent-tuned, not fixed.** Levels stay micro-skill sized (safe for every
   child); *session* chunking is personalised via the **learning-pace profiler** —
   ✅ built 2026-07-04: a 5-question preferences quiz in ParentView (attention,
   frustration response, novelty, energy, "one more go"; deliberately non-clinical,
   stored locally only) maps to `gentle | steady | eager` and yields a suggested plan
   (levels per sitting, session length, tips). Seam noted for adaptive difficulty to
   read the pace later.
7. **Game direction: high scores via Sprint mode (locked 2026-07-04).** Scoring and
   per-level time limits are a **post-mastery layer**, never the progression spine:
   mastering a level unlocks its timed Sprint (round length = `sprintSeconds`, content
   data per level: 60s default / 90s for flash-or-build activities), with forward-only
   best scores per level and category trophy totals. Early band: ambient sun-track
   timer + celebration-only endings (safe-failure holds); mid/upper (Phase 3+): visible
   countdowns + streak bonuses, aligned with timed-fluency expectations (e.g. England's
   Y4 multiplication check at ~6s/question).

---

## 7. Sources

- US Common Core (math domains K–5): [thecorestandards.org](https://www.thecorestandards.org/Math/) · [CCSSM K–5 overview (PDF)](https://www.sresd.org/downloads/instructional/math/ccss_math_k-51.pdf)
- England National Curriculum (maths KS1–2): [gov.uk programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study) · EYFS maths ELGs (Number, Numerical Patterns)
- Singapore MOE Primary Maths syllabus (2021): [moe.gov.sg syllabuses](https://www.moe.gov.sg/primary/curriculum/syllabus) · [NIE syllabus PDF](https://libris.nie.edu.sg/sites/default/files/math2007a.pdf)
- Australian Curriculum v9.0 (Mathematics): [australiancurriculum.edu.au](https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/mathematics)
- Japan MEXT Course of Study (elementary maths): [mext.go.jp](https://www.mext.go.jp/en/policy/education/elsec/title02/detail02/1373859.htm) · [TIMSS Encyclopedia — Japan](https://timssandpirls.bc.edu/timss2015/encyclopedia/countries/japan/the-mathematics-curriculum-in-primary-and-lower-secondary-grades/)
- Ontario Mathematics Curriculum, Grades 1–8 (2020): [ontario.ca](https://www.ontario.ca/page/math-curriculum-grades-1-8) · [strands overview](https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics/context/the-strands-in-the-mathematics-curriculum)

*Ireland, Finland, and India (NCERT) were cross-checked for outliers; they fit the same
strand structure and are not separately cited.*
