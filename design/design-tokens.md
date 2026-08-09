# Design Tokens — Vocab Cards

**Version:** 1.0 (2026-08-08)
**Owner:** Kevin Stoner
**Seed color:** `#305CA6` — "ink blue"
**Fonts:** Inter (UI) · JetBrains Mono (answer + diff)
**Base grid:** 4 dp
**UI library:** Material Design 3 via **react-native-paper** 5.x

> This file is the **single source of truth for every design value in the app.**
> `spec.md` and `spec-screens.md` reference tokens by name and never restate a
> raw value. If a value needs to change, it changes here.

Related: [`README.md`](./README.md) · [`spec.md`](./spec.md) ·
[`spec-screens.md`](./spec-screens.md) · [`prototype.html`](./prototype.html)
Product source: [Capability Spec](../documentation/capability-spec.md) ·
[PRD](../documentation/product-requirements.md) ·
[Spelling Diff Spec](../documentation/spelling-diff-spec.md) ·
[REBUILD_SPEC §11](../REBUILD_SPEC.md)

---

## 0. The two-layer system in one paragraph

Vocab Cards has **two surface families**, and every token belongs to exactly one
of them.

| Layer | What it is | Tokens | Where it appears |
|---|---|---|---|
| **Chrome** | Material Design 3, expressed with restraint. App bars, lists, dialogs, sheets, settings, trophies, import/export. | §1–§2 (`color.*` M3 roles) | Everywhere that is *not* a card |
| **Page** | **The notecard.** A ruled 3 × 5 index card — header zone, warm header rule, writing rules, margin rule, card-stock thickness — that the user reads and **writes on**, with every line of text sitting on a rule. | §3 (`color.paper.*`), §4 (`color.diff.*`), §9 (notecard construction + the baseline-grid contract) | The flashcard prompt, the answer line, the spelling-feedback strip, the card editor's card, and the missed-word rows |

The two never blend. A Page never carries a Material state-layer wash, and
Chrome never carries a rule line. This is what makes the product's personality
legible instead of decorative.

**Why the ruled texture moved from the backdrop to the card.
Approved by Kevin, 2026-08-08.** In the live app the ruled paper is the *page
background* and cards float on it as plain white panels
([REBUILD_SPEC §11](../REBUILD_SPEC.md)). Here it is inverted: the desk is
plain, the **card** is the ruled page. Three reasons:

1. The rules can only do real work — sit a baseline under written text — if
   they belong to the same box as the text. As a full-screen backdrop they run
   behind list rows, app bars and buttons at unrelated pitches, which is noise.
2. It removes the texture from ~80 % of the app's pixels, which is where the
   performance and legibility cost lives.
3. It makes "the card" a physical object — and once the rules belong to the
   card, they can carry its text, which is the thing that turns a textured panel
   into a **notecard** (§9).

The warm cream, the rule colour, the soft grey shadow, the black ink and the
red-and-green error/correct pair are all carried forward from the live app
unchanged in spirit — see §3.4.

---

## 1. Color — Light Scheme (Material chrome)

Generated with **`@material/material-color-utilities` v0.3.0** from
`CorePalette.of(argbFromHex('#305CA6'))`, mapped to the Material 3 (2023) role →
tone table. These are real generated values, **not** hand-approximations.
Regenerating from the same seed reproduces them exactly; the generator script is
reproduced in §12.

| Token | Hex | Usage |
|---|---|---|
| `color.primary` | `#305DA8` | Primary buttons, FAB, active indicators, input focus rule |
| `color.on-primary` | `#FFFFFF` | Content on primary |
| `color.primary-container` | `#D8E2FF` | Tonal buttons, selected chips, "current set" marker |
| `color.on-primary-container` | `#001A41` | Content on primary container |
| `color.secondary` | `#565E71` | Secondary/supporting UI |
| `color.on-secondary` | `#FFFFFF` | Content on secondary |
| `color.secondary-container` | `#DBE2F9` | Filter chips, secondary tonal surfaces |
| `color.on-secondary-container` | `#131B2C` | Content on secondary container |
| `color.tertiary` | `#715574` | Accent moments (trophy highlights) |
| `color.on-tertiary` | `#FFFFFF` | Content on tertiary |
| `color.tertiary-container` | `#FBD7FC` | Unlocked-trophy tile background |
| `color.on-tertiary-container` | `#29132D` | Content on tertiary container |
| `color.error` | `#BA1A1A` | Destructive actions, validation errors |
| `color.on-error` | `#FFFFFF` | Content on error |
| `color.error-container` | `#FFDAD6` | Error banners, quarantine notices |
| `color.on-error-container` | `#410002` | Content on error container |
| `color.background` | `#FAF9FD` | Root background |
| `color.on-background` | `#1B1B1F` | Text on background |
| `color.surface` | `#FAF9FD` | Default screen background |
| `color.on-surface` | `#1B1B1F` | Primary text/icons |
| `color.surface-variant` | `#E1E2EC` | Variant fills |
| `color.on-surface-variant` | `#44474F` | Secondary text, inactive icons |
| `color.outline` | `#74777F` | Input borders, focus rings |
| `color.outline-variant` | `#C4C6D0` | Dividers |
| `color.surface-dim` | `#DBD9DD` | Dimmed surface |
| `color.surface-bright` | `#FAF9FD` | Brightest surface |
| `color.surface-container-lowest` | `#FFFFFF` | Cards on a surface background |
| `color.surface-container-low` | `#F5F3F7` | App bar background |
| `color.surface-container` | `#EFEDF1` | Card backgrounds, dialogs |
| `color.surface-container-high` | `#E9E7EC` | **The "desk"** — backdrop behind a Page (§3) |
| `color.surface-container-highest` | `#E3E2E6` | Progress track, highest fills |
| `color.inverse-surface` | `#303033` | Snackbar background |
| `color.inverse-on-surface` | `#F2F0F4` | Snackbar text |
| `color.inverse-primary` | `#ADC6FF` | Snackbar action text |
| `color.scrim` | `#000000` | Modal backdrop (use at 32 % alpha) |
| `color.shadow` | `#000000` | Shadow color |

## 2. Color — Dark Scheme (Material chrome)

| Token | Hex | Usage |
|---|---|---|
| `color.primary` | `#ADC6FF` | Primary actions |
| `color.on-primary` | `#002E68` | Content on primary |
| `color.primary-container` | `#0D448E` | Tonal buttons, selected states |
| `color.on-primary-container` | `#D8E2FF` | Content on primary container |
| `color.secondary` | `#BFC6DC` | Secondary/supporting UI |
| `color.on-secondary` | `#283041` | Content on secondary |
| `color.secondary-container` | `#3F4759` | Secondary tonal surfaces |
| `color.on-secondary-container` | `#DBE2F9` | Content on secondary container |
| `color.tertiary` | `#DEBCDF` | Accent moments |
| `color.on-tertiary` | `#402843` | Content on tertiary |
| `color.tertiary-container` | `#583E5B` | Unlocked-trophy tile background |
| `color.on-tertiary-container` | `#FBD7FC` | Content on tertiary container |
| `color.error` | `#FFB4AB` | Destructive actions |
| `color.on-error` | `#690005` | Content on error |
| `color.error-container` | `#93000A` | Error banners |
| `color.on-error-container` | `#FFDAD6` | Content on error container |
| `color.background` | `#121316` | Root background |
| `color.on-background` | `#E3E2E6` | Text on background |
| `color.surface` | `#121316` | **The "desk"** in dark — backdrop behind a Page |
| `color.on-surface` | `#E3E2E6` | Primary text/icons |
| `color.surface-variant` | `#44474F` | Variant fills |
| `color.on-surface-variant` | `#C4C6D0` | Secondary text, inactive icons |
| `color.outline` | `#8E9099` | Input borders, focus rings |
| `color.outline-variant` | `#44474F` | Dividers |
| `color.surface-dim` | `#121316` | Dimmed surface |
| `color.surface-bright` | `#38393C` | Brightest surface |
| `color.surface-container-lowest` | `#0D0E11` | Deepest layer |
| `color.surface-container-low` | `#1B1B1F` | App bar background |
| `color.surface-container` | `#1F1F23` | Card backgrounds, dialogs |
| `color.surface-container-high` | `#292A2D` | Elevated cards |
| `color.surface-container-highest` | `#343538` | Progress track |
| `color.inverse-surface` | `#E3E2E6` | Snackbar background |
| `color.inverse-on-surface` | `#303033` | Snackbar text |
| `color.inverse-primary` | `#305DA8` | Snackbar action text |
| `color.scrim` | `#000000` | Modal backdrop |
| `color.shadow` | `#000000` | Shadow color |

