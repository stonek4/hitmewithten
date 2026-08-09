# Design Specification — Vocab Cards

**Version:** 1.0 (2026-08-08)
**Owner:** Kevin Stoner
**Tokens:** [`design-tokens.md`](./design-tokens.md) — the single source of truth for every value
**Screens:** [`spec-screens.md`](./spec-screens.md)
**Prototype:** [`prototype.html`](./prototype.html)

**Product source of truth:**
[Capability Spec](../documentation/capability-spec.md) ·
[PRD](../documentation/product-requirements.md) ·
[User Stories](../documentation/user-stories.md) ·
[Spelling Diff Spec](../documentation/spelling-diff-spec.md) ·
[Competitor Analysis](../documentation/competitor-analysis.md) ·
[REBUILD_SPEC.md](../REBUILD_SPEC.md) (frozen reverse-engineering of the live app)

---

## Contents

1. [Overview & assumptions](#1-overview--assumptions)
2. [Data model](#2-data-model)
3. [Component library](#3-component-library)
4. [Navigation model & transitions](#4-navigation-model--transitions)
5. [Icon map](#5-icon-map)
6. [App assets & launcher icon](#6-app-assets--launcher-icon)
7. [Accessibility contract](#7-accessibility-contract)
8. [Internationalization contract](#8-internationalization-contract)
9. [Dark-mode contract](#9-dark-mode-contract)
10. [Web divergences](#10-web-divergences)
11. [Dependencies & project setup](#11-dependencies--project-setup)
12. [Acceptance criteria](#12-acceptance-criteria)
13. [Open questions](#13-open-questions)

---

## 1. Overview & assumptions

### 1.1 What this app is

Vocab Cards is a spelling and vocabulary flashcard app. You type the answer; if
you get it wrong the app shows you the correct spelling with **exactly the
characters you got wrong marked**, and the card does not advance until you spell
it correctly. It is a ground-up rebuild of the live app at
[vocabcards.com](https://www.vocabcards.com), targeting **web + Android + iOS
from one Expo / React Native / TypeScript codebase**.

The product's differentiator is not the diff algorithm — Anki has one — it is
the whole loop around it: typing as the only input, automatic immediate
correction, retry until right, a **missing-space marker no competitor has**, and
zero setup ([Competitor Analysis](../documentation/competitor-analysis.md#conclusion)).
The design's job is to make that loop feel fast and make the marking legible at
a glance.

### 1.2 Design direction — the two-layer system

**Chrome is Material Design 3 via `react-native-paper`. The cards are paper.**

| | Chrome | Page |
|---|---|---|
| Language | Material 3, restrained | A ruled 3 × 5 **notecard** — cream in light, slate in dark — that the user writes on |
| Components | `react-native-paper` MD3 | Custom, built on tokens |
| Colours | `color.*` M3 roles | `color.paper.*`, `color.diff.*` |
| Where | App bars, lists, dialogs, sheets, settings, trophies, import/export | The flashcard, the answer line, the feedback strip, the card editor's card, missed-word rows |

The seed is **`#305CA6`** — the live app's pale-blue button gradient (`#DEE8F9`)
taken back to full chroma at the same hue. It is the *same blue*, made into a
real Material palette. The full derivation and the paper-in-dark-mode reasoning
are in [`design-tokens.md` §0 and §3](./design-tokens.md).

**This is heritage work, not a rebrand.** The warm page, the soft grey shadow,
the black ink, the red-error/green-correct pair, the 15 px button radius and the
script wordmark all carry forward. The one deliberate inversion — moving the
ruled texture from the page background onto the card — was **approved by Kevin
on 2026-08-08**, together with the requirement that the card read as a
**notecard** and that **every line of card text sit on a writing rule**. That is
now the headline art direction; its construction spec is
[`design-tokens.md` §9](./design-tokens.md#9-the-notecard--construction-spec) and
its component surface is [§3.1](#31-page--the-notecard-custom).

### 1.3 Design constraints that are non-negotiable

Each traces to a confirmed defect or a hard product rule.

1. **Never colour alone.** Every diff status carries at least one non-colour
   signal ([spelling-diff-spec.md §7.2](../documentation/spelling-diff-spec.md#72-hard-rules)).
2. **A space error always has visible extent.** It never renders as literal
   whitespace ([US-D3](../documentation/user-stories.md#us-d3--see-a-missing-space-p0)).
3. **Motion never carries state.** No animation may control visibility,
   mounting, or navigation. See [`design-tokens.md` §10.1](./design-tokens.md).
   *(This is the mechanism of the confirmed production soft-lock —
   [PRD §6.14](../documentation/product-requirements.md#614-inherited-defects-that-must-not-survive--p0).)*
4. **Validate before navigating.** An invalid start shows a message and the app
   stays fully interactive
   ([US-C2](../documentation/user-stories.md#us-c2--be-told-clearly-when-i-cant-start-p0)).
5. **Type scales with the OS font setting, everywhere.** No `allowFontScaling={false}`,
   no viewport-unit sizing, layouts reflow rather than truncate.
6. **Real controls, correctly sized and labelled.** Every interactive element is
   a `Pressable`/Paper component with `accessibilityRole` and
   `accessibilityLabel`, minimum **48 × 48 dp**. *(The live app uses `<div>`s
   with click handlers throughout.)*
7. **No user-supplied string is ever rendered as markup.** The diff is
   `DiffSegment[]` rendered as elements
   ([CAP-4](../documentation/capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator)).
8. **Nothing implies a mandatory account.** No sign-in wall, no signed-out empty
   state, no "sign in to continue"
   ([CAP-13 §13.1](../documentation/capability-spec.md#131-the-optionality-constraint-p0--this-part-gates-the-launch-build)).
9. **The answer input defeats every spelling aid** —
   [§7.5](#75-the-answer-input-a11y--input-attributes).
10. **Offline is the default mode**, not a degraded one. There is no offline
    banner that disables anything ([CAP-C1](../documentation/capability-spec.md#c1--offline-first-correctness)).

### 1.4 Target framework and versions

| | |
|---|---|
| Framework | Expo (managed), React Native, TypeScript `strict` |
| UI library | `react-native-paper` 5.x (Material Design 3) |
| Navigation | **Expo Router** (file-based) — chosen over bare React Navigation because web is a first-class target and the web build must serve real URLs on the `vocabcards.com` origin |
| Minimum iOS | 15.1 (Expo SDK floor) |
| Minimum Android | API 24 (Android 7.0) |
| Web | Modern evergreen browsers; installable PWA with a service worker |

### 1.5 Assumptions made in place of asking

| # | Assumption | If wrong |
|---|---|---|
| A1 | Home screen **is** the library. The live app's separate Menu and "Manage Cards" (Loader) screens are merged: the current set and its two drill buttons sit at the top of the set list. | Split back into two screens; the components are unchanged. |
| A2 | **No bottom tab bar.** This is a single-task app; Trophies / Settings / About / Import / Export live behind app-bar actions and an overflow menu. A counter strip on Home makes trophies visible without a tab. | Add a 3-tab bar (Library / Trophies / Settings); no other screen changes. |
| A3 | Tapping a set row opens a **Set Detail screen**; the live app's four-action modal is preserved as the *quick* path behind a trailing ⋮ on the row. | Drop Set Detail and route everything through the sheet. |
| A4 | The drilling session is a **full-screen modal route**, so an accidental back-swipe cannot silently end a test. | Make it a normal push. |
| A5 | **US-D6 (show the user's own attempt) is designed and built at P0 as a hidden row.** The `DiffStrip` renders 1 or 2 rows behind a prop; shipping it is flipping a default. See [§13 Q1](#13-open-questions). | Ship with `showAttempt={false}`. Zero design change. |
| A6 | Starter content is 4 sets × 30–50 cards; the actual word lists are content work, not design, and are not in this package. | — |
| A7 | The changelog and privacy policy render from data files; their copy is not in this package. | — |
| A8 | English/US only at launch; every string is behind an i18n key ([§8](#8-internationalization-contract)). | — |
| A9 | The launcher icon reuses Kevin's existing "V" mark rather than a new Material glyph ([§6](#6-app-assets--launcher-icon)). | — |
| A10 | P1 surfaces (sync, dictation, trouble words, review, session history, delimited import, multi-answer UI, marking explainer) are **fully designed** so they can be built without another design pass, but are marked P1 and can be omitted from the launch build with no layout consequences. | — |

---

## 2. Data model

Derived from [CAP-12 §12.1](../documentation/capability-spec.md#121-required-entity-shape)
and [spelling-diff-spec.md §2](../documentation/spelling-diff-spec.md#2-the-contract).
Field names here are the ones the design references; the *properties* are the
requirement.

```ts
// ─── Identity, present on every persisted entity (CAP-12 / C2) ───────────────
interface Tracked {
  id: string;                    // UUID v4, client-generated, never derived from content
  createdAt: string;             // ISO 8601 UTC
  updatedAt: string;             // stamped on EVERY mutation, no exceptions
  deletedAt: string | null;      // soft-delete tombstone, retained ~90 days
  schemaVersion: number;         // present from v1; every read branches on it
}

interface CardSet extends Tracked {
  name: string;                  // trimmed, non-empty, ≤ 100 chars, ANY character allowed
  lastUsedAt: string | null;
  order: number;
}

interface Card extends Tracked {
  setId: string;
  hints: string[];               // ≥ 1 non-empty after trim; ≤ 256 chars each
  answers: string[];             // ≥ 1 non-empty after trim; ≤ 256 chars each
                                 // internal whitespace is preserved BYTE-EXACTLY
  order: number;
}

/** Library list rows are served from this summary index, never by loading cards. */
interface CardSetSummary {
  id: string;
  name: string;
  cardCount: number;
  lastUsedAt: string | null;
  updatedAt: string;
  isCurrent: boolean;
}

// ─── Evaluation (spelling-diff-spec.md §2) ──────────────────────────────────
type DiffStatus = 'ok' | 'wrong' | 'missing' | 'extra' | 'transposed';

interface DiffSegment {
  status: DiffStatus;
  char: string;                  // from the CORRECT answer; '' when status === 'extra'
  typed?: string;                // what the user typed: set on 'wrong', 'extra', 'transposed'
}

interface DiffSegment {
  // …as above, plus:
  /** Present ONLY on 'transposed' segments. Links the two halves of one swap. */
  pairId?: number;
}
// 'transposed' — you swapped two adjacent characters (Damerau-Levenshtein).
// A swap emits TWO adjacent `transposed` segments, one per position, each
// carrying its own `char` (correct), `typed` (what was actually there) and a
// shared `pairId`.
//
// >>> PRESENTERS MUST GROUP BY pairId, NEVER BY ADJACENCY. <<<
// Two consecutive swaps produce FOUR consecutive `transposed` segments, and
// adjacency alone cannot tell (0,1)(2,3) apart from (1,2).
// See spelling-diff-spec.md §2.4.

interface AnswerEvaluation {
  correct: boolean;
  matchedAnswer: string;         // the accepted answer scored against (§6 of the diff spec)
  diff: DiffSegment[];           // empty when correct
}

// ─── Session (CAP-3 / CAP-6) ────────────────────────────────────────────────
type SessionMode = 'quick' | 'all' | 'missed' | 'review' /*P1*/ | 'dictation' /*P1*/;

interface SessionCardState {
  cardId: string;
  attempts: number;              // wrong attempts on this card in this session
  passed: boolean;
  firstDiff: DiffSegment[] | null;  // the FIRST diff produced, for the results screen
  promptShown: string;
  answerExpected: string;
}

interface Session {
  id: string;
  setId: string;
  mode: SessionMode;
  flipped: boolean;              // hints ⇄ answers
  cardStates: SessionCardState[];
  index: number;                 // position in cardStates
  startedAt: string;
  endedAt: string | null;
  endedEarly: boolean;
}

/** Persisted, local-only, carries NO card content (CAP-6 / CAP-19). */
interface SessionRecord {
  id: string;
  setId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt: string;
  endedEarly: boolean;
  cardsCompleted: number;
  firstTryPasses: number;
  wrongAttempts: number;
  elapsedMs: number;
  missedCardIds: string[];
}

// ─── Stats, trophies, preferences ───────────────────────────────────────────
interface CardStats {
  cardId: string;
  attempts: number;
  firstTryPasses: number;
  failures: number;
  lastSeenAt: string | null;
  interval: number | null;       // reserved for CAP-15 (P1) — written null at v1
  ease: number | null;
  dueAt: string | null;
}

interface TrophyState {
  tested: number;                // monotonic
  passed: number;                // monotonic
  failed: number;                // monotonic
  unlockedAt: Record<TrophyId, string>;
  notifiedTrophyIds: TrophyId[];
}

type TrophyType = 'tested' | 'passed' | 'failed';
interface TrophyDef { id: TrophyId; type: TrophyType; goal: number; }
// 24 trophies, thresholds FROZEN (CAP-7):
//   tested: 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000   (9)
//   passed: 50, 100, 500, 1000, 5000, 10000, 50000, 100000       (8)
//   failed: 10, 50, 100, 500, 1000, 5000, 10000                  (7)

interface Preferences {
  caseSensitive: boolean;              // default false  — SYNCS
  quickTestSize: 5 | 10 | 20 | 50;     // default 10     — SYNCS
  defaultPromptSide: 'hint' | 'answer';// default 'hint' — SYNCS
  appearance: 'system' | 'light' | 'dark'; // default 'system' — DEVICE-LOCAL
  haptics: boolean;                    // default true   — DEVICE-LOCAL
  analytics: boolean;                  // default true   — DEVICE-LOCAL
  speechVoiceId: string | null;        // P1 — DEVICE-LOCAL
  speechRate: number;                  // P1 — DEVICE-LOCAL
  schedulingEnabled: boolean;          // P1, default false — SYNCS
  updatedAt: string;
}

// ─── Import / export ────────────────────────────────────────────────────────
type ImportOutcome = 'imported' | 'renamed' | 'replaced' | 'failed' | 'quarantined';
interface ImportItemResult {
  sourceName: string;            // filename, or the legacy storage key
  outcome: ImportOutcome;
  setId: string | null;
  cardCount: number;
  reason: string | null;         // i18n key + params, never a raw message
}
type ExportFormat = 'vocabcards' | 'cards' /*legacy, lossy*/ | 'delimited' /*P1*/;

// ─── P1: trouble words (CAP-16) ─────────────────────────────────────────────
interface TroubleWord { cardId: string; answer: string; failures: number; lastFailedAt: string; }
interface ErrorPattern {
  id: string;
  kind: 'dropped-double' | 'transposed' | 'omitted-space' | 'vowel-substitution';
  occurrences: number;           // surfaced only at ≥ 3
  exampleCardId: string;
  params: Record<string, string>;  // fed into an ICU message, never concatenated
}
```

**Data-model rules the UI must honour:**

- Sets are addressed by `id`. Renaming touches metadata only.
- The missed-card list references cards **by id**, so "practice missed" survives
  an edit and silently skips a deleted card.
- Deleting the current set clears the selection to a **real `null`**.
- Every read validates; anything unparseable is **quarantined and surfaced**
  (see `QuarantineBanner`, [§3.21](#321-quarantinebanner)) — never dropped,
  never a blank screen.

---

## 3. Component library

### 3.0 Implementation strategy

Standard Material widgets come from **`react-native-paper`**. The components
below are either (a) thin themed wrappers over Paper, or (b) **custom Page-layer
components** that Paper has no primitive for. Every one reads tokens via
`useAppTheme()`; no component contains a hex value.

| Need | Use |
|---|---|
| Buttons | Paper `Button` (`mode="contained" \| "contained-tonal" \| "outlined" \| "text"`) |
| Icon buttons | Paper `IconButton` (`size={24}`, container 48 dp) |
| FAB | Paper `FAB` / `FAB.Extended` |
| Top app bar | Paper `Appbar.Header` + `Appbar.Content` / `Appbar.Action` / `Appbar.BackAction` |
| Cards, surfaces (Chrome only) | Paper `Card`, `Surface` |
| Text + type scale | Paper `Text variant="…"` |
| Text fields (Chrome) | Paper `TextInput mode="outlined"` |
| Chips | Paper `Chip` (`mode="flat" \| "outlined"`, `selected`) |
| Switches / radios | Paper `Switch`, `RadioButton.Item` |
| Lists & dividers | Paper `List.Item`, `List.Section`, `Divider` |
| Dialogs | Paper `Portal` + `Dialog` |
| Bottom sheets | `@gorhom/bottom-sheet` (Paper has no sheet); content styled with Paper components |
| Snackbar / toast | Paper `Snackbar` |
| Progress | Paper `ProgressBar` |
| Menus | Paper `Menu` |
| Segmented controls | Paper `SegmentedButtons` |
| Virtualised lists | RN `FlatList` (`getItemLayout` where rows are fixed) |
| **Page, AnswerLine, DiffStrip, DiffCell, PromptBlock, MarkLegend** | **Custom** — no Paper equivalent exists |

---

### 3.1 `Page` — the notecard **(custom)**

**Purpose:** the one component that renders the paper metaphor. Everything with
a "written on a card" feel is a child of a `Page`.

> **Art direction (Kevin, 2026-08-08):** it must read as a **ruled 3 × 5 index
> card**, and **every line of card text must sit on a writing rule** the way
> handwriting does. Both are contracts. The construction spec and the
> baseline-grid arithmetic live in
> [`design-tokens.md` §9](./design-tokens.md#9-the-notecard--construction-spec);
> this section is the component surface.

```
┌────────────────────────────────────────────┐ ← shape.large · 1dp paper.edge
│                                            │   elevation.page (light) / none (dark)
│   HINT                             3 / 10  │   HEADER ZONE — 1 rule pitch, UNRULED
│════════════════════════════════════════════│ ← HEADER RULE 2dp paper.rule-strong (warm)
│ ┆Extremely hungry                          │ ← baseline ON writing rule 1
│ ┆──────────────────────────────────────────│
│ ┆                                          │
│ ┆──────────────────────────────────────────│ ← rule 2 · pitch = paper.rule-pitch
│ ┆ravenus▏                                  │ ← the answer, baseline ON rule 3
│ ┆══════════════════════════════════════════│ ← rule 3 → 2dp primary on focus
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← paper.thickness — card stock depth
└────────────────────────────────────────────┘
  ↑ margin rule, 1dp, paper.margin, inset paper.margin-inset (40dp)
```

**Two zones, and the header rule means something.** Above it is what is
*printed* on the card; below it is what you *write*. That is why the field label
lives above and the answer lives below.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string \| null` | `null` | The field label. Renders in the **header zone**. `null` collapses the zone and the header rule. |
| `labelTrailing` | `ReactNode` | — | Right-aligned header-zone slot (e.g. "3 / 10") |
| `ruled` | `boolean` | `true` | Writing rules in the body. `false` only for a `Page` holding non-line content (a stats block) |
| `gridFontSize` | `number` | `paper.grid-font-size` (28) | Set to `16` for a compact card (results, insights) |
| `rulePitch` | `number` | **resolved line height of `type.card-answer`** | Derived, never a literal. Scales with the OS font scale. |
| `margin` | `boolean` | `true` | The vertical margin rule |
| `stacked` | `boolean` | `false` | A `paper.stack-offset` (4 dp) `paper.surface-shade` sliver behind and below — "a card from a stack" |
| `elevated` | `boolean` | `true` | Applies `elevation.page` |

**Tokens:** stock `color.paper.surface`; edge `color.paper.edge` at
`paper.edge-width`; header rule `color.paper.rule-strong` at
`paper.header-rule-width`; writing rules `color.paper.rule` at
`paper.rule-width`; margin `color.paper.margin` at `paper.margin-inset`;
thickness `color.paper.surface-shade` at `paper.thickness`; radius `shape.large`;
shadow `elevation.page`. Body content starts at
`paper.margin-inset + paper.margin-gutter` from the leading edge; minimum card
height `paper.min-bands` (5) bands.

#### 3.1.1 The baseline-grid contract — what an implementer must do

Stated so the alignment can be built without guessing. Full derivation:
[`design-tokens.md` §9.2](./design-tokens.md#92-the-baseline-grid-contract-the-crux).

1. **`rulePitch` is the *resolved* line height of `type.card-answer`** — the
   token value multiplied by the OS font scale. It is never a hard-coded number,
   which is what makes the grid survive dynamic type.
2. **Rules are drawn at baselines.** Rule *k* sits at
   `gridOrigin + k · rulePitch`, where
   `gridOrigin = headerZoneHeight + headerRuleWidth + rulePitch/2 + 0.362 · gridFontSize`.
3. **Every body text run sets `lineHeight = rulePitch`** (or a whole multiple).
4. **A run at a different font size is nudged** by
   `Δ = 0.362 · (gridFontSize − fontSize)`, applied as `paddingTop: Δ` **and**
   `marginBottom: −Δ` so total advance stays an exact multiple of the pitch:

   ```ts
   export const BASELINE_K = 0.362;   // holds for BOTH Inter and JetBrains Mono
   export const gridOffset = (fontSize: number, gridFontSize: number) =>
     BASELINE_K * (gridFontSize - fontSize);
   ```

   Ship this once as `useGridOffset()` + a `<GridText>` wrapper. **No screen
   does this arithmetic by hand.** At the base scale: `card-answer` /
   `card-prompt` / `diff-cell` → 0 dp · `card-prompt-small` → +2.2 dp ·
   `diff-attempt` → +2.9 dp.
5. **Wrapped lines are free.** Because `lineHeight === rulePitch`, a two-line
   prompt occupies two bands and both baselines land. Nothing extra is needed.
6. **Verification:** screenshot the drill card at font scales 1.0, 1.3 and 2.0
   and confirm every baseline meets a rule in all three. This is
   [AC-Notecard](#ac-notecard--the-baseline-grid).

**Construction:** procedural — `react-native-svg` `<Pattern>` on native, CSS
`repeating-linear-gradient` on web. No raster, no grain. Rationale and the
rejected alternatives:
[`design-tokens.md` §9.4](./design-tokens.md#94-how-the-texture-is-achieved--and-why-it-costs-nothing).

**States:** `Page` has no interactive states. It is never pressable; the
controls *on* it are. The body scrolls internally when content overflows and the
**rules scroll with it** — they belong to the content, not the frame — while the
header zone and header rule stay pinned.

**a11y:** `accessibilityRole="none"`. The rules, margin, header rule and
thickness are decorative and carry `accessibilityElementsHidden` /
`aria-hidden` on the background layer only.
`importantForAccessibility="no-hide-descendants"` is **never** used.

**Dark mode:** every paper token swaps; `elevated` resolves to no shadow and the
1 dp edge carries the separation instead. Rule polarity flips (lighter than the
card) while rule contrast stays sub-threshold, so the notecard reading survives
— [`design-tokens.md` §3.3](./design-tokens.md#33-the-three-rules-that-make-dark-mode-paper-work).
The component does not know which scheme it is in.

---

### 3.2 `DiffStrip` — the spelling-feedback moment **(custom)**

> **This is the most important component in the app.** It is the reason the
> product exists ([PRD §6.4](../documentation/product-requirements.md#64-spelling-feedback--p0--differentiator))
> and the thing one competitor does badly and everyone else not at all
> ([Competitor Analysis](../documentation/competitor-analysis.md#the-character-level-diff-question)).
> Its normative contract is
> [spelling-diff-spec.md §7](../documentation/spelling-diff-spec.md#7-presentation-contract).

**Purpose:** render an `AnswerEvaluation` so that a user — sighted, colour-blind,
or using a screen reader — learns *exactly* which characters they got wrong, at
a glance, mid-drill, without slowing the loop.

#### 3.2.1 Input contract

```ts
interface DiffStripProps {
  diff: DiffSegment[];        // structured data — NEVER an HTML string
  typedRaw: string;           // what the user submitted (for the a11y label)
  showAttempt?: boolean;      // US-D6. false at P0, true at P1. Design is identical.
  size?: 'full' | 'compact';  // 'compact' = results screen missed-word row
  reduceMotion?: boolean;
}
```

The component **never** receives or produces markup, and never re-derives the
diff. One array in, one strip out.

#### 3.2.2 Anatomy — a two-row character grid, on two rule bands

Each `DiffSegment` is exactly **one column**. Columns are fixed-width
(`font.mono` advance width + `type.diff-cell` tracking), so the two rows align
by construction rather than by luck.

```
   ┌──────────── one column per DiffSegment ─────────────┐

  ┆ i   c   e       c   r   e   a   m      ← YOU TYPED, baseline on writing rule k
  ┆         ∧                                (type.diff-attempt 20/40 — smaller
  ┆─────────────────────────────────────     type, same band)   hidden at P0
  ┆ i   c   e   _   c   r   e   a   m      ← CORRECT, baseline on writing rule k+1
  ┆─────────┄┄──────────────────────────     (type.diff-cell 28/40)
             ↑ the mark: 2 dp, 3 dp BELOW the writing rule
```

Top row = **your attempt**. Bottom row = **the correct spelling**, always fully
readable. The bottom row alone is a complete, correct P0 rendering; turning the
top row on is `showAttempt`, nothing more. That is the whole of US-D6.

#### 3.2.2.1 Why two adjacent rule bands, and not interlinear

Two readings were on the table: the attempt in the **interlinear space** above
the correct row (how a teacher marks a page), or the two rows on **two adjacent
writing rules**. **Decision: two adjacent rule bands.** Reasons, in order of
weight:

1. **True interlinear is geometrically impossible at these sizes.** The correct
   row is `type.diff-cell` at 28 sp, whose ascenders reach ≈27 dp above its own
   baseline — which fills essentially the entire 40 dp band above it. There is
   no clear interlinear space to put anything in. Buying some would mean
   shrinking the correct spelling, and the correct spelling is the one thing on
   this screen that must be biggest.
2. **It keeps the notecard invariant total.** "Every line of card text sits on a
   rule" with zero exceptions is an invariant an implementer will get right. The
   same rule with one carve-out is one they will get wrong.
3. **The marking metaphor lives in the marks, not in the row position.** The
   strike-through on the attempt, the `∧` insertion caret, and the 2 dp coloured
   underline drawn *below* the paper rule already read as a pen over a page.
   That is where annotation belongs.
4. **It reads correctly as an object.** Both rows on rules is "you wrote it
   wrong on one line, the right answer is on the next" — which is exactly what
   correcting your own work on a card looks like.

`type.diff-attempt` was therefore changed from 22/32 to **20/40**: smaller
glyphs in the *same* 40 dp band, nudged by `Δ = +2.9 dp` so its baseline lands
on the rule ([§3.1.1](#311-the-baseline-grid-contract--what-an-implementer-must-do)).
Writing smaller between the same printed lines is what people actually do on a
card.

#### 3.2.2.2 Marks vs. rules — they must not collide

The writing rule sits **at** the baseline, so a mark drawn at the baseline would
land on top of it. The separation is explicit:

| | Writing rule | Diff mark |
|---|---|---|
| Position | at the baseline | `paper.mark-offset` (**3 dp**) below the baseline |
| Thickness | 1 dp | **2 dp** |
| Contrast on the card | ~1.55:1 (light) / ~1.52:1 (dark) | **6.16–9.09:1** |
| Colour | neutral blue-grey | saturated `diff.wrong` / `diff.missing` |

Four separating axes — position, weight, contrast and hue — so the paper's line
and the pen's mark are never confusable. A mark may cross a descender; so does a
real proofreader's underline, and it stays legible because one stroke is
horizontal and the other vertical.

The **cell wash** (`diff.*-container`) is painted behind the *pair* of cells and
sits **under** the writing rule in z-order, so the rule stays continuous across
a marked cell rather than being interrupted by it — the card's ruling is
printed; the marking is on top of it.

#### 3.2.3 Per-status treatment — **every kind has 2–4 non-colour signals**

**Five kinds**, and every mark follows real proofreading convention.

| `status` | Attempt row (top) | Correct row (bottom) | Cell wash | Non-colour signals |
|---|---|---|---|---|
| `ok` | `char`, `paper.ink` | `char`, `paper.ink`, weight 500 | none | — (absence of marking *is* the signal) |
| `wrong` | `typed`, `diff.wrong`, **line-through** | `char`, `diff.wrong`, **weight 700**, **solid 2 dp underline** | none | strike-through above · solid underline · bold |
| `missing` | **`∧`** insertion caret, `diff.missing` | `char`, `diff.missing`, **weight 700**, **dashed 2 dp underline** | `diff.missing-container` | caret above · dashed underline · bold · wash |
| `extra` | `typed`, `diff.extra`, **line-through** | **`·`** void mark, `diff.void`, no weight | `diff.wrong-container` | strike-through above · a cell with *no letter* in it · wash |
| **`transposed`** (a **pair** of segments) | the two `typed` characters **in the order typed**, `diff.transposed`, **not struck**, **the ribbon** drawn across the pair | the two `char`s in the correct order, `diff.transposed`, **weight 700**, **the ribbon** drawn across the pair | `diff.wrong-container`, **one continuous block across both cells** | the **ribbon** (the only curve, and the only mark spanning two cells) · bold · a pair-wide wash · marked-but-**not**-struck, which no other status is |
| `missing` where `char === ' '` | **`∧`** caret, `diff.missing` | **`#`** — the proofreader's insert-a-space mark, `diff.missing`, weight 700, dashed 2 dp underline, **full character width** | `diff.missing-container` | the `#` itself · caret · dashed underline · wash |
| `extra` where `typed === ' '` | **`#`** struck through, `diff.extra` | `·` void mark | `diff.wrong-container` | `#` glyph · strike · void cell · wash |

**Why this set of marks — they are the real ones.** Audited against standard
proofreader's marks:

- **`∧` for `missing`** — the caret `‸`/`⁁` is *the* standard insertion mark.
- **Strike-through for `wrong` and `extra`** — the standard delete mark.
- **`#` for a missing space** — the standard "insert a space" mark. *(Kevin's
  decision, 2026-08-08. This replaces the live app's `_`, which was heritage
  from the v0.1.6 fix rather than convention. Used **inline in the cell**;
  deliberately **no** margin-annotation layer.)*
- **The ribbon for `transposed`** — the proofreader's transpose mark, the
  S-curve that loops over the first character and under the second (`tr` is its
  margin abbreviation).
- **`·` for `extra`** has no direct convention; it is the descendant of the live
  app's `-` and is kept because the *absence of a letter* is the real signal.

**Structural properties worth stating:**

- The five kinds are separable **by shape alone**: solid line · dashed line ·
  void cell · curve-across-two-cells · nothing. Desaturate the strip and it
  still reads.
- `wrong` and `missing` are the pair the live app renders identically
  ([spelling-diff-spec.md §7.1](../documentation/spelling-diff-spec.md#71-five-kinds-must-be-visually-distinguishable)).
  Here they differ in three ways at once: mark shape, hue, and what appears in
  the attempt row (a struck letter vs an empty insertion caret).
- The marks are **characters and drawn strokes, not icons.** An icon in the
  character grid would break the monospace advance and destroy alignment.
- `extra` is structurally unmistakable: it is the only status where the correct
  row contains **no letter**.
- `transposed` is structurally unmistakable: it is the only status whose mark
  **spans two cells**, and the only one that marks a character *without*
  striking it in the attempt row.

##### 3.2.3.1 Rendering the `transposed` pair

A swap emits **two adjacent `transposed` segments sharing a `pairId`**.

> **The renderer groups by `pairId`, never by adjacency.** Two consecutive
> swaps produce four consecutive `transposed` segments, and adjacency alone
> cannot distinguish `(0,1)(2,3)` from `(1,2)`. This is a correctness rule, not
> a style preference —
> [spelling-diff-spec.md §2.4](../documentation/spelling-diff-spec.md#24-how-a-transposed-pair-is-represented).

Draw the ribbon once per pair, on the segment whose `pairId` has not been seen
yet, and span it across that pair's two columns.

**The ribbon** is one `react-native-svg` `<Path>` (an inline `<svg>` on web),
absolutely positioned across the pair's two columns, and drawn **once per row**
so it straddles that row's own baseline:

```
   ────╮                          yT = baseline − 1.15·fs + 2      (above cap height)
        ╰────╮                    yM = baseline − 0.36·fs          (the cell join)
              ╰────                yB = baseline + 0.22·fs          (the mark band)

   path: M 0,yT  C .7w,yT  .5w,yM  w,yM
                 C 1.5w,yM 1.3w,yB 2w,yB          (w = one column width)
```

It **passes above the first character and below the second**, crossing the
letter band only in the narrow join *between* the two cells — where there is no
glyph. The control points hold the curve flat near each end, so neither letter
is obscured.

**How it avoids colliding with the notecard's writing rule.** This is the mark
most at risk, because a curve is the one shape that could run *parallel* to a
rule and become unreadable. The geometry makes that impossible:

- The stroke is **monotonic top-left to bottom-right** — it is never horizontal
  for any meaningful length, so it can never shadow a rule.
- It meets the writing rule at **one point**, travelling steeply, close to
  perpendicular. A steep crossing reads; a parallel run does not.
- Stroke width **2 dp** in a saturated `diff.transposed` (6.16–9.09:1) against a
  1 dp rule at ~1.55:1 — a 4× contrast separation.
- Its tail lands in the same band the other marks use (`paper.mark-offset`,
  3 dp below the baseline), so all five marks share one band and the card never
  looks cluttered.

**The missing-space marker gets its own row in the table on purpose.** It is a
P0 requirement ([US-D3](../documentation/user-stories.md#us-d3--see-a-missing-space-p0)),
it is the feature **no competitor has**
([Competitor Analysis](../documentation/competitor-analysis.md#no-competitor-marks-a-missing-space-and-none-detects-a-transposition)),
and it is
[the single easiest requirement in the project to lose in a rewrite](../documentation/spelling-diff-spec.md#72-hard-rules).
The rule for an implementer is absolute: **a `DiffSegment` whose `char` is `' '`
and whose `status` is not `ok` must occupy a full character cell containing a
visible glyph.** If it ever renders as whitespace, the feature is gone and
nobody will notice until a user complains.

The glyph is now **`#`**, the standard proofreader's insert-a-space mark, rather
than the live app's `_`. Everything else about the treatment is unchanged — full
cell width, dashed mark, wash, caret above. See
[`design-tokens.md` §4.1](./design-tokens.md#41-the-mark-glyphs) for the
"does it read as a hashtag?" check and its answer.

#### 3.2.4 Sizing & layout

| | `size="full"` | `size="compact"` |
|---|---|---|
| Grid font size / pitch | 28 / **40 dp** | 16 / **24 dp** |
| Correct row type | `type.diff-cell` (28/40 mono), baseline on rule *k+1* | `type.diff-compact` (16/24 mono), baseline on rule *k* |
| Attempt row type | `type.diff-attempt` (20/40 mono, `Δ +2.9 dp`), baseline on rule *k* | hidden |
| Column width | mono advance + `1 sp` tracking | mono advance + `0.5 sp` |
| Mark underline | 2 dp, `paper.mark-offset` (3 dp) below the writing rule | 1.5 dp, 2 dp below |
| Row gap | **none** — the pitch *is* the gap | — |
| Wrap | wraps at the container edge, **breaking between columns only**, in whole band pairs | single line, ellipsised with a "see all" affordance |

Long answers wrap; they never truncate and never scroll horizontally. Wrapping
splits the *pair* of rows together onto the next two bands, so the attempt stays
above its own letters and both baselines still land on rules.

#### 3.2.5 States

| State | Rendering |
|---|---|
| Wrong answer (default) | The strip, plus the retry prompt below |
| Correct answer | The strip is not rendered. The Page shows the stored-casing answer in `type.card-answer`, `diff.correct`, on a `diff.correct-container` wash, with a `check-circle` icon and the word "Correct" — **icon + word + colour**, never colour alone ([US-C4](../documentation/user-stories.md#us-c4--get-an-answer-confirmed-p0)) |
| Over the length cap | No strip. A plain "Not quite — try again" message and the answer shown unmarked ([spelling-diff-spec.md §8](../documentation/spelling-diff-spec.md#8-performance--bounds)) |
| Reduce-motion | Identical, minus the nudge (see below) |
| Empty submission | The whole answer is `missing`; every column shows a caret above and a marked letter below. Correct by construction — this is ground-truth vector 10 |

#### 3.2.6 Motion

- **Appear:** `motion.diff-appear` (100 ms fade). The strip is *already in its
  final layout* when the fade starts — the fade is on opacity only, from 1 to 1
  under reduce-motion. No stagger: staggering letters would slow the loop, which
  is the one thing this screen must not do.
- **Attention:** `motion.diff-nudge` — ±4 dp horizontal translate, 150 ms, on
  the strip container only. This is the descendant of the legacy `shake`, at a
  quarter of its amplitude. It **starts and ends at `translateX: 0`**, so an
  interrupted or disabled nudge leaves the strip exactly where it belongs.
- **Reduce-motion:** the nudge is replaced by a 150 ms `diff.wrong` border
  emphasis on the strip container. The feedback is never removed, only the
  movement.

#### 3.2.7 Screen-reader announcement (US-D5)

The strip renders inside an `accessibilityLiveRegion="polite"` container
(`aria-live="polite"` on web). **Polite, never assertive** — it must not
interrupt the user typing their retry.

The announcement is composed from the same `DiffSegment[]`, via ICU messages —
never string concatenation:

```
Incorrect. Correct spelling: i-c-e, space, c-r-e-a-m. You left out a space after "ice".
```

Composition rules:

1. **Spell the correct answer letter by letter**, hyphen-separated, with the
   literal word "space" for a space character. Reading it as a word tells a
   screen-reader user nothing about spelling.
2. Then summarise errors grouped by kind, in reading order:
   - `missing` → *"You left out the letter o."*
   - `missing`, space → *"You left out a space after «preceding run»."*
   - `wrong` → *"You typed a instead of e."*
   - `extra` → *"You typed an extra i."*
   - `extra`, space → *"You typed an extra space."*
   - **`transposed` → *"You swapped the i and the e."*** — emitted **once for
     the pair**, naming the two characters **in the order the user typed them**,
     which is what makes it actionable. Never reported as two separate wrong
     letters; that is the whole reason the status exists.
3. **Cap at 3 errors**, then *"and 4 more."* **A transposed pair counts as one
   error** toward that cap, matching how it is rendered and how a person would
   describe it.
4. The individual `DiffCell`s are **not** separately focusable and carry
   `accessibilityElementsHidden` — the announcement is the accessible
   representation. A screen-reader user swiping through 9 letter cells would be
   worse than useless.
5. `showAttempt` does **not** change the announcement. What the user typed is
   already implied by the error list, and re-spelling their attempt letter by
   letter would double the speech length mid-drill.

#### 3.2.8 Haptics

`haptics.answer-wrong` (`notificationError`) fires once, with the strip, gated on
the Haptics preference. Never on retype, only on submit.

#### 3.2.9 Worked examples (all from the verified ground-truth vectors)

Vector 3 — `ravenous` typed as `ravenus` (omitted `o`):

```
 r  a  v  e  n     u  s        attempt (∧ under the gap)
             ∧
 r  a  v  e  n  o  u  s        correct
             ┄┄                dashed mark under the missing o
```

Vector 4 — `ravenous` typed as `ravenious` (extra `i`):

```
 r  a  v  e  n  i̶  o  u  s      attempt (i struck through)
 r  a  v  e  n  ·  o  u  s      correct (void mark — no letter belongs here)
                ▁▁
```

Vector 11 — `ice cream` typed as `icecream` (**the missing space**):

```
 i  c  e     c  r  e  a  m      attempt
          ∧
 i  c  e  #  c  r  e  a  m      correct  (# = insert a space)
          ┄┄
```

Vector 13 — `ice cream` typed as `ice  cream` (extra space):

```
 i  c  e     #̶  c  r  e  a  m    attempt (#, struck = delete a space)
 i  c  e     ·  c  r  e  a  m    correct (void)
```

**Transposition** — `receive` typed as `recieve`. Not a ground-truth vector
(the 15 predate Damerau-Levenshtein), but it is the case the fifth status exists
for and it must be in the fixture set:

```
        ╭──╮
 r  e  c  i  e  v  e            attempt — the two letters AS TYPED, not struck
        ╰──╯                    the ribbon binds the pair
        ╭──╮
 r  e  c  e  i  v  e            correct
        ╰──╯
```

*Before* Damerau-Levenshtein this rendered as a `missing` **e** followed by an
`extra` **e** — two unrelated marks for one mistake. Now it is one swap.

Vector 14 — `a` typed as `b` (the `script.length === 1` special case, which the
algorithm forces to *insert*, so it is a `missing`, not a `wrong`):

```
 ∧          attempt
 a          correct
 ┄┄
```

These six are the acceptance fixtures for the component
([§12 AC-Diff](#12-acceptance-criteria)) and all six appear in
[`prototype.html`](./prototype.html), rendered from the real algorithm.

> **Algorithm note.** `transposed` requires **Damerau-Levenshtein** (adjacent
> transposition as a single edit) rather than plain Levenshtein.
> [spelling-diff-spec.md](../documentation/spelling-diff-spec.md) is the
> normative contract and is being updated to match; **it is authoritative on the
> tie-break order.** Until it lands, the assumption implemented in the prototype
> is: the transposition candidate is evaluated **last**, after delete →
> substitute → insert, and wins only on a **strict** improvement (`<`), exactly
> like the existing candidates. Verified consequence: **all 15 ground-truth
> vectors produce byte-identical output** to the plain-Levenshtein
> implementation — adding transposition changes nothing that was already
> marked. Re-verify against the spec when it is published.

---

### 3.3 `DiffCell` **(custom, internal)**

One column of a `DiffStrip`. Not used directly by screens.

**Props:** `segment: DiffSegment`, `row: 'attempt' | 'correct'`, `size`,
`pairPosition?: 'first' | 'second'` (set only on `transposed`).

**Rendering:** a fixed-width `View` (`width = monoAdvance(size) + tracking`,
`height = paper.rule-pitch`) containing a single `Text` whose baseline is placed
by the grid contract ([§3.1.1](#311-the-baseline-grid-contract--what-an-implementer-must-do)),
plus an absolutely positioned 2 dp mark line at `baseline + paper.mark-offset`
when the status calls for one. The wash is a `shape.extra-small` background
spanning the *vertical pair* of cells (attempt + correct), not each row
separately — and for `transposed` it spans **both cells of the pair** as one
continuous block.

**Cell wash vs. the writing rule.** The wash paints over the notecard's
background, which would break the ruling. A washed cell therefore **redraws the
1 dp writing rule at its own baseline**, so the card's ruling stays continuous
across it. The card's lines are printed; the marking sits on top of them.

**The ribbon** is not a `DiffCell` concern — it is one `<Path>` owned by the row
and positioned across the pair, so a single stroke spans two cells rather than
two half-strokes meeting at a seam.

**a11y:** `accessibilityElementsHidden` / `aria-hidden` — see §3.2.7 rule 4.

---

### 3.4 `AnswerLine` — the answer input **(custom)**

**Purpose:** the "writing on the page" moment. Where the user types.

**Why custom:** Paper's `TextInput` renders a filled or outlined box with a
floating label. A box on a notecard is a box on a notecard.

**The key point: `AnswerLine` has no underline of its own.** It does not draw a
line. It **sits on the card's writing rule** — baseline on the rule, exactly
like the prompt above it — and that existing rule changes weight and colour to
show state. This is precisely how you would write the answer on a card, and it
is what replaced the floating blue underline of the first pass. Everything else
about it is a plain RN `TextInput` with the attributes in
[§7.5](#75-the-answer-input-a11y--input-attributes).

```
 ┆                                          ← writing rule (blank band)
 ┆──────────────────────────────────────────
 ┆ravenus▏                                  ← type.card-answer, paper.ink,
 ┆══════════════════════════════════════════  baseline ON this rule, which is
 ┆                                            now 2 dp color.primary (focused)
```

| State | The writing rule it sits on | Text |
|---|---|---|
| Default | 1 dp `color.paper.rule` — indistinguishable from every other rule on the card | `color.paper.ink` |
| **Focused** | the same rule, **2 dp `color.primary`** | `color.paper.ink` |
| After a wrong submit | the same rule, **2 dp `color.diff.wrong`** | `color.paper.ink`, **fully selected** |
| Disabled (never used in a session) | 1 dp `color.paper.rule`; text at 38 % | — |
| Web keyboard focus | the 2 dp primary rule **plus** a 2 dp `color.primary` outline offset 2 dp around the whole line — a visible focus indicator is required on web ([§10](#10-web-divergences)) |

**The rule never moves between states** — only its width and colour change, and
it thickens **downward** from the baseline so the text does not shift. State is
never signalled by geometry, which keeps the grid stable and means a missed
state change cannot knock the card off its baselines.

**Behavior**

- **Focused with the keyboard up the instant the card appears**, every card,
  every platform ([US-C3](../documentation/user-stories.md#us-c3--type-the-answer-immediately-p0)).
- `returnKeyType="go"` / `enterKeyHint="go"`; the action key submits.
- On a wrong answer the text **stays and is fully selected**, so retyping
  replaces it in one keystroke
  ([US-C5](../documentation/user-stories.md#us-c5--try-again-without-retyping-everything-p0)).
- Height is `type.card-answer` line height × the number of wrapped lines; it
  grows, it never scrolls internally.
- Minimum tap area 48 dp tall including the label.

**a11y:** `accessibilityLabel` = "Your answer" (i18n `session.answerLabel`);
`accessibilityHint` = "Type the spelling and press go". Not announced on every
keystroke.

---

### 3.5 `PromptBlock` **(custom)**

The card's prompt on a `Page`.

- Label: "Hint" (or "Answer" when flipped) — `type.paper-label`,
  `color.paper.ink-variant`.
- Text: `type.card-prompt`, `color.paper.ink`; auto-downgrades to
  `type.card-prompt-small` when the string exceeds 80 characters, and the
  `Page`'s `rulePitch` follows the chosen variant.
- Scrolls internally if it still overflows; rules scroll with it.
- **Dictation mode (P1):** the text is replaced by a large `volume-high`
  play button and the label reads "Listen"; no text is shown until the card is
  passed ([US-J2](../documentation/user-stories.md#us-j2--type-what-i-hear-p1)).
- a11y: `accessibilityRole="text"`, label = the prompt string, prefixed
  "Hint:" / "Answer:".

---

### 3.6 `SessionProgressBar`

Paper `ProgressBar`. Track `color.surface-container-highest`, fill
`color.primary`, height 4 dp, `shape.full`.

- Value = `cardsPassed / sessionLength`. **Advances only on a pass** — never on
  a wrong attempt ([US-C10](../documentation/user-stories.md#us-c10--see-how-far-through-i-am-p0)).
- Animates with `motion.progress`; the value is set from state, so a skipped
  animation still shows the right width.
- a11y: `accessibilityRole="progressbar"`, `accessibilityValue={{ now, min: 0, max }}`,
  label "Card 4 of 10".
- Paired with a text counter "4 / 10" in `type.label-medium` — progress is
  never conveyed by bar length alone.

---

### 3.7 `SetRow`

Library list row. Paper `List.Item` themed.

```
┌─────────────────────────────────────────────┐
│ [cards]  SAT/GRE High-Frequency Words   ⋮   │  type.title-medium
│          42 cards · used 2 days ago         │  type.body-small, on-surface-variant
└─────────────────────────────────────────────┘
```

- Leading icon `cards`, 24 dp, `color.on-surface-variant`.
- **Current set** marker: a Paper `Chip mode="flat"` reading "Current" in
  `primary-container` / `on-primary-container`, plus the leading icon switches to
  `bookmark` in `color.primary`. Two signals, never colour alone.
- Trailing `IconButton` `dots-vertical` → `SetActionsSheet` (§3.20), 48 dp.
- Row min height 64 dp; pressed state = `on-surface` state layer at 8 %.
- a11y: label "SAT/GRE High-Frequency Words, 42 cards, current set", role
  `button`; the ⋮ is a separate element labelled "Actions for …".

---

### 3.8 `DrillCard` — the Home hero **(custom, uses `Page`)**

The one place the two layers touch, on purpose: a `Page stacked` carrying the
current set's name and the two drill buttons.

```
┌──────────────────────────────────────────┐
│ ┆  CURRENT SET                           │  type.paper-label
│ ┆  SAT/GRE High-Frequency Words          │  type.title-large, paper.ink
│ ┆  42 cards                              │  type.body-small, paper.ink-variant
│ ┆                                        │
│ ┆  ┌──────────────┐ ┌──────────────────┐ │
│ ┆  │ ⚡ 10 Cards   │ │ 🎓 All Cards     │ │  Paper Button contained / tonal
│ ┆  └──────────────┘ └──────────────────┘ │
└──────────────────────────────────────────┘└ ← stacked sliver
```

- "10 Cards" is `Button mode="contained"`; "All Cards" is
  `mode="contained-tonal"`. Both ≥ 48 dp tall; they stack vertically below
  360 dp width or above a 130 % font scale.
- The label reflects the quick-test size setting: "5 / 10 / 20 / 50 Cards".
- **P1** adds a third `mode="outlined"` "Review" button when scheduling is on
  ([US-K3](../documentation/user-stories.md#us-k3--still-be-able-to-just-hammer-a-list-p1)
  requires that this never displaces the first two).
- **No current set:** the Page shows the empty state instead —
  see [`spec-screens.md` Screen 1](./spec-screens.md).
- **Zero-card set:** buttons are **enabled**, and pressing shows a Snackbar
  "This set has no cards yet" with an "Add cards" action. *Deliberately not
  disabled* — a disabled button with no explanation is exactly the dead end
  [US-C2](../documentation/user-stories.md#us-c2--be-told-clearly-when-i-cant-start-p0)
  forbids, and validating on press is what keeps validation before navigation.

---

### 3.9 `CounterStrip`

Three lifetime counters on Home, tappable → Trophies.

```
  ┌────────────┬────────────┬────────────┐
  │   1,284    │   1,102    │    311     │   type.title-large
  │  tested    │  passed    │  failed    │   type.label-medium
  └────────────┴────────────┴────────────┘
```

Paper `Surface elevation={1}`, `shape.medium`, dividers `outline-variant`.
a11y: one element, role `button`, label "Lifetime progress: 1,284 cards tested,
1,102 passed, 311 failed. View trophies." Numbers via `Intl.NumberFormat`.

---

### 3.10 `TrophyTile`

| State | Background | Icon | Text |
|---|---|---|---|
| Unlocked | `tertiary-container` | `trophy` filled, `on-tertiary-container` | Name + "Unlocked 3 Feb 2026" |
| Locked | `surface-container` | `trophy` at 38 % opacity, `on-surface-variant` | Name + "10 of 50 cards passed" |
| Next in category | `surface-container-high` + 1 dp `outline` border | `trophy`, `on-surface` | Name + a `ProgressBar` |

Locked/unlocked is signalled by **icon opacity + the presence of a date + a
progress bar**, not by colour. `shape.medium`, min 96 dp tall, 2-up grid
(1-up below 360 dp or above 130 % font scale).
a11y: role `text`; label "Trophy: 50 cards passed. Unlocked 3 February 2026." /
"Trophy: 500 cards passed. Locked. 102 of 500."

---

### 3.11 `CardRow` — editor list row

```
┌────────────────────────────────────────────┐
│ ⠿  Extremely hungry                    ✎  │  hint — type.body-large
│    ravenous                                │  answer — type.diff-compact (mono!)
└────────────────────────────────────────────┘
```

- The **answer is monospaced** even here, so internal spacing is visible while
  authoring. This is the same reason the diff is monospaced.
- Leading `drag-horizontal-variant` handle (48 dp target, long-press to reorder,
  **plus** a "Move up / Move down" pair in the row's overflow menu — no action
  may be gesture-only).
- Trailing `pencil` → inline edit; swipe-left reveals `delete`, which is also in
  the overflow menu.
- Divider `outline-variant`, full width.

---

### 3.12 `RapidEntryForm` **(custom layout over Paper `TextInput`)**

The fast authoring loop, on a `Page`.

- Two fields: **Hint** then **Answer**, both Paper `TextInput mode="flat"`
  restyled to the `AnswerLine` treatment (label above, rule below, no box) so
  the editor and the test screen feel like the same paper.
- Hint field: normal input attributes.
  **Answer field: every spelling aid off** ([§7.5](#75-the-answer-input-a11y--input-attributes)).
- Hint `returnKeyType="next"` → focuses Answer. Answer `returnKeyType="done"` →
  saves and returns focus to a blank Hint.
- A live "Card 7" counter and a "View all cards" link.
- Leaving with both filled saves; one filled warns; neither exits silently
  ([US-B3](../documentation/user-stories.md#us-b3--not-lose-a-half-typed-card-p0)).

---

### 3.13 `EmptyState`

Centred: a 72 dp icon in a `secondary-container` circle, a
`type.headline-small` line, a `type.body-medium` explanation, and **exactly one**
`Button mode="contained"`. Never a dead end — every empty state has an action.

---

### 3.14 `ConflictDialog` — duplicate set name

Paper `Dialog`. Three explicit actions, **never a silent resolution**
([US-A4](../documentation/user-stories.md#us-a4--never-lose-a-set-to-a-duplicate-name-p0)):

| Action | Button | Notes |
|---|---|---|
| **Replace** | `mode="text"`, `textColor={color.error}` | Warning text names the card count that will be destroyed: "This will permanently delete 42 cards." |
| **Rename** | `mode="contained"` (default focus) | A `TextInput` pre-filled with `Name (2)`, incrementing until free |
| **Cancel** | `mode="text"` | Dismisses; nothing is written |

a11y: `accessibilityViewIsModal`, focus lands on the rename field, and the
warning is part of the dialog's accessible description so it is read before the
buttons.

---

### 3.15 `DestructiveConfirmDialog`

Paper `Dialog` for deleting a set or card. Title names the object; body names the
**count that will be lost**. Confirm is `mode="text"` in `color.error` with the
verb ("Delete"), never "OK". Cancel is the default focus.
Haptic `haptics.destructive-confirm` on confirm.

---

### 3.16 `ImportReportList`

One row per item, from `ImportItemResult`:

| Outcome | Icon | Colour | Text |
|---|---|---|---|
| `imported` | `check-circle` | `diff.correct` | "SAT Words — 42 cards" |
| `renamed` | `rename-box` | `on-surface-variant` | "SAT Words → SAT Words (2) — 42 cards" |
| `replaced` | `alert` | `color.error` | "SAT Words — replaced, 40 cards removed" |
| `failed` / `quarantined` | `alert-circle` | `color.error` | "old.cards — couldn't be read (not valid JSON)" |

Icon **and** distinct wording per outcome. A failed row is tappable to a detail
sheet with the reason. The list header states the totals as one ICU-pluralised
sentence.

---

### 3.17 `TrophyToast`

Paper `Snackbar`, `duration={6000}`, **dismissible**, with a "View" action →
Trophies. Icon `trophy` in `color.tertiary`. Fires once per trophy
([US-F2](../documentation/user-stories.md#us-f2--be-told-when-i-unlock-one-p0)).
Never shown mid-card — queued and shown when the card advances, so it cannot
cover the answer line. `accessibilityLiveRegion="polite"`.
**A missed toast is not a lost event** — the Trophies screen is the durable
record.

---

### 3.18 `MarkLegend` **(custom)**

The "what do the marks mean" key. A **five-row** notecard showing a live
`DiffStrip` for each kind against a plain-language sentence — a wrong letter, a
missing letter, an extra letter, a **missing space**, and a **swap**. Appears:

- as a collapsible "What do these marks mean?" row under the first `DiffStrip` a
  user ever sees (dismissed permanently after one open),
- as a `help-circle` action in the session app bar (P1,
  [US-M3](../documentation/user-stories.md#us-m3--understand-the-feedback-the-first-time-i-see-it-p1)),
- and in full on the About → "How marking works" screen.

Because it renders the real component with the real tokens, it can never drift
from the thing it explains.

---

### 3.19 `TopBar`

Paper `Appbar.Header mode="small"` (`mode="large"` on Home only).
Background `surface-container-low`, title `type.title-large`,
`Appbar.BackAction` uses `arrow-left`. Actions are `Appbar.Action` at 48 dp.
The session screen's bar is described in
[`spec-screens.md` Screen 7](./spec-screens.md).

---

### 3.20 `SetActionsSheet`

`@gorhom/bottom-sheet`, `shape.extra-large` top corners, `surface-container`.
A drag handle plus a header with the set name and card count, then Paper
`List.Item` rows — preserving the live app's four actions and adding two:

`Use for drilling` (`check-circle`) · `Edit cards` (`pencil`) ·
`Rename` (`rename-box`) · `Duplicate` (`content-copy`, P1) ·
`Export` (`file-export`) · `Delete` (`delete`, `color.error`).

Dismiss by scrim tap, drag-down, or Back/Escape. Every action is also reachable
from the Set Detail screen — the sheet is a shortcut, never the only path.

---

### 3.21 `QuarantineBanner`

A persistent Paper `Banner` at the top of Home when a read failed validation.
`error-container` / `on-error-container`, icon `database-alert`.
Text: "Some saved data couldn't be read. Nothing was deleted."
Actions: **View details** (a sheet listing the affected keys + an "Export raw"
escape hatch) and **Dismiss**.

**Corrupt data must never blank the UI**
([CAP-C6](../documentation/capability-spec.md#c6--error-recovery-and-reliability)).
This banner is the design's answer: the app renders everything it *could* read
and tells the truth about the rest.

---

### 3.22 `SyncStatusRow` **(P1 —** [CAP-13](../documentation/capability-spec.md#cap-13--optional-account--cloud-sync-p1--v1-commitment)**)**

A Settings row, and nothing else anywhere in the app.

| State | Icon | Text |
|---|---|---|
| Signed out (default) | `cloud-off` in `on-surface-variant` | "Sync is off. Everything stays on this device." |
| Synced | `cloud-check` in `diff.correct` | "Synced · 2 minutes ago" |
| Pending | `cloud-sync` in `on-surface-variant` | "3 changes waiting for a connection" |
| Error | `alert-circle` in `color.error` | "Couldn't sync. Your data is safe on this device." |

**Never blocks anything and never appears during a session.** The signed-out
state is worded as a *fact*, not as an invitation — no badge, no dot, no
nagging.

---

### 3.23 `TroubleWordRow` **(P1 —** [CAP-16](../documentation/capability-spec.md#cap-16--trouble-words--error-insights-p1--differentiator)**)**

A rank number, the answer in `type.diff-compact`, a `DiffStrip size="compact"` of
the most recent failure, and "missed 4 times · last Tuesday". Pattern sentences
render above the list as `Chip`-headed cards, from ICU messages with the pattern
as parameters — never concatenated
([US-L2](../documentation/user-stories.md#us-l2--know-why-they-keep-beating-me-p1--differentiator)).

---

### 3.24 `AudioButton` **(P1 —** [CAP-14](../documentation/capability-spec.md#cap-14--speech-synthesis--dictation-p1)**)**

Paper `IconButton` with `volume-high`, 48 dp. **Hidden entirely** when no voice
is installed — never disabled, never an error
([US-J4](../documentation/user-stories.md#us-j4--not-be-broken-by-a-device-with-no-voices-p1)).
Speaking does not steal focus from `AnswerLine`; typing continues over the audio.
In dictation mode it is a 64 dp `FAB` on the `Page`, replayable without limit,
with a muted-device warning banner.

---

## 4. Navigation model & transitions

### 4.1 Navigator

**Expo Router**, one native-stack root plus one modal group.
**Navigation is explicit and named. `router.back()` is never used to reach a
specific screen** — the live app calls `history.navigateBack()`, sometimes
twice, on an assumption about the entry path
([REBUILD_SPEC §7](../REBUILD_SPEC.md)).

```
app/
├── _layout.tsx                     Stack + PaperProvider + theme + fonts
├── index.tsx                       S1  Home / Library                     P0
├── first-run.tsx                   S16 First run & migration report       P0
├── set/
│   ├── new.tsx                     S3  Create set (dialog route)          P0
│   └── [setId]/
│       ├── index.tsx               S2  Set Detail                         P0
│       ├── cards.tsx               S5  Card list editor                   P0
│       └── add.tsx                 S4  Rapid entry                        P0
├── session/
│   ├── _layout.tsx                 modal presentation group
│   ├── index.tsx                   S7  Test session (+ S8 feedback state) P0
│   └── results.tsx                 S9  Session results                    P0
├── trophies.tsx                    S10 Trophies                           P0
├── settings/
│   ├── index.tsx                   S11 Settings                           P0
│   ├── account.tsx                 S17 Account & sync                     P1
│   └── voice.tsx                   S19 Voice & dictation                  P1
├── data/
│   ├── import.tsx                  S12 Import                             P0
│   ├── paste.tsx                   S20 Paste / delimited import           P1
│   └── export.tsx                  S13 Export                             P0
├── about/
│   ├── index.tsx                   S14 About                              P0
│   ├── changelog.tsx               S14a Changelog                         P0
│   ├── privacy.tsx                 S15 Privacy policy                     P0
│   └── marking.tsx                 S21 How marking works                  P1
└── insights/
    ├── index.tsx                   S18 Trouble words & insights           P1
    └── history.tsx                 S22 Session history                    P1
```

### 4.2 Screen graph

```
                        ┌──────────────────────┐
   first run ──────────▶│  S16 First run       │
                        └──────────┬───────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │                       S1  HOME / LIBRARY                      │
   │  [drill card] [counters] [set list] [search] [sort]  ⌂        │
   └──┬──────┬──────────┬──────────┬──────────┬──────────┬─────────┘
      │      │          │          │          │          │
      │      │          │          │          │          └▶ S14 About ─▶ S14a Changelog
      │      │          │          │          │                       ─▶ S15 Privacy
      │      │          │          │          │                       ─▶ S21 Marking (P1)
      │      │          │          │          └────────────▶ S11 Settings ─▶ S17 Account (P1)
      │      │          │          │                                     ─▶ S19 Voice (P1)
      │      │          │          └───────────────────────▶ S10 Trophies
      │      │          └──────────────────────────────────▶ S12 Import / S13 Export
      │      │                                                  (S20 Paste, P1)
      │      └─── tap a set ──▶ S2 Set Detail ─┬─▶ S5 Card list ─▶ inline edit
      │             (or ⋮ ──▶ SetActionsSheet) ├─▶ S4 Rapid entry
      │                                        ├─▶ S3 Rename / S13 Export / delete
      │                                        └─▶ "Use & drill" ──┐
      │                                                            │
      └── 10 Cards / All Cards / Review(P1) ──────────────────────┐│
                                                                  ▼▼
                                            ┌──────────────────────────────┐
                                            │  S7 SESSION  (modal)         │
                                            │   └ S8 feedback state        │
                                            └──────────┬───────────────────┘
                                                       │ finish or end early
                                                       ▼
                                            ┌──────────────────────────────┐
                                            │  S9 RESULTS                  │
                                            │   [Practice missed] ─────────┼──▶ back to S7
                                            │   [Done] ────────────────────┼──▶ S1 (explicit)
                                            └──────────────────────────────┘
                                                       │ (P1)
                                                       └──▶ S18 Insights ─▶ S22 History
```

### 4.3 Route params

| Route | Params | Notes |
|---|---|---|
| `/set/[setId]` | `setId: string` | The **id**, never the name |
| `/set/[setId]/cards` | `setId`, `focusCardId?` | `focusCardId` scrolls to and opens a row |
| `/set/[setId]/add` | `setId` | |
| `/session` | `setId`, `mode: SessionMode`, `cardIds?: string[]`, `flipped?: boolean` | `cardIds` seeds "practice missed". The card array is passed as **ids only** and rehydrated from storage — the live app smuggles the whole card array through router config ([REBUILD_SPEC §7](../REBUILD_SPEC.md)) |
| `/session/results` | `sessionRecordId` | **`replace`**, not `push`, so Back from Results cannot re-enter a finished session |
| `/set/new` | `prefillName?` | |
| `/data/export` | `setIds?: string[]` | Absent = whole library |
| `/insights` | `setId?` | Absent = across all sets |

### 4.4 Transitions

| From → To | Presentation | Motion |
|---|---|---|
| Home → any pushed screen | `card` push | `motion.nav` — platform default slide |
| Home / Set Detail → Session | **`modal`, full screen** | `motion.session-open` — slide up + fade |
| Session → Results | `replace` | Cross-fade, `motion.nav` |
| Results → Home | `dismissAll` + explicit `router.replace('/')` | Modal dismiss down |
| Any → dialog | `Portal` + `Dialog` | `motion.dialog` |
| Any → bottom sheet | `@gorhom/bottom-sheet` | `motion.sheet` |
| Card → next card *(within S7)* | no navigation | `motion.card-advance` — the prompt cross-fades and translates 8 dp; the `Page` itself never moves |
| Flip | no navigation | `motion.flip` — the prompt cross-fades; **no 3-D flip**, which would be a state-carrying animation |

**Every transition obeys [`design-tokens.md` §10.1](./design-tokens.md):** it can
be skipped entirely and the app is in the same state.

**Back behavior**

| Screen | Hardware/gesture back |
|---|---|
| Home | Exits the app (Android) / no-op (web root) |
| Set Detail, editors, settings, about | Pops one level |
| **Session** | Opens the "End test?" confirm — never silently discards a session |
| **Results** | Same as Done: explicit `replace` to Home |
| Session, first card, in-screen Back button | **No-op** ([US-C8](../documentation/user-stories.md#us-c8--go-back-a-card-p0)) — the live app silently exits the whole test here |

---

## 5. Icon map

All icons are **MaterialCommunityIcons** from `@expo/vector-icons` — one family,
filled/rounded, no mixing. Every name below was verified present in
`@expo/vector-icons@14`'s `MaterialCommunityIcons` glyphmap
(source: Pictogrammers MDI, Apache-2.0).

Screens reference **semantic names only**, never raw glyph strings.

```ts
// src/theme/icons.ts
export const ICONS = {
  // ── Drill modes ────────────────────────────────────────────────
  drillQuick:      'flash',                   // "10 Cards"       (legacy: glyphicon-ok)
  drillAll:        'school',                  // "All Cards"      (legacy: glyphicon-education)
  drillReview:     'brain',                   // P1 smart review  (CAP-15)
  drillMissed:     'restart',                 // "Practice missed words"
  drillDictation:  'ear-hearing',             // P1 dictation mode (CAP-14)

  // ── The session ────────────────────────────────────────────────
  flipSides:       'swap-horizontal',         // flip prompt/answer (legacy: glyphicon-refresh)
  cardBack:        'arrow-left-circle',       // previous card    (legacy: circle-arrow-left)
  cardSubmit:      'arrow-right-circle',      // submit / next    (legacy: circle-arrow-right)
  endSession:      'close',                   // end test
  keyboardHint:    'keyboard',
  speak:           'volume-high',             // P1 speak the answer

  // ── Feedback (chrome around the diff — the marks themselves are TEXT) ──
  answerCorrect:   'check-circle',
  answerWrong:     'close-circle',
  markingHelp:     'help-circle',             // "what do these marks mean?"

  // ── Library & sets ─────────────────────────────────────────────
  cardSet:         'cards',                   // a set             (legacy: glyphicon-th-list)
  currentSet:      'bookmark',                // the selected set
  setCreate:       'plus',                    // create a set      (legacy: glyphicon-plus)
  setRename:       'rename-box',
  setDuplicate:    'content-copy',            // P1
  setDelete:       'delete',                  // (legacy: glyphicon-trash)
  setEdit:         'pencil',                  // (legacy: glyphicon-pencil)
  setUse:          'check-circle',            // (legacy: glyphicon-ok-sign)
  search:          'magnify',
  sort:            'sort-variant',
  reorder:         'drag-horizontal-variant',

  // ── Progress ───────────────────────────────────────────────────
  trophy:          'trophy',                  // (legacy: glyphicon-gift)
  statTested:      'cards',
  statPassed:      'check-all',
  statFailed:      'close-circle',
  elapsed:         'timer',
  insights:        'chart-line',              // P1 (CAP-16)
  troubleWords:    'format-list-numbered',    // P1
  errorPattern:    'lightbulb-on',            // P1
  sessionHistory:  'history',                 // P1

  // ── Data ───────────────────────────────────────────────────────
  importFile:      'file-import',             // (legacy: glyphicon-open-file)
  exportFile:      'file-export',             // (legacy: glyphicon-save)
  pasteText:       'clipboard-text',          // P1 (CAP-17)
  share:           'share-variant',
  dataProblem:     'database-alert',          // quarantine banner

  // ── Settings & about ───────────────────────────────────────────
  settings:        'cog',                     // (legacy: glyphicon-cog)
  about:           'information',             // (legacy: glyphicon-info-sign)
  changelog:       'history',
  privacy:         'shield-lock',
  appearance:      'theme-light-dark',
  caseSensitivity: 'format-letter-case',
  quickTestSize:   'numeric',
  promptSide:      'swap-horizontal',
  haptics:         'vibrate',
  analytics:       'chart-box',
  voice:           'account-voice',           // P1
  contact:         'email',
  externalLink:    'open-in-new',
  version:         'tag',

  // ── Account & sync (P1, CAP-13) ────────────────────────────────
  account:         'account-circle',
  signOut:         'logout',
  syncOn:          'cloud-check',
  syncPending:     'cloud-sync',
  syncOff:         'cloud-off',

  // ── Generic ────────────────────────────────────────────────────
  back:            'arrow-left',
  close:           'close',
  overflow:        'dots-vertical',
  confirm:         'check',
  warning:         'alert',
  errorState:      'alert-circle',
  undo:            'undo',
} as const;

export type IconName = keyof typeof ICONS;
```

```tsx
// src/components/Icon.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICONS, IconName } from '@/theme/icons';

export function Icon({ name, size = 24, color, accessibilityLabel }: {
  name: IconName; size?: number; color: string; accessibilityLabel?: string;
}) {
  return (
    <MaterialCommunityIcons
      name={ICONS[name]}
      size={size}
      color={color}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no'}
    />
  );
}
```

**The diff marks are deliberately not in this map.** `∧`, `_`, `·`, `␣` and the
underlines are **text glyphs and drawn rules inside the monospace grid**. An
icon component in a character cell would break the mono advance width and
destroy the alignment that the whole feature depends on. See
[§3.2.3](#323-per-status-treatment--every-kind-has-24-non-colour-signals).

**Legacy glyphicon → MDI mapping** (Bootstrap 3 Glyphicons do not exist past
Bootstrap 3 — [REBUILD_SPEC §11](../REBUILD_SPEC.md)): every glyph the live app
uses is accounted for above in the trailing comments, except `glyphicon-remove`
(→ `close`) and `glyphicon-arrow-left` (→ `back`).

---

## 6. App assets & launcher icon

**The launcher icon is not being redesigned.** Kevin's mark already exists — a
black rounded square containing a white two-facet "V" — with vector source at
`hmwt_app/logo/Vocab_vector.pdf` and `Vocab.ai`. Generating a new Material glyph
would throw away the one piece of brand equity the product has. The icon skill
was therefore not used to *select* a glyph; the spec below is the production
recipe for the existing art.

| Expo asset | Size | Content | Notes |
|---|---|---|---|
| `assets/icon.png` | 1024 × 1024 | Black field `#0B0B0C`, white "V" at ~60 % of canvas | **Opaque — no alpha channel** (`channels=3`) |
| `assets/adaptive-icon.png` | 1024 × 1024 | Transparent; white "V" centred at ~60 % (inside the 66 % Android safe zone) | Foreground layer |
| `assets/adaptive-icon-monochrome.png` | 1024 × 1024 | Transparent; solid-white "V" | Android 13+ themed icons |
| `assets/splash-icon.png` | 512 × 512 | The "V" mark | |
| `assets/favicon.png` | 48 × 48 | The "V" mark | Web |
| `assets/wordmark-light.png` / `.svg` | ≥ 1982 × 410 | Existing black script lockup | Home + About, light scheme |
| `assets/wordmark-dark.png` / `.svg` | ≥ 1982 × 410 | The same lockup recoloured to `color.paper.ink` (`#E8E4DC`) | Dark scheme. **A second export, not a tint filter** |

```jsonc
// app.json (excerpt)
{
  "expo": {
    "name": "Vocab Cards",
    "slug": "vocab-cards",
    "scheme": "vocabcards",
    "icon": "./assets/icon.png",
    "ios":     { "bundleIdentifier": "com.kszapps.vocabcards", "supportsTablet": true },
    "android": {
      "package": "com.kszapps.vocabcards",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "monochromeImage": "./assets/adaptive-icon-monochrome.png",
        "backgroundColor": "#0B0B0C"
      }
    },
    "web": { "bundler": "metro", "output": "static", "favicon": "./assets/favicon.png" }
  }
}
```

Contrast: white on `#0B0B0C` ≈ 20:1 ✓. The icon appears on a dev/prebuild/EAS
build, not in Expo Go. Whether to re-tint the mark from black to
`color.primary` is [§13 Q3](#13-open-questions) — the recommendation is **no**.

---

## 7. Accessibility contract

Applies to every screen and component. Source:
[CAP C3](../documentation/capability-spec.md#c3--accessibility) and
[PRD §9](../documentation/product-requirements.md#9-non-functional-requirements).

### 7.1 Colour and contrast

- WCAG AA: **4.5:1** for text under 18 sp, **3:1** for large text and UI.
  Verified pairs are tabulated in [`design-tokens.md` §2 and §4](./design-tokens.md).
- **Never colour alone**, anywhere. Enumerated:

| Meaning | Colour | Second signal | Third |
|---|---|---|---|
| Diff `wrong` | red | solid underline | bold + struck attempt |
| Diff `missing` | violet | dashed underline | insertion caret + wash |
| Diff `extra` | red | struck attempt | an empty correct cell + wash |
| Diff `transposed` | red *(shared with `wrong` by design)* | the **ribbon** — the only curve, and the only mark spanning two cells | bold + a pair-wide wash + an attempt that is marked but **not** struck |
| Missing space | violet | the `#` glyph itself (insert-a-space) | dashed underline + caret |
| Answer correct | green | `check-circle` icon | the word "Correct" |
| Current set | primary chip | the word "Current" | `bookmark` icon |
| Trophy locked | dimmed | no unlock date | a progress bar |
| Import failed | red | `alert-circle` | the failure reason in words |
| Sync error | red | `alert-circle` | the message in words |

- Verify the diff under **deuteranopia, protanopia and tritanopia** simulation
  using [`prototype.html`](./prototype.html), which renders the production
  tokens.

### 7.2 Touch targets

Minimum **48 × 48 dp** (the spec floor is 44; we use 48). Small icons get a
transparent expanded pressable, never a larger glyph. `hitSlop` is acceptable
only where layout genuinely forbids padding, and it must still reach 48.

### 7.3 Screen reader (VoiceOver / TalkBack)

- `accessibilityRole` + `accessibilityLabel` on **every** interactive element;
  `accessibilityState` for selected / disabled / checked.
- **No action is available only via a gesture.** Card reorder has Move up/Move
  down menu items; swipe-to-delete has an overflow item; sheet dismissal has a
  Close button.
- Reading order is DOM/tree order and matches the visual order on every screen.
- Live regions are **polite** everywhere. The diff announcement is specified in
  [§3.2.7](#327-screen-reader-announcement-us-d5).
- Modals set `accessibilityViewIsModal`; focus moves into the dialog and returns
  to the trigger on dismiss.

### 7.4 Dynamic type

- **`allowFontScaling` is never disabled.** Not in the diff, not in the mono
  cells, not in badges.
- Layouts reflow: two-up grids collapse to one-up above a ~130 % scale; button
  rows stack; the `Page` grows and its rule pitch grows with the line height.
- Tested at **200 %** on both platforms. Nothing truncates; nothing is clipped;
  no horizontal scrolling appears.
- The diff strip wraps between columns and never shrinks its font to fit.

### 7.5 The answer input (a11y + input attributes)

The single load-bearing input requirement
([PRD §9](../documentation/product-requirements.md#the-answer-input--a-specific-load-bearing-requirement)).
Applies to **`AnswerLine`** and to `RapidEntryForm`'s **answer** field:

```tsx
<TextInput
  autoCorrect={false}
  autoCapitalize="none"
  spellCheck={false}
  autoComplete="off"
  textContentType="none"
  importantForAutofill="no"        // Android
  keyboardType="default"
  returnKeyType="go"
  // web (react-native-web passes these through):
  // autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
  // data-gramm="false"  ← also disable third-party grammar extensions on web
/>
```

**Verify on a physical iOS device, a physical Android device, and desktop web.**
This regresses silently across framework upgrades and its failure destroys the
product's purpose. It belongs in the release checklist, not in a code comment.

### 7.6 Motion & reduce-motion

- `AccessibilityInfo.isReduceMotionEnabled()` is read once at mount and
  subscribed to. Every animated component takes a `reduceMotion` prop or reads a
  context.
- Under reduce-motion: transforms are dropped, cross-fades become instant, the
  diff nudge becomes a border emphasis, the progress bar jumps.
- **An animation that is disabled, interrupted, or fails must be structurally
  incapable of leaving any element invisible or unreachable.** This is the exact
  mechanism of the confirmed production soft-lock and it is a review criterion,
  not a guideline.

### 7.7 Keyboard (web)

Full keyboard operability with a visible focus indicator — [§10](#10-web-divergences).

---

## 8. Internationalization contract

English/US at launch, i18n-ready from the first commit
([CAP C4](../documentation/capability-spec.md#c4--internationalization-readiness)).

- **No hardcoded user-facing strings.** Every string is a key in
  `src/i18n/en-US.json`. Keys are namespaced by screen: `home.*`, `session.*`,
  `diff.*`, `results.*`, `trophies.*`, `settings.*`, `import.*`, `about.*`.
- **ICU pluralisation**, never a ternary: `{count, plural, one {# card} other {# cards}}`.
- **No sentence concatenation.** The diff announcement, the trouble-word
  patterns and the import report are all full ICU messages with parameters.
  A sentence built from fragments cannot be translated.
- `Intl.DateTimeFormat` / `Intl.NumberFormat` for every date and number
  (trophy thresholds, counters, elapsed time).
- **Hermes ships an incomplete `Intl`.** Any `Intl` API used — `Segmenter`
  above all — must be polyfilled and **verified on a physical device**, not only
  on web where it works and then throws at render time on device
  ([spelling-diff-spec.md §5](../documentation/spelling-diff-spec.md#5-unicode-handling)).
- Layouts tolerate **30–40 % text expansion**. No fixed-width text containers,
  no truncation as a layout strategy.
- **RTL-friendly:** logical `start`/`end` properties everywhere, never
  `left`/`right`. Two deliberate exceptions, documented here:
  - The **paper margin rule** stays on the writing-start side, which flips with
    the layout direction. It is a writing affordance, not decoration.
  - The **diff strip** always renders in the *content's* direction. A diff of an
    Arabic word must read right-to-left even inside an English UI. Column order
    follows the segment array; the array is already in content order.
- Stored identifiers (trophy ids, setting keys, format names, error-pattern
  kinds) are **language-independent and stable**. Only display names translate.
- Card content is arbitrary user text in any script — see the Unicode rules in
  [spelling-diff-spec.md §5](../documentation/spelling-diff-spec.md#5-unicode-handling).
  A `DiffSegment.char` may be a multi-code-unit grapheme cluster; `DiffCell`
  renders it as one cell and **must not** index into it.

---

## 9. Dark-mode contract

- **Two complete schemes, designed together.** No screen has a light-only
  treatment. Every colour in every component comes from a semantic role that
  exists in both.
- Driven by the **Appearance** setting (`system` / `light` / `dark`, default
  `system`, **device-local**). Applies immediately, no restart
  ([CAP-10](../documentation/capability-spec.md#cap-10--settings--preferences-p0)).
- `StatusBar` style and the Android navigation bar follow the scheme.
- **The Page in dark mode is a designed surface, not an inversion.** The three
  rules — page is the warmest/most-lit object, rule polarity flips while rule
  contrast stays sub-threshold, and no grain — are in
  [`design-tokens.md` §3.3](./design-tokens.md).
- **Shadows do not exist in dark mode.** `elevation.page` resolves to `none`;
  page separation comes from `color.paper.edge` plus the page being lighter than
  the desk (1.23:1).
- Every diff token is contrast-verified **against the dark paper surface**, not
  against `color.surface`: 8.86–9.09:1, all ✓
  ([`design-tokens.md` §4](./design-tokens.md)).
- **The wordmark is a second export in dark mode**, never a tinted black PNG
  ([§6](#6-app-assets--launcher-icon)).
- Images and illustrations: there are none besides the wordmark, deliberately —
  a raster that needs a dark variant is a maintenance liability.
- The prototype's light/dark toggle is the review surface; both schemes are
  checked there before implementation.

---

## 10. Web divergences

Web is not a port — it is the origin the returning users are on
([PRD §9](../documentation/product-requirements.md#platforms)). Documented here
rather than in a separate folder because the divergences are few and local.

| Concern | Web behavior |
|---|---|
| **URLs** | Expo Router serves real paths (`/set/abc`, `/session`). Deep links and browser Back work. The legacy app used hash routes; a redirect map from `#/loader`, `#/about`, `#/creator`, `#/tester/:id` to the new paths should ship with the web build so old bookmarks resolve. |
| **Legacy migration** | The web build **must** deploy to the `vocabcards.com` origin — that is what makes the automatic `localStorage` adoption possible ([CAP-8](../documentation/capability-spec.md#cap-8--legacy-import--migration-p0)). This is a design-relevant constraint because Screen 16's whole reason to exist is reporting that migration. |
| **Hover** | Rows, buttons and diff cells get an `on-surface` 8 % state layer on hover. Hover is **never** the only way to reveal an action; the ⋮ button is always visible, not hover-revealed. |
| **Focus ring** | A 2 dp `color.primary` outline at 2 dp offset on every focusable element (`:focus-visible`). The `AnswerLine` shows it *in addition to* its thickened baseline rule. Never `outline: none`. |
| **Keyboard** | The whole drilling loop is operable without a mouse: `Enter` submits, `Esc` opens the end-test confirm, `←`/`→` are **not** bound (they belong to the text field). In the editor, `Tab` moves hint → answer and `Enter` saves-and-advances. Dialogs trap focus and close on `Esc`. |
| **Wide viewports** | Content is centred in a **max-width 720 dp** column; the `Page` never stretches past it. At ≥ 1024 dp the library uses a two-column set grid. The session screen keeps the single centred column at every width — a full-width diff strip would be unreadable. |
| **Paper texture** | CSS `repeating-linear-gradient` instead of SVG ([`design-tokens.md` §9.3](./design-tokens.md)). Identical output, one fewer node. |
| **Haptics** | No-op. Never a fallback vibration. |
| **Fonts** | Inter and JetBrains Mono load via `expo-font`; `font-display: swap` with the system fallback so first paint is never blocked. |
| **Offline** | Installable PWA with a service worker. The current app is 100 % offline-capable and **that property must not be lost**. |
| **Grammar extensions** | `data-gramm="false"` and `data-enable-grammarly="false"` on the answer input — a browser extension that corrects spelling defeats the product. |
| **Text selection** | Enabled on the diff strip (users copy the correct spelling), disabled on decorative rules. |

---

## 11. Dependencies & project setup

### 11.1 Packages

```bash
npx create-expo-app vocab-cards --template blank-typescript

# Navigation (file-based, real URLs on web)
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar

# Material Design 3
npm install react-native-paper react-native-vector-icons
npx expo install @expo/vector-icons react-native-gesture-handler react-native-reanimated

# Fonts
npx expo install expo-font @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono

# The paper surface (native pattern fill) + sheets
npx expo install react-native-svg
npm install @gorhom/bottom-sheet

# Storage, files, feedback
npx expo install @react-native-async-storage/async-storage \
  expo-document-picker expo-file-system expo-sharing expo-haptics \
  expo-localization

# i18n
npm install intl-messageformat          # or i18n-js + intl-messageformat
npm install @formatjs/intl-segmenter    # Hermes Intl.Segmenter polyfill — VERIFY ON DEVICE

# Colour generation (dev only)
npm install -D @material/material-color-utilities@0.3.0

# P1 only
npx expo install expo-speech            # CAP-14 dictation
npm install firebase                    # CAP-13 sync + CAP-19 analytics
```

| Package | Why it is required |
|---|---|
| `react-native-paper` | The M3 component library this spec builds on. Not optional. |
| `expo-router` | Real URLs on web; the app must serve `vocabcards.com` |
| `react-native-svg` | The `Page` rule pattern on native |
| `@gorhom/bottom-sheet` | Paper has no bottom sheet |
| `react-native-reanimated` | Required by `@gorhom/bottom-sheet`; also drives `motion.*` |
| `@expo-google-fonts/jetbrains-mono` | Glyph disambiguation in the diff — a correctness requirement ([`design-tokens.md` §5.2](./design-tokens.md)) |
| `@formatjs/intl-segmenter` | Grapheme clusters on Hermes ([spelling-diff-spec.md §5](../documentation/spelling-diff-spec.md#5-unicode-handling)) |
| `expo-haptics` | `haptics.*` tokens |

**Not used, deliberately:** no animation library beyond Reanimated, no chart
library at P0 (the P1 accuracy trend is a simple SVG sparkline), no icon set
other than MaterialCommunityIcons, no CSS-in-JS layer, no Bootstrap, no jQuery.

### 11.2 Font loading

```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

const [loaded] = useFonts({
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold,
});
// Render with the system fallback while loading — never block first paint.
// The type scale applies either way; only the metrics differ.
```

### 11.3 Theme provider

```tsx
// app/_layout.tsx
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/theme/paperTheme';
import { usePreferences } from '@/state/preferences';

const system = useColorScheme();
const { appearance } = usePreferences();          // 'system' | 'light' | 'dark'
const scheme = appearance === 'system' ? system : appearance;
const theme = scheme === 'dark' ? darkTheme : lightTheme;

<PaperProvider
  theme={theme}
  settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
>
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="session" options={{ presentation: 'modal', gestureEnabled: false }} />
  </Stack>
</PaperProvider>
```

`lightTheme` / `darkTheme` are built from `MD3LightTheme` / `MD3DarkTheme` plus
`design-tokens.md` §13, with `colors.page`, `colors.diff`, `spacing`, `radii`,
`motion`, `haptics` and `pageSurface` attached — see
[`design-tokens.md` §14](./design-tokens.md).

### 11.4 `app.json`

See [§6](#6-app-assets--launcher-icon) for the icon block. Additionally:

```jsonc
{
  "expo": {
    "userInterfaceStyle": "automatic",   // required for the dark-mode setting to work
    "splash": { "image": "./assets/splash-icon.png", "backgroundColor": "#FCF8EE",
                "dark": { "backgroundColor": "#121316" } },
    "plugins": ["expo-router", "expo-font", "expo-localization"]
  }
}
```

---

## 12. Acceptance criteria

Observable behaviours that define "done" for the design. Each maps to a
capability or story; verify against [`prototype.html`](./prototype.html) and the
screen specs.

### AC-Notecard — the baseline grid

The headline art direction ([§3.1](#31-page--the-notecard-custom)). Numbered
N1–N9 so they do not renumber the list below.

- **N1.** The drill card reads as a ruled index card: an unruled header zone, a
  **heavier, warm, colour-differentiated** header rule, evenly spaced writing
  rules below it, a vertical margin rule, rounded corners and a visible
  card-stock thickness along the bottom edge.
- **N2.** **The prompt's baseline sits exactly on a writing rule.** Not near it,
  not centred in the band.
- **N3.** **The answer's baseline sits exactly on a writing rule**, and that
  rule — not a separate underline — is what thickens to `color.primary` on focus
  and to `color.diff.wrong` after a wrong submission. There is no floating
  underline anywhere on a `Page`.
- **N4.** A **wrapped two-line prompt** occupies two bands and **both** baselines
  land on rules.
- **N5.** In the feedback state, the attempt row and the correct row occupy
  **two adjacent bands** and **both** baselines land on rules
  ([§3.2.2.1](#3221-why-two-adjacent-rule-bands-and-not-interlinear)).
- **N6.** Diff marks are visibly distinct from the writing rules — 3 dp lower,
  2 dp thick, saturated — and a marked cell does not interrupt the writing rule
  ([§3.2.2.2](#3222-marks-vs-rules--they-must-not-collide)).
- **N7.** **All of N2–N6 still hold at OS font scales 1.0, 1.3 and 2.0.**
  Screenshot all three and check every baseline against its rule. The rule pitch
  must be observed to *grow* with the text, never to stay fixed.
- **N8.** Body content — header zone included — starts to the right of the
  margin rule, giving the card a single vertical text edge.
- **N9.** All of the above hold in **dark mode**, with the rules lighter than the
  card and no shadow.

### AC-Diff — the spelling-feedback moment ([CAP-5](../documentation/capability-spec.md#cap-5--feedback-presentation-p0))

1. A wrong submission renders a `DiffStrip` **with no tap and no delay**; the
   correct spelling is fully readable through the marking.
2. All **five** statuses are visually distinguishable **in greyscale**.
   Screenshot the six worked examples in
   [§3.2.9](#329-worked-examples-all-from-the-verified-ground-truth-vectors),
   desaturate, and confirm each is still identifiable.
3. `wrong` and `missing` differ by **mark shape** (solid vs dashed), not only by
   hue.
3a. **`receive` typed as `recieve` renders as ONE swap**, not as two separate
   errors: two `transposed` cells bound by the ribbon, with the typed letters
   unstruck in the attempt row. The ribbon spans both cells as a single stroke.
3b. The ribbon does **not** run parallel to any writing rule, does not obscure
   either letter, and spans exactly the pair's two columns
   ([§3.2.3.1](#3231-rendering-the-transposed-pair)).
3c. **Swaps are grouped by `pairId`, never by adjacency.** Regression fixture:
   `receive` typed as `recieev` yields **four** consecutive `transposed`
   segments in **two** pairs — two ribbons, and two separate "You swapped…"
   sentences, not one.
4. `ice cream` typed as `icecream` shows a **visible, full-width marked cell**
   at the space position containing **`#`**. It is never whitespace, and it does
   not read as a hashtag.
5. `ice cream` typed as `ice  cream` shows an extra-space marker, not a silent
   pass.
6. `a` typed as `b` renders a single `missing` column (the `script.length === 1`
   special case), not a `wrong`.
7. An empty submission marks every character of the answer.
8. VoiceOver/TalkBack announce the correct spelling **letter by letter** with
   "space" spoken for a space, then up to 3 errors in plain language, then
   "and N more". Polite: typing the retry is not interrupted. A swap is
   announced **once** as *"You swapped the i and the e"* — never as two wrong
   letters — and counts as **one** error toward the cap of three.
9. Individual diff cells are not separately focusable by a screen reader.
10. Under deuteranopia / protanopia / tritanopia simulation, all **five**
    statuses remain identifiable. Note that `transposed` shares the `wrong` hue
    by design and is carried entirely by shape
    ([`design-tokens.md` §4](./design-tokens.md#4-color--the-spelling-diff-the-products-core-mechanic)).
11. At 200 % system font size, the strip wraps between columns; nothing
    truncates, nothing scrolls horizontally.
12. With reduce-motion on, the nudge is absent and the strip still appears
    immediately.
13. Turning `showAttempt` on adds the attempt row **without any other layout
    change** (US-D6 is a prop, not a redesign).
14. Submitting a >256-character answer produces a plain "try again" message and
    no strip, with no perceptible pause.
14a. **Adding transposition changed nothing else:** all 15 ground-truth vectors
    still produce byte-identical output to the plain-Levenshtein implementation
    ([§3.2.9](#329-worked-examples-all-from-the-verified-ground-truth-vectors)).
    This is a regression test, not a review step.

### AC-Session ([CAP-3](../documentation/capability-spec.md#cap-3--test-session-engine-p0))

15. The answer field is focused with the keyboard up **the instant** each card
    appears, on iOS, Android and web.
16. The keyboard's action key submits.
17. A wrong answer keeps the typed text **and selects it entirely**.
18. The progress bar does not move on a wrong attempt.
19. There is no skip, no reveal-answer and no "I was right" control anywhere.
20. Back on the **first** card does nothing. It never exits the session.
21. End test is always reachable, confirms when cards remain, and still produces
    a results screen.
22. Starting with no set, or a zero-card set, shows a specific message with a
    fix action, and **every control on the screen remains interactive**. Nothing
    disappears; no reload is needed.
23. Force-quitting an animation mid-transition (or enabling reduce-motion) never
    leaves any element invisible.
24. Autocorrect, autocapitalise, predictive text, spellcheck and autofill are
    all off in the answer field — verified on a physical device per platform.

### AC-Library ([CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0), [CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0))

25. The current set is marked with a chip **and** an icon **and** the word
    "Current".
26. Creating or importing a duplicate name opens `ConflictDialog` with Replace /
    Rename / Cancel; Replace names the card count that will be destroyed.
27. Deleting the current set leaves Home in a valid "no set selected" state with
    a working action.
28. Search filters as you type; sort offers name / recently used / card count.
29. The list stays smooth at 1 000 sets (virtualised, summary-index-backed).
30. Rapid entry returns focus to a blank Hint field after each save.
31. Leaving the editor with one field filled warns before discarding.
32. Card reorder is available from a menu as well as by drag.

### AC-Results & trophies ([CAP-6](../documentation/capability-spec.md#cap-6--session-results--missed-word-practice-p0), [CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0))

33. A results screen appears for **every** session, including those ended early.
34. It reports cards completed, first-try passes, wrong attempts and elapsed
    time.
35. Every missed card is listed with its answer and a compact rendering of its
    **first** diff.
36. "Practice missed words" starts a session containing only those cards, and is
    repeatable.
37. "Done" goes to Home by explicit navigation; Back from Results cannot re-enter
    the session.
38. The Trophies screen lists all 24 trophies with lock state, requirement,
    unlock date and progress to the next in each category.
39. An unlock toast is dismissible, appears once, and never covers the answer
    line mid-card.

### AC-Data ([CAP-8](../documentation/capability-spec.md#cap-8--legacy-import--migration-p0), [CAP-9](../documentation/capability-spec.md#cap-9--export--native-file-format-p0))

40. Selecting several `.cards` files imports **all** of them and reports a
    per-file outcome.
41. A failed item is reported with a reason and is never silently dropped.
42. Exporting a set in the legacy `.cards` format warns when data would be lost.
43. Unreadable stored data shows `QuarantineBanner` — the app still renders
    everything else, and nothing is deleted.

### AC-Settings & about ([CAP-10](../documentation/capability-spec.md#cap-10--settings--preferences-p0), [CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0))

44. Settings contains real, working controls for case sensitivity, quick-test
    size, default prompt side, appearance, haptics and analytics. It never says
    "no settings available".
45. Appearance applies immediately with no restart.
46. The version string appears once, derived from the build.
47. The privacy policy is reachable in-app and states local-only-by-default.

### AC-No-account ([CAP-13 §13.1](../documentation/capability-spec.md#131-the-optionality-constraint-p0--this-part-gates-the-launch-build))

48. There is **no** sign-in wall, no "sign in to continue", no signed-out empty
    state, and no badge or dot nagging toward an account, on any screen.
49. Every P0 feature works with the device in airplane mode from a cold start.

### AC-Accessibility (every screen)

50. All text meets WCAG AA in both schemes.
51. Every interactive element has a role and a label and is ≥ 48 × 48 dp.
52. No action is available only via a gesture.
53. Reading order matches visual order.
54. At 200 % font scale no screen truncates or clips.
55. Reduce-motion is honoured and nothing becomes invisible or unreachable.
56. On web, every focusable element shows a visible focus ring and the whole
    drilling loop is keyboard-operable.

### AC-Dark mode

57. Every screen has been reviewed in both schemes.
58. The paper surface in dark is the toned slate page — lighter than the desk,
    rules lighter than the page — not an inverted texture.
59. No shadow is used in dark mode; page separation comes from the edge hairline.
60. All diff tokens pass AA against the **dark paper surface**.

---

## 13. Open questions

Every one carries a recommendation so an implementer at 2 a.m. can proceed.
Items marked **awaiting Kevin** should be confirmed but must not block.

| # | Question | Recommendation | Status |
|---|---|---|---|
| Q1 | **Ship US-D6 (the user's own attempt row) at launch, or hold it to P1?** The PRD says P1 and calls the two-row layout "a real design problem worth giving the designer time on" ([PRD §10 Q6](../documentation/product-requirements.md#10-open-questions)). | **Ship it at launch, with `showAttempt` defaulting to `true`.** The two-row layout is solved here and costs nothing extra to render — it is the same column grid. It is Anki's single most-complained-about gap ([Competitor Analysis](../documentation/competitor-analysis.md#six-documented-weaknesses-in-ankis-implementation)) and it is the highest-leverage differentiator available for the price. If the loop feels slower in testing, flip the default to `false` — no other change. | **Awaiting Kevin** |
| Q2 | **`missing` in violet, or keep everything red like the live app?** Long-time users know red. | **Violet.** The five kinds are already separable by shape, so hue is redundancy, not the signal — but red-and-violet halves the time to read a mixed-error word. The change is additive: the correct spelling still reads the same way. Matches [spelling-diff-spec.md §11 Q1](../documentation/spelling-diff-spec.md#11-open-questions). | Recommended |
| Q3 | **Re-tint the launcher mark from black to `color.primary`?** | **No.** The black rounded-square "V" is the only brand equity the product has and it is on users' home screens today. Keep it. Re-tinting is a cheap change later if Kevin wants it. | **Awaiting Kevin** |
| Q4 | ~~Moving the ruled texture from the page background to the card.~~ | **RESOLVED — Kevin approved, 2026-08-08:** *"I think the texture off the page background and onto the card is good."* Recorded as a decision in [`design-tokens.md` §0](./design-tokens.md#0-the-two-layer-system-in-one-paragraph). Kevin added the follow-on requirement that the card read as a **notecard** with **text sitting on the rules** — designed in [§3.1](#31-page--the-notecard-custom) and [`design-tokens.md` §9](./design-tokens.md#9-the-notecard--construction-spec). | ✅ Closed |
| Q4a | **Where does the field label sit** — on a rule, or in the header zone? | **Header zone, and it is the only text on a card not on a rule.** Above the header rule is what is *printed* on the card; below it is what you *write*. One exception, stated once, so the invariant below the rule is total. | Recommended |
| Q4b | **`paper.rule` contrast raised from 1.30 → 1.55:1.** | Correct, and it had to change: the original figure assumed text floating *over* the rules. A baseline rule touches only glyph bottoms, so it interferes far less and can afford more presence — which the notecard reading needs. Reasoning recorded at [`design-tokens.md` §3.3](./design-tokens.md#33-the-three-rules-that-make-dark-mode-paper-work). | Recommended |
| Q5 | **No bottom tab bar** (assumption A2). | **Keep it.** One primary task; Trophies stay visible via `CounterStrip`. Revisit only if the P1 Insights screen makes four destinations feel buried. | Recommended |
| Q6 | **The wordmark needs an SVG export** and a light-ink dark-mode export. Only a black PNG and an Illustrator/PDF source exist today. | Export both from `hmwt_app/logo/Vocab_vector.pdf` before the first build. Until then the PNG is acceptable at 2× on the two screens that use it. | **Blocked on asset work** |
| Q7 | **Starter-set content** (4 sets × 30–50 cards) must be independently compiled or public domain ([CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0)). Not a design deliverable. | Write it as a data file, not in code, so a locale can replace it. The design assumes 4 sets and reads their names from the data. | Out of scope here |
| Q8 | **A "session in progress" is not resumable across a cold start** ([CAP-3](../documentation/capability-spec.md#cap-3--test-session-engine-p0)). Should the design warn? | **No warning.** Adding one would advertise a limitation nobody hits. The modal presentation already makes accidental exit hard. | Recommended |
| Q9 | **Quick-test button label** — does it read "10 Cards" (heritage) or follow the setting ("20 Cards")? | **Follow the setting.** A button that says 10 and draws 20 is a lie. Heritage is preserved for the default value, not for a fixed string. | Recommended |
| Q10 | ~~**Naming**~~ **RESOLVED 2026-08-08 — Kevin confirmed *Vocab Cards*.** Store title *"Vocab Cards: Spelling Practice"* (30 chars), ids `com.kszapps.vocabcards`. The existing script wordmark and **V** glyph are retained — a decisive factor in keeping the name ([naming-research.md](../documentation/naming-research.md), [capability-spec Q10](../documentation/capability-spec.md#open-questions-capability-level)). | Confirm as written. The design uses these strings in `app.json` and the About screen; changing them is a find-and-replace. | **Awaiting Kevin** |
