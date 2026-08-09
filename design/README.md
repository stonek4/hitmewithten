# Design — Vocab Cards

**Version:** 1.0 (2026-08-08)
**Owner:** Kevin Stoner
**Status:** Implementation-ready for all P0 screens; every P1 surface is designed
so it can be built without another design pass. See
[Hand-off note](#hand-off-note).

This folder is the complete design layer between the product documentation in
[`../documentation/`](../documentation/) and the engineers who will build the
app. **An implementation agent holding nothing but these four files should be
able to build the real, running app without guessing and without asking a
follow-up question.** Tokens are the single source of truth for every value;
the specs reference them by name and never restate a raw number.

---

## File map

| File | Contents | Serves |
|---|---|---|
| [`design-tokens.md`](./design-tokens.md) | The complete token set: Material 3 colour roles (light + dark, **generated** from the seed with `@material/material-color-utilities`), the **paper-surface tokens**, the **diff tokens**, typography, spacing, shape, elevation, the paper-construction spec, motion, haptics, brand assets, a full JSON block, and the mapping onto a `react-native-paper` MD3 theme. | [PRD §9](../documentation/product-requirements.md#9-non-functional-requirements) · [CAP C3](../documentation/capability-spec.md#c3--accessibility) · [REBUILD_SPEC §11](../REBUILD_SPEC.md) |
| [`spec.md`](./spec.md) | Overview & assumptions, the **data model** (every entity and enum), the **component library** (24 components, each mapped to its Paper primitive or flagged custom), the **navigation model** + route params + transitions, the complete **icon map**, and the **accessibility / i18n / dark-mode / web contracts**, dependencies & project setup, and **60 acceptance criteria**. | CAP-1 – CAP-20 |
| [`spec-screens.md`](./spec-screens.md) | **24 screens** — 16 P0, 8 P1 — each with purpose, ASCII wireframe, composition, tokens used, states (empty / first-run / error / edge), motion, a11y, i18n and dark-mode notes. Every screen names the CAP and stories it serves and its priority. | [PRD §6](../documentation/product-requirements.md#6-feature-requirements) · [User Stories](../documentation/user-stories.md) |
| [`prototype.html`](./prototype.html) | Self-contained clickable prototype. **Open the file in any browser — no build step.** Light/dark toggle, two phone frames, 13 screens wired. Runs the **real minimum-edit-distance diff algorithm**, so every marked word is genuine output. | All |

### Opening the prototype

```
open design/prototype.html          # macOS
xdg-open design/prototype.html      # Linux
```

**Left phone = the flow. Right phone = the marking, up close**, with a live
"type anything" lab so you can test the diff against any pair of strings.

**Wired flows:** First run → Home · Home → 10 Cards / All Cards → Session →
wrong answer → **the diff** → retry → correct → advance → Results → Practice
missed → Done · Home → set row → Set Detail → Editor · set-actions sheet ·
duplicate-name conflict dialog · delete confirm · end-test confirm · Trophies ·
Settings (the theme switch is live) · Import (per-file report) · Export (legacy
lossy warning) · About · Insights (P1) · the marking lab.

**Not wired:** sync, dictation, paste import, session history, search & sort,
card reorder. All are specified in [`spec-screens.md`](./spec-screens.md).

> The prototype is **throwaway demonstration HTML for a React Native app**. It is
> not the implementation and must never be mistaken for it. Its only job is to be
> the visual truth of the spec, in both schemes, before anyone writes app code.

---

## Design direction summary

### The two-layer system

**Chrome is Material Design 3 via `react-native-paper`. The cards are paper.**
This is Kevin's brief, taken literally and made into a system with a hard
boundary rather than a mood.

| | **Chrome** | **Page — the notecard** |
|---|---|---|
| Language | Material 3, expressed with restraint | A ruled 3 × 5 index card the user **writes on** |
| Built from | `react-native-paper` MD3 components | Custom components on tokens |
| Colours | `color.*` (M3 roles) | `color.paper.*`, `color.diff.*` |
| Type | Inter | **JetBrains Mono** for anything spelled |
| Where it appears | App bars, lists, dialogs, sheets, settings, trophies, import/export, results stats | **The flashcard, the answer line, the spelling-feedback strip, the card editor's card, the missed-word rows, the trouble-word patterns** |

**Where the boundary falls, precisely:** a surface is a Page if and only if it
holds **card content or diff output** — the words the user is learning and the
marks on them. Everything that is *about* cards rather than *of* them is Chrome.
A Page never carries a Material state-layer wash and is never pressable; Chrome
never carries a rule line. That single rule is what keeps the personality
legible instead of decorative, and it is why the same screen can hold both
without looking like two apps.

Details: [`design-tokens.md` §0](./design-tokens.md#0-the-two-layer-system-in-one-paragraph)
and [`spec.md` §1.2](./spec.md#12-design-direction--the-two-layer-system).

### Seed & palette

**Seed: `#305CA6` — "ink blue."** It is the live app's pale-blue button gradient
(`#DEE8F9`, [REBUILD_SPEC §11](../REBUILD_SPEC.md)) taken back to full chroma at
the same hue. The *same blue*, made into a real Material palette rather than a
gradient. All Material role values were **generated** with
`@material/material-color-utilities` v0.3.0 from that seed — not hand-picked —
and the regeneration script is in
[`design-tokens.md` §12.1](./design-tokens.md#121-regenerating-the-colour-roles).

The paper and diff palettes are **deliberately not derived from the seed**. The
seed is cool; paper is warm. That warm/cool split is what makes the Page read as
a different *material* rather than another tint of the same palette.

**This is heritage work, not a rebrand.** The warm page, the soft grey shadow,
the black ink, the red-error / green-correct pair, the 15 px button radius and
the script wordmark all carry forward from the live app. The full carry-over
table — including the two deliberate deviations, both argued — is
[`design-tokens.md` §3.4](./design-tokens.md#34-heritage-mapping--what-carried-over-from-the-live-app).

### Typography

Two families, chosen for two different jobs:

- **Inter** (`@expo-google-fonts/inter`) — all Material chrome, plus card hints
  and prompts, which are sentences and read best proportionally.
- **JetBrains Mono** (`@expo-google-fonts/jetbrains-mono`) — the answer input,
  the confirmed-answer echo, and the diff. **This is a functional choice, not a
  stylistic one.** Monospace gives the character-cell alignment the diff
  contract requires, and JetBrains Mono is specifically drawn to disambiguate
  `l`/`I`/`1`, `0`/`O` and `rn`/`m`. In an app whose whole purpose is telling
  you which *single character* you got wrong, glyph ambiguity is a correctness
  bug. ([`design-tokens.md` §5.2](./design-tokens.md#52-fontmono--jetbrains-mono))

**No handwriting face is used anywhere.** The script "Vocab Cards" lockup is the
one handwritten moment and it is an **image**, never a font — used on Home and
About only. Handwriting display faces are the obvious temptation in a paper
metaphor and are an accessibility disaster in card content or a diff.

Dynamic type is always on; nothing in this app ever sets
`allowFontScaling={false}`.

---

## The notecard

> **Art direction, Kevin, 2026-08-08:** *"I'd like it to look like a notecard,
> however I also really would like the lines of text to match up with the card
> background just how someone would write on a card."*

The reference object is a **ruled 3 × 5 index card**, and it is built from the
conventions people actually recognise: an unruled **header zone** at the top, a
heavier **warm header rule** beneath it, evenly spaced **writing rules** below
that, a vertical **margin rule** down the leading edge that content respects,
rounded corners, a visible **card-stock thickness** along the bottom, and a
stacked sliver behind it so it reads as a card from a deck.

**The header rule carries meaning:** above it is what is *printed* on the card;
below it is what you *write*. That is why the field label lives above it and the
prompt, the answer and the diff all live below it — on rules.

### The baseline grid — every line of text sits on a rule

This is the crux, and it is a contract rather than a visual goal.
([`design-tokens.md` §9.2](./design-tokens.md#92-the-baseline-grid-contract-the-crux) ·
[`spec.md` §3.1.1](./spec.md#311-the-baseline-grid-contract--what-an-implementer-must-do))

- **The rule pitch is the *resolved* line height of card text**, never a fixed
  pixel value — so the rules grow with the OS font scale and the grid holds at
  100 %, 130 % and 200 %.
- **Rules are drawn at baselines**, at
  `pitch/2 + 0.362 × gridFontSize` from the grid origin. Glyphs sit on the rule
  and descenders drop below it, which is what handwriting on a card looks like —
  not text centred in a band, which looks like a table.
- **`0.362` covers both shipped families.** Inter's and JetBrains Mono's
  `ascent − contentHeight/2` are 0.364 and 0.360 em, so at 28 sp / 40 dp **an
  Inter hint and a JetBrains Mono answer share a baseline to within 0.06 dp** —
  no per-family adjustment anywhere.
- **A run at a different size is nudged by** `Δ = 0.362 × (gridFontSize − fontSize)`,
  applied as `paddingTop: Δ` and `marginBottom: −Δ` so the advance stays an
  exact multiple of the pitch. Shipped once as `useGridOffset()` / `<GridText>`;
  no screen does this by hand.
- **Wrapped lines are free.** Because `lineHeight === pitch`, a two-line prompt
  takes two bands and both baselines land.
- Every notecard type variant therefore has a **40 dp line height** — you write
  smaller or larger *between the same printed lines*, you don't move the lines.
  `type.diff-attempt` went 22/32 → **20/40** for exactly this reason.

Two consequences worth knowing up front:

- **The answer input has no underline of its own.** It sits on a writing rule,
  and *that rule* thickens to `color.primary` on focus and `color.diff.wrong`
  after a wrong answer. It thickens downward from the baseline so the text never
  shifts.
- **The writing-rule contrast was raised** from 1.30 → **1.55:1** (light) and
  1.37 → **1.52:1** (dark). The original figures assumed text floating *over*
  the rules; a baseline rule meets only the bottoms of the glyphs and never
  crosses a stem or a counter, so it interferes far less and can afford more
  presence — which the notecard reading needs. Both are still well below the 3:1
  UI threshold, so a rule never becomes a divider.

### How the texture is achieved — procedural, zero assets

**No raster. No grain. No tiling.** The rules are drawn as vectors:
`react-native-svg` `<Pattern>` on native, a CSS `repeating-linear-gradient` on
web. One pattern fill, one draw call, 0 bytes of bundle.
([`design-tokens.md` §9.3](./design-tokens.md#94-how-the-texture-is-achieved--and-why-it-costs-nothing))

The performance constraints this was designed within — the live app is full of
`will-change` / `translateZ(0)` hacks precisely because animation on cheap
Android was a problem ([REBUILD_SPEC §10.4](../REBUILD_SPEC.md)):

| Concern | Answer |
|---|---|
| Bundle size | 0 bytes. The live app ships a 77 KB `linedpaper.png`; this ships nothing. |
| Tiling artifacts at arbitrary DPI | Structurally impossible — vectors in device-independent units, so no tile and no seam at 1.5×, 2.75× or anything else. |
| Low-end Android | The rules are a **static, non-animated** background layer. Nothing about the paper animates, so the texture never re-rasterises mid-transition. **No `will-change`, no `translateZ(0)` needed.** |
| Legibility | The **rule pitch is locked to the resolved line height** of the type rendered on it, at every dynamic-type scale. Text sits *on* the rules instead of crossing them. This is the single most important legibility decision in the notecard layer. |

### One deliberate inversion of the heritage — approved

In the live app the ruled paper is the **page background** and cards float on it
as plain white panels. Here it is inverted: **the desk is plain, the card is the
ruled page.** **Kevin approved this on 2026-08-08** — *"I think the texture off
the page background and onto the card is good"* — and it is recorded as a
decision, not an open question
([`spec.md` §13 Q4](./spec.md#13-open-questions)). Three reasons:

1. Rules can only do real work — sit a baseline under written text — if they
   belong to the same box as the text. As a full-screen backdrop they run behind
   list rows and app bars at unrelated pitches, which is noise.
2. It removes the texture from ~80 % of the app's pixels, which is where the
   performance and legibility cost lives.
3. It makes "the card" a physical object — and once the rules belong to the
   card, they can carry its text, which is what turns a textured panel into a
   notecard.

### The notecard in dark mode — a designed surface, not an inversion

A lined-paper texture cannot simply be inverted; a dark page with dark rules
reads as noise, and a chalkboard would demand a chalk texture and a handwriting
face — an accessibility non-starter. The answer is a **toned slate page under
low light**, governed by three rules
([`design-tokens.md` §3.3](./design-tokens.md#33-the-three-rules-that-make-dark-mode-paper-work)):

1. **The page is always the warmest, most-lit surface in the scene.** Light: a
   warm cream `#FCF8EE` on a cool grey desk. Dark: a slate `#23262C` that is
   *lighter* than the near-black `#121316` desk. A page under a lamp is a lit
   object in both cases, so the metaphor survives.
2. **Rule polarity flips; rule contrast does not.** Light: writing rules darker
   than the card at **1.55:1**, header rule at 2.23:1. Dark: writing rules
   lighter than the card at **1.52:1**, header rule at 1.80:1. Both schemes sit
   far below the 3:1 UI threshold **on purpose** — a rule that passes a contrast
   check has stopped being paper and started being a divider.
3. **No grain, in either scheme.** Grain is where paper textures go wrong on
   cheap Android: it is a raster, it bands on dark surfaces at 8-bit, and it
   moirés when scrolled at fractional DPI. The paper reads as paper from hue +
   rules + edge + shadow alone.

**Shadows do not exist in dark mode.** `elevation.page` resolves to `none`;
separation comes from the 1 dp `color.paper.edge` hairline plus the page being
lighter than the desk. Every diff colour is contrast-verified **against the dark
paper surface** (8.86–9.09:1), not against `color.surface`.

---

## The spelling-feedback moment

This is the product's entire differentiator
([Competitor Analysis](../documentation/competitor-analysis.md#the-character-level-diff-question)),
so it got the most design. Component:
[`spec.md` §3.2`DiffStrip`](./spec.md#32-diffstrip--the-spelling-feedback-moment-custom).
Screen: [`spec-screens.md` S8](./spec-screens.md#s8--the-feedback-moment).
Normative contract:
[spelling-diff-spec.md §7](../documentation/spelling-diff-spec.md#7-presentation-contract).

### Two rows, one character grid, two writing rules

The diff arrives as `DiffSegment[]` — structured data, **never an HTML string**.
Each segment is exactly **one column**, monospaced, so the two rows align by
construction rather than by luck — and each row's baseline lands on one of the
notecard's writing rules:

```
┆ i   c   e       c   r   e   a   m    ← YOU TYPED   (baseline on rule k)
┆─────────∧────────────────────────
┆ i   c   e   _   c   r   e   a   m    ← CORRECT     (baseline on rule k+1)
┆─────────┄┄───────────────────────      the dashed MARK sits 3 dp BELOW the rule
```

**Two adjacent rule bands, not interlinear.** Both readings were on the table —
the attempt in the interlinear space above (how a teacher marks a page), or both
rows on rules. Two bands wins, because at 28 sp the correct row's ascenders
reach ≈27 dp above its own baseline and fill the entire band above it: there is
no clear interlinear space, and buying some would mean shrinking the one thing on
screen that must be biggest. It also keeps the notecard invariant total, with
zero exceptions. The teacher's-pen quality lives in the **marks** instead.
([`spec.md` §3.2.2.1](./spec.md#3221-why-two-adjacent-rule-bands-and-not-interlinear))

**Marks never collide with the rules.** The writing rule is 1 dp, at the
baseline, at ~1.55:1. A diff mark is 2 dp, 3 dp lower, at 6.16–9.09:1, saturated.
Four separating axes — position, weight, contrast, hue — so the card's printed
line and the pen's mark are never confusable. The cell wash sits *under* the
rule in z-order, so the ruling stays continuous across a marked cell.
([`spec.md` §3.2.2.2](./spec.md#3222-marks-vs-rules--they-must-not-collide))

**Showing the user their own attempt aligned against the correct answer is the
highest-leverage decision in the package.** It is Anki's single most-complained-
about gap in its own equivalent feature — *"I cannot see the input I made?"* —
and it costs nothing extra here because it is the same column grid. The bottom
row alone is a complete, correct P0 rendering; the top row is a prop
(`showAttempt`), not a redesign. That is the whole of
[US-D6](../documentation/user-stories.md#us-d6--see-my-own-attempt-next-to-the-answer-p1--differentiator).

### Five kinds, each with 2–4 non-colour signals — and they are the real marks

**Nothing is encoded by colour alone** — an accessibility requirement and
strictly more informative. Every mark was audited against standard
**proofreader's marks**, so these are the marks a teacher would actually use:

| Kind | Attempt row | Correct row | Non-colour signals | Convention |
|---|---|---|---|---|
| `ok` | letter, ink | letter, ink | absence of marking | — |
| `wrong` | typed letter, **struck through** | correct letter, **bold**, **solid underline** | strike · solid rule · bold | strike = delete |
| `missing` | **`∧`** insertion caret | correct letter, **bold**, **dashed underline**, tinted cell | caret · dashed rule · bold · wash | the caret `‸` = insert |
| `extra` | typed letter, **struck through** | **`·`** void mark — **no letter at all** | strike · an empty correct cell · wash | strike = delete |
| **`transposed`** | the two typed letters **in the order typed**, **not struck**, **ribbon** across the pair | the two correct letters, **bold**, **ribbon** across the pair | the **ribbon** — the only curve, and the only mark spanning two cells · bold · pair-wide wash · marked-but-not-struck | the transpose ribbon (`tr`) |

Swapped pairs are grouped by an explicit **`pairId`**, never by adjacency — two
consecutive swaps produce four consecutive `transposed` segments and adjacency
alone cannot tell `(0,1)(2,3)` from `(1,2)`.
| **missing space** | **`∧`** caret | **`#`**, bold, dashed underline, tinted, **full character width** | the `#` glyph · caret · dashed rule · wash | `#` = insert a space |

The five are separable **by shape alone** — desaturate the strip and it still
reads: solid line · dashed line · void cell · curve-across-two-cells · nothing.
`wrong` and `missing` render identically in the live app; here they differ in
three ways at once.

The marks are **text glyphs and drawn strokes inside the monospace grid, never
icons** — an icon in a character cell would break the mono advance width and
destroy the alignment the whole feature depends on.

**`transposed` is new, and it is why the algorithm moved to
Damerau-Levenshtein.** Plain Levenshtein has no concept of a swap, so `receive`
typed as `recieve` rendered as a *missing* `e` plus an *extra* `e` — two
unrelated marks for one of the most common spelling mistakes there is. It is now
one swap bound by one ribbon, and the screen reader says *"You swapped the i and
the e."* Verified: **adding transposition leaves all 15 ground-truth vectors
byte-identical** — nothing that was already marked changed.

**And no fourth hue.** `transposed` deliberately shares the `wrong` red. It *is*
a wrong-letter error, and it is already the most structurally distinctive mark
in the set, so it needs hue least; adding a teal would push the palette into
CVD-marginal territory to buy redundancy for the one mark that doesn't need it.
Fewer hues, carried harder by shape, is the stronger accessibility position.

**The ribbon vs. the rule grid.** A curve is the one shape that could run
*parallel* to a writing rule and become unreadable, so the geometry is chosen so
it cannot. The stroke passes **above the first letter and below the second**,
crossing the letter band only in the narrow join *between* the two cells where
there is no glyph. It is monotonic — never horizontal for any meaningful length
— so it meets a rule at one point, steeply, at 2 dp and 6–9:1 against a 1 dp
rule at ~1.55:1.

### The missing-space marker

A `DiffSegment` whose `char` is `' '` and whose `status` is not `ok` **must
occupy a full character cell containing a visible glyph.** It is P0
([US-D3](../documentation/user-stories.md#us-d3--see-a-missing-space-p0)), it is
the feature **no competitor has**
([Competitor Analysis](../documentation/competitor-analysis.md#no-competitor-marks-a-missing-space-and-none-detects-a-transposition)),
and the diff spec names it
[the single easiest requirement in the document to lose in a rewrite](../documentation/spelling-diff-spec.md#72-hard-rules).
If it ever renders as whitespace the feature is gone and nobody will notice
until a user complains. The glyph is **`#`** — the standard proofreader's
insert-a-space mark *(Kevin's decision, 2026-08-08)* — used inline in the cell,
replacing the live app's `_`, which was heritage rather than convention.

### The screen-reader reading

A polite live region — never assertive, so it cannot interrupt the retry —
composed from the same segments via ICU messages, never concatenation:

```
Incorrect. Correct spelling: i-c-e, space, c-r-e-a-m.
You left out a space after "ice".
```

Spelled **letter by letter** with the word "space" spoken for a space; errors
grouped by kind in plain language; **capped at three then "and N more"**;
individual cells hidden from the accessibility tree so nobody swipes through
nine letters. Full composition rules:
[`spec.md` §3.2.7](./spec.md#327-screen-reader-announcement-us-d5).

### Speed

The strip appears with a 100 ms fade — already laid out before the fade starts —
plus a ±4 dp, 150 ms attention nudge (the descendant of the legacy `shake`, at a
quarter of the amplitude) that starts and ends at `translateX: 0`. **No stagger,
no per-letter reveal.** The user must read this in under a second and retype;
ceremony here costs the loop. The typed text stays and is **fully selected**, so
the retry is one keystroke.

---

## Critical constraints, at a glance

Each traces to a confirmed defect or a hard product rule.

| Constraint | How it is implemented |
|---|---|
| **Motion never carries state** | No animation may set visibility, mount/unmount a node, or gate navigation. Every animated property **starts and ends at identity**, so a skipped, interrupted or disabled animation leaves the UI already correct. This is the exact mechanism of the confirmed production soft-lock ([PRD §6.14](../documentation/product-requirements.md#614-inherited-defects-that-must-not-survive--p0)). [`design-tokens.md` §10.1](./design-tokens.md#101-the-three-motion-laws-for-this-app) |
| **Validate, then navigate, then animate** | The drill buttons stay **enabled** on a zero-card set and validate on press with a Snackbar + "Add cards". A disabled button with no explanation is the dead end [US-C2](../documentation/user-stories.md#us-c2--be-told-clearly-when-i-cant-start-p0) forbids. |
| **Reduce-motion** | Transforms dropped, cross-fades instant, the diff nudge becomes a 150 ms border emphasis. The feedback is never removed, only the movement. |
| **Dynamic type** | Never disabled, anywhere — including the mono diff cells. Layouts reflow: grids collapse to 1-up above ~130 %, button rows stack, the Page's rule pitch grows with the line height. Tested at 200 %. *(The live app sizes every font in `vh`, so a larger system font does nothing at all.)* |
| **Real controls** | Every interactive element is a Paper component or `Pressable` with `accessibilityRole` + `accessibilityLabel`, minimum **48 × 48 dp**. *(The live app uses `<div>`s with click handlers throughout.)* **No action is available only via a gesture** — reorder has Move up/down menu items, swipe-delete has an overflow item, sheets have a Close button. |
| **Never colour alone** | Enumerated for every meaning in the app — not just the diff — in [`spec.md` §7.1](./spec.md#71-colour-and-contrast). |
| **No markup from user strings** | The diff is `DiffSegment[]` rendered as elements. This closes the confirmed stored-XSS by construction ([CAP-4](../documentation/capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator)). |
| **The answer input defeats every spelling aid** | Exact attribute list, plus `data-gramm="false"` for browser grammar extensions, in [`spec.md` §7.5](./spec.md#75-the-answer-input-a11y--input-attributes). **Verify on a physical device per platform** — it regresses silently and its failure destroys the product. |
| **Offline-first, no mandatory sign-in** | There is **no** sign-in wall, no "sign in to continue", no signed-out empty state, and no badge or dot nagging toward an account, on any screen. Sync lives in one Settings row whose signed-out state is worded as a *fact*, not an invitation. Every P0 feature works in airplane mode from a cold start. ([CAP-13 §13.1](../documentation/capability-spec.md#131-the-optionality-constraint-p0--this-part-gates-the-launch-build)) |
| **Corrupt data never blanks the UI** | `QuarantineBanner` renders everything readable and tells the truth about the rest, with nothing deleted ([CAP C6](../documentation/capability-spec.md#c6--error-recovery-and-reliability)). |
| **Three platforms** | Web divergences — real URLs, hover, focus rings, keyboard, wide viewports, PWA, grammar extensions — are in [`spec.md` §10](./spec.md#10-web-divergences). The web build **must** deploy to the `vocabcards.com` origin; that is what makes the `localStorage` auto-migration possible. |

---

## Capability → design coverage

| Capability | Where it is designed |
|---|---|
| [CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0) Library & storage | S1, S2, S3, S6 |
| [CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0) Card authoring | S4, S5, S24 (P1) |
| [CAP-3](../documentation/capability-spec.md#cap-3--test-session-engine-p0) Test session | S7 |
| [CAP-4](../documentation/capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator) Diff algorithm | Data model in [`spec.md` §2](./spec.md#2-data-model); the design consumes `DiffSegment[]` and never re-derives it |
| [CAP-5](../documentation/capability-spec.md#cap-5--feedback-presentation-p0) Feedback presentation | **S8** + `DiffStrip`, `DiffCell`, `MarkLegend` |
| [CAP-6](../documentation/capability-spec.md#cap-6--session-results--missed-word-practice-p0) Results & missed words | S9, S22 (P1) |
| [CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0) Trophies | S10 + `CounterStrip`, `TrophyTile`, `TrophyToast` |
| [CAP-8](../documentation/capability-spec.md#cap-8--legacy-import--migration-p0) Legacy import | S12, S16 |
| [CAP-9](../documentation/capability-spec.md#cap-9--export--native-file-format-p0) Export | S13 |
| [CAP-10](../documentation/capability-spec.md#cap-10--settings--preferences-p0) Settings | S11 |
| [CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0) Starter content | S16 |
| [CAP-12](../documentation/capability-spec.md#cap-12--entity-identity--change-tracking-p0) Identity | [`spec.md` §2](./spec.md#2-data-model) — sets addressed by `id` everywhere in the design |
| [CAP-13](../documentation/capability-spec.md#cap-13--optional-account--cloud-sync-p1--v1-commitment) Sync | S17 (P1); the **optionality constraint is honoured on every screen** |
| [CAP-14](../documentation/capability-spec.md#cap-14--speech-synthesis--dictation-p1) Audio & dictation | S19, S23 (P1) |
| [CAP-15](../documentation/capability-spec.md#cap-15--scheduling--smart-review-p1) Scheduling | `DrillCard`'s third button (P1) |
| [CAP-16](../documentation/capability-spec.md#cap-16--trouble-words--error-insights-p1--differentiator) Trouble words | S18 (P1) |
| [CAP-17](../documentation/capability-spec.md#cap-17--delimited-text--third-party-import-p1) Delimited import | S20 (P1) |
| [CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0) About & legal | S14, S14a, S15, S21 (P1) |
| [CAP-19](../documentation/capability-spec.md#cap-19--telemetry--analytics-p1) Analytics | S11's opt-out row; no screen carries card content into analytics |
| [CAP-20](../documentation/capability-spec.md#cap-20--premium-entitlement-p2) Premium | Nothing designed — nothing ships at launch |

---

## Hand-off note

**Implementation-ready.** An engineer or implementation agent needs only these
four files:

1. [`design-tokens.md`](./design-tokens.md) — every value, plus the
   `react-native-paper` theme mapping
2. [`spec.md`](./spec.md) — data model, components, navigation, icon map,
   contracts, dependencies, acceptance criteria
3. [`spec-screens.md`](./spec-screens.md) — 24 screens with all states
4. [`prototype.html`](./prototype.html) — open in a browser to see and feel it

**Verify against** the 60 acceptance criteria in
[`spec.md` §12](./spec.md#12-acceptance-criteria) and the per-screen checklist at
the end of [`spec-screens.md`](./spec-screens.md#cross-screen-checklist).

### Open — Kevin's call, each with a recommendation

Nothing here blocks a build; every item has a default an implementer can proceed
on. Full table with reasoning:
[`spec.md` §13](./spec.md#13-open-questions).

| # | Question | Recommendation |
|---|---|---|
| Q1 | Ship the "you typed" row at launch, or hold it to P1? | **Ship it** (`showAttempt` defaults `true`). It is Anki's most-complained-about gap and costs nothing extra to render. Flipping the default is a one-line change if the loop feels slower in testing. |
| Q2 | `missing` in violet, or keep everything red as today? | **Violet.** Shape already separates the five kinds, so hue is redundancy — but it halves the time to read a mixed-error word. |
| Q3 | Re-tint the launcher mark from black to `color.primary`? | **No.** The black rounded-square "V" is the only brand equity the product has and it is on users' home screens today. |
| ~~Q4~~ | ~~Moving the ruled texture from the background onto the card.~~ | ✅ **Closed — approved by Kevin, 2026-08-08**, together with the notecard / text-on-the-rules direction, which is now built into the tokens, the specs and the prototype. |
| Q5 | No bottom tab bar. | **Keep it.** One primary task; `CounterStrip` keeps trophies visible. |
| Q10 | ~~Naming~~ **RESOLVED 2026-08-08 — Kevin confirmed *Vocab Cards***, store title *"Vocab Cards: Spelling Practice"*, `com.kszapps.vocabcards`. | Settled. The existing script wordmark and **V** glyph are retained, which was a decisive factor in keeping the name — see [naming-research.md](../documentation/naming-research.md). |

### Blocked on asset work (not design)

- **The wordmark needs an SVG export** from `hmwt_app/logo/Vocab_vector.pdf`,
  plus a **second export recoloured to `color.paper.ink`** for dark mode — a
  black PNG must never be tint-filtered or shown black-on-black. Until then the
  existing PNG at 2× is acceptable on the two screens that use it.
- **Launcher masters** (`icon.png` opaque / no alpha, `adaptive-icon.png`,
  `adaptive-icon-monochrome.png`, all 1024 × 1024) re-exported from the same
  vector source. Exact recipe and `app.json` block:
  [`spec.md` §6](./spec.md#6-app-assets--launcher-icon). No Material glyph was
  generated for the launcher — using one would throw away Kevin's existing mark.

### Out of scope for this package

- **Starter-set content** (4 sets × 30–50 cards) must be independently compiled
  or public domain, and lives in a data file so a locale can replace it
  ([CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0)).
- **Changelog and privacy-policy copy** — both render from data files; the
  screens are designed, the prose is not written.
- **Application code.** Nothing in this folder is production code, including the
  prototype.
