# Capability Specification — vocab-cards

| | |
| --- | --- |
| **Status** | Draft v0.2 |
| **Last updated** | 2026-08-08 |
| **Owner** | Kevin Stoner |
| **Derived from** | [Product Requirements Document](./product-requirements.md) |
| **Related** | [User Stories](./user-stories.md) · [Spelling Diff Spec](./spelling-diff-spec.md) · [Competitor Analysis](./competitor-analysis.md) · [REBUILD_SPEC.md](../REBUILD_SPEC.md) |

---

## Purpose & Scope

This document specifies **what the system must be able to do** — the discrete
capabilities, their inputs, outputs, behaviors, rules and dependencies —
bridging the *why/what* of the [PRD](./product-requirements.md) and the *how* of
technical design. It is implementation-aware (Expo / React Native / TypeScript
client; Firebase used only for opt-in sync and analytics) but it is **not** a
technical design document: it states capabilities and constraints, not schemas
or code.

**Priority key** (inherited from [PRD §6](./product-requirements.md#6-feature-requirements)):

| Tag | Meaning |
| --- | --- |
| **P0** | Launch-blocking. The store build does not ship without it. |
| **P1** | Fast follow. |
| **P1 · v1 commitment** | Committed by Kevin to the v1 product definition; fully specified and designed for now, but explicitly does **not** gate the launch build. See [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension). |
| **P2** | Later. |

**Status key:** `not built` · `partial` · `built`.

> **This table is the project's build tracker.** It is the one place a future
> session can ask "does this exist yet?" and get a trustworthy answer without
> reading the whole codebase. **Update the Status column whenever the real state
> changes.** A stale status column is worse than no status column.

### Capability map

| ID | Capability | Priority | PRD § | Stories | Status |
| --- | --- | --- | --- | --- | --- |
| [CAP-1](#cap-1--card-set-library--local-storage-p0) | Card Set Library & Local Storage | P0 | 6.1 | US-A1–A6, US-A8 | **built** |
| [CAP-2](#cap-2--card-authoring-p0) | Card Authoring | P0 | 6.2, 6.2.1 | US-B1–B4, US-B6 | built |
| [CAP-3](#cap-3--test-session-engine-p0) | Test Session Engine | P0 | 6.3 | US-C1–C10 | built |
| [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator) | Answer Evaluation & Spelling Diff | **P0 · differentiator** | 6.4, 6.2.1 | US-D1, US-D3a, US-C4, US-C6 | **built** |
| [CAP-5](#cap-5--feedback-presentation-p0) | Feedback Presentation | P0 | 6.4, 9 | US-D2, D3, D3a, D4–D6 | **built** |
| [CAP-6](#cap-6--session-results--missed-word-practice-p0) | Session Results & Missed-Word Practice | P0 | 6.5 | US-E1–E4 | built |
| [CAP-7](#cap-7--trophies--counters-p0) | Trophies & Counters | P0 | 6.6 | US-F1–F4 | built |
| [CAP-8](#cap-8--legacy-import--migration-p0) | Legacy Import & Migration | P0 | 6.7 | US-G1–G3 | built |
| [CAP-9](#cap-9--export--native-file-format-p0) | Export & Native File Format | P0 | 6.7 | US-G4 | built |
| [CAP-10](#cap-10--settings--preferences-p0) | Settings & Preferences | P0 | 6.8 | US-H1–H3 | built |
| [CAP-11](#cap-11--starter-content-p0) | Starter Content | P0 | 6.1 | US-A7 | built |
| [CAP-12](#cap-12--entity-identity--change-tracking-p0) | Entity Identity & Change Tracking | P0 | 6.1, 6.9 | US-A3, US-A4, US-I1 | **built** |
| [CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment) | Optional Account & Cloud Sync | **P1 · v1 commitment** | 6.9 | US-I1–I7 | not built |
| [CAP-14](#cap-14--speech-synthesis--dictation-p1) | Speech Synthesis & Dictation | P1 | 6.10 | US-J1–J4 | not built |
| [CAP-15](#cap-15--scheduling--smart-review-p1) | Scheduling & Smart Review | P1 | 6.11 | US-K1–K3 | not built |
| [CAP-16](#cap-16--trouble-words--error-insights-p1--differentiator) | Trouble Words & Error Insights | **P1 · differentiator** | 6.12 | US-L1–L4 | not built |
| [CAP-17](#cap-17--delimited-text--third-party-import-p1) | Delimited-Text & Third-Party Import | P1 | 6.7, 6.2 | US-B5, US-G5–G7 | not built |
| [CAP-18](#cap-18--about-changelog--legal-p0) | About, Changelog & Legal | P0 | 6.13 | US-M1–M3 | built |
| [CAP-19](#cap-19--telemetry--analytics-p1) | Telemetry & Analytics | P1 | 5, 9 | US-H3, US-L4 | not built |
| [CAP-20](#cap-20--premium-entitlement-p2) | Premium Entitlement | P2 | 8 | — | not built |

**20 capabilities. 13 are P0 and gate the launch build.**

> **Provenance note (2026-08-07):** this is a **greenfield rebuild**. Nothing in
> this table is built. The legacy Aurelia 1 app at
> [vocabcards.com](https://www.vocabcards.com) implements a *subset* of
> CAP-1 – CAP-4, CAP-7, CAP-8 and CAP-18 — see
> [REBUILD_SPEC.md](../REBUILD_SPEC.md) for exactly what and how — but **no
> legacy code is being ported except the diff algorithm**
> ([CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator)), and the
> legacy app's behavior is a *requirement source*, not an implementation.

---

## CAP-1 — Card Set Library & Local Storage (P0)

**Description:** Own every card set and card on the device, and every operation
on them. This is the single module through which all card data is read and
written; nothing else touches storage directly.

- **Inputs:** set name; card content; set/card ids; sort and search criteria;
  imported set payloads (from [CAP-8](#cap-8--legacy-import--migration-p0) /
  [CAP-17](#cap-17--delimited-text--third-party-import-p1)).
- **Outputs:** the library list (id, name, card count, last-used, updated-at);
  a set's ordered cards; the current-set selection; validation and conflict
  results.
- **Behaviors:**
  - List sets with card counts; search by name; sort by name, recently used, or
    card count.
  - Create, rename, delete, duplicate a set.
  - Select a set as **current**; clear the selection.
  - Read and write a set's cards.
  - Persist locally and survive app restart, offline, with no account.
- **Rules:**
  - **A set is addressed by its `id`, never by its name.** Renaming touches only
    metadata. *(This replaces the legacy design where the set name **is** the
    `localStorage` key — the root cause of a confirmed silent data-loss defect;
    see [CAP-12](#cap-12--entity-identity--change-tracking-p0).)*
  - **Name validation:** trimmed, non-empty, capped (**suggested 100
    characters**). Any character is permitted — names are not filesystem keys.
    Sanitisation happens only when generating an export filename
    ([CAP-9](#cap-9--export--native-file-format-p0)).
  - **Duplicate names are surfaced, never silently resolved.** Creating or
    importing a set whose trimmed name case-insensitively matches an existing
    one returns a conflict the caller must resolve as **Replace** (warning names
    the card count to be destroyed) / **Rename** (auto-suffixed suggestion
    `Name (2)`, incrementing until free) / **Cancel**. After resolution,
    duplicate names are permitted.
  - **Deleting the current set clears the selection to a real null**, not the
    string `"null"`. *(Legacy writes the literal string and only works by
    accident — [REBUILD_SPEC §13](../REBUILD_SPEC.md) bug 6.)*
  - **Every read validates against a schema.** Unparseable data is
    **quarantined and reported**, never discarded and never allowed to blank the
    UI. *(Legacy has no error handling on any `JSON.parse` of stored values;
    corrupt storage is a white screen.)*
  - **Writes are atomic per entity.** An interrupted write never leaves a set
    half-saved.
  - Deletions are **soft** (tombstoned) — see
    [CAP-12](#cap-12--entity-identity--change-tracking-p0).
  - Must stay responsive at **1 000 sets × 1 000 cards**; list rendering is
    virtualised and the library list is served from a summary index, not by
    loading every card.
- **Dependencies:** [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-2 — Card Authoring (P0)

**Description:** Create and edit the cards inside a set, in two modes: rapid
sequential entry, and a browsable list with inline editing.

- **Inputs:** hint text; answer text; card ordering; the set being edited.
- **Outputs:** persisted cards; validation errors; unsaved-work warnings.
- **Behaviors:**
  - **Rapid entry:** hint → answer → submit → a blank card with focus returned
    to the hint field. The keyboard action key advances. *(Preserves the legacy
    editor's flow, which is genuinely fast — [REBUILD_SPEC §8.4](../REBUILD_SPEC.md).)*
  - **List view:** all cards in the set, editable inline, deletable, reorderable.
  - Leaving the editor with both fields filled saves the card; with one field
    filled, warns before discarding; with neither, exits silently.
  - **P1 —** author multiple hints and multiple accepted answers per card
    ([PRD §6.2.1](./product-requirements.md#621-multiple-accepted-answers--p1),
    US-B6).
- **Rules:**
  - A card requires **≥ 1 non-empty hint and ≥ 1 non-empty answer** after
    trimming.
  - **Leading/trailing whitespace is trimmed on save; internal whitespace is
    preserved byte-exactly.** Internal spacing is spelling-significant and is
    what the missing-space marker depends on
    ([CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator)).
  - **Content length is capped at authoring time** (**suggested 256 characters**
    per hint and per answer) so that
    [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator)'s
    O(n·m) bound is never approached in normal use.
  - **The answer field defeats every spelling aid.** Autocorrect,
    autocapitalisation, spellcheck, predictive text/keyboard suggestions,
    autofill and smart-punctuation substitution are all disabled. Concretely:
    `autoCorrect={false}`, `autoCapitalize="none"`, `spellCheck={false}`,
    `autoComplete="off"`, `textContentType="none"`, and
    `importantForAutofill="no"` on Android; the equivalent HTML attributes on
    web. **Verify on a physical iOS device, a physical Android device and
    desktop web** — this regresses silently across framework upgrades and its
    failure destroys the product's purpose.
  - Cards keep an explicit **order** within a set; reordering rewrites only
    order, never identity.
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-3 — Test Session Engine (P0)

**Description:** Run a drilling session: select the cards, present them one at
a time, accept typed answers, drive retry and advancement, and produce the
record the results screen consumes.

- **Inputs:** source card set; session mode (**quick** *n* / **all** / **missed
  words** / *P1:* **review** / *P1:* **dictation**); the user's typed
  submissions; flip toggle; navigation actions (back, end).
- **Outputs:** the current prompt; per-attempt evaluation results (delegated to
  [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator));
  progress; counter increments for
  [CAP-7](#cap-7--trophies--counters-p0); a completed **session record** for
  [CAP-6](#cap-6--session-results--missed-word-practice-p0) and
  [CAP-16](#cap-16--trouble-words--error-insights-p1--differentiator).
- **Behaviors:**
  - **Start.** Validate first, navigate second (see Rules). Quick mode draws
    *n* cards at random (*n* from [CAP-10](#cap-10--settings--preferences-p0),
    default 10); if the set holds fewer than *n*, use what exists. All mode uses
    every card.
  - **Shuffle** with **Fisher–Yates on a copy**. *(Legacy uses
    `sort(() => 0.5 - Math.random())`, which is not a valid shuffle, is
    engine-dependent, and mutates the caller's array in place —
    [REBUILD_SPEC §9.2](../REBUILD_SPEC.md).)*
  - **Present** a card: prompt plus a text input **focused with the keyboard up
    the instant the card appears**, on every platform and every card. The
    keyboard action key submits.
  - **Submit → evaluate** via CAP-4.
    - **Correct:** `passed += 1`; confirm the answer; brief pause; advance.
    - **Incorrect:** `failed += 1`; render the diff via
      [CAP-5](#cap-5--feedback-presentation-p0); **keep the user's text and
      select it entirely** so a retry replaces it in one keystroke; the card
      does **not** advance and progress does **not** move.
  - **Advance:** `tested += 1`, progress recomputed, next card presented.
  - **Flip:** swap prompt and answer sides mid-session. Hints become the
    accepted answers and answers become the prompt; every CAP-4 rule applies
    unchanged to the swapped values.
  - **Back:** move to the previous card. **On the first card it is a no-op.**
    *(Behavior change: legacy silently exits the whole test —
    [REBUILD_SPEC §15](../REBUILD_SPEC.md).)*
  - **End test:** always available; confirms if cards remain; produces a
    results record for the portion completed.
  - **Finish:** on passing the last card, produce the session record and hand
    off to CAP-6.
- **Rules:**
  - **Validate before navigating, never after, and never drive visibility from
    an animation side-effect.** *(These two rules exist because their absence
    causes the most serious confirmed defect in the live app: an empty set
    passes the guard, the menu buttons are animated to `visibility: hidden`,
    navigation throws and aborts, and the user is left on a **blank, unusable
    screen recoverable only by reloading** — [REBUILD_SPEC §13 bug #1](../REBUILD_SPEC.md).
    Both are non-negotiable.)*
  - Starting with **no current set** or a **set of zero cards** is refused with
    a specific message and an action ("Choose a set" / "Add cards"). The app
    stays fully interactive.
  - **Unlimited retries.** No attempt cap, no reveal-answer, no override. A card
    advances only by being answered correctly.
  - **Counter semantics are preserved exactly** from the legacy app, because
    they feed trophy thresholds users have already partially earned:
    `tested` once per card advanced past; `passed` once per correct submission;
    `failed` once per **wrong attempt** (three wrong tries on one card
    increments it three times).
  - Progress is `cardsPassed / sessionLength`, advancing only on a pass.
  - **Navigation is explicit and named**, never `history.back()`. *(Legacy calls
    browser-back — sometimes twice — on an assumption about the entry path;
    [REBUILD_SPEC §7](../REBUILD_SPEC.md).)*
  - The session tracks **per-card attempt counts** so CAP-6 can report
    first-try passes and CAP-16 can aggregate.
  - A session in progress survives backgrounding; it is **not** required to
    survive a cold start (a resumable session is out of scope for v1).
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator),
  [CAP-5](#cap-5--feedback-presentation-p0),
  [CAP-7](#cap-7--trophies--counters-p0),
  [CAP-10](#cap-10--settings--preferences-p0).

---

## CAP-4 — Answer Evaluation & Spelling Diff (P0 · differentiator)

**Description:** Decide whether a submitted answer is correct and, when it is
not, compute the character-level difference that is the product's reason to
exist.

> **[spelling-diff-spec.md](./spelling-diff-spec.md) is the normative contract
> for this capability.** It carries the algorithm, the load-bearing tie-break
> order, the mutate-as-you-go alignment, the Unicode rules, the multiple-answer
> selection rule, the presentation contract and all **29** test vectors —
> **verified by execution on 2026-08-07**. This section does not restate any of
> it. Implement from that document.

- **Inputs:** the submitted string; the card's accepted answers; the
  case-sensitivity setting from
  [CAP-10](#cap-10--settings--preferences-p0).
- **Outputs:** an `AnswerEvaluation` — `{ correct, matchedAnswer, diff }` — where
  `diff` is `DiffSegment[]`, a **structured data value**, never an HTML string.
  See [spelling-diff-spec.md §2](./spelling-diff-spec.md#2-the-contract).
- **Behaviors:**
  - Normalise and compare per
    [spelling-diff-spec.md §4](./spelling-diff-spec.md#4-evaluation-rules).
  - On a mismatch, compute the diff per
    [spelling-diff-spec.md §3](./spelling-diff-spec.md#3-the-algorithm).
  - **Detect adjacent transpositions** — `receive` typed as `recieve` is **one**
    error, not two wrong letters.
  - With multiple accepted answers, score against the **closest** candidate per
    [spelling-diff-spec.md §6](./spelling-diff-spec.md#6-multiple-accepted-answers).
- **Rules:**
  - **The module is pure.** Two strings in, an array out. No React, no storage,
    no platform APIs, no i18n layer, no logging. It must be unit-testable with
    nothing but a JS runtime.
  - **Damerau–Levenshtein, restricted (optimal string alignment)** — *not* plain
    Levenshtein *(Kevin's decision, 2026-08-07)*. An adjacent transposition is a
    single edit costing exactly **1**, never 0 and never the substitution cost;
    costing it otherwise makes repeated letters report phantom swaps.
    - **This is a deliberate, approved departure from verbatim v0.2.0 parity**,
      which has no transposition concept. **Do not "fix" it back** to match
      [REBUILD_SPEC](../REBUILD_SPEC.md) — that document correctly records the
      old behavior, and the divergence is intentional. See
      [spelling-diff-spec.md §1.1](./spelling-diff-spec.md#11-intentional-departure-from-verbatim-parity--transposition-added-2026-08-07).
    - **Verified additive:** all 15 production vectors pass **unchanged** with
      transposition enabled.
  - **Tie-break order is `d → s → i → t`, each winning only on a strict `<`.**
    Transposition is evaluated **last**; the reasoning, and the measurements
    behind it, are in
    [spelling-diff-spec.md §3.3](./spelling-diff-spec.md#33-why-transposition-is-evaluated-last-in-the-tie-break).
    The order is behavior, not style.
  - **A transposed pair is two linked segments sharing a `pairId`**, never one
    segment — required by the reconstruction invariant and by per-character
    alignment
    ([spelling-diff-spec.md §2.4](./spelling-diff-spec.md#24-how-a-transposed-pair-is-represented)).
  - **Port verbatim, test, then refactor.** All 15 ground-truth vectors from
    [REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md) plus the 14 transposition vectors
    exist as executable characterization tests **before** any cleanup. The
    tie-break order and the `script.length === 1 → insert` special case are
    **behavior, not style**.
  - **No user-supplied string is ever interpreted as markup.** This is what
    eliminates, by construction, the **confirmed stored-XSS currently executing
    on the production domain** ([REBUILD_SPEC §13](../REBUILD_SPEC.md)).
  - Input is **bounded** ([spelling-diff-spec.md §8](./spelling-diff-spec.md#8-performance--bounds));
    beyond the cap, return a plain incorrect result with no marking rather than
    allocating a large matrix on the UI thread.
  - Unicode: NFC-normalise, and operate on grapheme clusters, per
    [spelling-diff-spec.md §5](./spelling-diff-spec.md#5-unicode-handling).
    **Verify on-device** — Hermes ships an incomplete `Intl`.
- **Dependencies:** none (deliberately — this is a leaf module).

---

## CAP-5 — Feedback Presentation (P0)

**Description:** Render an `AnswerEvaluation` so a user — sighted, colour-blind,
or using a screen reader — learns exactly what they got wrong.

- **Inputs:** an `AnswerEvaluation`; the active theme; reduce-motion and
  font-scale settings.
- **Outputs:** rendered feedback UI; a screen-reader live-region announcement;
  optional haptic feedback.
- **Behaviors:**
  - Render each `DiffSegment` as a real UI element, distinguishing the five
    kinds — `ok`, `wrong`, `missing`, `extra`, `transposed` — and rendering a
    **space error with visible extent**.
  - Confirm a correct answer visually **and** non-visually, echoing the stored
    casing.
  - Emit a polite live-region announcement naming the correct spelling **letter
    by letter** and summarising the errors in plain language.
  - **P1 —** render the user's own attempt aligned above the correct answer,
    both marked (US-D6).
- **Rules:**
  - **The marking follows proofreaders' correction marks** — caret for an
    omission, strikethrough for a deletion, the transpose mark for a swap, and
    **`#`** for a missing space *(changed from `_` on 2026-08-07, Kevin's
    decision — the underscore was never a proofreading convention)*. The full
    table is
    [spelling-diff-spec.md §7.1](./spelling-diff-spec.md#71-five-kinds-must-be-visually-distinguishable).
  - **Never colour alone.** Every non-`ok` status carries a second, non-colour
    signal. Verify under deuteranopia, protanopia and tritanopia simulation.
    The full contract is
    [spelling-diff-spec.md §7](./spelling-diff-spec.md#7-presentation-contract).
  - **A space error must never render as literal whitespace.** This is the
    single easiest requirement in the project to lose in a rewrite, and it is a
    feature **no competitor has**
    ([Competitor Analysis](./competitor-analysis.md#no-competitor-marks-a-missing-space-and-none-detects-a-transposition)).
  - **A transposed pair reads as ONE error.** The two segments sharing a
    `pairId` get a single mark spanning both — never two independent
    wrong-letter marks, which is the misleading output the feature exists to
    remove. **Group by `pairId`, never by adjacency**: two consecutive swaps
    produce four consecutive `transposed` segments that adjacency alone cannot
    disambiguate. The screen-reader announcement likewise reports one swap, not
    two wrong letters.
  - The correct spelling is fully readable through the marking.
  - Characters align predictably (tabular or monospaced treatment).
  - The announcement is **polite**, never assertive — it must not interrupt the
    user typing their retry — and long error lists are capped ("and 4 more").
  - Any attention animation (the legacy shake) respects reduce-motion and
    **cannot affect visibility or interactivity**.
  - Text scales with the user's system font size; layout reflows rather than
    truncating. *(Legacy sizes everything in viewport units, so a larger system
    font has no effect at all — [REBUILD_SPEC §11](../REBUILD_SPEC.md).)*
- **Dependencies:** [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator),
  [CAP-10](#cap-10--settings--preferences-p0).

---

## CAP-6 — Session Results & Missed-Word Practice (P0)

**Description:** Close the loop on a session: report what happened, show
precisely which words were missed, and let the user immediately re-drill them.

- **Inputs:** the completed session record from
  [CAP-3](#cap-3--test-session-engine-p0) — per-card attempts, first-try
  outcome, the first diff produced per missed card, elapsed time.
- **Outputs:** a results view; a **missed-card list**; a new session seeded from
  the missed cards; a persisted session-history entry.
- **Behaviors:**
  - Report cards completed, **cards passed on the first try**, total wrong
    attempts, and elapsed time.
  - List every card missed at least once with its answer and a compact rendering
    of the first diff recorded for it.
  - **Practice missed words** starts a new session containing only those cards —
    repeatable until the list is empty.
  - **Done** returns to the home screen by explicit navigation.
  - **P1 —** a short per-set session history: date, cards, first-try accuracy
    (US-E4).
- **Rules:**
  - A results view is produced for **every** session, including those ended
    early ([CAP-3](#cap-3--test-session-engine-p0)); an abandoned session reports
    only what was completed.
  - The missed-card list references cards **by id**, so a "practice missed"
    session still works if the underlying card was edited between sessions, and
    degrades gracefully (silently skipping) if it was deleted.
  - Session records are **local-only** by default and carry **no card content** —
    only card ids, counts and diff summaries — so history stays compact and
    [CAP-19](#cap-19--telemetry--analytics-p1)'s no-content rule is structurally
    easy to honour.
  - Session history is retained with a bound (**suggested: the last 50 sessions
    per set**), pruned oldest-first.
- **Dependencies:** [CAP-3](#cap-3--test-session-engine-p0),
  [CAP-5](#cap-5--feedback-presentation-p0),
  [CAP-1](#cap-1--card-set-library--local-storage-p0).

---

## CAP-7 — Trophies & Counters (P0)

**Description:** Maintain the three lifetime counters, unlock the 24 trophies
against them, notify on unlock, and present them on a screen that — for the
first time — actually exists.

- **Inputs:** counter increments from
  [CAP-3](#cap-3--test-session-engine-p0); legacy trophy state from
  [CAP-8](#cap-8--legacy-import--migration-p0).
- **Outputs:** the three counters; each trophy's locked/unlocked state, progress
  and unlock date; unlock notifications.
- **Behaviors:**
  - Increment `tested`, `passed`, `failed` per
    [CAP-3](#cap-3--test-session-engine-p0)'s counter semantics.
  - Evaluate all 24 thresholds after each increment; unlock and notify newly
    crossed ones **once each**.
  - Present a **trophies screen**: every trophy locked and unlocked, its
    requirement, the unlock date, and progress toward the next in each category.
  - Show a **dismissible** unlock toast.
- **Rules:**
  - **All 24 trophies preserved exactly**, thresholds unchanged
    *(Kevin's decision, 2026-08-07)*:

    | Type | Thresholds | Count |
    | --- | --- | --- |
    | Cards tested | 10, 50, 100, 500, 1 000, 5 000, 10 000, 50 000, 100 000 | 9 |
    | Cards passed | 50, 100, 500, 1 000, 5 000, 10 000, 50 000, 100 000 | 8 |
    | Cards failed | 10, 50, 100, 500, 1 000, 5 000, 10 000 | 7 |

  - **Implemented as data, not a class hierarchy:** three integer counters, a
    declarative threshold table, and a set of already-notified trophy ids.
    *(Legacy uses an abstract class with three subclasses differing only in a
    type string and display text, each storing its own counter —
    [REBUILD_SPEC §9.3](../REBUILD_SPEC.md).)*
  - **A missed toast is not a lost event** — the trophies screen is the durable
    record.
  - **Legacy migration rule — get this exactly right or you silently erase
    years of a user's progress.** Legacy stores a *per-trophy* counter, and
    `updateTrophyType` **skips already-obtained trophies**, so each trophy's
    counter **freezes at its own goal** while un-obtained ones keep counting.
    To recover the true global counter for each type:

    > **`counter = max(storedCounter)` across all trophies of that type**, and
    > **`unlocked = { t : t.storedCounter >= t.goal }`**, and
    > **`alreadyNotified = { t : t.newObtained === false }`**.

    Worked example: a user who has tested 14 cards has `tested(goal 10) = 10`
    (frozen) and `tested(goal 50…100000) = 14`; `max = 14`. ✅
    **Known, accepted limitation:** once *every* trophy of a type is obtained,
    all its counters are frozen at their goals, so the recovered counter caps at
    the largest goal (e.g. 100 000 tested). At that point all trophies of that
    type are already unlocked, so nothing user-visible is lost. Document it;
    do not try to fix it.
  - `Trophy.name` in the legacy payload is declared but never assigned and
    serialises as absent — **do not rely on it**
    ([REBUILD_SPEC §6](../REBUILD_SPEC.md)).
  - Counters are **monotonic**, which is what makes them safely mergeable under
    sync — see [CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment).
  - **P2 —** additional trophy categories (streaks, accuracy, perfect sessions)
    are **additive only**. Changing or removing an existing trophy rewrites
    users' history and is forbidden.
- **Dependencies:** [CAP-3](#cap-3--test-session-engine-p0),
  [CAP-8](#cap-8--legacy-import--migration-p0).

---

## CAP-8 — Legacy Import & Migration (P0)

**Description:** Guarantee that no existing user loses anything — from either
in-browser storage on the same origin, or `.cards` files on disk.

- **Inputs:** legacy `localStorage` keys on the `vocabcards.com` origin
  (`keys`, `current`, `<setName>.cards`, `trophies`); one or more selected
  `.cards` files.
- **Outputs:** imported sets and cards; migrated trophy state; a per-item
  outcome report; a quarantine record for anything unparseable.
- **Behaviors:**
  - **Automatic same-origin migration (web).** On first run, detect legacy
    `localStorage` and adopt sets, cards, the current-set selection and trophy
    progress with no user action.
  - **`.cards` file import**, one or many, from the file picker or a share
    intent.
  - Report per item: imported / renamed / replaced / failed, with a reason.
- **Rules:**
  - **Legacy data is read, never deleted, until migration has demonstrably
    succeeded** — and even then, prefer marking it migrated over removing it.
    The failure mode being defended against is a returning user losing years of
    sets; asymmetric caution is correct.
  - **Legacy format** ([REBUILD_SPEC §6](../REBUILD_SPEC.md)): a `.cards` file
    is the raw JSON of `Array<{ definitions: string[]; answers: string[] }>`,
    byte-identical to the `localStorage` value; the **set name is the filename
    minus the trailing `.cards`**. Both `definitions` and `answers` are arrays
    that only ever hold index `[0]` in practice, but the importer must accept
    **any** length and map them onto the rebuild's real multi-value hints and
    answers.
  - **Every selected file is imported.** *(Fixes a confirmed defect: legacy
    reuses a single `FileReader` across the loop and calls `readAsText` before
    assigning `onload`, so selecting two files imports only the first, silently
    — [REBUILD_SPEC §13](../REBUILD_SPEC.md) bug 5. The picker advertises
    `multiple`, so users are actively invited into the broken path.)*
  - **Imported files are untrusted input.** Validate structure and types
    **before** writing anything; fail safely on malformed data; never leave the
    library partially imported. A file containing markup or script is inert
    data — no import path may produce a value that is later interpreted as
    markup ([CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator)).
  - Name collisions route through
    [CAP-1](#cap-1--card-set-library--local-storage-p0)'s conflict prompt.
  - **Legacy `current` may be the literal string `"null"`** — treat it as no
    selection ([REBUILD_SPEC §13](../REBUILD_SPEC.md) bug 6).
  - Trophy state migrates by [CAP-7](#cap-7--trophies--counters-p0)'s `max()`
    rule.
  - Imported entities are assigned fresh ids and timestamps by
    [CAP-12](#cap-12--entity-identity--change-tracking-p0); the legacy format
    carries neither.
  - Anything unparseable is **quarantined and surfaced**, never silently
    dropped.
  - **`.cards` import is supported indefinitely.** It is the only route existing
    users' archives have.
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-7](#cap-7--trophies--counters-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-9 — Export & Native File Format (P0)

**Description:** Let the user take everything out, in a format that round-trips
losslessly and in the legacy format for backwards compatibility.

- **Inputs:** a selection of one, several, or all sets; the target format.
- **Outputs:** a file offered to the platform's share/save mechanism.
- **Behaviors:**
  - Export one set, a multi-select of sets, or the whole library.
  - **Native format (`.vocabcards`)** — versioned, self-describing, multi-set,
    UTF-8 JSON, carrying ids, timestamps, hints and answers as real arrays, and
    the format version. Structure — **illustrative shape, not a fixture**:
    `…uuid…` stands for a UUID v4 and `…` for an ISO-8601 timestamp like
    `exportedAt`'s; the file itself is plain JSON with no comments.

    ```json
    {
      "format": "vocabcards",
      "formatVersion": 1,
      "exportedAt": "2026-08-07T12:00:00.000Z",
      "app": { "name": "Vocab Cards", "version": "1.0.0" },
      "sets": [{
        "id": "…uuid…", "name": "SAT Words",
        "createdAt": "…", "updatedAt": "…",
        "cards": [{
          "id": "…uuid…",
          "hints":   ["Extremely hungry"],
          "answers": ["ravenous"],
          "order": 0, "createdAt": "…", "updatedAt": "…"
        }]
      }]
    }
    ```

  - **Legacy `.cards` export** remains available, one set at a time, producing
    the exact legacy shape so the file still opens in the old app.
  - **P1 —** delimited-text export (US-G6).
- **Rules:**
  - **Export → import must reproduce a set exactly.** This round-trip is a test.
  - `formatVersion` is present from v1 and every importer branches on it.
    Unknown future versions fail with a clear message, never a partial import.
  - **Legacy export is lossy by definition** — multiple hints/answers collapse to
    index `[0]`, ids and timestamps are dropped. **Warn the user** when
    exporting a set that would lose data this way.
  - Filenames are **sanitised** at generation: path separators and control
    characters removed, length capped, collisions suffixed. *(Legacy uses the
    raw set name, so a name containing `/` produces an invalid download.)*
  - The export payload is built with a proper serialiser and a correct MIME
    type. *(Legacy builds a `data:charset=utf-8,…` URL **with no MIME type** —
    [REBUILD_SPEC §13](../REBUILD_SPEC.md) bug 10.)*
  - Export works fully offline and requires no account.
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-10 — Settings & Preferences (P0)

**Description:** Own every user preference, its default, its storage scope, and
whether it syncs.

- **Inputs:** user selections.
- **Outputs:** current preference values, readable synchronously by every other
  capability.
- **Behaviors:** present, change and persist the settings below; apply changes
  immediately with no restart.
- **Rules:**

  | Setting | Options | Default | Priority | Scope |
  | --- | --- | --- | --- | --- |
  | Case sensitivity | Ignore case / Require exact case | **Ignore case** | P0 | Syncs |
  | Quick-test size | 5 / 10 / 20 / 50 | **10** | P0 | Syncs |
  | Default prompt side | Hint first / Answer first | **Hint first** | P0 | Syncs |
  | Appearance | System / Light / Dark | **System** | P0 | **Device-local** |
  | Haptics | On / Off | **On** (mobile) | P0 | Device-local |
  | Analytics | On / Off | **On** | P0 | **Device-local** |
  | Speech voice & rate | platform voices | platform default | P1 | Device-local |
  | Scheduling mode | Off / On | **Off** | P1 | Syncs |
  | Per-set prompt side | override | inherit | P1 | Syncs |

  - **Defaults preserve legacy behavior**: case-insensitive comparison and a
    10-card quick test are exactly what the live app hard-codes. A returning
    user notices no change.
  - **Appearance and analytics are deliberately device-local** — a phone in dark
    mode and a laptop in light mode is the correct outcome, and an analytics
    opt-out must be honourable on one device without an account.
  - **The analytics opt-out is honoured before any event is emitted**, including
    the first-run session ([CAP-19](#cap-19--telemetry--analytics-p1)).
  - Every setting reads correctly with **no account and no network**.
  - **The Settings screen ships with real settings or it does not ship.** *(It
    has shown "Currently there are no settings available to change" since 2017 —
    [REBUILD_SPEC §8.1](../REBUILD_SPEC.md).)*
- **Dependencies:** [CAP-12](#cap-12--entity-identity--change-tracking-p0) (for
  the syncing subset).

---

## CAP-11 — Starter Content (P0)

**Description:** Seed a first-run library so the app is never an empty room —
and so the empty-set path is not the first thing a new user meets.

- **Inputs:** first-run detection; the seeded-content version marker.
- **Outputs:** four card sets in the library.
- **Behaviors:** on first launch, create four ordinary sets — *Commonly
  Misspelled Words*, *Tricky Doubles*, *Homophones & Confusables*, *SAT/GRE
  High-Frequency Words* — of **30–50 cards each**.
- **Rules:**
  - They are **ordinary sets**: fully editable, renameable, deletable,
    exportable. There is no read-only concept.
  - **Seeded exactly once**, guarded by a persisted `starterContentVersion`
    marker. If the user deletes them they never return. Bumping the marker in a
    future release must **not** re-seed sets the user already deleted or edited.
  - **Not seeded** when [CAP-8](#cap-8--legacy-import--migration-p0) has migrated
    an existing library — a returning user with their own sets does not want
    four new ones.
  - Content must be **independently compiled or public domain**. No copyrighted
    word list is reproduced. Hints are short definitions or usage clues; answers
    are the words.
  - Content is **English/US** and lives in a data file, not in code, so it is
    replaceable per locale later
    ([Cross-Cutting Constraints](#cross-cutting-constraints-apply-to-all-capabilities)).
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-8](#cap-8--legacy-import--migration-p0).

---

## CAP-12 — Entity Identity & Change Tracking (P0)

**Description:** Give every set and card a stable identity and a change history
that makes sync a pure addition later. **This is the one-way door of the entire
project.**

> **Why this is P0 even though sync is not.** Retrofitting identity onto data
> that thousands of card sets already exist in is the single most expensive
> mistake available here. It costs days now and a migration on real users'
> libraries later. It also independently fixes the confirmed duplicate-name
> data-loss defect, so it earns its P0 twice over. See
> [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension).

- **Inputs:** entity creation and mutation events from
  [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-2](#cap-2--card-authoring-p0), [CAP-7](#cap-7--trophies--counters-p0),
  [CAP-8](#cap-8--legacy-import--migration-p0),
  [CAP-10](#cap-10--settings--preferences-p0).
- **Outputs:** ids, timestamps, tombstones, and a per-entity change record.
- **Behaviors:** assign an id on creation; stamp `updatedAt` on every mutation;
  tombstone on delete; expose the change set a future sync engine needs.

### 12.1 Required entity shape

Field names are illustrative; **the properties are the requirement**.

| Entity | Fields |
| --- | --- |
| **CardSet** | `id` (UUID v4, client-generated) · `name` · `order`/`lastUsedAt` · `createdAt` · `updatedAt` · `deletedAt \| null` · `schemaVersion` |
| **Card** | `id` (UUID v4) · `setId` · `hints: string[]` · `answers: string[]` · `order` · `createdAt` · `updatedAt` · `deletedAt \| null` |
| **CardStats** | `cardId` · `attempts` · `firstTryPasses` · `failures` · `lastSeenAt` · **reserved scheduling fields** (`interval`, `ease`, `dueAt`) |
| **TrophyState** | `tested` · `passed` · `failed` (monotonic ints) · `notifiedTrophyIds: string[]` · `unlockedAt` per trophy |
| **Preferences** | the syncing subset from [CAP-10](#cap-10--settings--preferences-p0) · `updatedAt` |

### 12.2 Data-shape pressure test

Walking one real card set through every operation, to confirm the shape actually
supports them:

| Operation | Does the shape support it? |
| --- | --- |
| **Created offline, no account** | ✅ `id` is a client-generated UUID. No server round-trip, no account, and the id is already sync-ready. |
| **Renamed** | ✅ `name` is metadata; `id` is unchanged; no card is touched; no reference breaks. *(The legacy shape fails here — the name **is** the key.)* |
| **Card edited** | ✅ Per-card `id` and `updatedAt` mean one card's edit is independent of the rest of the set — which is what makes per-card merge possible later. |
| **Card deleted** | ✅ `deletedAt` tombstone. Without it, a deletion on device A could never propagate to device B, and a re-sync would silently resurrect the card. |
| **Set deleted, then the user regrets it** | ✅ Tombstoned rather than erased; recoverable within the retention window. |
| **Listed in the library** | ✅ The summary index carries `id`, `name`, card count and `updatedAt` — no need to load every card to render the list at 1 000 sets. |
| **Exported and re-imported on another device** | ✅ Ids travel in the native format ([CAP-9](#cap-9--export--native-file-format-p0)), so re-importing an already-synced set is recognised as the same set rather than duplicated. |
| **Imported from a legacy `.cards` file** | ✅ Fresh ids and timestamps assigned at import. Legacy files carry neither and never will. |
| **Two sets deliberately share a name** | ✅ Permitted — identity is `id`. The conflict prompt is a UX affordance, not a uniqueness constraint. |
| **Scheduling turned on 6 months later** | ✅ `CardStats` and its reserved fields exist from day one, so [CAP-15](#cap-15--scheduling--smart-review-p1) is a feature, not a migration. |
| **Signing in after months of local use** | ✅ Local UUIDs are globally unique, so upload is a union with no id collisions — see [CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment). |
| **Trophy counters merged across two devices** | ✅ Counters are monotonic, so `max()` per counter and union of `notifiedTrophyIds` is a correct, order-independent merge. |

- **Rules:**
  - **Ids are UUID v4, generated on the client, never derived from content or
    name.** They must be assignable with no network and no account.
  - **Every mutation stamps `updatedAt`.** No exceptions — a missed stamp is a
    silently-lost sync later.
  - **Deletes are soft.** Tombstones are retained for a bounded window
    (**suggested 90 days**), then purged. Purging a tombstone that has never
    synced is forbidden while an account exists.
  - **`schemaVersion` is present from v1** and every read branches on it, so a
    future model change is a migration rather than a break.
  - **This capability must be complete before any user creates data**, i.e.
    before the launch build ships. That is the entirety of the argument for its
    P0.
- **Dependencies:** none.

---

## CAP-13 — Optional Account & Cloud Sync (P1 · v1 commitment)

**Description:** Let a user *optionally* sign in and have their library,
trophies and study settings follow them across devices — without the app ever
becoming an app that requires an account.

> **Sequencing (resolved in [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension)).**
> Kevin committed sync to v1. Its **data-model prerequisites are P0**
> ([CAP-12](#cap-12--entity-identity--change-tracking-p0)) and ship in the launch
> build; **the sync service itself is P1 and does not gate the launch.** It is
> first in the fast-follow queue. If it is ready when the launch build is, it
> ships in it — nothing prevents that. If it slips, launch proceeds without it,
> because four confirmed defects (including a soft-lock and an XSS) are live on
> production now and sync is a *pure addition* to a local-first app: no
> migration, no behavior change for anyone who ignores it.

### 13.1 The optionality constraint (P0 — this part gates the launch build)

**Anonymous, local-only, offline use is a first-class supported mode, not a
degraded one.** This is a constraint on how *everything else* is built, so it is
P0 even though the rest of the capability is not (US-I1).

- There is **no** sign-in wall, **no** "sign in to continue" interstitial, and
  **no** signed-out empty state anywhere in the app.
- **Local-only mode makes no authentication calls of any kind** — no anonymous
  auth session, no silent account creation, no device registration. "No account"
  means no account, verifiable by watching the network.
- Every capability except this one behaves **identically** signed out.
- Sign-in is discoverable in Settings and may be offered **at most once**
  contextually — dismissibly, permanently, and never during a drilling session.
- Rationale is competitive, not just ethical: account-free operation is a
  marketed feature of the closest philosophical competitor
  ([Competitor Analysis takeaway 10](./competitor-analysis.md#key-takeaways-for-our-product)).

### 13.2 The sync service (P1 · v1 commitment)

- **Inputs:** an auth credential (Google, Apple, email); local entities and
  their change records from
  [CAP-12](#cap-12--entity-identity--change-tracking-p0); remote entities.
- **Outputs:** a merged library on every signed-in device; sync status; an
  adoption report on first sign-in; account deletion.
- **Behaviors:**
  - Sign in / sign out / delete account.
  - Sync sets, cards, trophy state and the syncing subset of preferences.
  - Queue changes offline and reconcile on reconnect.
  - Surface sync status unobtrusively.
- **Rules:**
  - **Sign-in adopts local data, never replaces it** (US-I3). Local UUIDs are
    globally unique, so the merge is a **union by id**. Name collisions between
    local and cloud sets route through
    [CAP-1](#cap-1--card-set-library--local-storage-p0)'s prompt. The user is
    told what happened: *n* uploaded, *n* merged, *n* renamed.
  - **Sign-out defaults to keeping local data** (US-I4). The alternative —
    remove this device's copy — is offered explicitly with a warning. Signing
    out must never be an accidental deletion.
  - **Conflict policy: last-writer-wins at document granularity** (per set, per
    card), ordered by a **server-assigned** timestamp so client clock skew
    cannot reorder writes. Offline edits take the timestamp of when they reach
    the server.
    - **Accepted limitation, documented not hidden** (US-I7): a device offline
      for a long time can overwrite a newer edit made elsewhere. This is
      single-user multi-device sync, not collaboration — the blast radius is one
      person's own edit. Per-field merge is disproportionate. Surface the rule
      in plain language in-app.
  - **Per-card documents, not one document per set.** A set of 200 cards edited
    on two devices must merge per card; whole-set granularity would discard one
    device's edits wholesale.
  - **Trophy merge is `max()` per counter and a union of `notifiedTrophyIds`** —
    correct and order-independent because the counters are monotonic
    ([CAP-7](#cap-7--trophies--counters-p0)).
  - **Tombstones sync**, or deletions silently resurrect.
  - **Default-deny backend rules.** A user can read and write only their own
    data. Every new collection or field ships with matching rule coverage.
  - **Card content is never readable by anyone but its owner**, and never leaves
    the device at all in local-only mode.
  - **P0 for any build that ships accounts — in-app account and data deletion**
    (US-I6). Required by **both** the Apple App Store and Google Play for any
    app offering account creation. Launch-blocking for that build, not a
    fast-follow. It must: be reachable in-app with no email to support; explain
    exactly what is deleted; require explicit confirmation; delete the account
    and all its cloud data; offer an export first; and separately ask whether to
    keep the local copy.
  - Store privacy declarations (Apple "App Privacy", Google "Data Safety") must
    accurately describe **both** local-only and synced modes.
  - **Cost note:** sync is the only capability with an ongoing marginal cost. If
    it ever becomes material, the correct lever is a fair-use cap on **new**
    accounts with existing users grandfathered — **never** a retroactive paywall
    on a shipped free feature. See
    [PRD §8.4](./product-requirements.md#84-the-one-honest-cost-risk-to-watch).
- **Dependencies:** [CAP-12](#cap-12--entity-identity--change-tracking-p0),
  [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-7](#cap-7--trophies--counters-p0),
  [CAP-10](#cap-10--settings--preferences-p0),
  [CAP-18](#cap-18--about-changelog--legal-p0) (privacy policy).

---

## CAP-14 — Speech Synthesis & Dictation (P1)

**Description:** Speak answers aloud, and run sessions where the spoken word is
the only prompt — closing the largest table-stakes gap in the product.

- **Inputs:** the text to speak; voice and rate from
  [CAP-10](#cap-10--settings--preferences-p0); the platform's available voices.
- **Outputs:** audio playback; a dictation session mode for
  [CAP-3](#cap-3--test-session-engine-p0); voice availability state.
- **Behaviors:**
  - Speak the answer on demand from the test screen and the results screen.
  - **Dictation mode:** the prompt is audio only, replayable without limit; no
    text is shown until the card is passed.
  - Enumerate platform voices; let the user choose one and set the rate.
- **Rules:**
  - **On-device TTS only in P1** — offline, free, no API cost, no account, no
    data leaving the device. Cloud/neural voices are P2 and are the only
    honestly cost-justified candidate for a future paid gate
    ([PRD §8](./product-requirements.md#8-monetization)).
  - **The spelling feedback works unchanged in dictation mode.** This is the
    entire point: every other spelling app has audio without letter-level
    feedback, and Anki has letter-level feedback without dictation. The
    intersection is empty
    ([Competitor Analysis](./competitor-analysis.md#the-character-level-diff-question)).
  - **Graceful absence.** Where no voice is installed, audio controls **hide**
    rather than fail, and dictation mode is unavailable with a short
    explanation. Availability is detected, never assumed.
  - Audio respects the device's silent/mute switch and ducks appropriately;
    dictation mode warns if the device is muted, since the prompt would
    otherwise be invisible.
  - Speech must not block the input — the field stays focused and typing works
    while audio plays.
  - **P2 —** per-card recorded audio. Deferred deliberately: it introduces
    binary media into the data model, the file format and sync.
- **Dependencies:** [CAP-3](#cap-3--test-session-engine-p0),
  [CAP-10](#cap-10--settings--preferences-p0).

---

## CAP-15 — Scheduling & Smart Review (P1)

**Description:** Choose *which* cards to drill based on the user's actual
performance, rather than at random.

- **Inputs:** `CardStats` accumulated from every session
  ([CAP-12](#cap-12--entity-identity--change-tracking-p0)); the scheduling
  setting.
- **Outputs:** a due-card selection for a **Review** session; per-card interval
  and due date.
- **Behaviors:**
  - Record per-card attempts, first-try passes, failures and last-seen time from
    the launch build onward. **The recording is effectively P0** — the fields
    exist and are written in v1 so that enabling scheduling later is a feature,
    not a migration — while the *scheduling* is P1.
  - Offer a **Review** session type selecting recently-failed, long-unseen and
    never-seen cards.
  - Maintain an **SM-2-derived** interval and ease per card.
- **Rules:**
  - **The grade is derived from the typed answer, not from self-rating.** A
    first-try pass is a good grade; a pass after *n* failures degrades with *n*.
    Self-rating is precisely what this product refuses to do — the typed answer
    already tells the truth.
  - **Scheduling never hijacks the manual modes.** "10 Cards" and "All Cards"
    behave exactly as they do today, forever. Review is a third option. A user
    cramming must be able to hammer one list twenty times in an hour.
  - Scheduling is **off by default** ([CAP-10](#cap-10--settings--preferences-p0)).
  - **SM-2 over FSRS, deliberately:** simple, well-documented, fully explainable
    to the user, and needs no training data. FSRS's advantage (~20–30% fewer
    reviews at equal retention) matters at Anki's scale of daily reviews, not
    for someone drilling a 40-word list before an exam. **Note:** the widely
    repeated claim that FSRS is Anki's *default* could **not** be confirmed —
    see [Competitor Analysis — Unconfirmed Claims](./competitor-analysis.md#unconfirmed-claims).
    Do not repeat it.
  - `CardStats` is keyed by card `id`, so it survives editing a card's text and
    is discarded with the card.
  - **P2 —** FSRS, if real usage ever shows review volume high enough to justify
    it.
- **Dependencies:** [CAP-3](#cap-3--test-session-engine-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0),
  [CAP-10](#cap-10--settings--preferences-p0).

---

## CAP-16 — Trouble Words & Error Insights (P1 · differentiator)

**Description:** Aggregate what the diff already computes on every failure —
*which characters* the user got wrong — into insight nobody else in the market
can offer.

- **Inputs:** per-attempt `DiffSegment[]` and card ids from every session
  ([CAP-3](#cap-3--test-session-engine-p0),
  [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator)).
- **Outputs:** a ranked trouble-word list; recurring error patterns in plain
  language; first-try accuracy trends; a drill session seeded from trouble
  words.
- **Behaviors:**
  - Rank cards by failure frequency and recency, per set and overall; one tap
    drills just those.
  - Detect **recurring error shapes** across attempts — a repeatedly dropped
    doubled letter, a consistently transposed pair, a habitually omitted space,
    a specific vowel substitution — and render them as sentences:
    *"You've left out the second `r` in **embarrass** 4 times."*
  - Show first-try accuracy over time per set.
- **Rules:**
  - **P0 privacy constraint (US-L4):** all of this is computed and stored **on
    the device**. With sync enabled it travels only inside the user's own
    account data. It is **never** sent to analytics, in any form, ever. This is
    P0 because it constrains how the P0 data model and
    [CAP-19](#cap-19--telemetry--analytics-p1) are built, even though the
    feature is P1.
  - Aggregation stores **error summaries, not full attempt transcripts** —
    enough to rank and to name a pattern, bounded in size, pruned with the
    session history.
  - A pattern is only surfaced above a **minimum support threshold**
    (**suggested: 3 occurrences**). Claiming a pattern from one mistake is
    noise and undermines trust in the feature.
  - Patterns are phrased as observations, never as judgements.
  - **Sequenced after launch on purpose:** it needs a few weeks of real per-card
    data behind it before it says anything interesting
    ([PRD §7.2](./product-requirements.md#72-the-fast-follow-queue--p1-in-order)).
  - **This is the only genuinely novel capability in the product.** No
    competitor can ship it without first building a character-level diff, and
    only one competitor computes one at all — behind a card-template hack.
    Treat it as the long-term differentiator, not a nice-to-have.
- **Dependencies:** [CAP-4](#cap-4--answer-evaluation--spelling-diff-p0--differentiator),
  [CAP-6](#cap-6--session-results--missed-word-practice-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-17 — Delimited-Text & Third-Party Import (P1)

**Description:** Get word lists in from wherever they already live. This is the
acquisition channel, not a convenience.

- **Inputs:** pasted text or an opened file; a delimiter override; a
  column-swap toggle.
- **Outputs:** a preview of the resulting cards; imported cards; a per-row
  outcome report.
- **Behaviors:**
  - Accept **pasted text** (into a new or existing set — US-B5) or a **file**.
  - **Auto-detect the delimiter** among tab, comma, semicolon and pipe; let the
    user override.
  - Let the user swap which column is the hint and which is the answer.
  - Show a **live preview** — card count and the first several cards — before
    anything is written.
  - **P1 —** delimited-text export (US-G6).
  - **P2 —** Anki `.apkg` import (US-G7).
- **Rules:**
  - **UTF-8, with a BOM tolerated and stripped.** Non-ASCII content is normal,
    not exceptional.
  - Quoted fields and embedded delimiters are handled per RFC 4180 for the comma
    case; a field containing the delimiter must not silently split a card.
  - Rows that cannot be parsed are **reported and skipped**, never silently
    dropped, and never abort the whole import.
  - **This single feature covers Quizlet's "Copy text" export, Anki's text
    export (which itself auto-detects comma, semicolon, tab, space, pipe and
    colon) and any spreadsheet.**
  - **Import is never gated behind a purchase.** Charging at the exact moment a
    switcher is deciding whether to switch is the worst possible placement of a
    paywall ([PRD §8.2](./product-requirements.md#82-the-trap-in-free-now-paid-unlock-later--and-how-to-avoid-it)).
  - Imported content is untrusted input and follows every rule in
    [CAP-8](#cap-8--legacy-import--migration-p0).
  - **P2 — Quizlet URL import is deliberately not pursued.** It depends on
    scraping a third party's site: fragile and of uncertain standing.
    Delimited-text paste gets most of the benefit with none of the risk.
- **Dependencies:** [CAP-1](#cap-1--card-set-library--local-storage-p0),
  [CAP-2](#cap-2--card-authoring-p0),
  [CAP-12](#cap-12--entity-identity--change-tracking-p0).

---

## CAP-18 — About, Changelog & Legal (P0)

**Description:** Version information, release history, and the legal surfaces
both stores require.

- **Inputs:** the build's version; the changelog data file; hosted policy URLs.
- **Outputs:** the About screen; the changelog; the privacy policy; contact and
  support links; *(P1)* a feedback explainer.
- **Behaviors:**
  - Show the app version, a changelog, contact details and links.
  - Present the privacy policy in-app and at a stable public URL.
  - **P1 —** a short "how the marking works" explainer reachable from the test
    screen, showing the five error kinds — including the transpose mark and the
    `#` missing-space mark — with examples (US-M3).
- **Rules:**
  - **One source of truth for the version**, derived from the build. *(Legacy
    hard-codes it in four separate places: `package.json`, the JSON-LD in
    `index.html`, the About heading, and the changelog entry —
    [REBUILD_SPEC §8.5](../REBUILD_SPEC.md).)*
  - **The changelog is data, not markup**, so it can be rendered, localised and
    reused in store release notes.
  - **The privacy policy must accurately describe the built behavior**, and
    specifically must distinguish: local-only by default (no card content leaves
    the device); what sync stores if enabled; and what analytics collects and
    how to disable it. An inaccurate policy is a store-review failure and a
    trust failure.
  - Both the policy URL and in-app route must exist before the first store
    submission.
- **Dependencies:** [CAP-10](#cap-10--settings--preferences-p0),
  [CAP-19](#cap-19--telemetry--analytics-p1).

---

## CAP-19 — Telemetry & Analytics (P1)

**Description:** Measure whether the product works, without ever learning what
anyone spells wrong.

- **Inputs:** lifecycle and interaction events; the analytics setting.
- **Outputs:** analytics events supporting the metrics in
  [PRD §5](./product-requirements.md#5-success-metrics).
- **Behaviors:** emit a **deliberately small, named event set**:

  | Event | Properties | Supports |
  | --- | --- | --- |
  | `app_first_open` | platform, migration outcome | Migration success rate |
  | `first_answer_submitted` | seconds since first open | Time to first card typed |
  | `session_started` | mode, session length, set size *(bucketed)* | Engagement |
  | `session_completed` | cards, first-try passes, wrong attempts, duration | Completion rate, accuracy trend |
  | `session_abandoned` | cards completed, position | Completion rate |
  | `set_created` / `set_deleted` | card count *(bucketed)* | Engagement |
  | `import_completed` | source (legacy / native / delimited), sets, cards, failures | Migration and switcher on-ramp |
  | `trophy_unlocked` | trophy id | Progression |
  | `sync_enabled` / `sync_disabled` | — | Sync opt-in rate |
  | `error_occurred` | error class, capability | Reliability |

- **Rules:**
  - **Analytics never carries card content.** No hint, answer, set name, typed
    attempt, diff output, trouble word or error pattern is ever transmitted, in
    any form, hashed or otherwise. Counts and categories only. This is a hard
    rule with no exceptions, and it is what makes
    [CAP-16](#cap-16--trouble-words--error-insights-p1--differentiator) safe to
    build.
  - **The opt-out is honoured before any event is emitted**, including on first
    run ([CAP-10](#cap-10--settings--preferences-p0)).
  - **A named event taxonomy, not automatic page-view collection.** *(Legacy
    initialises Firebase Analytics and logs nothing custom, so five years of
    data answer no product question —
    [REBUILD_SPEC §12](../REBUILD_SPEC.md).)*
  - Sync opt-in rate is **tracked, not targeted** — we explicitly do not want to
    push users into accounts
    ([PRD §5](./product-requirements.md#5-success-metrics)).
  - Analytics is **never** required for the app to function and never blocks a
    user action.
  - The event set is declared in one place so the privacy policy
    ([CAP-18](#cap-18--about-changelog--legal-p0)) and the store data-safety
    declarations can be derived from it rather than drifting from it.
- **Dependencies:** [CAP-10](#cap-10--settings--preferences-p0).

---

## CAP-20 — Premium Entitlement (P2)

**Description:** A future one-time "Supporter" purchase. **Nothing ships at
launch** *(Kevin's decision, 2026-08-07: free at launch, no ads ever, and any
future paid tier is a one-time purchase — never a subscription).*

- **Inputs:** a store purchase receipt.
- **Outputs:** an entitlement flag; restore-purchases.
- **Behaviors:** offer a single one-time in-app purchase; unlock cosmetic
  recognition; restore on a new device.
- **Rules:**
  - **One-time purchase only. Never a subscription. Never ads.** No ads is a
    permanent commitment, not a launch tactic — every ad-carrying competitor
    sits at 4.3–4.7★ while the adless, IAP-free AnkiDroid holds 4.8★
    ([Competitor Analysis](./competitor-analysis.md#pricing)).
  - **It gates nothing functional.** What the buyer gets is cosmetic —
    alternate app icons, extra paper themes, a supporter badge on About.
    Indicative price **$4.99–$9.99**; the exact number is Kevin's call and is
    not urgent.
  - **Explicitly foreclosed as gates** — recorded so a future pass does not
    casually reopen them
    ([PRD §8.2](./product-requirements.md#82-the-trap-in-free-now-paid-unlock-later--and-how-to-avoid-it)):

    | Candidate | Verdict | Why |
    | --- | --- | --- |
    | Cloud sync ([CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment)) | ❌ **Foreclosed** | Ships free in v1. Gating it later is a **takeaway** — precisely the Quizlet dynamic this product is positioned against. |
    | Import ([CAP-17](#cap-17--delimited-text--third-party-import-p1)) | ❌ Rejected | It is the acquisition channel. |
    | Trouble words ([CAP-16](#cap-16--trouble-words--error-insights-p1--differentiator)) | ❌ Rejected | It is the differentiator. Gating the reason to choose us shrinks the audience that experiences it. |
    | Set/card/device caps | ❌ Rejected | Quizlet's daily cap with different nouns. |
    | Cosmetics | ✅ **Recommended** | Takes nothing away, caps nothing. |
    | Cloud/neural TTS voices ([CAP-14](#cap-14--speech-synthesis--dictation-p1) P2) | ✅ Viable | The **only** honestly cost-justified functional gate: on-device TTS stays free forever; premium neural voices carry a real per-character cost. Announce as an addition, never a removal. |

  - **"Stay free" is an acceptable outcome.** The honest read is that there is
    very little here worth gating: the product competes against a free
    open-source app with a 4.8★ rating, and any meaningful paywall would cost
    more in rating and word-of-mouth than it earns. This is a personal project
    with near-zero marginal cost. See
    [PRD §8.3](./product-requirements.md#83-recommendation).
- **Dependencies:** [CAP-10](#cap-10--settings--preferences-p0),
  [CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment) (if the
  entitlement is ever to follow an account rather than a store account).

---

## Cross-Cutting Constraints (apply to all capabilities)

These are not the responsibility of any one capability. Every capability is
built to them, and a review that finds one violated has found a defect.

### C1 — Offline-first correctness

- **Every P0 capability works fully with no network and no account.** Offline is
  the default mode, not a degraded one. There is no "offline" banner that
  disables functionality.
- On web this means an installable PWA with a service worker; the current app is
  already 100% offline-capable and that property must not be lost.
- No capability may block a user action on a network round-trip. Sync
  ([CAP-13](#cap-13--optional-account--cloud-sync-p1--v1-commitment)) is
  eventually consistent and never synchronous with a user interaction.
- Local writes are the source of truth until acknowledged; the UI reflects the
  local write immediately.

### C2 — Entity identity and change tracking (keeping sync additive)

- **Every persisted entity has a client-generated UUID, `createdAt`,
  `updatedAt`, a soft-delete tombstone, and a `schemaVersion`** — from the very
  first commit, whether or not sync is built yet
  ([CAP-12](#cap-12--entity-identity--change-tracking-p0)).
- **Identity is never derived from user-editable content.** No name, no text,
  no hash of either, may serve as a key. *(This one rule is the difference
  between the rebuild and the confirmed data-loss defect in the live app.)*
- Every mutation stamps `updatedAt`. A missed stamp is a silently-lost sync.
- Any new entity introduced by a future capability inherits this shape without
  discussion.

### C3 — Accessibility

- **Never convey meaning by colour alone.** Highest-stakes in
  [CAP-5](#cap-5--feedback-presentation-p0), where the core mechanic is
  currently red text, but it applies everywhere. Verify under deuteranopia,
  protanopia and tritanopia simulation.
- WCAG AA contrast (4.5:1 text, 3:1 large text and UI). Touch targets ≥ 44×44pt.
- `accessibilityLabel` / `accessibilityRole` / `accessibilityState` on every
  interactive element; VoiceOver and TalkBack can reach and operate everything.
  No action is available only via a gesture.
- **Respect the user's text size.** Do not disable font scaling; lay out so
  larger text reflows. *(A specific regression risk: the legacy app sizes
  everything — including fonts — in viewport units, so a larger system font has
  no effect whatsoever.)*
- Respect **reduce-motion**. An animation that is disabled, interrupted or fails
  must be **structurally incapable** of leaving any element invisible or
  unreachable — this is the exact mechanism of the confirmed production
  soft-lock.
- Full keyboard operability on web, with a visible focus indicator.

### C4 — Internationalization readiness

- Launches **English / US only**, built i18n-ready from day one: no hardcoded
  user-facing strings, resource files keyed by string id, `Intl`-based date and
  number formatting, ICU pluralisation, no sentence concatenation, layouts
  tolerant of text expansion and RTL-friendly.
- **Unicode is a correctness requirement, not only an i18n one.** Card content is
  arbitrary user text in any script; the diff must be grapheme-aware and
  NFC-normalised
  ([spelling-diff-spec.md §5](./spelling-diff-spec.md#5-unicode-handling)).
- **Hermes ships an incomplete `Intl`.** Any `Intl` API used — `Segmenter` above
  all — must be polyfilled and **verified on a physical device**, not only on
  web, where it works and then throws at render time on device.
- Stored identifiers (trophy ids, setting keys, format names) are
  language-independent and stable; only display names are translated.
- Starter content ([CAP-11](#cap-11--starter-content-p0)) lives in a data file so
  a locale can replace it.

### C5 — Data portability

- **A user can always get everything out, in a format they can read, for free,
  offline, with no account.** This is a stated product value, not just a
  feature ([CAP-9](#cap-9--export--native-file-format-p0)).
- **The legacy `.cards` format is supported indefinitely.** It is the only route
  existing users' archives have
  ([CAP-8](#cap-8--legacy-import--migration-p0)).
- Export → import round-trips losslessly in the native format, and this is
  tested.
- No import or export path is ever gated behind a purchase
  ([CAP-20](#cap-20--premium-entitlement-p2)).

### C6 — Error recovery and reliability

- **Corrupt stored data must never produce a blank screen.** Every read
  validates; what cannot be parsed is **quarantined and reported**, never
  discarded and never fatal. *(Legacy has no error handling on any `JSON.parse`
  of a stored value: corrupt storage is a white screen.)*
- **Writes are atomic per entity.** An interrupted write never leaves an entity
  half-saved.
- **Validate before navigating, never after.** A failed navigation must not be
  able to strand the user on a screen it has already torn down — the mechanism
  of the confirmed soft-lock.
- **All imported and stored content is untrusted input**, validated before use.
- **No user-supplied string is ever interpreted as markup or code**, on any
  surface, ever. This closes the confirmed stored-XSS by construction.
- Every failure path has a user-visible outcome. Silent failure is the specific
  pathology of the legacy app (multi-file import, duplicate names, corrupt
  storage all fail silently) and is treated as a defect class in its own right.

### C7 — Security & privacy

- **Local-only by default.** With no account, no card content leaves the device —
  and this is verifiable by watching the network, not merely asserted.
- **Analytics never carries card content**
  ([CAP-19](#cap-19--telemetry--analytics-p1)).
- Once sync exists: default-deny rules, own-data-only access, matching rule
  coverage for every new collection or field.
- No secrets in the client bundle; the Firebase web config is publishable and
  restricted by referrer / bundle id.
- Store privacy declarations accurately reflect built behavior, including the
  difference between local-only and synced use.

### C8 — Performance

- The drilling loop feels instant on a mid-range Android device: submit → feedback
  is imperceptible.
- Library and session screens stay responsive at **1 000 sets × 1 000 cards**;
  lists are virtualised and the library renders from a summary index.
- The diff is bounded so a pathological input cannot freeze the UI thread
  ([spelling-diff-spec.md §8](./spelling-diff-spec.md#8-performance--bounds)).
- Cold start is fast enough that *time to first card typed*
  ([PRD §5](./product-requirements.md#5-success-metrics)) is dominated by the
  user, not the app.

### C9 — Architecture

- **The spelling diff is a pure leaf module** — two strings in, an array out; no
  React, no storage, no platform APIs. It is the most important code in the
  project and the easiest to unit-test; keep it pure.
- **All card data access goes through
  [CAP-1](#cap-1--card-set-library--local-storage-p0).** No screen touches
  storage directly. *(Legacy has four components hand-building `localStorage`
  key strings — [REBUILD_SPEC §5](../REBUILD_SPEC.md).)*
- **CSS class names, animation names and storage keys are never application
  logic.** *(Two of the legacy app's bugs are a typo'd animation name and a
  mismatched class name silently disabling behavior.)*
- Navigation is explicit and named. Never `history.back()`.
- Modals are conditionally-rendered components with props and callbacks, not
  always-mounted elements toggled by a global DOM query.

---

## Open Questions (capability-level)

| # | Question | Affects | Recommendation |
| --- | --- | --- | --- |
| 1 | **Does the launch build wait for sync?** [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension) says no; [CAP-12](#cap-12--entity-identity--change-tracking-p0) is P0 either way. | CAP-13 | **Launch on parity; sync as v1.1.** Four confirmed defects are live on production now, and sync is a pure addition with no migration cost. Only the release gate changes if Kevin disagrees — no scope or priority in this document moves. |
| 2 | **Per-card sync documents vs. one document per set.** Per-card gives correct merge granularity but multiplies reads. | CAP-13 | **Per-card.** A 200-card set edited on two devices must merge per card; whole-set granularity discards one device's edits wholesale. Read cost is bounded by the local-first cache. |
| 3 | **Tombstone retention window** — 90 days is a guess. | CAP-12, CAP-13 | **90 days**, and never purge a tombstone that has not yet synced while an account exists. Revisit if storage ever matters. |
| 4 | **Session-history retention** — 50 sessions per set is a guess. | CAP-6, CAP-16 | **50 per set**, pruned oldest-first. [CAP-16](#cap-16--trouble-words--error-insights-p1--differentiator) needs enough history to detect a pattern at a support threshold of 3, which 50 comfortably exceeds. |
| 5 | **Should `CardStats` sync?** It is derived data and can be regenerated, but losing it on a new device loses the trouble-word history that makes CAP-16 valuable. | CAP-13, CAP-15, CAP-16 | **Yes, sync it** — but treat it as merge-by-`max()` on the monotonic counters and last-writer-wins on scheduling fields, so a conflict never corrupts it. |
| 6 | **Grapheme segmentation on Hermes** — is `Intl.Segmenter` polyfillable at acceptable bundle cost? | CAP-4 | Attempt the polyfill; if the cost is unreasonable, ship code-point iteration and **document the combining-sequence limitation** in [spelling-diff-spec.md](./spelling-diff-spec.md) rather than leaving it implicit. Verify on a physical device either way. |
| 7 | **Is on-device TTS quality good enough for dictation?** SpellQuiz uses human recordings specifically because synthetic voices are poor at this. | CAP-14, CAP-20 | Ship on-device TTS in P1 and evaluate against real word lists before committing to cloud voices. The answer also settles CAP-20's only viable functional gate. |
| 8 | **Character cap for the diff** — 256 per side is a guess. | CAP-2, CAP-4 | **256**, enforced at authoring/import and again as a backstop in the diff. Cards are words and short phrases. |
| 9 | **How many people use vocabcards.com today?** Firebase Analytics has collected page views since 2022. | CAP-8, CAP-19 | Assume **low but non-zero** and build both the `.cards` importer and the auto-migration regardless — the cost is small and the failure mode is unacceptable. Worth ten minutes in the Firebase console to know. |
| 10 | ~~**Naming.**~~ **RESOLVED 2026-08-08 — Kevin confirmed *Vocab Cards*.** Store title *"Vocab Cards: Spelling Practice"* (30 chars; the em-dash form was 31 and both stores would have rejected it), app ids `com.kszapps.vocabcards`. See [naming-research.md](./naming-research.md). **Action outstanding:** reserve the App Store name. | All | Confirm as written. Both same-named store apps are dormant (10 installs; 3 ratings, last updated 2019). |