**Chrome contrast verification** (computed, WCAG 2.1 relative luminance):

| Pair | Light | Dark |
|---|---|---|
| `on-surface` / `surface` | 16.38:1 ✓ | 14.41:1 ✓ |
| `on-surface-variant` / `surface` | 8.86:1 ✓ | 10.91:1 ✓ |
| `outline` / `surface` (UI ≥3:1) | 4.27:1 ✓ | 5.84:1 ✓ |
| `on-primary` / `primary` | 6.45:1 ✓ | 7.73:1 ✓ |

---

## 3. Color — The Page (paper surface)

**Hand-authored, deliberately not derived from the seed.** The seed is a cool
blue; paper is warm. That warm/cool split is the whole point of the two-layer
system — the Page must read as a *different material*, not as another tint of
the same palette. These values are contrast-verified below.

### 3.1 Light — "cream index card under a desk lamp"

| Token | Hex | Role | CR vs page |
|---|---|---|---|
| `color.paper.surface` | `#FCF8EE` | The card stock itself | — |
| `color.paper.surface-shade` | `#EFE8D8` | The sheet *behind* the card (deck) and the card's own bottom-edge thickness | 1.15 |
| `color.paper.edge` | `#CFC7B4` | 1 dp hairline at the card boundary | 1.59 (1.37 vs desk) |
| `color.paper.rule` | `#BFCBDD` | **Writing rules** — the horizontal lines text sits on | **1.55** |
| `color.paper.rule-strong` | `#D19C94` | **Header rule** — 2 dp, warm, colour-differentiated from the writing rules | **2.23** |
| `color.paper.margin` | `#DFB3AC` | The vertical margin rule (left inset) | 1.77 |
| `color.paper.ink` | `#1B1B1F` | Card text — the "written" content | 16.19 ✓ |
| `color.paper.ink-variant` | `#4A4A52` | Labels and secondary text on the card | 8.28 ✓ |
| `color.paper.desk` | alias → `color.surface-container-high` (`#E9E7EC`) | Backdrop the card sits on | 1.16 |

### 3.2 Dark — "toned card under low light" (**not** an inverted texture)

| Token | Hex | Role | CR vs page |
|---|---|---|---|
| `color.paper.surface` | `#23262C` | The card stock — deliberately **lighter** than the desk | — |
| `color.paper.surface-shade` | `#1C1F24` | Deck sheet + bottom-edge thickness | 1.09 |
| `color.paper.edge` | `#3B414D` | 1 dp hairline at the card boundary | 1.48 (1.81 vs desk) |
| `color.paper.rule` | `#3C434F` | **Writing rules** — **polarity flips**: lighter than the card | **1.52** |
| `color.paper.rule-strong` | `#6A4340` | **Header rule** — 2 dp, warm | **1.80** |
| `color.paper.margin` | `#5E3C3A` | Vertical margin rule | 1.58 |
| `color.paper.ink` | `#E8E4DC` | Card text — warm off-white, not pure white | 11.96 ✓ |
| `color.paper.ink-variant` | `#B4AFA6` | Labels and secondary text | 6.95 ✓ |
| `color.paper.desk` | alias → `color.surface` (`#121316`) | Backdrop | 1.23 |

### 3.3 The three rules that make dark-mode paper work

This is the design problem, answered explicitly rather than left to
implementation:

1. **The page is always the warmest, most-lit surface in the scene.** In light
   it is warmer *and* brighter than the cool grey desk; in dark it is warmer
   *and* brighter than the near-black desk. The metaphor survives because a page
   under a lamp is a lit object in both cases. Inverting the texture (dark page,
   dark rules) reads as noise, not paper, and a chalkboard would demand a chalk
   texture and a handwriting face — an accessibility non-starter (§5.4).
2. **Rule-line polarity flips; rule-line *contrast ratio* does not.** Light:
   writing rules are darker than the card at **1.55:1**; the header rule is
   **2.23:1**. Dark: writing rules are lighter than the card at **1.52:1**; the
   header rule is **1.80:1**. Both schemes sit far below the 3:1 UI threshold
   **on purpose** — a rule that passes a contrast check is a rule that has
   stopped being paper and started being a divider.

   > **Revised 2026-08-08, and here is why.** The first pass set the writing
   > rules at 1.30 / 1.37:1, on the assumption that text would *float over*
   > them. Under the baseline-grid contract (§9) text now sits **on** the rule:
   > the rule meets only the bottoms of the glyphs and never crosses a stem or a
   > counter. A baseline rule is intrinsically far less interfering than a
   > crossing rule, so the contrast budget could go **up** — and it needed to,
   > because at 1.30:1 the rules were too faint to read as a notecard at arm's
   > length. Raised to ~1.55:1 in both schemes, with the warm header rule and
   > margin rule pulled further forward still so the card's *structure* reads
   > before its *content* does.
3. **Grain is dropped in dark mode, and in light mode too** (§9.3). Grain is
   where paper textures go wrong on cheap Android: it is a raster, it bands
   badly on dark surfaces at 8-bit, and it moirés when scrolled at fractional
   DPI. The paper reads as paper from hue + rules + edge + shadow alone.

### 3.4 Heritage mapping — what carried over from the live app

| Live app ([REBUILD_SPEC §11](../REBUILD_SPEC.md)) | Rebuild token | Change |
|---|---|---|
| `img/linedpaper.png` tiled on `body` | `color.paper.rule` + `paper.rule-pitch`, drawn on the **card** | **Moved from backdrop to card — approved by Kevin, 2026-08-08.** Raster → procedural (§9.3), and the rules now carry the text rather than sitting behind the app |
| Panel background `white` | `color.paper.surface` `#FCF8EE` | Warmed; now the ruled card stock itself |
| Panel shadow `0 0 3px 1px lightgrey` | `elevation.page` | Softened, directional, tokenised |
| Button gradient `#ffffff → #dee8f9` | `color.primary` `#305DA8` (the seed **is** this blue, saturated) | Gradients dropped; M3 button variants instead |
| Button radius `15px` | `shape.large` (16 dp) | Effectively preserved |
| Error text `red` | `color.diff.wrong` / `color.diff.extra` | Preserved, contrast-corrected |
| Correct text `green` | `color.diff.correct` | Preserved, contrast-corrected |
| Progress track `#e0e2e5`, fill `black` | `color.surface-container-highest` / `color.primary` | **Deviation:** fill is ink-blue, not black — black-on-grey is heritage but reads as "disabled" in M3 and fails in dark |
| Modal scrim `rgba(0,0,0,0.5)` | `color.scrim` at 32 % | M3 standard |
| Script "Vocab Cards" wordmark | `asset.wordmark` (image, §11) | Preserved as an **image**, never as a font |

