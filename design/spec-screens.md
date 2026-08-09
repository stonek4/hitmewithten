# Screen Specifications — Vocab Cards

**Version:** 1.0 (2026-08-08)
**Tokens:** [`design-tokens.md`](./design-tokens.md) · **Components, nav, icons, a11y:** [`spec.md`](./spec.md) · **Prototype:** [`prototype.html`](./prototype.html)

Every screen below states the capability and stories it serves and its priority.
Tokens are referenced by name; raw values live only in
[`design-tokens.md`](./design-tokens.md).

---

## Screen index

| # | Screen | Capability | Stories | Priority |
|---|---|---|---|---|
| [S1](#s1--home--library) | Home / Library | [CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0), [CAP-3](../documentation/capability-spec.md#cap-3--test-session-engine-p0), [CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0), [CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0) | A1, A2, A6, A7, C1, C2 | **P0** |
| [S2](#s2--set-detail) | Set Detail | [CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0) | A1, A3, A5 | **P0** |
| [S3](#s3--create--rename-set-dialog) | Create / Rename set (dialog) | [CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0) | A2, A3, A4 | **P0** |
| [S4](#s4--card-editor--rapid-entry) | Card editor — rapid entry | [CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0) | B1, B3, B4 | **P0** |
| [S5](#s5--card-editor--card-list) | Card editor — card list | [CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0) | B2, B3, B4 | **P0** |
| [S6](#s6--set-actions-sheet) | Set actions sheet | [CAP-1](../documentation/capability-spec.md#cap-1--card-set-library--local-storage-p0) | A1 | **P0** |
| [S7](#s7--test-session) | **Test session** | [CAP-3](../documentation/capability-spec.md#cap-3--test-session-engine-p0) | C1, C3–C10 | **P0** |
| [S8](#s8--the-feedback-moment) | **The feedback moment** | [CAP-4](../documentation/capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator), [CAP-5](../documentation/capability-spec.md#cap-5--feedback-presentation-p0) | D1–D6 | **P0** |
| [S9](#s9--session-results) | Session results | [CAP-6](../documentation/capability-spec.md#cap-6--session-results--missed-word-practice-p0) | E1, E2, E3 | **P0** |
| [S10](#s10--trophies) | Trophies | [CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0) | F1–F4 | **P0** |
| [S11](#s11--settings) | Settings | [CAP-10](../documentation/capability-spec.md#cap-10--settings--preferences-p0) | H1, H2, H3 | **P0** |
| [S12](#s12--import) | Import | [CAP-8](../documentation/capability-spec.md#cap-8--legacy-import--migration-p0) | G1, G2, G3 | **P0** |
| [S13](#s13--export) | Export | [CAP-9](../documentation/capability-spec.md#cap-9--export--native-file-format-p0) | G4 | **P0** |
| [S14](#s14--about--changelog) | About & Changelog | [CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0) | M1 | **P0** |
| [S15](#s15--privacy-policy) | Privacy policy | [CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0) | M2 | **P0** |
| [S16](#s16--first-run--migration-report) | First run & migration report | [CAP-8](../documentation/capability-spec.md#cap-8--legacy-import--migration-p0), [CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0) | A7, G1 | **P0** |
| [S17](#s17--account--sync-p1) | Account & sync | [CAP-13](../documentation/capability-spec.md#cap-13--optional-account--cloud-sync-p1--v1-commitment) | I1–I7 | P1 |
| [S18](#s18--trouble-words--insights-p1) | Trouble words & insights | [CAP-16](../documentation/capability-spec.md#cap-16--trouble-words--error-insights-p1--differentiator) | L1, L2, L3 | P1 |
| [S19](#s19--voice--dictation-settings-p1) | Voice & dictation settings | [CAP-14](../documentation/capability-spec.md#cap-14--speech-synthesis--dictation-p1) | J1, J3, J4 | P1 |
| [S20](#s20--paste--delimited-import-p1) | Paste / delimited import | [CAP-17](../documentation/capability-spec.md#cap-17--delimited-text--third-party-import-p1) | B5, G5 | P1 |
| [S21](#s21--how-marking-works-p1) | How marking works | [CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0) | M3 | P1 |
| [S22](#s22--session-history-p1) | Session history | [CAP-6](../documentation/capability-spec.md#cap-6--session-results--missed-word-practice-p0) | E4 | P1 |
| [S23](#s23--dictation-session-p1) | Dictation session | [CAP-14](../documentation/capability-spec.md#cap-14--speech-synthesis--dictation-p1) | J2 | P1 |
| [S24](#s24--multiple-accepted-answers-p1) | Multiple accepted answers | [CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0) | B6 | P1 |

**16 P0 screens, 8 P1 screens.** Every P0 screen in the launch build; every P1
screen designed so it can be built without another design pass.

---

## S1 — Home / Library

**CAP-1, CAP-3, CAP-7, CAP-11 · US-A1, A2, A6, A7, C1, C2 · P0**

### Purpose

The hub. It answers "what am I drilling and how do I start" in one glance, and
"where is that other set" in one scroll. It replaces the live app's Menu **and**
Loader screens — see [`spec.md` §1.5 A1](./spec.md).

### Layout

```
┌────────────────────────────────────────────┐  ← status bar
│  [V] Vocab Cards            [trophy]  [⋮]  │  Appbar.Header mode="large"
│                                            │  wordmark image, left
├────────────────────────────────────────────┤
│                                            │
│ ┌────────────────────────────────────────┐ │  ← DrillCard = a notecard, stacked
│ │   CURRENT SET                          │ │    header zone, unruled
│ │══════════════════════════════════════  │ │    header rule, 2dp, warm
│ │ ┆SAT/GRE High-Frequency Words          │ │    baseline ON rule 1
│ │ ┆──────────────────────────────────────│ │
│ │ ┆42 cards                              │ │    baseline ON rule 2
│ │ ┆──────────────────────────────────────│ │
│ │ ┆┌───────────────┐ ┌────────────────┐  │ │    buttons are CHROME sitting on the
│ │ ┆│ ⚡ 10 Cards    │ │ 🎓 All Cards   │  │ │    card — they occupy whole bands but
│ │ ┆└───────────────┘ └────────────────┘  │ │    do not sit on rules (not text)
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │    paper.thickness
│ └────────────────────────────────────────┘ │
│                                          ▏ │  ← stacked sliver, paper.surface-shade
│ ┌──────────┬──────────┬──────────┐         │  ← CounterStrip → S10
│ │  1,284   │  1,102   │   311    │         │
│ │  tested  │  passed  │  failed  │         │
│ └──────────┴──────────┴──────────┘         │
│                                            │
│  YOUR SETS                        [sort]   │  type.title-small, on-surface-variant
│  ┌──────────────────────────────────────┐  │
│  │ 🔍 Search sets                       │  │  Paper Searchbar (shown at ≥6 sets)
│  └──────────────────────────────────────┘  │
│                                            │
│  🔖 SAT/GRE High-Frequency Words      ⋮   │  ← SetRow, current
│     42 cards · used 2 days ago             │     [Current] chip
│  ──────────────────────────────────────    │
│  🗂 Commonly Misspelled Words          ⋮   │
│     50 cards · used 1 week ago             │
│  ──────────────────────────────────────    │
│  🗂 Tricky Doubles                     ⋮   │
│     36 cards                               │
│  ──────────────────────────────────────    │
│  🗂 Homophones & Confusables           ⋮   │
│     44 cards                               │
│                                            │
│                                     ( + )  │  ← FAB, "New set"
└────────────────────────────────────────────┘
```

### Composition

| Element | Component | Notes |
|---|---|---|
| App bar | Paper `Appbar.Header mode="large"` | Wordmark image as `Appbar.Content` title (`asset.wordmark`, height 28 dp). Actions: `trophy` → S10; `dots-vertical` → Paper `Menu` |
| Overflow menu | Paper `Menu.Item` ×4 | Settings (`cog`) · Import (`file-import`) · Export (`file-export`) · About (`information`) |
| Drill card | [`DrillCard`](./spec.md#38-drillcard--the-home-hero-custom-uses-page) | The only notecard on this screen. Set name and card count are *text*, so they sit on writing rules; the two buttons are chrome placed on the card and occupy whole bands without sitting on a rule (only text sits on rules) |
| Counters | [`CounterStrip`](./spec.md#39-counterstrip) | Tappable → S10 |
| Search | Paper `Searchbar` | Rendered only at ≥ 6 sets, to keep first-run quiet |
| Sort | Paper `Menu` behind a `sort-variant` `IconButton` | Name · Recently used · Card count |
| Set list | `FlatList` of [`SetRow`](./spec.md#37-setrow) | Virtualised; served from `CardSetSummary`, never by loading cards |
| FAB | Paper `FAB icon="plus" label` | Extended on first run, compact once ≥ 1 set |
| Quarantine | [`QuarantineBanner`](./spec.md#321-quarantinebanner) | Pinned under the app bar when a read failed |

### Tokens

Screen `color.surface`; app bar `color.surface-container-low`; `DrillCard` is a
notecard (`color.paper.*`) on a `color.surface` desk — the one place the desk is
`surface` rather than `surface-container-high`, because the card is small and the
shadow does the separation; `CounterStrip` `color.surface-container` at
`elevation.level1`, `shape.medium`; section label `color.on-surface-variant`;
dividers `color.outline-variant`; FAB `color.primary-container` /
`color.on-primary-container`.

### States

**No current set** — the `DrillCard` becomes an `EmptyState` inside the same
notecard, so the layout does not jump. A blank ruled card with one written line
on it is exactly the right image for "nothing chosen yet":

```
┌────────────────────────────────────────┐
│   CURRENT SET                          │  header zone
│══════════════════════════════════════  │
│ ┆No set chosen yet                     │  type.card-prompt, baseline on rule 1
│ ┆──────────────────────────────────────│
│ ┆Pick a set below to start drilling    │  type.card-prompt-small, on rule 2
│ ┆──────────────────────────────────────│
└────────────────────────────────────────┘
```

**Empty library** (only reachable if the user deleted all four starter sets —
[CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0)):

```
              [ 🗂 72dp circle ]
              Nothing to drill yet
     Create a set, or import a .cards file
     you exported from the old Vocab Cards.
          [ Create your first set ]
             [ Import a file ]        ← Button mode="text"
```

**Zero-card current set** — buttons stay **enabled**. Pressing shows a Paper
`Snackbar`: *"This set has no cards yet"* with an **Add cards** action → S4.
This is the direct fix for
[US-C2](../documentation/user-stories.md#us-c2--be-told-clearly-when-i-cant-start-p0)
and the live app's soft-lock: validation happens on press, before navigation, and
nothing on screen changes state.

**Search with no results** — inline `type.body-medium` line "No sets match
"xyz"" plus a `mode="text"` **Clear search** button. The list is never blank
without an explanation.

**Loading** — three skeleton `SetRow`s at `surface-variant`. Never a spinner over
an empty screen.

**Data quarantined** — `QuarantineBanner` at the top; the rest of the library
renders normally.

### Motion

- No entrance animation. The screen renders instantly. *(The live app
  `flipInX`es five buttons on every visit and drives their visibility from the
  animation's completion — the mechanism of the soft-lock.
  [REBUILD_SPEC §10.3](../REBUILD_SPEC.md))*
- Drill button press → `motion.press` state layer, then **validate**, then
  `motion.session-open`.
- FAB → dialog with `motion.dialog`.
- List rows use the platform's default press ripple only.

### a11y

- App bar wordmark: `accessibilityRole="header"`, label "Vocab Cards".
- `DrillCard` buttons: "Drill 10 cards from SAT/GRE High-Frequency Words" /
  "Drill all 42 cards from SAT/GRE High-Frequency Words".
- `CounterStrip`: one element, role `button`, label as specified in
  [`spec.md` §3.9](./spec.md#39-counterstrip).
- `SetRow`: "SAT/GRE High-Frequency Words, 42 cards, current set", role
  `button`; the ⋮ is separate: "Actions for SAT/GRE High-Frequency Words".
- Reading order: app bar → drill card → counters → section label → search → sort
  → rows → FAB.
- At ≥ 130 % font scale the two drill buttons stack vertically and the counter
  strip becomes three stacked rows.

### i18n

`home.currentSetLabel` · `home.drillQuick` (ICU: `{count, plural, ...} Cards`) ·
`home.drillAll` · `home.setCardCount` (ICU plural) · `home.lastUsed` (relative
time via `Intl.RelativeTimeFormat`) · `home.sectionSets` · `home.searchPlaceholder`
· `home.emptyTitle` / `home.emptyBody` · `home.noSetTitle` / `home.noSetBody` ·
`home.emptySetSnackbar` · `home.counters.tested|passed|failed`.
Counters formatted with `Intl.NumberFormat`. Set names are user content and are
never translated or truncated mid-word.

### Dark mode

The desk goes to `color.surface` (`#121316`) and the drill card to the slate
`color.paper.surface` (`#23262C`) — the card stays the lightest object on the
screen. Writing rules flip to `#3C434F` (lighter than the card) and the header
rule to the warm `#6A4340`, so the notecard reading survives without inverting
anything. `elevation.page` resolves to no shadow; `color.paper.edge` carries the
separation. The wordmark switches to `asset.wordmark` dark export
([`spec.md` §6](./spec.md#6-app-assets--launcher-icon)).

---

## S2 — Set Detail

**CAP-1 · US-A1, A3, A5 · P0**

### Purpose

Everything about one set in one place, and the launch point for drilling it.
New — the live app has no such screen; it has a four-button modal.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  SAT/GRE High-Frequency Words        ⋮   │  Appbar small
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │  ← Page, stacked
│ │ ┆  42 cards · created 12 Jan 2026      │ │
│ │ ┆  Last drilled 2 days ago             │ │
│ │ ┆                                      │ │
│ │ ┆  ┌────────────────────────────────┐  │ │
│ │ ┆  │  Use this set & drill          │  │ │  contained, full width
│ │ ┆  └────────────────────────────────┘  │ │
│ └────────────────────────────────────────┘ │
│                                          ▏ │
│                                            │
│  CARDS                        [Edit cards] │  type.title-small · text button → S5
│  ──────────────────────────────────────    │
│  Extremely hungry                          │  first 5 cards, read-only preview
│  ravenous                                  │  answer in type.diff-compact (mono)
│  ──────────────────────────────────────    │
│  Showing 5 of 42          [See all cards]  │
│                                            │
│  ──────────────────────────────────────    │
│  ✎  Rename set                             │  List.Item rows
│  ⧉  Duplicate set                     (P1) │
│  ⬆  Export set                             │
│  🗑  Delete set                             │  color.error
└────────────────────────────────────────────┘
```

### Composition

Paper `Appbar` (`⋮` opens [S6](#s6--set-actions-sheet) for parity with the row
shortcut) · a `Page stacked` with metadata and the primary CTA · a read-only
5-card preview using `CardRow` in a non-interactive variant · a `List.Section`
of destructive-last actions.

### Tokens

Screen `color.surface-container-high` (the **desk**, so the page reads as an
object) · Page `color.paper.*` · CTA `Button mode="contained"` ·
Delete row label `color.error` with the `delete` icon.

### States

- **Zero cards:** the preview section becomes an `EmptyState` — "No cards yet ·
  [Add cards]". The CTA stays enabled and validates on press (Snackbar, as S1).
- **Set is already current:** the CTA reads **"Drill this set"** and a `bookmark`
  + "Current" chip appears in the metadata line.
- **Deleted while open** (sync, P1): the screen replaces itself with a "This set
  was deleted" state and a **Back to library** button. Never a blank screen.

### Motion

Push/pop with `motion.nav`. The Page does not animate independently. Delete →
`DestructiveConfirmDialog` (`motion.dialog`), then `router.replace('/')` — an
explicit named navigation, never a back.

### a11y

CTA label "Use SAT/GRE High-Frequency Words and start drilling". Delete row
`accessibilityHint` "Opens a confirmation". The preview rows are `role="text"`
and are excluded from the tab order. Destructive action is last in reading
order, matching visual order.

### i18n

`set.cardCount` (plural) · `set.createdOn` (`Intl.DateTimeFormat`) ·
`set.lastDrilled` (relative) · `set.useAndDrill` / `set.drillThis` ·
`set.previewFooter` (plural) · `set.rename|duplicate|export|delete`.

### Dark mode

Desk → `color.surface`; page → slate. Delete row uses dark `color.error`
(`#FFB4AB`), which passes AA on `surface`.

---

## S3 — Create / Rename set (dialog)

**CAP-1 · US-A2, A3, A4 · P0**

### Purpose

Name a set. And — the part that matters — **stop a duplicate name from silently
destroying a word list**, the confirmed data-loss defect
([PRD §6.14 defect 2](../documentation/product-requirements.md#614-inherited-defects-that-must-not-survive--p0)).

### Layout — normal

```
        ┌──────────────────────────────┐
        │  New set                     │  type.headline-small
        │                              │
        │  ┌────────────────────────┐  │
        │  │ Name                   │  │  Paper TextInput mode="outlined"
        │  │ ▏                      │  │  autofocus
        │  └────────────────────────┘  │
        │  Any characters are fine.    │  helper, type.body-small
        │                              │
        │            Cancel   Create   │
        └──────────────────────────────┘
```

### Layout — duplicate-name conflict ([`ConflictDialog`](./spec.md#314-conflictdialog--duplicate-set-name))

```
        ┌──────────────────────────────────┐
        │  ⚠  "SAT Words" already exists   │
        │                                  │
        │  You already have a set with     │
        │  this name containing 42 cards.  │
        │                                  │
        │  ┌────────────────────────────┐  │
        │  │ SAT Words (2)              │  │  pre-filled, auto-suffixed
        │  └────────────────────────────┘  │
        │                                  │
        │  Replace                         │  text, color.error
        │  ← "This permanently deletes     │
        │     42 cards."                   │
        │                                  │
        │        Cancel   Rename & create  │  Rename is the default action
        └──────────────────────────────────┘
```

### States

| State | Behavior |
|---|---|
| Empty / whitespace-only | Create is disabled **and** a helper line reads "Give the set a name"; the disabled reason is always visible, never implied |
| > 100 characters | Character counter turns `color.error`; input stops accepting |
| Duplicate (case-insensitive, trimmed) | The conflict layout above. **Never resolved silently.** Auto-suffix increments until free |
| Rename mode | Title "Rename set", field pre-filled, action "Save". Renaming touches metadata only — no card is affected |

### Motion

`motion.dialog` in/out. On Create → navigate to S4 (rapid entry) so the user
lands ready to type, per
[US-A2](../documentation/user-stories.md#us-a2--create-a-set-p0).

### a11y

`accessibilityViewIsModal`; focus lands in the text field; the destructive
warning is part of the dialog's accessible description so it is read **before**
the buttons; `Replace` has `accessibilityHint` "Permanently deletes 42 cards".
Escape / Back cancels.

### i18n

`set.newTitle` · `set.nameLabel` · `set.nameHelper` · `set.nameRequired` ·
`set.conflictTitle` · `set.conflictBody` (ICU, plural on card count) ·
`set.replaceWarning` (ICU plural) · `set.actionReplace|Rename|Cancel|Create|Save`.
Never build these from fragments — the card count is a parameter.

### Dark mode

Paper `Dialog` at `color.surface-container-high`; the warning uses dark
`color.error`.

---

## S4 — Card editor — rapid entry

**CAP-2 · US-B1, B3, B4 · P0**

### Purpose

Type in 40 words from a handout without touching the mouse. This flow is
genuinely good in the live app and is preserved
([REBUILD_SPEC §8.4](../REBUILD_SPEC.md)).

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Add cards · SAT Words          Card 7   │  Appbar; counter in the subtitle
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │  ← the notecard
│ │   NEW CARD                       7     │ │  header zone, unruled
│ │══════════════════════════════════════  │ │  header rule
│ │ ┆Hint                                  │ │  type.paper-label on rule 1 (Δ +5.8dp)
│ │ ┆──────────────────────────────────────│ │
│ │ ┆Extremely hungry▏                     │ │  type.card-prompt — baseline on rule 2
│ │ ┆══════════════════════════════════════│ │  that rule = the field's line;
│ │ ┆                                      │ │  focused → 2dp primary
│ │ ┆──────────────────────────────────────│ │
│ │ ┆Answer                                │ │  label on rule 4
│ │ ┆──────────────────────────────────────│ │
│ │ ┆ravenous                              │ │  type.card-answer (MONO) on rule 5
│ │ ┆──────────────────────────────────────│ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └────────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │        Save & next card               │  │  contained, full width, ≥48dp
│  └──────────────────────────────────────┘  │
│                                            │
│   ◀ Previous            See all 6 cards ▶  │  text buttons
└────────────────────────────────────────────┘
```

### Composition

[`RapidEntryForm`](./spec.md#312-rapidentryform-custom-layout-over-paper-textinput)
on a notecard. Both fields use the
[`AnswerLine`](./spec.md#34-answerline--the-answer-input-custom) treatment — no
box, no underline of their own; each field's text sits on a writing rule and
*that* rule carries the focus state. The editor and the test screen are then
literally the same card with the same lines, which is the point.

**Two fields, one header zone.** Unlike the session card (whose single label
lives above the header rule), the editor has two things being *written*, so both
field labels drop below the header rule and sit on their own writing rules in
`type.paper-label` — small type on a full band, nudged `Δ +5.8 dp`. The header
zone carries the card's identity ("NEW CARD" + its number). The invariant holds:
everything below the header rule is written content and every line of it is on a
rule.

### Behavior

- Hint → `returnKeyType="next"` → focuses Answer.
- Answer → `returnKeyType="done"` → saves, clears both, focuses **Hint**.
- **The answer field defeats every spelling aid** —
  [`spec.md` §7.5](./spec.md#75-the-answer-input-a11y--input-attributes).
  The hint field does not (hints are prose).
- Previous loads the prior card into both fields for editing.
- Leaving: both filled → saves · one filled → warns → *"Save this card?"*
  [Save] [Discard] [Cancel] · neither → exits silently
  ([US-B3](../documentation/user-stories.md#us-b3--not-lose-a-half-typed-card-p0)).

### States

| State | Rendering |
|---|---|
| Hint empty on save | Focus returns to Hint; helper "A hint is required" under the rule; the rule turns `color.error` |
| Answer empty on save | Same for Answer |
| First card of a new set | Counter reads "Card 1"; Previous is hidden (not disabled — there is nothing to explain) |
| Over 256 chars | Counter appears at 200 chars, turns `color.error` at 256, input stops |

### Motion

Saving: the two field values cross-fade out over `motion.card-advance` (200 ms)
while the card and its rules stay put — the same motion as advancing a card in a
session, on purpose. The rules never move, because the card does not move; only
what is written on it changes. Under reduce-motion the fields simply clear.

### a11y

Fields labelled "Hint" / "Answer" with hints "Press next to move to the answer" /
"Press done to save and start the next card". The card counter is
`accessibilityLiveRegion="polite"` so a screen-reader user hears "Card 8" after
each save. The Save button is a real button; the keyboard action key is a
convenience, never the only path.

### i18n

`editor.addTitle` · `editor.cardCounter` (ICU) · `editor.hintLabel` ·
`editor.answerLabel` · `editor.saveNext` · `editor.previous` · `editor.seeAll`
(plural) · `editor.hintRequired` · `editor.answerRequired` ·
`editor.discardTitle|Save|Discard|Cancel`.

### Dark mode

Slate card, warm off-white ink, writing rules lighter than the card. The focused
writing rule uses dark `color.primary` (`#ADC6FF`) at 8.88:1 against the card —
so the active field's line is unmistakable against the other rules, which sit at
1.52:1.

---

## S5 — Card editor — card list

**CAP-2 · US-B2, B3, B4 · P0**

### Purpose

See and fix any card without paging through the set. New — in the live app the
only way to reach card 37 is to press "next" 37 times.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  SAT Words · 42 cards          [+]  [⋮]  │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │ 🔍 Search cards                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ⠿  Extremely hungry                  ✎   │  ← CardRow
│     ravenous                               │     answer in MONO
│  ──────────────────────────────────────    │
│  ⠿  To make worse                     ✎   │
│     exacerbate                             │
│  ──────────────────────────────────────    │
│  ⠿  A cold dessert                    ✎   │  ← expanded (editing)
│  ┌──────────────────────────────────────┐  │
│  │ HINT                                 │  │  inline edit on a mini Page
│  │ A cold dessert                       │  │
│  │ ──────────────────────────────────   │  │
│  │ ANSWER                               │  │
│  │ ice cream                            │  │  MONO — internal space visible
│  │ ──────────────────────────────────   │  │
│  │                  🗑     Cancel  Save  │  │
│  └──────────────────────────────────────┘  │
│  ──────────────────────────────────────    │
│                                            │
└────────────────────────────────────────────┘
```

### Composition

`FlatList` of [`CardRow`](./spec.md#311-cardrow--editor-list-row) (virtualised,
`getItemLayout` on the collapsed height). The expanded editor is the same
`RapidEntryForm` fields inside a small `Page`, rendered inline.

**The answer is monospaced in the list, not only in the editor.** Internal
whitespace is spelling-significant and preserved byte-exactly
([CAP-2](../documentation/capability-spec.md#cap-2--card-authoring-p0)); a
proportional font hides a double space, and a double space is a card that can
never be answered correctly.

### States

| State | Rendering |
|---|---|
| Empty set | `EmptyState` — "No cards yet" · [Add your first card] → S4 |
| Reordering | Row lifts to `elevation.level3`, others shift with `motion.card-advance`. Also available as **Move up / Move down** in the row overflow — no gesture-only actions |
| Deleting | Swipe-left reveals a `color.error-container` panel with `delete`; also in the overflow. Confirms via `DestructiveConfirmDialog` |
| Unsaved inline edit + navigate away | Same warn-before-discard as S4 |
| Search no results | Inline message + Clear |

### Motion

Row expand/collapse: height + opacity over `motion.sheet-in` (350 ms,
`emphasizedDecelerate`). **The expanded editor is conditionally rendered**, not
an always-mounted node toggled by a global query — the live app's modal pattern
is explicitly replaced
([CAP C9](../documentation/capability-spec.md#c9--architecture)).

### a11y

Rows: "Card 3 of 42. Hint: A cold dessert. Answer: ice cream." Actions:
"Edit card 3", "Delete card 3", "Move card 3 up". The drag handle has
`accessibilityActions` for `increment`/`decrement` so TalkBack/VoiceOver can
reorder without a drag.

### i18n

`editor.listTitle` (plural) · `editor.searchCards` · `editor.moveUp|moveDown` ·
`editor.deleteCard` · `editor.emptyTitle|emptyBody|emptyCta`.

### Dark mode

Rows on `color.surface`; the inline editor is a slate `Page` — the editing state
is visibly "on paper" while the list is chrome. That contrast is the two-layer
system doing its job.

---

## S6 — Set actions sheet

**CAP-1 · US-A1 · P0**

### Purpose

The live app's four-action modal, preserved as a shortcut from a set row.

### Layout

```
        ┌──────────────────────────────────┐
        │             ▁▁▁▁▁                │  drag handle
        │  SAT/GRE High-Frequency Words    │  type.title-medium
        │  42 cards                        │  type.body-small
        │  ──────────────────────────────  │
        │  ✓  Use for drilling             │
        │  ✎  Edit cards                   │
        │  ⌨  Rename                        │
        │  ⧉  Duplicate                (P1) │
        │  ⬆  Export                        │
        │  🗑  Delete                        │  color.error
        └──────────────────────────────────┘
```

Full spec: [`spec.md` §3.20](./spec.md#320-setactionssheet).

### States

Duplicate is hidden (not disabled) until P1 ships. "Use for drilling" shows a
trailing `check` and is non-actionable when the set is already current.

### Motion

`motion.sheet-in` / `motion.sheet-out`. Scrim `color.scrim` at 32 %.

### a11y

`accessibilityViewIsModal`; focus enters the sheet; Escape/Back/scrim-tap
dismiss; a **Close** button exists for screen-reader users so dismissal is not
gesture-only. Destructive item last.

### i18n / Dark mode

`sheet.use|edit|rename|duplicate|export|delete`. Sheet
`color.surface-container` in both schemes.

---

## S7 — Test session

**CAP-3 · US-C1, C3, C4, C5, C6, C7, C8, C9, C10 · P0**

### Purpose

The drilling loop. Everything on this screen is subordinate to one thing:
**type, submit, see, retype.** It is a full-screen modal route so a stray
back-swipe cannot end a session.

### Layout

```
┌────────────────────────────────────────────┐
│  ✕      ▓▓▓▓▓▓▓▓░░░░░░░░░░░  4/10     ⇄   │  session bar
│         progress               flip        │
├────────────────────────────────────────────┤
│                                            │
│ ┌────────────────────────────────────────┐ │  ← Page = THE NOTECARD
│ │   HINT                        4 / 10   │ │  HEADER ZONE, 1 band, UNRULED
│ │══════════════════════════════════════  │ │  HEADER RULE 2dp paper.rule-strong
│ │ ┆Extremely hungry                      │ │  type.card-prompt — baseline ON rule 1
│ │ ┆──────────────────────────────────────│ │
│ │ ┆                                      │ │  rule 2 (blank band)
│ │ ┆──────────────────────────────────────│ │
│ │ ┆ravenus▏                              │ │  type.card-answer (MONO) — baseline
│ │ ┆══════════════════════════════════════│ │  ON rule 3, which IS the AnswerLine:
│ │ ┆                                      │ │  2dp color.primary while focused
│ │ ┆──────────────────────────────────────│ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │  paper.thickness — card stock depth
│ └────────────────────────────────────────┘ │
│   ↑ margin rule, 1dp paper.margin           │
│                                            │
│   ◀                                  ▶     │  prev card / submit
│  (48dp)                            (56dp)  │
│                                            │
│              ⌨ keyboard up                 │
└────────────────────────────────────────────┘
```

**Above the header rule is what is printed on the card; below it is what you
write.** That is why the field label and the card position live in the header
zone and the prompt and answer live on writing rules. The answer has **no
underline of its own** — it sits on writing rule 3, and that rule thickens and
takes `color.primary` on focus. Baseline-grid contract:
[`spec.md` §3.1.1](./spec.md#311-the-baseline-grid-contract--what-an-implementer-must-do).

### Composition

| Element | Component | Notes |
|---|---|---|
| Session bar | Paper `Appbar.Header` | Leading `IconButton` `close` → end-test confirm. Centre: [`SessionProgressBar`](./spec.md#36-sessionprogressbar) + "4/10" text. Trailing `swap-horizontal` → flip. **P1** adds `help-circle` → S21 and `volume-high` → speak |
| **The notecard** | [`Page`](./spec.md#31-page--the-notecard-custom) `ruled stacked`, `label="Hint"`, `labelTrailing="4 / 10"` | `rulePitch` = **resolved** line height of `type.card-answer`, so it grows with the OS font scale |
| Prompt | [`PromptBlock`](./spec.md#35-promptblock-custom) | Baseline on writing rule 1. Drops to `type.card-prompt-small` above 80 chars — **smaller glyphs in the same band**, `Δ +2.2 dp` |
| Input | [`AnswerLine`](./spec.md#34-answerline--the-answer-input-custom) | Baseline on a writing rule; **that rule is its underline**. Autofocus, keyboard up, action key submits |
| Prev / Submit | Paper `IconButton` `arrow-left-circle` / `FAB size="small"` `arrow-right-circle` | Submit is also the keyboard action key |

### Behavior (the loop)

1. Card appears → **input focused, keyboard up, instantly**, every card, every
   platform ([US-C3](../documentation/user-stories.md#us-c3--type-the-answer-immediately-p0)).
2. Submit → evaluate ([CAP-4](../documentation/capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator)).
3. **Correct** → the confirm state (below), `motion.confirm-hold` 300 ms, then
   advance with `motion.card-advance`.
4. **Wrong** → [S8](#s8--the-feedback-moment). The card does **not** advance and
   progress does **not** move. The typed text stays and is **fully selected**.
5. **Unlimited retries. No skip, no reveal, no override.**
   ([US-C6](../documentation/user-stories.md#us-c6--not-be-let-off-the-hook-p0))

### States

**Correct** — the answer line is replaced in place by the confirmation, which
stays on the same writing rule the answer was on:

```
│ ┆✓ Correct                             │  check-circle + the WORD, diff.correct
│ ┆──────────────────────────────────────│
│ ┆ravenous                              │  stored casing, MONO, baseline ON the
│ ┆──────────────────────────────────────│  rule, on a diff.correct-container wash
```

Three signals: icon, word, colour
([US-C4](../documentation/user-stories.md#us-c4--get-an-answer-confirmed-p0)).
Haptic `haptics.answer-correct`.

**Wrong** — see [S8](#s8--the-feedback-moment).

**Flipped** — the header-zone label changes from `HINT` to `ANSWER` and the two
sides swap; every evaluation rule applies unchanged to the swapped values
([US-C7](../documentation/user-stories.md#us-c7--drill-in-the-other-direction-p0)).
A `Chip` reading "Flipped" appears in the session bar so the state is never
implicit. **The card does not rotate.** The label and the body content cross-fade
in place over `motion.flip` while the rules stay exactly where they are — the
notecard is a fixed physical surface and only what is written on it changes. A
3-D flip would put the card edge-on, i.e. invisible, which is a state-carrying
animation and is forbidden
([`design-tokens.md` §10.1](./design-tokens.md#101-the-three-motion-laws-for-this-app)).

**First card** — the Previous control is **present but a no-op**, with
`accessibilityState={{ disabled: true }}` and a Snackbar-free silent ignore.
*(The live app exits the entire test here —
[US-C8](../documentation/user-stories.md#us-c8--go-back-a-card-p0).)* It is
rendered rather than hidden so the layout does not shift on card 2.

**End test** — `close` or hardware Back opens a Paper `Dialog`:
*"End this test? You've completed 4 of 10 cards. You'll still see your results."*
[Keep going] [End test]. Ending produces a results screen for the portion
completed.

**Long prompt** — a wrapped prompt takes **two or more whole bands, every
baseline still on a rule** (this is free: `lineHeight === rulePitch`). Past the
card's band count the **body scrolls internally and the rules scroll with the
text**, so it reads as a card you are scrolling rather than a card that broke;
the header zone and header rule stay pinned, and the answer line stays pinned to
the last band so it never leaves the viewport with the keyboard up.

**Keyboard covering the card** — the card's body shrinks by whole bands (never
by a fraction of one, which would put the grid off-phase). The prompt scrolls
internally; it is never truncated with an ellipsis.

**Large dynamic type** — `rulePitch` is the *resolved* line height, so at 200 %
the rules are ~80 dp apart and the card has fewer, taller bands. Every baseline
still lands. This is [AC-Notecard N7](./spec.md#ac-notecard--the-baseline-grid).

### Motion

| Event | Motion |
|---|---|
| Session open | `motion.session-open` — slide up + fade |
| Card advance | `motion.card-advance` — the prompt and answer cross-fade and translate 8 dp; **the Page itself never moves**, so the paper feels like a fixed surface being written on |
| Progress advance | `motion.progress` |
| Flip | `motion.flip` cross-fade. **No 3-D flip** — a flip animation that fails mid-way would leave a card edge-on, i.e. invisible, i.e. exactly the failure class this app is designed against |
| Wrong answer | `motion.diff-appear` + `motion.diff-nudge` (S8) |
| Reduce-motion | All of the above become instant swaps. Nothing is hidden, nothing is unreachable |

Every one obeys [`design-tokens.md` §10.1](./design-tokens.md): the animated
properties start and end at identity, and no animation gates navigation.

### a11y

- Progress: `role="progressbar"`, `accessibilityValue`, label "Card 4 of 10",
  paired with the visible "4/10".
- The answer line is the **first** element in the reading order after the bar,
  because it is where the user is.
- Flip: `accessibilityState={{ checked: flipped }}`, label "Swap hint and
  answer".
- End: label "End test", hint "You'll be asked to confirm".
- Prev on card 1: `disabled` state announced.
- **The feedback live region is a sibling of the answer line, not a parent**, so
  announcing it never moves focus out of the input.
- Web: `Enter` submits, `Esc` opens the end-test confirm, the answer input holds
  focus, and every control has a visible focus ring.

### i18n

`session.hintLabel` / `session.answerSideLabel` · `session.answerLabel` ·
`session.progress` (ICU "Card {n} of {total}") · `session.flip` ·
`session.flippedChip` · `session.correct` · `session.endTitle` ·
`session.endBody` (ICU plural) · `session.endConfirm|endCancel`.
Card content is user text — never translated, never truncated, always rendered
as text and never as markup.

### Dark mode

The slate page under a near-black desk; the focused answer rule in dark
`color.primary`. The confirm wash uses dark `diff.correct-container`
(`#0F4527`) with `diff.correct` (`#7CD99E`) at 8.86:1.

---

## S8 — The feedback moment

**CAP-4, CAP-5 · US-D1, D2, D3, D4, D5, D6 · P0 · differentiator**

> **This is the screen the product exists for.** Its normative contract is
> [spelling-diff-spec.md §7](../documentation/spelling-diff-spec.md#7-presentation-contract);
> the component is [`spec.md` §3.2](./spec.md#32-diffstrip--the-spelling-feedback-moment-custom).
> It is a *state* of [S7](#s7--test-session), not a navigation — the user never
> leaves the input.

### Purpose

Tell the user **exactly** which characters they got wrong, legibly, at a glance,
on a phone, mid-drill, without slowing the loop — and do it without relying on
colour, and do it out loud for a screen reader.

### Layout

```
┌────────────────────────────────────────────┐
│  ✕      ▓▓▓▓▓▓▓▓░░░░░░░░░░░  4/10     ⇄   │  ← progress does NOT move
├────────────────────────────────────────────┤
│                                            │
│ ┌────────────────────────────────────────┐ │  ← the same notecard, in place
│ │   HINT                        4 / 10   │ │  header zone, unruled
│ │══════════════════════════════════════  │ │  header rule
│ │ ┆A cold dessert                        │ │  prompt — baseline on rule 1
│ │ ┆──────────────────────────────────────│ │
│ │ ┆ i  c  e     c  r  e  a  m            │ │  YOU TYPED — type.diff-attempt
│ │ ┆─────────∧────────────────────────────│ │  baseline on rule 2 (∧ = caret cell)
│ │ ┆ i  c  e  #  c  r  e  a  m            │ │  CORRECT — type.diff-cell
│ │ ┆─────────┄┄───────────────────────────│ │  baseline on rule 3; the dashed MARK
│ │ ┆                                      │ │  sits 3dp BELOW the rule
│ │ ┆──────────────────────────────────────│ │
│ │ ┆▛icecream▟                            │ │  kept AND fully selected
│ │ ┆══════════════════════════════════════│ │  its writing rule → 2dp diff.wrong
│ │ ┆  What do these marks mean?           │ │  text button → MarkLegend
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └────────────────────────────────────────┘ │
│                                            │
│   ◀                                  ▶     │
└────────────────────────────────────────────┘
```

The two diff rows and the input all sit on the same card, in the same monospace,
in the same column grid, **on consecutive writing rules**. The user's eye travels
**attempt → correct → their own text, already selected** — which is the retry, in
one keystroke, straight down the card's own lines.

**Why two adjacent bands rather than interlinear marking.** Two readings were
possible: the attempt in the interlinear space above the correct row (how a
teacher marks a page), or both rows on rules. **Two adjacent bands wins**,
because at 28 sp the correct row's ascenders reach ≈27 dp above its baseline and
fill the entire band above it — there is no clear interlinear space, and buying
some would mean shrinking the one thing on this screen that must be biggest. It
also keeps the notecard invariant total, with zero exceptions. The teacher's-pen
quality lives in the **marks** instead — the strike, the caret, and the 2 dp
coloured underline drawn *below* the paper's own rule. Full argument:
[`spec.md` §3.2.2.1](./spec.md#3221-why-two-adjacent-rule-bands-and-not-interlinear).

**The marks never collide with the rules.** Writing rule: 1 dp, at the baseline,
~1.55:1. Diff mark: 2 dp, 3 dp lower, 6.16–9.09:1, saturated. Four separating
axes — position, weight, contrast, hue. The cell wash sits *under* the writing
rule in z-order, so the ruling stays continuous across a marked cell: the card's
lines are printed, the marking is on top of them.
([`spec.md` §3.2.2.2](./spec.md#3222-marks-vs-rules--they-must-not-collide))

### The five kinds, on the card

Every mark is a **real proofreader's mark**, audited against convention.

| Kind | Attempt row | Correct row | Marks | Convention |
|---|---|---|---|---|
| `ok` | letter, ink | letter, ink | none | — |
| `wrong` | typed letter, red, **struck** | correct letter, red, **bold**, **solid underline** | 3 | strike = delete |
| `missing` | **`∧`** caret, violet | correct letter, violet, **bold**, **dashed underline**, wash | 4 | caret `‸` = insert |
| `extra` | typed letter, red, **struck** | **`·`** void mark, no letter, wash | 3 | strike = delete |
| **`transposed`** | the two typed letters **in the order typed**, red, **not struck**, **ribbon** across the pair | the two correct letters, red, **bold**, **ribbon** across the pair | 4 | the transpose ribbon (`tr`) |
| **missing space** | **`∧`** caret, violet | **`#`**, violet, bold, dashed underline, wash, **full cell width** | 4 | `#` = insert a space |
| extra space | **`#`** struck, red | **`·`** void mark, wash | 4 | `#` struck = delete a space |

The two halves of a swap share a **`pairId`**; the strip groups by it, **never
by adjacency** — two consecutive swaps give four consecutive `transposed`
segments, which adjacency alone cannot resolve
([spelling-diff-spec.md §2.4](../documentation/spelling-diff-spec.md#24-how-a-transposed-pair-is-represented)).

**`transposed` is new** and is the reason the algorithm moved to
**Damerau-Levenshtein**: `receive` typed as `recieve` used to render as a
*missing* `e` plus an *extra* `e` — two unrelated marks for one mistake. It is
now one swap, bound by one ribbon. It is also the only mark that **spans two
cells** and the only one that marks a character **without striking it**, which
is what makes it identifiable in greyscale.

**The missing-space glyph is `#`**, the standard proofreader's insert-a-space
mark *(Kevin's decision, 2026-08-08)* — used **inline in the cell**, replacing
the live app's `_`. Everything else about the treatment is unchanged.

Full treatment table, the ribbon geometry, and worked examples for all six
fixtures: [`spec.md` §3.2.3–§3.2.9](./spec.md#323-per-status-treatment--every-kind-has-24-non-colour-signals).

**The missing-space marker is the one thing on this screen that must never be
lost.** A `DiffSegment` with `char === ' '` and a non-`ok` status renders a
**full character cell containing a visible glyph**. It is a P0 requirement
([US-D3](../documentation/user-stories.md#us-d3--see-a-missing-space-p0)), it is
the feature **no competitor has**
([Competitor Analysis](../documentation/competitor-analysis.md#no-competitor-marks-a-missing-space-and-none-detects-a-transposition)),
and the diff spec names it
[the single easiest requirement in the document to lose in a rewrite](../documentation/spelling-diff-spec.md#72-hard-rules).

### Composition

`PromptBlock` (unchanged) · [`DiffStrip`](./spec.md#32-diffstrip--the-spelling-feedback-moment-custom)
with `showAttempt` · a `mode="text"` **What do these marks mean?** button
(shown until the user opens the legend once, then only from the session bar's
`help-circle` at P1) · `AnswerLine` in its wrong state.

### Tokens

Page `color.paper.*`; correct row `type.diff-cell`; attempt row
`type.diff-attempt`; `color.diff.wrong` / `.missing` / `.extra` / `.void` and
their containers; the answer rule at 2 dp `color.diff.wrong`. All diff tokens
are contrast-verified **against the paper surface**, 6.16–7.05:1 light and
8.86–9.09:1 dark ([`design-tokens.md` §4](./design-tokens.md)).

### States

| State | Rendering |
|---|---|
| Second and later attempts on the same card | The strip is **replaced**, not stacked — a fresh diff per attempt ([spelling-diff-spec.md §4.2](../documentation/spelling-diff-spec.md#42-when-the-diff-is-computed)). The nudge fires again |
| Answer over the 256-char cap | No strip. `type.body-large` "Not quite — try again", answer shown unmarked ([spelling-diff-spec.md §8](../documentation/spelling-diff-spec.md#8-performance--bounds)) |
| Empty submission | Every column is `missing`: a full row of carets over a fully marked answer. Correct by construction (ground-truth vector 10) |
| Very long word | The pair of rows wraps together onto the **next two bands**, breaking between columns only. Both baselines still land on rules. Never truncates, never scrolls horizontally |
| Large dynamic type | The pitch grows with the text, so the pair simply occupies two taller bands. Marks stay 3 dp below their rules ([AC-Notecard N7](./spec.md#ac-notecard--the-baseline-grid)) |
| `showAttempt={false}` (P0 fallback) | The attempt row and its label are omitted. Nothing else changes — [`spec.md` §13 Q1](./spec.md#13-open-questions) |
| Reduce-motion | No nudge; a 150 ms `color.diff.wrong` border emphasis on the strip instead |
| Screen reader active | The strip is inside a polite live region; individual cells are hidden from the tree |

### Motion

- `motion.diff-appear` — 100 ms opacity fade. The strip is already laid out
  before the fade starts.
- `motion.diff-nudge` — ±4 dp horizontal, 150 ms, on the strip container only.
  The descendant of the live app's `shake`, at a quarter of its amplitude, and
  **starting and ending at `translateX: 0`** so an interrupted nudge is
  harmless.
- **No stagger, no per-letter reveal.** The whole point is that the user reads
  this in under a second and retypes. Ceremony here costs the loop.

### a11y — the announcement (US-D5)

Polite live region, composed from the same `DiffSegment[]` via ICU messages:

```
Incorrect. Correct spelling: i-c-e, space, c-r-e-a-m.
You left out a space after "ice".
```

A swap is announced **once** for the pair, naming the two characters in the
order the user typed them:

```
Incorrect. Correct spelling: r-e-c-e-i-v-e. You swapped the i and the e.
```

Rules — spell letter by letter, say "space" for a space, summarise errors in
plain language grouped by kind, **a transposed pair counts as one error**,
**cap at three then "and N more"**, never assertive, cells not individually
focusable. Full composition spec:
[`spec.md` §3.2.7](./spec.md#327-screen-reader-announcement-us-d5).

Additional: the answer input keeps focus throughout. The announcement never
steals it. `haptics.answer-wrong` fires once.

### i18n

`diff.youTyped` · `diff.correct` · `diff.legendLink` ·
`diff.announce.prefix` · `diff.announce.spelling` · `diff.announce.space` ·
`diff.announce.missingLetter` · `diff.announce.missingSpace` ·
`diff.announce.wrongLetter` · `diff.announce.extraLetter` ·
`diff.announce.extraSpace` · `diff.announce.transposed` ·
`diff.announce.andMore` (ICU plural) · `diff.tooLong`.

**Every one is a complete ICU message with parameters.** The announcement must
never be assembled by concatenating fragments — a sentence built from pieces
cannot be translated, and this is the sentence that matters most.

**RTL:** the strip renders in the *content's* direction, not the UI's. A diff of
an Arabic word reads right-to-left inside an English UI. Column order follows
the segment array, which is already in content order
([`spec.md` §8](./spec.md#8-internationalization-contract)).

**Unicode:** a `DiffSegment.char` may be a multi-code-unit grapheme cluster. One
cluster = one cell. `DiffCell` renders `segment.char` as an opaque string and
never indexes into it
([spelling-diff-spec.md §5](../documentation/spelling-diff-spec.md#5-unicode-handling)).

### Dark mode

On the slate page: `diff.wrong` `#FFB4AB`, `diff.missing` `#D9BCFF`,
`diff.correct` `#7CD99E`, all at ≥ 8.8:1 against `color.paper.surface`. The cell
washes deepen rather than lighten (`#4B2B29`, `#3B2E55`) so they stay
sub-threshold and never look like a highlight. Mark lines keep the same
thickness — a 2 dp rule reads identically in both schemes.

### Verification

Screenshot the five worked examples from
[`spec.md` §3.2.9](./spec.md#329-worked-examples-all-from-the-verified-ground-truth-vectors),
**desaturate to greyscale**, and confirm each of the five kinds is still
identifiable. Then run deuteranopia, protanopia and tritanopia simulations
against [`prototype.html`](./prototype.html), which renders the production
tokens. This is [AC-Diff](./spec.md#12-acceptance-criteria) 2, 3 and 10.

---

## S9 — Session results

**CAP-6 · US-E1, E2, E3 · P0**

### Purpose

Close the loop: what happened, exactly which words were missed, and one tap to
re-drill them. New — today a test just ends and dumps the user at the menu.

### Layout

```
┌────────────────────────────────────────────┐
│                                    Done    │  Appbar, no back action
├────────────────────────────────────────────┤
│                                            │
│                    10                      │  type.display-medium
│              cards completed               │  type.body-medium
│                                            │
│  ┌──────────┬───────────┬───────────────┐  │
│  │    7     │     5     │    3:42       │  │  type.title-large
│  │ first-try│  wrong    │   elapsed     │  │  type.label-medium
│  │  passes  │ attempts  │               │  │
│  └──────────┴───────────┴───────────────┘  │
│                                            │
│  WORDS YOU MISSED (3)                      │  type.title-small
│                                            │
│ ┌────────────────────────────────────────┐ │  ← a compact notecard per missed word
│ │ ┆ice cream                             │ │  grid font 16, pitch 24
│ │ ┆──────────────────────────────────────│ │  baseline on rule 1
│ │ ┆i c e # c r e a m                     │ │  DiffStrip size="compact", on rule 2
│ │ ┆────────┄┄────────────────────────────│ │  mark 2dp below the rule
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ ┆ravenous                              │ │
│ │ ┆──────────────────────────────────────│ │
│ │ ┆r a v e n o u s                       │ │
│ │ ┆────────────┄┄────────────────────────│ │
│ └────────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │   ↻  Practice these 3 words           │  │  contained, full width
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Back to library                     │  │  outlined
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### Composition

Headline stat block (Paper `Surface elevation={0}`) · a three-cell stat row
(`surface-container`, `shape.medium`, dividers `outline-variant`) · one
**compact notecard** per missed card (`gridFontSize={16}` → 24 dp pitch,
`label={null}` so there is no header zone) carrying the answer on rule 1 and a
`DiffStrip size="compact"` of the **first** diff recorded for that card on rule
2 · two full-width buttons.

**Why the missed words are on notecards.** They are card content and diff output
— the same material as S8. Putting them on chrome would break the association
the user just formed, and putting them on *un*ruled paper would break the "this
is what you wrote" reading. Every line here sits on a rule too; only the grid
constant changes.

### States

| State | Rendering |
|---|---|
| **Perfect session** (nothing missed) | The missed section is replaced by a `diff.correct-container` panel: `check-all` icon, "Every card on the first try", and only the **Back to library** button. No fake celebration animation |
| **Ended early** | A `Chip` under the headline: "Ended early · 4 of 10 cards". Reports only what was completed ([CAP-6](../documentation/capability-spec.md#cap-6--session-results--missed-word-practice-p0)) |
| **A missed card was deleted mid-session** (sync, P1) | Silently skipped from the practice list; the count reflects what can actually be drilled |
| **Trophy unlocked during the session** | `TrophyToast` appears here, not mid-card, with a **View** action → S10 |
| **P1** | A "Recent sessions" link → [S22](#s22--session-history-p1) |

### Motion

- Enter: cross-fade from the session (`motion.nav`); the numbers do **not**
  count up — a counting animation delays the information for decoration.
- Trophy toast: `motion.toast`.
- "Practice these N words" → a new session with `motion.session-open`.
- **Done / Back to library** → `router.replace('/')`, an explicit named
  navigation. *(The live app walks history backwards, sometimes twice —
  [REBUILD_SPEC §7](../REBUILD_SPEC.md).)* Back from Results cannot re-enter a
  finished session.

### a11y

- The headline block is one element: "10 cards completed. 7 passed on the first
  try. 5 wrong attempts. 3 minutes 42 seconds."
- Each missed row: "ice cream. You left out a space after ice." — the same
  plain-language summary the live region used, not a re-spelling.
- The compact strips' cells are hidden from the tree, as in S8.
- "Practice these 3 words" is the default focus target.

### i18n

`results.cardsCompleted` (ICU) · `results.firstTryPasses` ·
`results.wrongAttempts` · `results.elapsed` (formatted duration, not
concatenated) · `results.missedHeader` (ICU plural) ·
`results.practiceMissed` (ICU plural) · `results.done` ·
`results.perfectTitle|perfectBody` · `results.endedEarly` (ICU).

### Dark mode

Stat row `surface-container`; missed-word pages are slate; the compact diff uses
the dark diff tokens. The perfect-session panel uses dark
`diff.correct-container`.

---

## S10 — Trophies

**CAP-7 · US-F1, F2, F3, F4 · P0**

### Purpose

Make 24 previously-invisible objects visible. Today the only way to ever see a
trophy is a 2-second toast you may not be looking at.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Trophies                     11 of 24   │
├────────────────────────────────────────────┤
│  ┌──────────┬───────────┬──────────────┐   │
│  │  1,284   │   1,102   │     311      │   │  CounterStrip (same component)
│  │  tested  │  passed   │   failed     │   │
│  └──────────┴───────────┴──────────────┘   │
│                                            │
│  CARDS TESTED                       5/9    │  type.title-small
│  Next: 5,000 tested                        │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  1,284 / 5,000       │  ProgressBar + text
│                                            │
│  ┌──────────────┐ ┌──────────────┐         │
│  │  🏆          │ │  🏆          │         │  TrophyTile
│  │  10 tested   │ │  50 tested   │         │
│  │  3 Feb 2026  │ │  9 Feb 2026  │         │  unlocked: date present
│  └──────────────┘ └──────────────┘         │
│  ┌──────────────┐ ┌──────────────┐         │
│  │  🏆 (dim)    │ │  🏆 (dim)    │         │
│  │  5,000 tested│ │ 10,000 tested│         │  locked: no date,
│  │  1,284/5,000 │ │ 1,284/10,000 │         │  progress instead
│  └──────────────┘ └──────────────┘         │
│                                            │
│  CARDS PASSED                       4/8    │
│  …                                         │
│  CARDS FAILED                       2/7    │
│  …                                         │
└────────────────────────────────────────────┘
```

### Composition

Three `List.Section`s — **Cards tested (9) · Cards passed (8) · Cards failed
(7)** — each with a header, a "next trophy" `ProgressBar`, and a 2-up grid of
[`TrophyTile`](./spec.md#310-trophytile). Thresholds are frozen
([CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0)).

### States

- **Nothing unlocked yet:** the header reads "0 of 24"; every tile is locked and
  the first tile in each category shows its progress bar. Not an empty state —
  the roster *is* the content.
- **All unlocked in a category:** the progress line is replaced by "All 9
  unlocked" with a `check-all` icon.
- **Migrated from the legacy app:** unlocked trophies show the migration date
  with a footnote row: "Progress before 8 August 2026 was carried over from the
  original Vocab Cards." Recovering the true counters uses the `max()` rule and
  getting it wrong silently erases years of progress
  ([CAP-7](../documentation/capability-spec.md#cap-7--trophies--counters-p0)) —
  the footnote is how a user can tell it worked.
- **Counter capped at 100,000** (the documented, accepted legacy-migration
  limitation): no special UI. All trophies of that type are unlocked, so nothing
  user-visible is lost.

### Motion

None on entry. A newly unlocked tile arriving from a toast tap gets a 300 ms
`tertiary-container` background pulse that starts and ends at the resting
colour. Under reduce-motion, no pulse.

### a11y

- Header "11 of 24 trophies unlocked".
- Section progress: `role="progressbar"` with `accessibilityValue`, plus the
  visible "1,284 / 5,000" — never bar length alone.
- Tiles are `role="text"` with the labels in
  [`spec.md` §3.10](./spec.md#310-trophytile). Lock state is spoken, not
  implied by dimming.
- 1-up grid above a ~130 % font scale.

### i18n

`trophies.title` · `trophies.headerCount` (ICU) · `trophies.sectionTested|Passed|Failed`
· `trophies.next` (ICU) · `trophies.progress` (ICU, `Intl.NumberFormat`) ·
`trophies.unlockedOn` (`Intl.DateTimeFormat`) · `trophies.allUnlocked` (ICU) ·
`trophies.migrationNote`. **Trophy ids are language-independent and stable**;
only display names translate.

### Dark mode

Unlocked tiles `tertiary-container` `#583E5B` / `on-tertiary-container`
`#FBD7FC`; locked tiles `surface-container` with the icon at 38 %. Dimming reads
correctly in both schemes because it is opacity on a themed colour, not a fixed
grey.

---

## S11 — Settings

**CAP-10 · US-H1, H2, H3 · P0**

### Purpose

Real settings. It has said *"Currently there are no settings available to
change"* since 2017.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Settings                                │
├────────────────────────────────────────────┤
│  DRILLING                                  │
│  Aa  Case sensitivity                      │
│      ( Ignore case │ Require exact case )  │  SegmentedButtons
│  ──────────────────────────────────────    │
│  #   Quick test size                       │
│      (  5  │ 10 │ 20 │ 50  )               │  SegmentedButtons
│  ──────────────────────────────────────    │
│  ⇄   Default prompt side                   │
│      ( Hint first │ Answer first )         │
│                                            │
│  APPEARANCE                                │
│  ◐   Theme                                 │
│      ( System │ Light │ Dark )             │
│  ──────────────────────────────────────    │
│  📳  Haptic feedback              [ ●━ ]   │  Switch
│                                            │
│  PRIVACY                                   │
│  📊  Anonymous usage analytics    [ ●━ ]   │  Switch
│      Never includes anything you type      │  type.body-small
│  ──────────────────────────────────────    │
│  🛡  Privacy policy                    →   │  → S15
│                                            │
│  YOUR DATA                                 │
│  ⬇  Import cards                       →   │  → S12
│  ⬆  Export cards                       →   │  → S13
│  ──────────────────────────────────────    │
│  ☁  Sync                          (P1) →   │  → S17
│      Off. Everything stays on this device. │
│                                            │
│  ABOUT                                     │
│  ℹ  About Vocab Cards                  →   │  → S14
│      Version 1.0.0                         │
└────────────────────────────────────────────┘
```

### Composition

Paper `List.Section` + `List.Item`, `SegmentedButtons` for the three-and-four
option choices, `Switch` for booleans. Every change **applies immediately, no
restart, no Save button**.

### States

- **Quick test size** disabled options: none. All four are always selectable; a
  set with fewer cards just uses what exists.
- **Haptics** row is **hidden entirely on web** — a setting that does nothing is
  worse than no setting.
- **Analytics off:** the explanatory line changes to "Analytics is off. Nothing
  is sent." The opt-out is honoured **before any event is emitted**, including
  on first run.
- **Sync row (P1):** shows [`SyncStatusRow`](./spec.md#322-syncstatusrow-p1--cap-13)
  states. **Signed-out is worded as a fact, not an invitation** — no badge, no
  dot, no red count. This is
  [CAP-13 §13.1](../documentation/capability-spec.md#131-the-optionality-constraint-p0--this-part-gates-the-launch-build)
  expressed in pixels.

### Motion

Theme change applies with a 200 ms cross-fade of the root background
(`motion.card-advance`); under reduce-motion it swaps instantly. Nothing
unmounts.

### a11y

Each control has `accessibilityRole` (`radiogroup` for segmented buttons,
`switch` for toggles) and `accessibilityState`. Section headers are
`role="header"`. Helper text is part of the row's accessible description so it
is read with the control, not after it.

### i18n

`settings.title` · `settings.sectionDrilling|Appearance|Privacy|Data|About` ·
`settings.caseSensitivity` + `.ignore|.exact` · `settings.quickSize` ·
`settings.promptSide` + `.hintFirst|.answerFirst` · `settings.theme` +
`.system|.light|.dark` · `settings.haptics` · `settings.analytics` +
`.onBody|.offBody` · `settings.privacyPolicy` · `settings.import|export` ·
`settings.sync` + the four status strings · `settings.about` · `settings.version`.

### Dark mode

Standard M3 list on `color.surface`; section headers `on-surface-variant`;
selected segmented buttons `secondary-container`.

---

## S12 — Import

**CAP-8 · US-G1, G2, G3 · P0**

### Purpose

Get every existing user's data in, from either `.cards` files or the legacy
browser storage — and **report honestly** what happened to each item.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Import cards                            │
├────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐│
│  │  ⬇  Choose files                       ││  Button contained, full width
│  └────────────────────────────────────────┘│
│  .cards files from the original Vocab      │  type.body-medium
│  Cards, or .vocabcards files exported      │
│  from this app. You can pick several.      │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  📋 Paste a list instead          (P1) ││  → S20
│  └────────────────────────────────────────┘│
│                                            │
│  RESULT                                    │
│  Imported 3 sets · 1 renamed · 1 failed    │  one ICU sentence
│  ──────────────────────────────────────    │
│  ✓  SAT Words — 42 cards                   │  ImportReportList
│  ✓  Tricky Doubles — 36 cards              │
│  ⌨  Homophones → Homophones (2) — 44 cards │
│  ⚠  old-backup.cards — couldn't be read →  │  tappable for the reason
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  Done                                  ││
│  └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### Composition

A primary picker button (`expo-document-picker`, `multiple: true`) · an
explanation · [`ImportReportList`](./spec.md#316-importreportlist) ·
a P1 paste entry point.

### States

| State | Rendering |
|---|---|
| Idle | The picker and explanation only; no result section |
| Working | An indeterminate `ProgressBar` under the button with "Reading 4 files…". The button is disabled with a visible reason |
| **Every selected file is reported** | One row per file, always. *(The live app reuses one `FileReader` across the loop and imports only the first file, silently — [PRD §6.14 defect 3](../documentation/product-requirements.md#614-inherited-defects-that-must-not-survive--p0).)* This screen exists partly to make that failure impossible to reproduce unnoticed |
| Name collision | Routes through [S3](#s3--create--rename-set-dialog)'s `ConflictDialog`, one at a time, and the resolution appears in the report |
| Failure | `alert-circle`, `color.error`, and a **reason in words** — never a silent drop. Tapping opens a sheet with the raw detail and a "Copy" action |
| Quarantined | Same treatment; the raw payload is retained, not deleted |

### Motion

Rows append with a 100 ms fade as each file resolves. No progress choreography —
a report is information, not a show.

### a11y

The summary line is `accessibilityLiveRegion="polite"` and announces once at the
end, not per file. Each row is one element with the outcome spoken as a word
("Imported", "Renamed", "Failed") — the icon and colour are supplements.

### i18n

`import.title` · `import.chooseFiles` · `import.explainer` · `import.pasteInstead`
· `import.working` (ICU plural) · `import.summary` (a single ICU message with
imported/renamed/replaced/failed counts) · `import.outcome.*` · `import.reason.*`
(one key per failure class, never a raw exception string).

### Dark mode

Standard chrome. Outcome colours use the dark `diff.correct` / `color.error`.

---

## S13 — Export

**CAP-9 · US-G4 · P0**

### Purpose

Let the user take everything out, for free, offline, with no account.

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Export cards                   Select   │
├────────────────────────────────────────────┤
│  FORMAT                                    │
│  ( Vocab Cards (.vocabcards) │ Legacy (.cards) )│  SegmentedButtons
│  Keeps everything: ids, dates, multiple    │  type.body-small
│  hints and answers.                        │
│                                            │
│  SETS                          [Select all]│
│  ☑  SAT/GRE High-Frequency Words · 42      │  Checkbox rows
│  ☑  Commonly Misspelled Words · 50         │
│  ☐  Tricky Doubles · 36                    │
│  ☐  Homophones & Confusables · 44          │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  Export 2 sets (92 cards)              ││  contained
│  └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### States

| State | Rendering |
|---|---|
| Nothing selected | Button disabled **with** a visible line "Choose at least one set" |
| **Legacy `.cards` format selected** | A `color.error-container` inline warning: *"The old format keeps only the first hint and answer for each card, and drops dates. 3 cards would lose an extra answer."* Legacy export is **one set at a time**, so the multi-select collapses to single-select with an explanation ([CAP-9](../documentation/capability-spec.md#cap-9--export--native-file-format-p0)) |
| Sharing | Hands off to `expo-sharing`; on web, triggers a download with a **sanitised filename** and a correct MIME type |
| Failure | Snackbar with a reason and a Retry action |

### Motion

None beyond the standard push and the sheet the OS presents.

### a11y

Checkbox rows: `role="checkbox"`, `accessibilityState={{ checked }}`, label
"SAT/GRE High-Frequency Words, 42 cards". The lossy-format warning is part of
the format control's accessible description so it is heard **before** the choice
is made, not after.

### i18n

`export.title` · `export.formatLabel` · `export.formatNative|Legacy` ·
`export.formatExplainer` · `export.legacyWarning` (ICU, with the affected count)
· `export.selectAll` · `export.action` (ICU, plural on sets and cards) ·
`export.needSelection`.

### Dark mode

Warning uses dark `error-container` `#93000A` / `on-error-container` `#FFDAD6`.

---

## S14 — About & Changelog

**CAP-18 · US-M1 · P0**

### Layout

```
┌────────────────────────────────────────────┐
│ ←  About                                   │
├────────────────────────────────────────────┤
│                                            │
│         [ Vocab Cards wordmark ]           │  asset.wordmark, scheme-aware
│                                            │
│              Version 1.0.0                 │  type.body-medium — ONE source,
│                                            │  derived from the build
│  Type the word. See exactly what you got   │  type.body-large
│  wrong. Try again until it's right.        │
│                                            │
│  📜  What's new                        →   │  → S14a
│  ❓  How marking works            (P1)  →   │  → S21
│  🛡  Privacy policy                     →   │  → S15
│  ✉  Contact                            →   │  mailto:
│  🔗  vocabcards.com                     →   │  external
│                                            │
│  Made by Kevin Stoner.                     │  type.body-small
│  Icons: Pictogrammers MDI (Apache-2.0).    │
└────────────────────────────────────────────┘
```

### S14a — Changelog

A `FlatList` of releases rendered **from a data file, not markup**
([CAP-18](../documentation/capability-spec.md#cap-18--about-changelog--legal-p0)):
version (`type.title-medium`), date (`type.body-small`,
`Intl.DateTimeFormat`), and bullet lines (`type.body-medium`). The current
version's row carries a "Current" chip.

### States

The version string appears **once** and comes from the build.
*(It is hard-coded in four separate places today —
[REBUILD_SPEC §8.5](../REBUILD_SPEC.md).)*
"How marking works" is hidden until P1 ships.

### a11y / i18n / Dark mode

Wordmark: `accessibilityRole="image"`, label "Vocab Cards". External links carry
`accessibilityHint` "Opens in your browser". Keys `about.*`, `changelog.*`;
changelog entries are data and are localisable per entry. Dark mode uses the
dark wordmark export.

---

## S15 — Privacy policy

**CAP-18 · US-M2 · P0**

Long-form prose in `type.body-large` on `color.surface`, from the same data file
that backs the hosted URL, with a "Last updated" date and a "View online"
external link. It must accurately distinguish **local-only by default** (no card
content leaves the device), what sync stores if enabled, and what analytics
collects and how to disable it — an inaccurate policy is a store-review failure
and a trust failure. Required in-app and at a stable URL before the first store
submission.

Body text is `on-surface`; headings `type.title-medium`; max-width 720 dp on
web. a11y: headings use `role="header"` so screen-reader users can navigate by
heading.

---

## S16 — First run & migration report

**CAP-8, CAP-11 · US-A7, G1 · P0**

### Purpose

The first thing a returning user sees. It must say, unambiguously, *your sets
are here*. And for a new user, it must not be a wall.

### Layout — returning user (legacy `localStorage` found, web)

```
┌────────────────────────────────────────────┐
│                                            │
│         [ Vocab Cards wordmark ]           │
│                                            │
│           Welcome back                     │  type.headline-medium
│                                            │
│  We found your card sets and moved them    │  type.body-large
│  over. Nothing was deleted.                │
│                                            │
│  ✓  6 sets · 248 cards                     │  ImportReportList
│  ✓  11 trophies                            │
│  ✓  Your selected set: SAT Words           │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  Start drilling                        ││  contained
│  └────────────────────────────────────────┘│
│           See what was imported            │  text button
└────────────────────────────────────────────┘
```

### Layout — new user

```
┌────────────────────────────────────────────┐
│         [ Vocab Cards wordmark ]           │
│                                            │
│  Type the word. See exactly what you       │  type.headline-small
│  got wrong.                                │
│                                            │
│ ┌────────────────────────────────────────┐ │  ← a live DiffStrip on a notecard.
│ │   A COLD DESSERT                       │ │    The product explained by
│ │══════════════════════════════════════  │ │    showing it, not telling it —
│ │ ┆ i  c  e     c  r  e  a  m            │ │    and the first thing a new user
│ │ ┆─────────∧────────────────────────────│ │    ever sees is a card with
│ │ ┆ i  c  e  #  c  r  e  a  m            │ │    writing on its lines.
│ │ ┆─────────┄┄───────────────────────────│ │
│ └────────────────────────────────────────┘ │
│                                            │
│  We've added four word lists to get you    │  type.body-medium
│  started. They're yours — edit or delete   │
│  them freely.                              │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  Start drilling                        ││
│  └────────────────────────────────────────┘│
│              Import my own cards           │  text button → S12
└────────────────────────────────────────────┘
```

### States

| Condition | Screen |
|---|---|
| Legacy storage found (same origin) | The "Welcome back" variant. **Legacy data is read, never deleted.** Starter sets are **not** seeded ([CAP-11](../documentation/capability-spec.md#cap-11--starter-content-p0)) |
| Legacy storage partially unreadable | The same screen plus a `QuarantineBanner`-styled row: "1 set couldn't be read. It hasn't been deleted." and a link to the detail |
| No legacy storage | The new-user variant, four starter sets seeded once, guarded by `starterContentVersion` |
| Not first run | This route is never reached |

**There is no sign-in on this screen, no account prompt, and no way to skip into
one.** Anonymous local-only use is the first-class path
([US-I1](../documentation/user-stories.md#us-i1--never-be-asked-to-sign-in-p0)).

### Motion

The DiffStrip on the new-user variant renders **statically** — it does not
animate a typing demo. A demo would be motion carrying meaning, and it would
delay the button. `motion.nav` out to Home.

### a11y

The demo strip is `accessibilityRole="image"` with the label "Example: the word
'ice cream' typed as 'icecream', with the missing space marked." — one sentence,
not the live-region announcement.

### i18n

`firstRun.welcomeBackTitle|Body` · `firstRun.migrationSets|Trophies|CurrentSet`
(ICU plural) · `firstRun.newTitle|Body` · `firstRun.demoA11y` ·
`firstRun.start` · `firstRun.importOwn` · `firstRun.seeImported`.

### Dark mode

Both variants on `color.surface` with a slate demo notecard. Dark wordmark
export.

---

## S17 — Account & sync **(P1)**

**CAP-13 · US-I1–I7 · P1 · v1 commitment**

### Layout — signed out (the default, forever, for anyone who wants it)

```
┌────────────────────────────────────────────┐
│ ←  Sync                                    │
├────────────────────────────────────────────┤
│  ☁  Sync is off                            │  cloud-off, on-surface-variant
│     Everything stays on this device.       │
│                                            │
│  Turn on sync to keep your sets, trophies  │  type.body-medium
│  and study settings on all your devices.   │
│  Your cards are only ever readable by you. │
│                                            │
│  [ Continue with Google ]                  │  outlined
│  [ Continue with Apple  ]                  │  outlined
│  [ Continue with email  ]                  │  outlined
│                                            │
│  Vocab Cards works completely without an   │  type.body-small
│  account. Nothing here is required.        │
└────────────────────────────────────────────┘
```

### Layout — signed in

```
│  👤  kevin@example.com                     │
│  ☁  Synced · 2 minutes ago                 │  SyncStatusRow
│  ──────────────────────────────────────    │
│  ℹ  How conflicts are handled          →   │  plain-language explainer (US-I7)
│  ↩  Sign out                               │
│  🗑  Delete account and cloud data          │  color.error
```

### States & rules

- **The signed-out state is a fact, not a funnel.** No badge, no dot, no count,
  no interstitial, no "sign in to continue". Reachable only from Settings. It
  may be offered contextually **at most once**, dismissibly and permanently, and
  **never during a drilling session**.
- **Sign-in adopts local data, never replaces it.** After signing in, a report:
  "6 sets uploaded · 2 merged · 1 renamed", using the same
  `ImportReportList` component as S12.
- **Sign-out defaults to keeping local data.** The dialog offers *Keep everything
  on this device* (default) and *Also remove this device's copy* (with a
  warning). Signing out must never be an accidental deletion.
- **Conflict explainer (US-I7):** "The most recent change wins, per set and per
  card. If a device has been offline a long time, its edit can replace a newer
  one made elsewhere." Stated plainly, in-app, not hidden.
- **Delete account (P0 for any build that ships accounts —
  [US-I6](../documentation/user-stories.md#us-i6--delete-my-account-and-my-data-p0-for-any-build-that-ships-accounts)):**
  a dedicated flow that (1) explains exactly what is deleted, (2) **offers to
  export first**, (3) separately asks whether to keep the local copy, and (4)
  requires typing the word DELETE to confirm. Required by both stores.

### a11y / i18n / Dark mode

Provider buttons are `role="button"` with full labels ("Continue with Google").
The delete flow's confirmation is `accessibilityViewIsModal` with the
consequences in the accessible description. Keys `sync.*`. Standard chrome in
both schemes.

---

## S18 — Trouble words & insights **(P1)**

**CAP-16 · US-L1, L2, L3 · P1 · differentiator**

### Layout

```
┌────────────────────────────────────────────┐
│ ←  Insights                    [All sets ▾]│
├────────────────────────────────────────────┤
│  💡  PATTERNS WE'VE NOTICED                │
│ ┌────────────────────────────────────────┐ │  ← Page
│ │ ┆ You've left out the second r in      │ │  type.body-large
│ │ ┆ embarrass 4 times.                   │ │  the word in MONO
│ │ ┆                    [ Drill this ]    │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ ┆ You often type ie where the word     │ │
│ │ ┆ has ei — 6 times across 4 words.     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  FIRST-TRY ACCURACY                        │
│  ▁▂▃▅▅▆▇  62% → 84% over 8 sessions        │  SVG sparkline + the numbers
│                                            │
│  WORDS THAT KEEP BEATING YOU               │
│  1  embarrass       missed 4× · Tuesday    │  TroubleWordRow
│     e m b a r_r a s s                      │  DiffStrip size="compact"
│  2  ice cream       missed 3× · Monday     │
│  3  necessary       missed 3× · last week  │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  ↻  Drill my 10 worst words            ││  contained
│  └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### Rules

- **Everything on this screen is computed and stored on the device.** With sync
  on it travels only inside the user's own account data. It is **never** sent to
  analytics, in any form
  ([US-L4](../documentation/user-stories.md#us-l4--keep-my-mistakes-private-p0)) —
  a P0 constraint even though the feature is P1. The screen carries a quiet
  footer stating this, because it is a trust feature and users should be told.
- A pattern is surfaced only at **≥ 3 occurrences**. Claiming a pattern from one
  mistake is noise.
- Patterns are **observations, never judgements**: "You've left out…", never
  "You struggle with…".
- Each pattern is a full ICU message with the word and count as parameters.

### States

- **Not enough data:** an `EmptyState` — "Keep drilling. After a few sessions
  we'll show you the patterns in your mistakes." with the accuracy sparkline
  hidden. Never a chart with two points.
- **No trouble words:** "Nothing is giving you trouble right now." with a
  `check-all` icon.

### a11y

The sparkline is `role="image"` with a label carrying the numbers
("First-try accuracy rose from 62% to 84% over 8 sessions") — the chart is
never the only representation. Pattern cards are one element each.

### Dark mode

Pattern cards are slate pages; the sparkline uses `color.primary` with a
`primary-container` fill at 24 %, both AA-safe in each scheme.

---

## S19 — Voice & dictation settings **(P1)**

**CAP-14 · US-J1, J3, J4 · P1**

A Settings sub-screen: a voice picker (`RadioButton.Item` per platform voice,
each with a **Preview** `IconButton`), a rate `Slider` (0.5× – 1.5×) with a
Preview button, and a "Dictation mode" explainer row.

**Graceful absence** — if the platform reports no voices, the entire screen is
replaced by a single `EmptyState`: "Your device doesn't have a speech voice
installed. Dictation mode isn't available." with a link to the OS settings.
Controls **hide, never fail**
([US-J4](../documentation/user-stories.md#us-j4--not-be-broken-by-a-device-with-no-voices-p1)).
On web, the row is hidden if `speechSynthesis` reports no voices.

a11y: the rate slider has `accessibilityValue` in words ("0.8 times normal
speed"). Keys `voice.*`.

---

## S20 — Paste / delimited import **(P1)**

**CAP-17 · US-B5, G5 · P1**

```
┌────────────────────────────────────────────┐
│ ←  Paste a list                            │
├────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐│
│  │ ravenous⇥extremely hungry              ││  multiline TextInput, MONO
│  │ exacerbate⇥to make worse               ││  (delimiters must be visible)
│  │ …                                      ││
│  └────────────────────────────────────────┘│
│  Separator  ( Tab │ , │ ; │ | )  auto: Tab │  SegmentedButtons
│  [ ⇄ Swap columns ]                        │
│                                            │
│  PREVIEW — 24 cards                        │
│  ┌────────────────────────────────────────┐│
│  │ ┆ extremely hungry → ravenous          ││  first 3 on a Page
│  │ ┆ to make worse    → exacerbate        ││
│  └────────────────────────────────────────┘│
│  ⚠  2 rows couldn't be read           →    │
│  ┌────────────────────────────────────────┐│
│  │  Add 24 cards                          ││
│  └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

**Rules:** the paste box is **monospaced** so tabs and double spaces are visible.
Delimiter auto-detected among tab / comma / semicolon / pipe, overridable. A
**live preview before anything is written**. Unparseable rows are reported and
skipped, never silently dropped and never aborting the import. UTF-8 with a BOM
tolerated and stripped. **Never gated behind a purchase.**

a11y: the preview count is a polite live region updating as the user types. Keys
`paste.*`.

---

## S21 — How marking works **(P1)**

**CAP-18 · US-M3 · P1**

The [`MarkLegend`](./spec.md#318-marklegend-custom) at full size: one notecard
per error kind — **five of them** — each showing a **live `DiffStrip`** with a
real example beside a plain-language sentence.

```
│ ┌────────────────────────────────────────┐ │
│ │ ┆  r a v a n o u s                     │ │  A WRONG LETTER
│ │ ┆       ▔▔                             │ │  You typed a different letter.
│ │ ┆                                      │ │  It's underlined, in red, and
│ │ ┆                                      │ │  struck through in your attempt.
│ └────────────────────────────────────────┘ │
```

Five kinds — wrong letter, missing letter, extra letter, **missing space**
(`#`), and **swapped letters** (the ribbon). Reachable from About, from the
session bar's `help-circle`, and once inline under the first diff a user ever
sees.

Because every mark here follows real proofreading convention, the explainer can
say so, which is a small trust win: *"These are the same marks a teacher would
use."*

**Because it renders the real component with the real tokens, it cannot drift
from the thing it explains.** a11y: each example is one element with the
explanation as its label. Keys `marking.*`.

---

## S22 — Session history **(P1)**

**CAP-6 · US-E4 · P1**

A per-set list of the last sessions (bounded at 50, pruned oldest-first): date,
mode chip, cards, and first-try accuracy as a percentage **and** a small bar.
Reachable from S2 and from S9. Tapping a row opens that session's stored
`SessionRecord` summary — **no card content is stored**, so the detail is counts
only, and the screen says so rather than looking broken.

a11y: each row is one element ("12 February, quick test, 10 cards, 70% first
try"). Keys `history.*`.

---

## S23 — Dictation session **(P1)**

**CAP-14 · US-J2 · P1**

[S7](#s7--test-session) with the `PromptBlock` replaced:

```
│ ┆  LISTEN                                 │
│ ┆                                         │
│ ┆            ┌─────────┐                  │
│ ┆            │   🔊    │                  │  64dp FAB, replayable
│ ┆            └─────────┘                  │  without limit
│ ┆         Tap to hear it again            │
│ ┆                                         │
```

**No text is shown until the card is passed.** Everything else — the answer
line, the diff, the retry loop, the progress rules — is **identical**. That is
the entire point: every other spelling app has audio without letter-level
feedback, and Anki has letter-level feedback without dictation
([Competitor Analysis](../documentation/competitor-analysis.md#the-character-level-diff-question)).

**States:** device muted → a `color.error-container` banner "Your device is
muted — you won't hear the word" with an inline unmute hint, because the prompt
would otherwise be invisible. No voice installed → the mode is not offered at
all. Speech never blocks the input: the field stays focused and typing works
while audio plays.

a11y: the replay button is labelled "Play the word again". A screen-reader user
in dictation mode gets the word spoken by the app, not by the screen reader —
the prompt is deliberately not in the accessibility tree as text.

---

## S24 — Multiple accepted answers **(P1)**

**CAP-2 · US-B6 · P1**

An additive change to [S4](#s4--card-editor--rapid-entry) and
[S5](#s5--card-editor--card-list): under the Answer field, a `mode="text"`
**+ Add another accepted answer** button. Each additional answer becomes its own
`AnswerLine` row with a remove `IconButton`. The same pattern applies to hints.

The first answer is the **primary** and is what a flipped session prompts with.
A helper line states the rule that matters: *"If you get it wrong, we'll mark
you against whichever accepted answer is closest to what you typed."*
([spelling-diff-spec.md §6](../documentation/spelling-diff-spec.md#6-multiple-accepted-answers))

The data model supports this from P0
([`spec.md` §2](./spec.md#2-data-model): `hints: string[]`, `answers: string[]`),
so this is presentation only. a11y: each row labelled "Accepted answer 2 of 3".
Keys `editor.addAnswer|removeAnswer|multiAnswerHelp`.

---

## Cross-screen checklist

Before any screen is called done:

- [ ] Reviewed in **both** schemes.
- [ ] Reviewed at **200 %** system font size — nothing truncated or clipped.
- [ ] **Every line of card text sits on a writing rule**, at font scales 1.0,
      1.3 and 2.0 ([AC-Notecard](./spec.md#ac-notecard--the-baseline-grid)).
- [ ] No `Page` draws an underline of its own — a field's state is carried by
      the writing rule it sits on.
- [ ] Every interactive element ≥ **48 × 48 dp** with a role and a label.
- [ ] No action available **only** via a gesture.
- [ ] Every empty state has an action; no dead ends.
- [ ] Every disabled control shows **why** it is disabled.
- [ ] Reduce-motion honoured; every animation start = end = identity.
- [ ] No hardcoded string; every one behind an i18n key with ICU plurals.
- [ ] No hex value in the component; every colour from a token.
- [ ] Nothing on the screen implies an account is needed.
- [ ] Works from a cold start in airplane mode.