---

## 4. Color — The Spelling Diff (the product's core mechanic)

> Normative contract: [spelling-diff-spec.md §7](../documentation/spelling-diff-spec.md#7-presentation-contract).
> **Colour is never the only signal.** Every token below is paired with a
> non-colour mark defined in [`spec.md` §3.2](./spec.md). These tokens make the
> feedback *faster* to read for people who can see colour; they are never what
> makes it *possible* to read.

All values are contrast-checked **against `color.paper.surface`**, not against
`color.surface` — the diff only ever renders on a Page.

| Token | Light | Dark | Meaning | Light CR | Dark CR |
|---|---|---|---|---|---|
| `color.diff.correct` | `#146B3A` | `#7CD99E` | Answer accepted | 6.20:1 ✓ | 8.86:1 ✓ |
| `color.diff.wrong` | `#B3261E` | `#FFB4AB` | You typed a different character here | 6.16:1 ✓ | 8.93:1 ✓ |
| `color.diff.missing` | `#6A3CA6` | `#D9BCFF` | You left this character out | 7.05:1 ✓ | 9.09:1 ✓ |
| `color.diff.extra` | alias → `diff.wrong` | alias → `diff.wrong` | You typed a character that doesn't belong | — | — |
| `color.diff.transposed` | alias → `diff.wrong` | alias → `diff.wrong` | **You swapped these two characters** — see the hue note below | — | — |
| `color.diff.wrong-container` | `#FBE4E1` | `#4B2B29` | Cell wash behind an `extra` or a `transposed` pair | wash 1.15 | wash 1.21 |
| `color.diff.missing-container` | `#EFE6FB` | `#3B2E55` | Cell wash behind a `missing` | wash 1.14 | wash 1.23 |
| `color.diff.correct-container` | `#C8EBD5` | `#0F4527` | Wash behind a confirmed answer | — | — |
| `color.diff.void` | alias → `color.paper.rule` | alias → `color.paper.rule` | The "nothing belongs here" mark in the correct row |

**Hue choice, justified — and why there is no fourth hue.** `wrong` is red
(heritage) and `missing` is violet. Red and violet stay separable under
deuteranopia and protanopia (violet resolves toward blue while red resolves
toward dark yellow-brown); under tritanopia they converge somewhat, which is
exactly why each also carries a distinct **mark shape** — a solid underline for
`wrong`, a dashed underline plus an insertion caret for `missing`.

`transposed` deliberately **shares the red**, for two reasons. First, it *is* a
wrong-letter error — both characters are wrong where they sit — so it belongs to
the red family semantically. Second, it is already the most structurally
distinctive mark in the whole set: it is the only **curve**, and the only mark
that **spans two cells**. It needs hue least. Introducing a fourth hue would
push the palette into CVD-marginal territory (a teal would converge with the
violet under deuteranopia) to buy redundancy for the one mark that does not need
it. Fewer hues, carried harder by shape, is the stronger accessibility position.

Verify all three simulations against [`prototype.html`](./prototype.html), which
renders the real tokens.

### 4.1 The mark glyphs

The marks themselves are **text glyphs and drawn strokes inside the monospace
grid, never icons** — an icon would break the mono advance width and destroy the
column alignment the feature depends on.

| Mark | Glyph / stroke | Used for | Convention |
|---|---|---|---|
| `∧` | caret, in the attempt row's cell | `missing` — "insert here" | The proofreader's caret `‸` / `⁁`, the standard insertion mark |
| strike-through | 2 dp line through the attempt row's glyph | `wrong`, `extra` | The standard delete mark |
| `#` | in the correct row's cell, full character width | **`missing` where `char === ' '`** | **The standard proofreader's mark for "insert a space."** *(Kevin's decision, 2026-08-08 — replaces the live app's `_`, which was heritage rather than convention. Used **inline in the cell**; no margin-annotation layer.)* |
| `#` struck through | in the attempt row's cell | `extra` where `typed === ' '` | Delete a space |
| `·` | in the correct row's cell | `extra` — "nothing belongs here" | No direct convention; the descendant of the live app's `-` |
| **the ribbon** | an S-curve looping **over** the first cell and **under** the second | **`transposed`** | The proofreader's transpose mark (`tr` in the margin) |

**On `#` reading as a hashtag.** The risk is real and is handled by treatment,
not by changing the glyph: it renders at weight 700 in `color.diff.missing`
violet on a `diff.missing-container` wash with a dashed 2 dp mark beneath it,
and it appears as a single isolated cell *between* letters — a hashtag precedes
a word. Its two horizontal strokes could in principle echo the notecard's
writing rules; they do not, because the glyph sits at 6.16–9.09:1 against a card
whose rules sit at ~1.55:1, a 4× separation in contrast.

**Cell washes are intentionally sub-threshold** (1.14–1.23:1). They are a
peripheral "something happened here" cue for scanning, never the signal.

---

## 5. Typography

Two families, chosen for two different jobs. **Dynamic type is always on** —
never set `allowFontScaling={false}` anywhere in this app. *(The live app sizes
every font in `vh`/`vmin`, so a user who raises their system font size gets no
benefit at all — [REBUILD_SPEC §11](../REBUILD_SPEC.md). This is the specific
regression being designed out.)*

### 5.1 `font.ui` — **Inter**

`@expo-google-fonts/inter`. All Material chrome, plus card **hints/prompts**
(which are sentences and read best proportionally). Falls back to `System`
(SF Pro / Roboto) if loading fails; the scale still applies.

### 5.2 `font.mono` — **JetBrains Mono**

`@expo-google-fonts/jetbrains-mono`. Used **only** for the answer input, the
confirmed-answer echo, and the diff strip.

**This is a functional choice, not a stylistic one.** Monospace gives the
character-cell alignment the diff contract requires
([spelling-diff-spec.md §7.2 rule 3](../documentation/spelling-diff-spec.md#72-hard-rules)),
and JetBrains Mono is specifically drawn to disambiguate `l`/`I`/`1`, `0`/`O`
and `rn`/`m`. In an app whose entire purpose is telling a user which single
character they got wrong, glyph ambiguity is a correctness bug. Roboto Mono is
an acceptable substitute if bundle size ever forces it; the ambiguity trade-off
should be recorded if so.

### 5.3 Scale

| Token | Family | Size | Line height | Weight | Tracking | Usage |
|---|---|---|---|---|---|---|
| `type.display-large` | ui | 57 | 64 | 400 | −0.25 | Unused (reserved) |
| `type.display-medium` | ui | 45 | 52 | 400 | 0 | Results headline number |
| `type.display-small` | ui | 36 | 44 | 400 | 0 | Trophy count |
| `type.headline-large` | ui | 32 | 40 | 400 | 0 | Empty-state headings |
| `type.headline-medium` | ui | 28 | 36 | 400 | 0 | Screen hero titles |
| `type.headline-small` | ui | 24 | 32 | 400 | 0 | Section heroes |
| `type.title-large` | ui | 22 | 28 | 700 | 0 | App bar title, set name |
| `type.title-medium` | ui | 16 | 24 | 600 | +0.15 | List row primary |
| `type.title-small` | ui | 14 | 20 | 600 | +0.10 | Sub-section labels |
| `type.body-large` | ui | 16 | 24 | 400 | +0.50 | Body text |
| `type.body-medium` | ui | 14 | 20 | 400 | +0.25 | Secondary body |
| `type.body-small` | ui | 12 | 16 | 400 | +0.40 | Captions |
| `type.label-large` | ui | 14 | 20 | 500 | +0.10 | Buttons, tabs |
| `type.label-medium` | ui | 12 | 16 | 500 | +0.50 | Chips |
| `type.label-small` | ui | 11 | 16 | 500 | +0.50 | Badges |
| **Notecard-only variants** | | | | | | |
| `type.card-answer` | **mono** | **28** | **40** | 500 | +0.50 | **The grid-defining variant.** The answer the user writes on the card |
| `type.card-prompt` | ui | 28 | **40** | 400 | 0 | The hint. Drops to `card-prompt-small` above 80 chars |
| `type.card-prompt-small` | ui | 22 | **40** | 400 | 0 | Long prompts — smaller type, **same 40 dp band** |
| `type.diff-cell` | **mono** | 28 | **40** | 500 | +1.00 | Correct-answer row of the diff |
| `type.diff-attempt` | **mono** | 20 | **40** | 400 | +1.00 | The user's own attempt row (US-D6) — smaller type, **same band** |
| `type.diff-compact` | **mono** | 16 | **24** | 500 | +0.50 | Compact grid (results, insights): grid font size 16, pitch 24 |
| `type.paper-label` | ui | 12 | 16 | 500 | +0.50 | Field label — lives in the **header zone**, the one thing on a card not on a rule |

**Every line height in the notecard block is 40 dp — and that is the entire
point.** On a real card you write smaller or larger between the *same* printed
lines; you do not move the lines. So the rule pitch is fixed by
`type.card-answer` and every other variant keeps the same band, changing only
its glyph size. `type.diff-attempt` dropped from 22/32 → **20/40** for exactly
this reason. The per-size baseline correction that keeps them all landing on the
rules is §9.3.

---

## 6. Spacing

4 dp base grid.

```json
{ "spacing": { "0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32, "10": 40, "12": 48, "16": 64, "20": 80 } }
```

| Rule | Value |
|---|---|
| Screen horizontal padding | `spacing.4` |
| Page (card) internal padding | `spacing.5` horizontal, `spacing.6` vertical |
| Page margin-rule inset from the left edge | `spacing.10` (40 dp) |
| List row vertical padding | `spacing.3`; min row height 56 dp |
| Section header top margin | `spacing.6` |
| Gap between controls in a row | `spacing.3` |
| FAB inset from screen edge | `spacing.4` |
| Minimum touch target | **48 × 48 dp** (spec floor is 44; we use 48) |

---

## 7. Shape

```json
{ "shape": { "none": 0, "extra-small": 4, "small": 8, "medium": 12, "large": 16, "extra-large": 28, "full": 9999 } }
```

| Token | Applied to |
|---|---|
| `shape.extra-small` | Badges, diff cell washes |
| `shape.small` | Text fields, snackbars, chips |
| `shape.medium` | List cards, trophy tiles |
| `shape.large` | **The Page** (16 dp — matches the live app's 15 px button radius) |
| `shape.extra-large` | FAB, dialogs, bottom sheets |
| `shape.full` | Pills, avatars, icon-button state layers |

---

## 8. Elevation

M3 tonal elevation plus a **Page-specific level**, because a sheet of paper
casts a real, soft, slightly-offset shadow and an M3 card does not.

```json
{
  "elevation": {
    "level0": { "surface": "surface",                   "shadow": "none" },
    "level1": { "surface": "surface-container-low",     "shadow": "0 1px 2px rgba(0,0,0,.08), 0 1px 3px 1px rgba(0,0,0,.06)" },
    "level2": { "surface": "surface-container",         "shadow": "0 1px 2px rgba(0,0,0,.10), 0 2px 6px 2px rgba(0,0,0,.08)" },
    "level3": { "surface": "surface-container-high",    "shadow": "0 4px 8px 3px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.08)" },
    "level4": { "surface": "surface-container-highest", "shadow": "0 6px 10px 4px rgba(0,0,0,.10), 0 2px 3px rgba(0,0,0,.08)" },
    "page":   { "light": "0 2px 6px rgba(0,0,0,.10), 0 1px 1px rgba(0,0,0,.06)", "dark": "none" }
  }
}
```

| Level | Applied to |
|---|---|
| 0 | Screen surfaces, list rows |
| 1 | App bar, resting cards |
| 2 | Bottom sheets, menus |
| 3 | FAB resting, dialogs |
| 4 | FAB pressed |
| **page** | **The Page.** In light: the soft grey drop shadow, carried from the live app. In dark: **no shadow at all** — shadows are invisible on a near-black desk. Separation comes from `color.paper.edge` (1 dp hairline) plus the page being lighter than the desk. |

---

## 9. The notecard — construction spec

> **Art direction, Kevin, 2026-08-08:** *"I'd like it to look like a notecard,
> however I also really would like the lines of text to match up with the card
> background just how someone would write on a card."*
>
> The reference object is a **ruled 3 × 5 index card**. Two things follow, and
> both are contracts, not suggestions: the card must carry the *conventions* of
> a notecard (§9.1), and **every line of card text must have its baseline
> exactly on a writing rule, at every dynamic-type scale** (§9.2).

### 9.1 Anatomy

```
 ┌────────────────────────────────────────────┐ ← 1 dp color.paper.edge, shape.large
 │                                            │
 │   HINT                             3 / 10  │   HEADER ZONE — 1 rule pitch tall,
 │                                            │   UNRULED blank card stock.
 │═══════════════════════════════════════════ │ ← HEADER RULE  2 dp  paper.rule-strong
 │ ┆                                          │   (warm — colour-differentiated)
 │ ┆Extremely hungry                          │ ← baseline ON writing rule 1
 │ ┆──────────────────────────────────────────│   1 dp  color.paper.rule
 │ ┆                                          │
 │ ┆──────────────────────────────────────────│ ← writing rule 2   pitch = rule-pitch
 │ ┆ravenus▏                                  │ ← the answer, baseline ON rule 3
 │ ┆══════════════════════════════════════════│ ← rule 3 thickens to 2 dp primary on focus
 │ ┆                                          │
 │ ┆──────────────────────────────────────────│ ← writing rule 4
 │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← 3 dp paper.surface-shade = card thickness
 └────────────────────────────────────────────┘
   ↑ margin rule, 1 dp vertical, color.paper.margin, inset paper.margin-inset (40 dp)
     ALL content — header zone included — starts to its right (+ paper.margin-gutter)
```

**Two zones, and the header rule means something.** Above it is what is
*printed* on the card; below it is what you *write*. That is why the field label
lives above and the answer lives below, and it is why the answer's underline is
not a decoration — it is the writing rule the answer sits on.

| Part | Token | Notes |
|---|---|---|
| Card stock | `color.paper.surface` | Warm off-white |
| Corner | `shape.large` (16 dp) | Matches the live app's 15 px button radius |
| Edge | `color.paper.edge`, 1 dp | Physical boundary; carries separation in dark mode where there is no shadow |
| **Thickness** | `color.paper.surface-shade`, `paper.thickness` (3 dp) along the bottom inside edge | Reads as card stock depth rather than a printed panel |
| Deck | `paper.stacked` → a 4 dp `surface-shade` sliver behind and below | "A card from a stack" |
| **Header zone** | unruled, height = `paper.header-zone` (1 × `rule-pitch`) | Blank card stock, exactly as on a real ruled index card |
| **Header rule** | `color.paper.rule-strong`, `paper.header-rule-width` (2 dp) | Heavier **and** warm — differentiated from the writing rules on two axes |
| **Writing rules** | `color.paper.rule`, `paper.rule-width` (1 dp), every `rule-pitch` | Text baselines land exactly here |
| **Margin rule** | `color.paper.margin`, 1 dp vertical, inset `paper.margin-inset` (40 dp) | A real margin: content respects it |
| Aspect | min height **5 rule bands**; target **5 : 3** where the viewport allows | The 3 × 5 index card. On a phone the card grows taller as content demands rather than clipping |

### 9.2 The baseline-grid contract (the crux)

**Rule pitch is derived from the resolved line height of card text — never a
fixed pixel value — so the grid holds at every dynamic-type scale.**

```
paper.grid-font-size  = the font size that defines the grid
                        = type.card-answer size (28 sp), scaled by the OS font scale
paper.rule-pitch      = the RESOLVED line height of type.card-answer
                        = 40 dp × fontScale
```

Rules are drawn at `y = gridOrigin + k · rule-pitch`, `k = 0, 1, 2, …`, where

```
gridOrigin = headerZoneHeight + headerRuleWidth
           + rule-pitch / 2  +  0.362 × paper.grid-font-size
```

That second line is `baselineOffset` — the distance from the top of a line box
to its baseline — and **every rule is drawn exactly at a baseline.** Glyphs then
sit on the rule and descenders drop below it, which is what writing on a ruled
card looks like.

**Where `0.362` comes from.** A line box centres its glyph box, so
`baselineOffset(F, L) = (L − F·contentHeight)/2 + F·ascent = L/2 + F·(ascent − contentHeight/2)`.
For the two shipped families:

| Family | ascent | descent | content height | `ascent − content/2` |
|---|---|---|---|---|
| Inter | 0.969 em | 0.241 em | 1.210 em | **0.364** |
| JetBrains Mono | 1.020 em | 0.300 em | 1.320 em | **0.360** |

They agree to 0.004 em. **At 28 sp / 40 dp the two families share a baseline to
within 0.06 dp**, so an Inter hint and a JetBrains Mono answer land on the same
grid with no per-family adjustment. One constant covers both:

```ts
export const BASELINE_K = 0.362;
export const baselineOffset = (fontSize: number, lineHeight: number) =>
  lineHeight / 2 + BASELINE_K * fontSize;
```

**Making a differently-sized run land on the rules.** Every body run sets
`lineHeight = paper.rule-pitch` (or a whole multiple). A run whose font size is
not `grid-font-size` is nudged by

```ts
// Δ > 0 for text SMALLER than the grid size.
export const gridOffset = (fontSize: number) =>
  BASELINE_K * (GRID_FONT_SIZE - fontSize);
```

applied as `paddingTop: Δ` **plus** `marginBottom: −Δ`, so the run's total
advance stays an exact multiple of the pitch and the next line is still in
phase. At the base scale:

| Variant | Size | Δ (paddingTop / −marginBottom) |
|---|---|---|
| `type.card-answer`, `type.card-prompt`, `type.diff-cell` | 28 | **0 dp** |
| `type.card-prompt-small` | 22 | **+2.2 dp** |
| `type.diff-attempt` | 20 | **+2.9 dp** |
| `type.paper-label` (compact grids only) | 12 | **+5.8 dp** |

Ship it once as a `useGridOffset(fontSize)` hook and a `<GridText>` wrapper; no
screen does this arithmetic by hand.

**Multi-line runs are free.** Because `lineHeight === rule-pitch`, a wrapped
two-line prompt occupies exactly two bands and *both* baselines land on rules.
Nothing extra is required — this is why the pitch is defined as the line height
rather than as a number that happens to look right.

**Compact grids** (results missed-word cards, insights rows) set
`grid-font-size = 16` and therefore `rule-pitch = 24`. The contract is
identical; only the constants change.

### 9.2.1 Consequences the screens depend on

- **The answer input has no underline of its own.** Its writing rule *is* the
  paper rule beneath it, which thickens to 2 dp `color.primary` on focus and
  2 dp `color.diff.wrong` after a wrong submission. See `AnswerLine` in
  [`spec.md` §3.4](./spec.md#34-answerline--the-answer-input-custom).
- **Diff marks are drawn `paper.mark-offset` (3 dp) *below* the writing rule**,
  at 2 dp, in a saturated diff colour. Paper rule: 1 dp at ~1.55:1. Mark: 2 dp
  at ~6:1. They read as *the card's line* and *the teacher's pen*, which is
  exactly the relationship. A mark may cross a descender; so does a real
  proofreader's underline, and it stays legible because one stroke is horizontal
  and the other vertical.
- **The field label is the only text on a notecard not sitting on a rule.** It
  lives in the unruled header zone. That exception is deliberate and total:
  everything below the header rule is written content and every line of it is on
  a rule.

### 9.3 Tokens

```json
{
  "paper": {
    "grid-font-size": 28,
    "rule-pitch": "= resolved lineHeight of type.card-answer (40 dp × fontScale)",
    "baseline-k": 0.362,
    "rule-width": 1,
    "header-rule-width": 2,
    "header-zone": "= 1 × rule-pitch",
    "margin-width": 1,
    "margin-inset": 40,
    "margin-gutter": 12,
    "margin-enabled": true,
    "mark-offset": 3,
    "edge-width": 1,
    "thickness": 3,
    "stack-offset": 4,
    "min-bands": 5,
    "corner": "shape.large",
    "grain": "none"
  }
}
```

### 9.4 How the texture is achieved — and why it costs nothing

**Decision: procedural rules, zero raster assets, zero grain.**

| Concern | Answer |
|---|---|
| **Bundle size** | 0 bytes. There is no image. The live app ships a 77 KB `linedpaper.png`; this ships nothing. |
| **Tiling artifacts at arbitrary DPI** | Structurally impossible — the rules are drawn as vectors in device-independent units, so there is no tile and no seam at 1.5×, 2.75× or any other density. |
| **Low-end Android performance** | The rules are a **static, non-animated** background layer. Nothing about the page animates except its own opacity/translate on screen transitions, so the texture never re-rasterises mid-animation. No `will-change`, no `translateZ(0)` hacks are needed — the live app needed them because it animated textured elements ([REBUILD_SPEC §10.4](../REBUILD_SPEC.md)). |
| **Legibility** | The rule pitch is **locked to the resolved line height** of card text and every baseline lands on a rule (§9.2), so text sits *on* the rules instead of crossing them, at every dynamic-type scale. This is the single most important legibility decision in the notecard layer. |

**Implementation (native, iOS + Android):** one `react-native-svg` `<Svg>`
absolutely positioned inside the card body, containing a `<Defs><Pattern>` of
height `rule-pitch` with a single `<Line>` at its top edge, offset by
`gridOrigin`; plus one `<Line>` for the vertical margin rule and one 2 dp
`<Line>` for the header rule. One pattern fill = one draw call.
`react-native-svg` is already required for other work
([`spec.md` §11.1](./spec.md#111-packages)).

**Implementation (web):** the identical result from a CSS
`repeating-linear-gradient` on the card body's background — no SVG node at all.
Note `background-position-y` is the grid origin, which is what puts the rules on
the baselines:

```css
.notecard-body {
  --pitch:  40px;                                   /* resolved lineHeight of card text */
  --grid-fs: 28px;                                  /* paper.grid-font-size            */
  --baseline: calc(var(--pitch) / 2 + 0.362 * var(--grid-fs));   /* = 30.14px */

  background-image:
    linear-gradient(var(--paper-margin), var(--paper-margin)),   /* vertical margin */
    repeating-linear-gradient(to bottom,
      var(--paper-rule) 0 1px,                                   /* the writing rule */
      transparent       1px var(--pitch));
  background-size:     1px 100%, 100% 100%;
  background-position: var(--paper-margin-inset) 0,  0 var(--baseline);
  background-repeat:   no-repeat, repeat;
}
/* every body text run keeps the grid */
.gridline {
  line-height: var(--pitch);
  padding-top:   calc(0.362 * (var(--grid-fs) - var(--fs)));
  margin-bottom: calc(-0.362 * (var(--grid-fs) - var(--fs)));
}
```

**Rejected alternatives, recorded so they are not re-litigated:**

| Option | Why not |
|---|---|
| Tile `linedpaper.png` | 77 KB, seams at fractional DPI, cannot track dynamic type, and its rule pitch is fixed in pixels — so text could never sit on it |
| Per-rule `<View>` children | N layout nodes per card, re-measured on every reflow; worst option on low-end Android |
| Subtle gradient only, no rules | Loses the metaphor; the rule *rhythm* is what reads as a notecard |
| Add a grain/noise overlay | Banding on dark surfaces, moiré on scroll, and a raster asset — for an effect nobody notices at arm's length |
| Centre text in the rule band instead of on the baseline | Looks like a table, not like handwriting. The whole ask is that it reads as *written* |

### 9.5 When the notecard must degrade

- **Reduce-motion:** no change (nothing about the card animates).
- **Increased contrast / high-contrast mode:** set `paper.margin-enabled: false`,
  raise `color.paper.rule` to `color.outline-variant` and
  `color.paper.rule-strong` to `color.outline`. Widths stay 1 dp / 2 dp — the
  grid must not shift, or the baselines stop matching.
- **Content longer than the card:** the **body scrolls internally and the rules
  scroll with it**, because the rules belong to the content, not to the frame.
  The header zone and header rule stay pinned. A long prompt therefore reads as
  a card you are scrolling down, not as a card that broke.
- **Very large dynamic type (up to 200 %+):** `rule-pitch` is the resolved line
  height, so the rules grow with the text. The card simply has fewer, taller
  bands and every baseline still lands. Nothing clips, nothing truncates,
  nothing goes off-grid — this is the property the whole §9.2 contract exists to
  guarantee.
- **Flip (swapping prompt and answer sides):** the card does **not** rotate in
  3-D. The header-zone label and the body content cross-fade in place over
  `motion.flip` while the rules stay exactly where they are — the card is a
  fixed physical surface and only what is written on it changes. A 3-D flip
  would put the card edge-on, i.e. invisible, which is a state-carrying
  animation and is forbidden by §10.1.

---

## 10. Motion

```json
{
  "motion": {
    "duration": {
      "short1": 50, "short2": 100, "short3": 150, "short4": 200,
      "medium1": 250, "medium2": 300, "medium3": 350, "medium4": 400,
      "long1": 450, "long2": 500
    },
    "easing": {
      "standard":              "cubic-bezier(0.2, 0, 0, 1)",
      "standardDecelerate":    "cubic-bezier(0, 0, 0, 1)",
      "standardAccelerate":    "cubic-bezier(0.3, 0, 1, 1)",
      "emphasized":            "cubic-bezier(0.2, 0, 0, 1)",
      "emphasizedDecelerate":  "cubic-bezier(0.05, 0.7, 0.1, 1)",
      "emphasizedAccelerate":  "cubic-bezier(0.3, 0, 0.8, 0.15)"
    }
  }
}
```

| Transition | Token | Duration | Easing |
|---|---|---|---|
| Screen push / pop | `motion.nav` | `medium4` 400 | `emphasized` |
| Session open (modal) | `motion.session-open` | `medium3` 350 | `emphasizedDecelerate` |
| Bottom sheet open / close | `motion.sheet` | `medium3` / `medium2` | `emphasizedDecelerate` / `emphasizedAccelerate` |
| Dialog enter / exit | `motion.dialog` | `medium1` / `short4` | `standardDecelerate` / `standardAccelerate` |
| **Card advance (next card)** | `motion.card-advance` | `short4` 200 | `standard` |
| **Correct-answer confirm hold** | `motion.confirm-hold` | `medium2` 300 | — (a pause, not an animation) |
| **Diff appear** | `motion.diff-appear` | `short2` 100 | `standardDecelerate` |
| **Diff attention nudge** | `motion.diff-nudge` | `short3` 150 | `standard` |
| Progress bar advance | `motion.progress` | `medium1` 250 | `emphasizedDecelerate` |
| Trophy toast in / out | `motion.toast` | `short4` / `short3` | `standardDecelerate` |
| State-layer press | `motion.press` | `short2` 100 | `standard` |
| Flip (swap prompt side) | `motion.flip` | `medium2` 300 | `emphasized` |

### 10.1 The three motion laws for this app

These exist because the live app's most serious confirmed defect is an
animation-driven soft-lock
([PRD §6.14 defect 1](../documentation/product-requirements.md#614-inherited-defects-that-must-not-survive--p0)).

1. **Motion is decorative-only. It never carries state.** No animation may set
   `visibility`, `display`, `opacity: 0` as a resting value, mount/unmount a
   node, or gate navigation. Every animated property **starts and ends at
   identity**. If an animation is skipped, interrupted, throws, or is disabled,
   the UI is already in its correct final state.
2. **Validate, then navigate, then animate.** Never animate-then-navigate.
3. **Reduce-motion removes the animation, never the feedback.** Under
   `AccessibilityInfo.isReduceMotionEnabled()`, transforms are dropped and
   cross-fades collapse to instant; the diff nudge becomes a 100 ms border
   emphasis on the diff strip instead. Nothing becomes unreachable and nothing
   becomes silent.

### 10.2 What replaced the legacy animations

| Live app ([REBUILD_SPEC §10.3](../REBUILD_SPEC.md)) | Rebuild |
|---|---|
| `flipInX` / `flipOutX` on menu buttons | Removed. The home screen renders instantly. |
| `slideInRight` / `slideOutLeft` on the tester text | `motion.card-advance` — a 200 ms cross-fade + 8 dp horizontal translate on the prompt only, *inside* a Page that never moves |
| `slideBack` two-phase with nested `setTimeout`s | The same `motion.card-advance`, reversed. No timers drive visibility. |
| `shake` on a wrong answer | `motion.diff-nudge` — ±4 dp horizontal, 150 ms, on the diff strip only |
| `slideOutRight` on `done()` | Standard navigator dismiss |

---

## 11. Haptics

`expo-haptics`. Every call is gated on the **Haptics** preference
([CAP-10](../documentation/capability-spec.md#cap-10--settings--preferences-p0),
default On, device-local) *and* on the platform having a haptic engine — web is
a no-op.

| Event | Pattern |
|---|---|
| Correct answer | `notificationSuccess` |
| Wrong answer | `notificationError` |
| Trophy unlocked | `notificationSuccess` (fires once, with the toast) |
| Session complete | `impactMedium` |
| Destructive confirm (delete set/card) | `impactMedium` |
| Card advance | *none* — too frequent, becomes noise |
| Button press | *none* — leave it to the platform |

---

## 12. Brand assets

The wordmark and launcher mark **already exist** and are not being redesigned.
Source art lives in `hmwt_app/logo/`.

| Token | Source | Use |
|---|---|---|
| `asset.wordmark` | `hmwt_app/logo/Vocab_transparent.png` (1982 × 410) — script "Vocab Cards" + black rounded-square "V" | Home screen header, About screen. **Always an image; the script face is never used as a font** (§5.4 rationale). Needs an SVG re-export from `Vocab_vector.pdf` for crispness — see Open Questions in [`spec.md`](./spec.md). |
| `asset.mark` | `hmwt_app/logo/icon_transparent.png` (410 × 410) — the "V" glyph alone | App bar mark, launcher icon source |
| `asset.launcher` | Re-export from `hmwt_app/logo/Vocab_vector.pdf` at 1024 × 1024 | See [`spec.md` §6](./spec.md) for the exact Expo masters |

**Wordmark on a dark background:** the mark is solid black. In dark mode use a
recoloured export at `color.paper.ink` (`#E8E4DC`) — do **not** apply a CSS/RN
tint filter to the black PNG, and do not show black-on-black. Two exports,
selected by scheme.

---

## 13. Tokens as JSON

```json
{
  "seed": "#305CA6",
  "generator": "@material/material-color-utilities@0.3.0 · CorePalette.of(seed) · M3 2023 role→tone map",
  "color": {
    "light": {
      "primary": "#305DA8", "on-primary": "#FFFFFF",
      "primary-container": "#D8E2FF", "on-primary-container": "#001A41",
      "secondary": "#565E71", "on-secondary": "#FFFFFF",
      "secondary-container": "#DBE2F9", "on-secondary-container": "#131B2C",
      "tertiary": "#715574", "on-tertiary": "#FFFFFF",
      "tertiary-container": "#FBD7FC", "on-tertiary-container": "#29132D",
      "error": "#BA1A1A", "on-error": "#FFFFFF",
      "error-container": "#FFDAD6", "on-error-container": "#410002",
      "background": "#FAF9FD", "on-background": "#1B1B1F",
      "surface": "#FAF9FD", "on-surface": "#1B1B1F",
      "surface-variant": "#E1E2EC", "on-surface-variant": "#44474F",
      "outline": "#74777F", "outline-variant": "#C4C6D0",
      "surface-dim": "#DBD9DD", "surface-bright": "#FAF9FD",
      "surface-container-lowest": "#FFFFFF", "surface-container-low": "#F5F3F7",
      "surface-container": "#EFEDF1", "surface-container-high": "#E9E7EC",
      "surface-container-highest": "#E3E2E6",
      "inverse-surface": "#303033", "inverse-on-surface": "#F2F0F4",
      "inverse-primary": "#ADC6FF",
      "scrim": "#000000", "shadow": "#000000",
      "paper": {
        "surface": "#FCF8EE", "surface-shade": "#EFE8D8",
        "edge": "#CFC7B4", "rule": "#BFCBDD", "rule-strong": "#D19C94",
        "margin": "#DFB3AC",
        "ink": "#1B1B1F", "ink-variant": "#4A4A52",
        "desk": "alias:surface-container-high"
      },
      "diff": {
        "correct": "#146B3A", "correct-container": "#C8EBD5",
        "wrong": "#B3261E", "wrong-container": "#FBE4E1",
        "missing": "#6A3CA6", "missing-container": "#EFE6FB",
        "extra": "alias:diff.wrong", "transposed": "alias:diff.wrong",
        "transposed-container": "alias:diff.wrong-container",
        "void": "alias:paper.rule"
      }
    },
    "dark": {
      "primary": "#ADC6FF", "on-primary": "#002E68",
      "primary-container": "#0D448E", "on-primary-container": "#D8E2FF",
      "secondary": "#BFC6DC", "on-secondary": "#283041",
      "secondary-container": "#3F4759", "on-secondary-container": "#DBE2F9",
      "tertiary": "#DEBCDF", "on-tertiary": "#402843",
      "tertiary-container": "#583E5B", "on-tertiary-container": "#FBD7FC",
      "error": "#FFB4AB", "on-error": "#690005",
      "error-container": "#93000A", "on-error-container": "#FFDAD6",
      "background": "#121316", "on-background": "#E3E2E6",
      "surface": "#121316", "on-surface": "#E3E2E6",
      "surface-variant": "#44474F", "on-surface-variant": "#C4C6D0",
      "outline": "#8E9099", "outline-variant": "#44474F",
      "surface-dim": "#121316", "surface-bright": "#38393C",
      "surface-container-lowest": "#0D0E11", "surface-container-low": "#1B1B1F",
      "surface-container": "#1F1F23", "surface-container-high": "#292A2D",
      "surface-container-highest": "#343538",
      "inverse-surface": "#E3E2E6", "inverse-on-surface": "#303033",
      "inverse-primary": "#305DA8",
      "scrim": "#000000", "shadow": "#000000",
      "paper": {
        "surface": "#23262C", "surface-shade": "#1C1F24",
        "edge": "#3B414D", "rule": "#3C434F", "rule-strong": "#6A4340",
        "margin": "#5E3C3A",
        "ink": "#E8E4DC", "ink-variant": "#B4AFA6",
        "desk": "alias:surface"
      },
      "diff": {
        "correct": "#7CD99E", "correct-container": "#0F4527",
        "wrong": "#FFB4AB", "wrong-container": "#4B2B29",
        "missing": "#D9BCFF", "missing-container": "#3B2E55",
        "extra": "alias:diff.wrong", "transposed": "alias:diff.wrong",
        "transposed-container": "alias:diff.wrong-container",
        "void": "alias:paper.rule"
      }
    }
  },
  "typography": {
    "fontFamily": { "ui": "Inter", "mono": "JetBrainsMono" },
    "displayLarge":  { "family": "ui", "size": 57, "lineHeight": 64, "weight": "400", "tracking": -0.25 },
    "displayMedium": { "family": "ui", "size": 45, "lineHeight": 52, "weight": "400", "tracking": 0 },
    "displaySmall":  { "family": "ui", "size": 36, "lineHeight": 44, "weight": "400", "tracking": 0 },
    "headlineLarge": { "family": "ui", "size": 32, "lineHeight": 40, "weight": "400", "tracking": 0 },
    "headlineMedium":{ "family": "ui", "size": 28, "lineHeight": 36, "weight": "400", "tracking": 0 },
    "headlineSmall": { "family": "ui", "size": 24, "lineHeight": 32, "weight": "400", "tracking": 0 },
    "titleLarge":    { "family": "ui", "size": 22, "lineHeight": 28, "weight": "700", "tracking": 0 },
    "titleMedium":   { "family": "ui", "size": 16, "lineHeight": 24, "weight": "600", "tracking": 0.15 },
    "titleSmall":    { "family": "ui", "size": 14, "lineHeight": 20, "weight": "600", "tracking": 0.1 },
    "bodyLarge":     { "family": "ui", "size": 16, "lineHeight": 24, "weight": "400", "tracking": 0.5 },
    "bodyMedium":    { "family": "ui", "size": 14, "lineHeight": 20, "weight": "400", "tracking": 0.25 },
    "bodySmall":     { "family": "ui", "size": 12, "lineHeight": 16, "weight": "400", "tracking": 0.4 },
    "labelLarge":    { "family": "ui", "size": 14, "lineHeight": 20, "weight": "500", "tracking": 0.1 },
    "labelMedium":   { "family": "ui", "size": 12, "lineHeight": 16, "weight": "500", "tracking": 0.5 },
    "labelSmall":    { "family": "ui", "size": 11, "lineHeight": 16, "weight": "500", "tracking": 0.5 },
    "cardPrompt":      { "family": "ui",   "size": 28, "lineHeight": 40, "weight": "400", "tracking": 0 },
    "cardPromptSmall": { "family": "ui",   "size": 22, "lineHeight": 40, "weight": "400", "tracking": 0 },
    "cardAnswer":      { "family": "mono", "size": 28, "lineHeight": 40, "weight": "500", "tracking": 0.5 },
    "diffCell":        { "family": "mono", "size": 28, "lineHeight": 40, "weight": "500", "tracking": 1 },
    "diffAttempt":     { "family": "mono", "size": 20, "lineHeight": 40, "weight": "400", "tracking": 1 },
    "diffCompact":     { "family": "mono", "size": 16, "lineHeight": 24, "weight": "500", "tracking": 0.5 },
    "paperLabel":      { "family": "ui",   "size": 12, "lineHeight": 16, "weight": "500", "tracking": 0.5 }
  },
  "spacing": { "0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32, "10": 40, "12": 48, "16": 64, "20": 80 },
  "shape": { "none": 0, "extra-small": 4, "small": 8, "medium": 12, "large": 16, "extra-large": 28, "full": 9999 },
  "elevation": {
    "level0": { "surface": "surface", "shadow": "none" },
    "level1": { "surface": "surface-container-low", "shadow": "0 1px 2px rgba(0,0,0,.08), 0 1px 3px 1px rgba(0,0,0,.06)" },
    "level2": { "surface": "surface-container", "shadow": "0 1px 2px rgba(0,0,0,.10), 0 2px 6px 2px rgba(0,0,0,.08)" },
    "level3": { "surface": "surface-container-high", "shadow": "0 4px 8px 3px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.08)" },
    "level4": { "surface": "surface-container-highest", "shadow": "0 6px 10px 4px rgba(0,0,0,.10), 0 2px 3px rgba(0,0,0,.08)" },
    "page": { "light": "0 2px 6px rgba(0,0,0,.10), 0 1px 1px rgba(0,0,0,.06)", "dark": "none" }
  },
  "paper": {
    "grid-font-size": 28,
    "rule-pitch": "resolvedLineHeight(type.card-answer) = 40 × fontScale",
    "baseline-k": 0.362,
    "rule-width": 1, "header-rule-width": 2, "header-zone": "1 × rule-pitch",
    "margin-width": 1, "margin-inset": 40, "margin-gutter": 12, "margin-enabled": true,
    "mark-offset": 3, "edge-width": 1, "thickness": 3, "stack-offset": 4,
    "min-bands": 5, "corner": 16, "grain": "none"
  },
  "motion": {
    "duration": { "short1": 50, "short2": 100, "short3": 150, "short4": 200, "medium1": 250, "medium2": 300, "medium3": 350, "medium4": 400, "long1": 450, "long2": 500 },
    "easing": {
      "standard": "cubic-bezier(0.2, 0, 0, 1)",
      "standardDecelerate": "cubic-bezier(0, 0, 0, 1)",
      "standardAccelerate": "cubic-bezier(0.3, 0, 1, 1)",
      "emphasized": "cubic-bezier(0.2, 0, 0, 1)",
      "emphasizedDecelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
      "emphasizedAccelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)"
    },
    "named": {
      "nav": { "duration": 400, "easing": "emphasized" },
      "session-open": { "duration": 350, "easing": "emphasizedDecelerate" },
      "sheet-in": { "duration": 350, "easing": "emphasizedDecelerate" },
      "sheet-out": { "duration": 300, "easing": "emphasizedAccelerate" },
      "dialog-in": { "duration": 250, "easing": "standardDecelerate" },
      "dialog-out": { "duration": 200, "easing": "standardAccelerate" },
      "card-advance": { "duration": 200, "easing": "standard" },
      "confirm-hold": { "duration": 300, "easing": "none" },
      "diff-appear": { "duration": 100, "easing": "standardDecelerate" },
      "diff-nudge": { "duration": 150, "easing": "standard" },
      "progress": { "duration": 250, "easing": "emphasizedDecelerate" },
      "toast": { "duration": 200, "easing": "standardDecelerate" },
      "press": { "duration": 100, "easing": "standard" },
      "flip": { "duration": 300, "easing": "emphasized" }
    }
  },
  "haptics": {
    "answer-correct": "notificationSuccess",
    "answer-wrong": "notificationError",
    "trophy-unlocked": "notificationSuccess",
    "session-complete": "impactMedium",
    "destructive-confirm": "impactMedium"
  }
}
```

### 12.1 Regenerating the colour roles

```js
// scripts/gen-colors.mjs  —  npm i @material/material-color-utilities@0.3.0
import { CorePalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
const cp = CorePalette.of(argbFromHex('#305CA6'));
const P = t => hexFromArgb(cp.a1.tone(t));   // primary
const S = t => hexFromArgb(cp.a2.tone(t));   // secondary
const T = t => hexFromArgb(cp.a3.tone(t));   // tertiary
const E = t => hexFromArgb(cp.error.tone(t));
const N = t => hexFromArgb(cp.n1.tone(t));   // neutral
const NV = t => hexFromArgb(cp.n2.tone(t));  // neutral variant
// light: primary P(40) on-primary P(100) primary-container P(90) on-primary-container P(10) …
// surface N(98) on-surface N(10) surface-variant NV(90) on-surface-variant NV(30)
// outline NV(50) outline-variant NV(80)
// surface-container-lowest/low/·/high/highest = N(100)/N(96)/N(94)/N(92)/N(90)
// dark:  primary P(80) on-primary P(20) primary-container P(30) on-primary-container P(90) …
// surface N(6) on-surface N(90) surface-variant NV(30) on-surface-variant NV(80)
// outline NV(60) outline-variant NV(30)
// surface-container-lowest/low/·/high/highest = N(4)/N(10)/N(12)/N(17)/N(22)
```

The `paper.*` and `diff.*` groups are **not** generated — they are hand-authored
and must be re-contrast-checked by hand if edited.

---

## 14. Implementation — mapping to react-native-paper

Tokens live in `src/theme/` and are consumed through a **react-native-paper**
MD3 theme. No second theming layer.

| File | Role |
|---|---|
| `src/theme/tokens.ts` | Everything in §13 as typed constants (`lightColors`, `darkColors`, `paperLight`, `paperDark`, `diffLight`, `diffDark`, `spacing`, `radii`, `typography`, `motion`, `haptics`). Source of truth in code. |
| `src/theme/paperTheme.ts` | Builds `lightTheme` / `darkTheme` from `MD3LightTheme` / `MD3DarkTheme` + the tokens, and extends with what MD3 doesn't model. |
| `src/theme/index.ts` | `useAppTheme()` (typed accessor), `useColorSchemeTheme()` (honours the Appearance setting). |
| `src/theme/icons.ts` | The semantic icon map ([`spec.md` §5](./spec.md)). |

**Color roles.** Every token in §1/§2 overrides the identically-named Paper MD3
role, camelCased in code (`color.on-primary` → `colors.onPrimary`).

**Surface containers → Paper elevation.**

| Paper `colors.elevation` | Token |
|---|---|
| `level0` | `surface` |
| `level1` | `surface-container-low` |
| `level2` | `surface-container` |
| `level3` | `surface-container-high` |
| `level4` / `level5` | `surface-container-highest` |

The `surfaceContainer*` tokens are also exposed by name for direct use.

**Paper-layer and diff tokens** are not MD3 roles, so they hang off the theme as
`colors.paper.*` and `colors.diff.*`, read via `useAppTheme().colors.paper`.
`theme.paperSurface` (the §9 construction constants) is separate from
`theme.colors.paper` (the §3 colours) — name them distinctly in code to avoid
confusion with the *library* called `react-native-paper`. Suggested code names:
**`colors.page`** and **`pageSurface`**. This document keeps "paper" because
that is the design language; the mapping is stated here once so it is not
ambiguous.

**Typography** maps onto Paper's MD3 scale with `configureFonts`; the variant
names in §13 already match (`displayLarge` … `labelSmall`). The Page-only
variants (`cardPrompt`, `cardAnswer`, `diffCell`, `diffAttempt`, `diffCompact`,
`paperLabel`) are **added** to the same fonts config so `<Text variant="diffCell">`
works, and are typed via Paper's theme augmentation.

**Spacing / shape / motion / haptics** attach as `theme.spacing`, `theme.radii`,
`theme.motion`, `theme.haptics`. Paper's single `roundness` stays at the MD3
default; component radii come from `theme.radii`.

**Icons.** `MaterialCommunityIcons` from `@expo/vector-icons`, wired into
`PaperProvider` via `settings.icon` so Paper components and custom components
share one family.
