# Product Requirements Document — vocab-cards

| | |
| --- | --- |
| **Status** | Draft v0.2 |
| **Last updated** | 2026-08-08 |
| **Owner** | Kevin Stoner |
| **Related** | [Competitor Analysis](./competitor-analysis.md) · [User Stories](./user-stories.md) · [Capability Spec](./capability-spec.md) · [Spelling Diff Spec](./spelling-diff-spec.md) · [REBUILD_SPEC.md](../REBUILD_SPEC.md) |

---

## 1. Overview

**Vocab Cards** is a spelling-and-vocabulary drilling app. You make a list of
cards — each a hint and an answer — and then you *type* the answers. When you
misspell one, the app doesn't just say "wrong": it computes the minimum edit
distance between what you typed and what was correct, and shows you the correct
spelling with **exactly the characters you got wrong marked** — using the marks a
teacher would use, including a dedicated mark for a space you left out and one
for two letters you wrote the wrong way round. Then you try again, and again,
until you get it right.

That feedback loop is the product. Everything else exists to serve it.

Vocab Cards already exists and has been live at
[vocabcards.com](https://www.vocabcards.com) since 2017 as an Aurelia 1
single-page app. **This PRD covers a ground-up rebuild** onto Expo / React
Native / TypeScript, shipping to **web, Android and iOS**, and the first-ever
store presence for the product.
[REBUILD_SPEC.md](../REBUILD_SPEC.md) is the frozen, verified record of exactly
what the existing app does; it is the authority for "what exists today" and this
PRD does not restate it. **Nothing that works today may be lost.**

**Naming (confirmed by Kevin 2026-08-08 — see [naming-research.md](./naming-research.md)):**
product name **Vocab Cards**; store title **"Vocab Cards: Spelling Practice"**;
domain `vocabcards.com`; app ids `com.kszapps.vocabcards`; repository stays
`vocab-cards`.

## 2. Problem Statement

People who need to spell a specific set of words correctly — professionals
learning a technical vocabulary, students on SAT/GRE word lists, language
learners fighting orthography — have no good tool. The market gives them two
bad options:

1. **General flashcard apps that are getting deliberately *worse* at spelling.**
   Quizlet's grading is typo-tolerant by design ("minor misspellings such as
   accent mark errors or missing letters are accepted"), it has AI Smart
   Grading that credits meaning over wording, and an "Override: I was correct"
   button. Meanwhile Learn and Test moved behind a paywall in 2022 and its
   Trustpilot score is **1.4/5 across 600+ reviews, where the most common word
   is "paywall."**
2. **Anki, which can do this but won't help you find it.** Anki's
   `{{type:Field}}` is the only character-level typed-answer diff in the market.
   It requires hand-editing a card template, doesn't affect grading, hides your
   own input from you, has open marking bugs with repeated characters and
   non-Latin scripts, **can't tell a swapped pair from two wrong letters**, and
   on AnkiDroid doesn't even focus the text box for you.

Dedicated spelling apps exist, but they are built for 8-year-olds: cartoon
gamification, parent-purchased subscriptions at $30–$150/year, and — in every
one surveyed — **no per-letter feedback at all**.

The gap is a spelling-first drilling app for adults and older students that is
uncompromising about correctness, tells you precisely what you got wrong, makes
you fix it, and asks nothing of you to get started. See the
[Competitor Analysis](./competitor-analysis.md) for the evidence behind every
claim above.

## 3. Goals & Non-Goals

### Goals

- **Preserve the existing product completely.** Every behavior in
  [REBUILD_SPEC.md](../REBUILD_SPEC.md) survives the rebuild, and every existing
  user's data survives with it — both `.cards` files and in-browser
  `localStorage`.
- **Make the spelling diff the centre of the product**, and make it better than
  Anki's on the five axes where Anki's is documented as weak: discoverability
  (ours is the default, not a template hack), showing the user their own
  attempt, correctness (no repeated-character or Unicode bugs), mobile
  ergonomics (the input is always focused), and **transposition** (a swapped
  pair is one error, not two wrong letters).
- **Close the table-stakes gaps** that keep Vocab Cards out of a serious store
  comparison: audio dictation, spaced repetition, session results, a visible
  achievements screen, real settings, and import from the tools people already
  use.
- **Ship on three platforms** — web, Android, iOS — from one codebase.
- **Stay free, adless and account-optional.** The app must remain fully usable
  with no account, entirely offline, exactly as it is today. Cloud sync is an
  opt-in layer, never a precondition.
- **Get to a store listing quickly.** Parity plus fixes is a shippable product;
  it should not wait on the fast-follow features.

### Non-Goals (this release)

- **Not building a content business.** Vocab Cards is a tool for *your* word
  lists. We ship a handful of small starter sets to solve the cold start
  ([§6.11 Starter Content](#611-spaced-repetition--smart-review--p1) is
  scheduling; starter sets are [§6.1](#61-card-sets--library--p0)) and nothing
  more. No curated course catalogue, no publisher decks.
- **Not building a social product.** No community deck library, no sharing
  feed, no leaderboards, no accounts-for-discovery. Sets move between people as
  files.
- **Not an AI product.** No AI card generation, no AI grading, no chatbot.
  Leniency-by-AI is the exact thing we are positioned against.
- **Not for children.** *(Kevin's decision, 2026-08-07.)* The audience is
  students and adults. We do not enrol in Google Play's Families programme, do
  not market to under-13s, and are not designing for COPPA. This is a
  deliberate scope boundary, not an oversight — see
  [Competitor Analysis — Families policy](./competitor-analysis.md#google-play-families-policy--out-of-scope).
- **No paid tier at launch.** *(Kevin's decision, 2026-08-07.)* See
  [§8](#8-monetization).
- **No translated languages at launch.** English/US only, but built
  **i18n-ready from day one** so additional locales are configuration, not a
  rewrite. See [§9](#9-non-functional-requirements).
- **Not a general note-taking or study-planning tool.** No rich text, no
  cloze deletion, no image occlusion, no note hierarchy.

## 4. Target Users / Personas

*(Audience decided by Kevin, 2026-08-07: students and adults with
self-supplied word lists, positioned on spelling accuracy.)*

| Persona | Who they are | What they need |
| --- | --- | --- |
| **The Speller** *(primary)* | An adult drilling an exact vocabulary they must spell right — medical, legal, technical terms; commonly-misspelled English; a professional glossary. | Ruthless correctness, precise feedback on *which letters*, and repetition until it sticks. Will not tolerate a tool that forgives typos. |
| **The Student** | High-school or university, working an SAT/GRE/coursework word list, often supplied by a teacher or a book. | Fast bulk entry or import, a quick 10-card drill between classes, a visible sense of progress. |
| **The Language Learner** | Learning L2 vocabulary where orthography is the hard part — accents, doubled letters, word spacing. | Drill in both directions (term→meaning and meaning→term), audio, and feedback that distinguishes an accent error from a wrong letter. |
| **The Returning User** | Has used vocabcards.com since some point between 2017 and today. Has sets in browser `localStorage` and possibly exported `.cards` files. | To lose absolutely nothing, and ideally to not have to do anything to keep it. |
| **The Switcher** | Currently uses Quizlet or Anki, is unhappy about the paywall or the complexity, and has word lists trapped there. | A one-step way to get their existing lists in. |

## 5. Success Metrics

| Metric | Target | Why it matters |
| --- | --- | --- |
| **Time to first card typed** (fresh install → first answer submitted) | **< 60 seconds** median | The product's advantage is zero friction. Anything that slows this down (a signup wall, an empty-state dead end) is a bug. |
| **Session completion rate** (tests started → tests finished) | **> 70%** | A test that gets abandoned mid-way means the loop isn't working. |
| **First-try accuracy trend per card** | Improving over a user's first 4 weeks | The product's actual claim is "you will spell these correctly." This is the only metric that tests it. |
| **Repeat-session rate** (users with ≥ 2 sessions on separate days in week 1) | **> 40%** | Retention proxy that doesn't require accounts to measure. |
| **Store rating** | **≥ 4.5★** on Play at 500 reviews | The adless, nothing-gated position is only worth holding if it converts to rating. AnkiDroid's 4.8★ is the benchmark. |
| **Migration success rate** (returning web users whose existing sets appear after the rebuild ships) | **100%**, zero data-loss reports | Non-negotiable. A returning user losing their sets is the worst possible failure. |
| **Sync opt-in rate** *(post-sync)* | Tracked, not targeted | We explicitly do not want to push users into accounts. This number tells us whether sync was worth building, not whether we should promote it. |

Instrumentation for these lives in
[CAP-19](./capability-spec.md#cap-19--telemetry--analytics-p1).

---

## 6. Feature Requirements

**Priority key:**

| Tag | Meaning |
| --- | --- |
| **P0** | Launch-blocking. The store build does not ship without it. |
| **P1** | Fast follow — built immediately after launch. |
| **P1 · v1 commitment** | Kevin has committed this to the v1 product definition. It is fully scoped and designed for now, and its **data-model prerequisites are P0**, but it explicitly does **not** gate the launch build. See [§7.3](#73-resolving-the-sync-vs-ship-early-tension). |
| **P2** | Later. |
| **· differentiator** | Appended where the requirement is a genuine competitive edge rather than table stakes. Honesty matters here: most of this document is table stakes. |

---

### 6.1 Card Sets & Library — P0

The library is the app's home: every card set the user has, with its card count,
and the controls to make more.

- **A card set** is a named, ordered list of cards. **A card** is a set of
  hints and a set of accepted answers. *(Today both are `string[]` that only
  ever hold one element — [REBUILD_SPEC §6](../REBUILD_SPEC.md). The rebuild
  models them as real collections from the first commit; the multi-value **UI**
  is [§6.2.1](#621-multiple-accepted-answers--p1).)*
- **P0 — Create, rename, delete a set.** Deleting asks for confirmation and
  states the card count being destroyed.
- **P0 — Select a "current" set.** The home screen drills the current set.
  Preserved from today's behavior.
- **P0 — Set identity is a stable id, never the name.** *(Fixes a confirmed
  data-loss defect: today the set name **is** the storage key, so creating a
  set with an existing name silently destroys the original —
  [REBUILD_SPEC §13](../REBUILD_SPEC.md).)* Renaming a set must be a pure
  metadata change that touches no card data and breaks no reference. This is a
  hard requirement and a one-way door if we get it wrong — see
  [CAP-12](./capability-spec.md#cap-12--entity-identity--change-tracking-p0).
- **P0 — Duplicate names are handled, never silently.** *(Kevin's default,
  2026-08-07.)* Attempting to create or import a set whose name already exists
  prompts: **Replace** / **Rename** (pre-filled with an auto-suffixed
  suggestion, e.g. `My Set (2)`) / **Cancel**. Names are not required to be
  unique once the user has chosen — identity is the id.
- **P0 — Set names are validated.** Non-empty after trimming; a length cap;
  any character allowed (names are no longer filesystem keys), with sanitising
  applied only at export filename generation.
- **P0 — Search and sort the library.** Sort by name, by recently used, by card
  count. Search filters by set name. *(Trivial today with a handful of sets;
  necessary the moment someone imports 30 Quizlet sets.)*
- **P0 — Starter content.** *(Kevin's default, 2026-08-07.)* On first launch,
  seed **4 small starter sets** so the app is never an empty room:
  *Commonly Misspelled Words*, *Tricky Doubles* (accommodate, embarrass,
  occurrence…), *Homophones & Confusables*, and *SAT/GRE High-Frequency Words*.
  30–50 cards each. They are **ordinary, fully editable, fully deletable sets** —
  not a special read-only concept — seeded once and never re-seeded. Content
  must be independently compiled or public domain; no copyrighted word list is
  reproduced. See [CAP-11](./capability-spec.md#cap-11--starter-content-p0).
- **P0 — An empty set can never brick the app.** *(Fixes the most serious
  confirmed defect in the live app — see [§6.14](#614-inherited-defects-that-must-not-survive--p0).)*
- **P1 — Duplicate a set.** Copy an existing set as a starting point.
- **P2 — Folders or tags for organising sets.**

### 6.2 Card Authoring — P0

- **P0 — Add, edit, delete, and reorder cards within a set.** Today's editor
  shows one card at a time with next/back; the rebuild must at minimum preserve
  a rapid one-at-a-time entry flow (type hint → tab → type answer → Enter →
  next blank card) because it is the fastest way to enter a word list by hand.
  A **list view** of all cards in the set with inline edit is additionally
  required so users can find and fix one card without paging through.
- **P0 — Enter never loses work.** Leaving the editor with a partially-typed
  card saves it if both fields are non-empty, and warns otherwise. *(Today's
  `done()` does the former; the warning is new.)*
- **P0 — The answer field disables autocorrect, autocapitalise, predictive text
  and spellcheck.** This is load-bearing, not cosmetic: the app must never help
  the user spell. Applies to the **test** input above all, and to the editor's
  answer field. See [§9](#9-non-functional-requirements) for the exact platform
  flags.
- **P0 — Card count and validation.** A card requires at least one non-empty
  hint and one non-empty answer. Leading/trailing whitespace is trimmed on
  save; internal whitespace is preserved exactly (it is spelling-significant).
- **P1 — Bulk paste entry.** Paste multiple lines of `term<tab>definition` (or
  comma-separated) directly into a set. This is the same parser as
  [§6.7](#67-import-export--migration--p0--p1) and the cheapest possible
  Quizlet on-ramp.

#### 6.2.1 Multiple accepted answers — P1

*(Kevin's default, 2026-08-07: modelled from commit one, UI shipped as P1.)*

Today `Card.answers` is a `string[]` that only ever holds index `[0]` — dead
generality left over from an intent that was never implemented
([REBUILD_SPEC §6](../REBUILD_SPEC.md)). We implement it for real.

- A card may accept **any of several answers** (synonyms, spelling variants,
  with/without an article).
- A card may carry **several hints**, all shown together.
- An answer is correct if it matches **any** accepted answer under the current
  case-sensitivity setting.
- **When the answer is wrong, the diff is computed against the accepted answer
  with the lowest edit distance** — the one the user was evidently reaching
  for. This rule matters and is easy to get wrong; it is specified in
  [spelling-diff-spec.md §6](./spelling-diff-spec.md#6-multiple-accepted-answers).
- **The data model carries the collections from day one (P0)** so that adding
  the UI later is not a migration.

---

### 6.3 The Test Session — P0

The drilling loop, preserved from [REBUILD_SPEC §8.2](../REBUILD_SPEC.md) and
tightened.

- **P0 — Two entry points, preserved:** **10 Cards** (a random 10 from the
  current set) and **All Cards** (the whole set). If the set has fewer than 10
  cards, "10 Cards" uses what exists.
- **P0 — Correct shuffling.** Fisher–Yates on a **copy** of the array.
  *(Today's `sort(() => 0.5 - Math.random())` is not a valid shuffle, is
  engine-dependent, and mutates the caller's array in place —
  [REBUILD_SPEC §9.2](../REBUILD_SPEC.md).)*
- **P0 — One card at a time:** the prompt, and a text input that is **focused
  and ready to type the instant the card appears**, on every platform. On
  mobile the keyboard's action key submits. *(This is the specific ergonomic
  failure documented in AnkiDroid — see
  [Competitor Analysis](./competitor-analysis.md#six-documented-weaknesses-in-ankis-implementation).)*
- **P0 — Submit and evaluate.** Comparison is **case-insensitive by default**
  (a setting — [§6.8](#68-settings--p0)) and **whitespace-exact internally**,
  with leading/trailing whitespace trimmed. *(Trimming is a deliberate change
  from today, which trims nothing; a leading space is not a spelling error.)*
- **P0 — Correct:** the answer is confirmed visually **and non-visually** (see
  [§9](#9-non-functional-requirements) — never colour alone), a brief pause,
  then advance.
- **P0 — Incorrect:** the spelling feedback appears ([§6.4](#64-spelling-feedback--p0--differentiator)),
  the card reacts, and **the user's text is selected rather than cleared** so a
  retry is one keystroke away without destroying what they typed.
  *(Kevin's default, 2026-08-07. Today the wrong text simply stays in the box
  and must be manually cleared.)*
- **P0 — Unlimited retries.** No max-attempts, no reveal-answer button.
  *(Kevin's default, 2026-08-07.)* The card does not advance until it is right.
  This is the product's core stance and must not be softened.
- **P0 — Flip.** A control swaps which side is the prompt, mid-session,
  preserved exactly from today. When flipped, the hints become the accepted
  answers and vice versa.
- **P0 — Progress.** A progress bar showing position through the session.
  Progress advances **only when a card is passed**, never on a failed attempt —
  preserved from today's semantics.
- **P0 — Back.** Returns to the previous card. **On the first card it is a
  no-op** *(Kevin's default, 2026-08-07 — today it silently exits the test,
  almost certainly by accident)*.
- **P0 — End test.** An explicit, always-available control to leave a session
  early, with confirmation if cards remain. Ending early still produces a
  results screen for what was done.
- **P0 — Counters.** `tested` increments once per card advanced past; `passed`
  once per correct submission; `failed` once per **incorrect submission**, so
  three wrong attempts on one card increments it three times. Preserved exactly
  — these feed the trophies and changing them would rewrite users' progress.
- **P1 — Session length options** beyond 10/all (e.g. 20, 50, "cards I've been
  getting wrong").

---

### 6.4 Spelling Feedback — P0 · differentiator

**This is the product.** The full algorithmic specification, including the
tie-break order, the mutate-as-you-go alignment, and all 29 test vectors, lives
in **[spelling-diff-spec.md](./spelling-diff-spec.md)** — it is too detailed and
too load-bearing to live inline, and an engineering agent should treat that
document as the contract.

The marking follows **proofreaders' correction marks** — the conventions a
teacher actually uses on a page — so the feedback is legible to anyone who has
had an essay handed back. *(Audited against proofreading convention 2026-08-07;
two changes came out of it, both Kevin's decisions: the missing-space mark and
transposition detection, below.)*

Product-level requirements:

- **P0 — On a wrong answer, show the correct spelling with exactly the wrong
  characters marked.** Behavior is byte-for-byte equivalent to the live app for
  all 15 verified production vectors. The algorithm is ported verbatim first and
  covered by characterization tests **before** any refactor.
- **P0 — A missing space gets its own distinct marker.** `ice cream` typed as
  `icecream` must visibly show that a space is missing at that position. This
  was a deliberate v0.1.6 fix and **no competitor does it** — it does not get
  quietly dropped in the rewrite. *(Changed 2026-08-07, Kevin's decision: the
  mark is now **`#`**, the standard proofreading space-insertion mark, rather
  than the underscore used since v0.1.6, which was never a convention. The
  change is presentational — the diff data is unaffected.)*
- **P0 · differentiator — Detect transposed letters.** *(Kevin's decision,
  2026-08-07.)* `receive` typed as `recieve` is **one** error — two letters the
  wrong way round — and must be marked as one, with a single mark spanning the
  pair, exactly as a teacher would. This requires **Damerau–Levenshtein** rather
  than plain Levenshtein, which has no concept of a swap and scores that case as
  two unrelated wrong letters.
  - **This is a deliberate departure from verbatim parity with v0.2.0**, which
    cannot do it. All 15 production vectors were re-verified and are
    **unchanged** — the divergence is purely additive.
  - **It is a second axis on which we beat Anki**, whose typed-answer comparison
    has the identical limitation. See
    [Competitor Analysis](./competitor-analysis.md#the-character-level-diff-question).
  - Swapped letters are among the most common spelling errors there are, which
    is why proofreading has a dedicated mark for them.
- **P0 — Five distinguishable error kinds**, not one: a **wrong** character, a
  **missing** character, an **extra** character the user typed, a **transposed**
  pair, and a **missing space**. Today's app renders wrong and missing
  identically and cannot represent a transposition at all; distinguishing them
  is both an accessibility requirement and a genuine improvement.
- **P0 — The diff is a structured data value, not an HTML string.**
  a `DiffSegment[]` (see
  [spelling-diff-spec.md §2.1](./spelling-diff-spec.md#21-types) for the exact
  shape) rendered as real UI elements. This is not a
  refactoring preference: it simultaneously fixes a **confirmed stored-XSS
  vulnerability** that executes on the live production domain
  ([REBUILD_SPEC §13](../REBUILD_SPEC.md)), removes the `innerhtml` rendering
  path entirely, and makes the algorithm unit-testable.
- **P0 — Never colour alone.** Red-on-black is unreadable for a large fraction
  of users. Each error kind carries a second, non-colour signal, and the
  feedback is announced to screen readers. Specified in
  [§9](#9-non-functional-requirements) and
  [spelling-diff-spec.md §7](./spelling-diff-spec.md#7-presentation-contract).
- **P0 — Unicode correctness.** The diff operates on user-perceived characters,
  applies Unicode NFC normalisation before comparison so that `é` typed as
  `e`+combining-acute is *correct*, and never splits a character in half.
  *(Today's implementation indexes UTF-16 code units and normalises nothing —
  the same class of bug reported against Anki's implementation for non-Latin
  scripts.)*
- **P1 · differentiator — Show the user their own attempt.** Anki's most
  upvoted complaint about its own diff is that you cannot see what you typed.
  We show the typed string aligned above the correct one, both marked. The data
  model supports this from P0 (each segment carries what the user typed at that
  position); only the presentation is P1.

---

### 6.5 Session Results & Missed-Word Practice — P0

Today a test simply ends and returns to the menu. Every competitor ends a
session with a score and a list of what you got wrong; this is table stakes and
it is missing.

- **P0 — A results screen at the end of every session**, including sessions
  ended early. It shows: cards completed, **cards passed on the first try**,
  total wrong attempts, and time taken.
- **P0 — The missed-word list.** Every card the user got wrong at least once,
  with the answer and a compact rendering of the *first* diff they produced on
  it. This is the highest-value screen in the app and does not exist today.
- **P0 — "Practice missed words."** One tap starts a new session containing
  only the cards missed in the session just finished. Repeatable.
- **P0 — Done** returns to the home screen, not backwards through history.
  *(Today's navigation is `history.navigateBack()` — sometimes called twice —
  and is fragile the moment an entry path changes.)*
- **P1 — Session history.** A short list of recent sessions per set with their
  scores, so improvement is visible.

---

### 6.6 Trophies & Progress — P0

Twenty-four trophies exist today and **there is no screen that lists them** —
the only way to ever see one is a 2-second toast you may not be looking at
([REBUILD_SPEC §9.3](../REBUILD_SPEC.md)).

- **P0 — All 24 trophies are preserved exactly**, with their existing
  thresholds and display text *(Kevin's default, 2026-08-07)*:

  | Type | Thresholds | Count |
  | --- | --- | --- |
  | Cards tested | 10, 50, 100, 500, 1 000, 5 000, 10 000, 50 000, 100 000 | 9 |
  | Cards passed | 50, 100, 500, 1 000, 5 000, 10 000, 50 000, 100 000 | 8 |
  | Cards failed | 10, 50, 100, 500, 1 000, 5 000, 10 000 | 7 |

- **P0 — Existing trophy progress migrates.** A returning user's unlocked
  trophies stay unlocked and their counters carry over. The legacy format
  stores a per-trophy counter that freezes at its goal, so the migration must
  recover the true global counters — the exact rule is in
  [CAP-7](./capability-spec.md#cap-7--trophies--counters-p0). Getting this wrong
  silently resets a user's multi-year progress.
- **P0 — A trophies screen.** Every trophy, locked and unlocked, with progress
  toward the next one and the date unlocked. This is close to free and turns 24
  invisible objects into a reason to come back.
- **P0 — Unlock notification.** A toast on unlock, as today, but dismissible
  and also recorded on the trophies screen so a missed toast is not a lost
  event. Each trophy notifies **once** (a one-shot latch, preserved).
- **P0 — Trophies are re-implemented as data,** not a class hierarchy: three
  counters plus a declarative threshold table plus a set of already-notified
  ids. Same behavior, trivially serialisable, and syncable.
- **P2 — Additional trophy categories** (streaks, accuracy, set completion,
  perfect sessions). The current roster is 100% "cards counted" and contains no
  retention hook. Deliberately deferred — adding trophies later is additive,
  changing existing ones is not.

---

### 6.7 Import, Export & Migration — P0 / P1

Data portability is both a requirement (existing users) and the cheapest
acquisition channel available (switchers — see
[Competitor Analysis takeaway 6](./competitor-analysis.md#key-takeaways-for-our-product)).

- **P0 — Legacy `.cards` import.** The existing format is a JSON array of
  `{definitions: string[], answers: string[]}`, with the set name derived from
  the filename minus the extension
  ([REBUILD_SPEC §6](../REBUILD_SPEC.md)). It must import cleanly, forever.
- **P0 — Multi-file import actually works.** *(Fixes a confirmed defect: today
  selecting two `.cards` files silently imports only the first, with no error —
  [REBUILD_SPEC §13](../REBUILD_SPEC.md) bug 5. The file picker advertises
  `multiple`, so users are invited into the broken path.)*
- **P0 — Same-origin `localStorage` auto-migration on web.** *(Kevin's default,
  2026-08-07.)* The rebuild ships to the same `vocabcards.com` origin, so a
  returning user's existing sets, current-set selection and trophy progress are
  **already there** in `localStorage` and must be adopted automatically on
  first run, with no action from the user and no possibility of loss. The
  legacy keys are read, never deleted, until the user is safely migrated.
- **P0 — Export.** A user can export one set, several sets, or everything.
- **P0 — A new native format,** versioned, self-describing, multi-set,
  UTF-8 JSON, carrying ids and timestamps. Specified in
  [CAP-9](./capability-spec.md#cap-9--export--native-file-format-p0).
  Legacy `.cards` export is **also retained** so a user can still hand a file
  to someone on the old app.
- **P1 — Delimited-text import.** Paste or open a file of
  `term<delimiter>definition` lines. Auto-detect **tab, comma, semicolon and
  pipe**; let the user override the delimiter and swap which column is the
  answer, with a live preview. This single feature covers **Quizlet's "Copy
  text" export**, **Anki's text export**, and any spreadsheet.
- **P1 — Delimited-text export**, for the same interoperability reason.
- **P2 — Anki `.apkg` import.** Real value for switchers, but it is a
  zip-plus-SQLite container with media and note types — meaningfully more work
  than everything else in this section combined. Deferred deliberately.
- **P2 — Import from a Quizlet set URL.** Knowt's growth lever, but it depends
  on scraping a third party's site, which is fragile and of uncertain standing.
  Delimited-text paste gets most of the benefit with none of the risk.

---

### 6.8 Settings — P0

The Settings button has shown *"Currently there are no settings available to
change"* since 2017 ([REBUILD_SPEC §8.1](../REBUILD_SPEC.md)). It ships with
real settings or it does not ship.

**P0 settings:**

| Setting | Options | Default | Notes |
| --- | --- | --- | --- |
| Case sensitivity | Ignore case / Require exact case | **Ignore case** | Preserves today's hard-coded behavior as the default. |
| Quick-test size | 5 / 10 / 20 / 50 | **10** | "10 Cards" is a preserved entry point; this makes the number configurable. |
| Default prompt side | Hint first / Answer first | **Hint first** | Per-set override is P1. |
| Appearance | System / Light / Dark | **System** | Dark mode is table stakes for a 2026 store listing and near-free with a themed component library. |
| Haptics | On / Off | **On** (mobile) | |
| Analytics | On / Off | **On** | An honest opt-out, prominently placed. See [§9](#9-non-functional-requirements). |

**P1 settings:** speech voice and rate ([§6.10](#610-audio--dictation--p1)),
scheduling mode ([§6.11](#611-spaced-repetition--smart-review--p1)),
per-set default prompt side, sound effects.

- **P0 — Settings are stored locally and, once sync exists, sync with the
  account.** Appearance and analytics preference are device-local by design.

---

### 6.9 Optional Cloud Sync — P1 · v1 commitment

> **Kevin's decision, 2026-08-07** *(overriding this document's original
> recommendation to defer sync)*: optional cloud sync **is in v1**, with heavy
> emphasis on *optional*. **Anonymous, local-only, offline, account-free use is
> a first-class supported mode, not a degraded one.** How this is sequenced
> against "ship parity early" is resolved explicitly in
> [§7.3](#73-resolving-the-sync-vs-ship-early-tension).

- **P0 — The data model is sync-ready from the first commit.** Stable UUIDs on
  every set and card, creation and modification timestamps, soft-delete
  tombstones, and set identity fully decoupled from set name. **This is the
  one-way door**: retrofitting identity onto data users have already created is
  the single most expensive mistake available in this project. It is P0 whether
  or not sync ships in the launch build. See
  [CAP-12](./capability-spec.md#cap-12--entity-identity--change-tracking-p0).
- **P1 · v1 commitment — Optional account and sync.** Sign in (Google, Apple,
  email) to sync sets, cards, trophy progress and settings across devices.
- **P0 — No account is required for anything else, ever.** Specifically:
  - The app **never** shows a sign-in wall, a "sign in to continue" interstitial,
    or a signed-out empty state.
  - Local-only mode makes **no authentication calls at all** — no anonymous
    auth session, no silent account creation. "No account" means no account.
  - Every feature except sync itself works identically signed out.
  - Sign-in is discoverable from Settings and offered **at most once**
    contextually, dismissibly, and never during the drilling loop.
- **P1 · v1 commitment — Signing in adopts local data.** A user who has been
  local-only for months and then signs in gets their existing library uploaded
  and merged, not replaced. Name collisions between local and cloud sets
  surface the same prompt as [§6.1](#61-card-sets--library--p0).
- **P1 · v1 commitment — Signing out keeps local data.** The user chooses:
  *sign out and keep everything on this device* (default) or *sign out and
  remove this device's copy*. Signing out must never be a data-loss event by
  accident.
- **P1 · v1 commitment — Conflict policy is defined and honest.** Last-writer-
  wins at the individual set/card level, ordered by server-assigned timestamp,
  with the known limitation documented rather than hidden. Specified in
  [CAP-13](./capability-spec.md#cap-13--optional-account--cloud-sync-p1--v1-commitment).
- **P0 *(conditional — launch-blocking for any build that ships accounts)* —
  In-app account and data deletion.** Required by both Apple App Store and
  Google Play for any app offering account creation. Not optional, not a
  fast-follow. See [§9](#9-non-functional-requirements).
- **P2 — Sharing a set via link.** Deliberately out of scope; sets move as
  files.

---

### 6.10 Audio & Dictation — P1

The single largest table-stakes gap. Every serious spelling tool is built on
"type what you hear": Quizlet's Spell mode, Vocabulary.com's adaptive Spelling
Bee, SpellQuiz's entire product, and every kids' spelling app surveyed. Vocab
Cards has no sound at all.

*(Kevin's default, 2026-08-07: P1, not P0.)*

- **P1 — Speak the answer.** A control on the test screen and the results
  screen pronounces the answer using the device's built-in text-to-speech. On
  device, offline, free, no API cost.
- **P1 — Dictation mode.** A session mode where the prompt is **the spoken word
  only** — no text — and the user types what they hear. Replay is always
  available. **The spelling diff applies unchanged**, which is the point:
  spelling apps have audio without letter-level feedback, and Anki has
  letter-level feedback without dictation. The intersection is empty.
- **P1 — Voice and rate are configurable**, including a slower rate for
  difficult words, and the voice list comes from the platform.
- **P1 — Graceful absence.** Where no TTS voice is installed (some Android
  devices, some browsers), audio controls hide rather than fail, and dictation
  mode is unavailable with an explanation.
- **P2 — Per-card recorded audio.** A user records their own pronunciation for
  a card. Useful for language learners and for words TTS mangles, but it
  introduces binary media into the data model, the file format and sync — a
  significant scope increase. Deferred.
- **P2 — Cloud/neural voices.** Higher quality than on-device TTS but carries a
  real per-character cost. See [§8](#8-monetization) — this is the one
  candidate for a future paid gate that is honestly cost-justified.

---

### 6.11 Spaced Repetition & Smart Review — P1

Table stakes. Anki (SM-2 and FSRS), Quizlet Learn, Memrise and Brainscape all
schedule; Vocab Cards shuffles randomly.

- **P1 — Per-card performance is recorded** from launch: attempts, first-try
  successes, failures, last-seen timestamp. *(The **fields** are P0 in the data
  model — see [CAP-12](./capability-spec.md#cap-12--entity-identity--change-tracking-p0) —
  so enabling scheduling later is not a migration.)*
- **P1 — A "Review" session type** that selects cards by need rather than at
  random: cards failed recently, cards not seen in a while, cards never seen.
- **P1 — An SM-2-derived scheduler** with per-card interval and ease. SM-2 over
  FSRS deliberately: it is simple, well-documented, fully explainable to the
  user, and needs no training data. FSRS's advantage
  ([20–30% fewer reviews at equal retention](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm))
  is real but matters most at Anki's scale of daily reviews, not for someone
  drilling a 40-word list before an exam.
  **Note:** the widely-repeated claim that FSRS is Anki's *default* could not be
  confirmed and should not be repeated — see
  [Competitor Analysis — Unconfirmed Claims](./competitor-analysis.md#unconfirmed-claims).
- **P1 — Scheduling is opt-in and never hijacks the manual modes.** "10 Cards"
  and "All Cards" keep working exactly as they do today. Scheduling is a third
  option, not a replacement. The existing product is a *drill* tool, and users
  who want to hammer one list twenty times must be able to.
- **P2 — FSRS**, if usage data ever shows review volume high enough to justify
  it.

---

### 6.12 Trouble Words & Error Insights — P1 · differentiator

The diff already computes, on every single failure, *exactly which characters*
the user got wrong — and then throws that away. Nobody in the market aggregates
this, because nobody else computes it in the first place.

- **P1 — Trouble words.** A ranked view of the cards the user gets wrong most
  often, across sessions, per set and overall. One tap drills just those.
- **P1 · differentiator — Trouble patterns.** Aggregate the diff output to
  surface *recurring* error shapes: a repeatedly-dropped doubled letter, a
  consistently-transposed pair, a habitually-omitted space, a specific vowel
  swap. Rendered in plain language — *"You've left out the second `r` in
  **embarrass** 4 times."*
- **P1 — Accuracy over time**, per set: first-try accuracy trending, which is
  the only honest measure of whether the app is working.
- **P0 — Privacy constraint.** All of this is computed and stored **on the
  device**. Nothing about what a user spells wrong is sent anywhere. If the
  user has enabled sync it travels in their own encrypted-in-transit account
  data, and nowhere else. Analytics never carries card content — see
  [§9](#9-non-functional-requirements).
- **P2 — Suggested drills** generated from trouble patterns.

---

### 6.13 About, Changelog & Help — P0

- **P0 — About screen** with version, links, and contact.
- **P0 — The changelog moves out of the component and into data.** Today it is
  hard-coded markup, and the version string is duplicated in four separate
  places ([REBUILD_SPEC §8.5](../REBUILD_SPEC.md)). One source of truth, derived
  from the build.
- **P0 — Privacy policy**, reachable in-app and hosted at a stable URL. Required
  for both stores. Must accurately describe: local-only storage by default,
  what sync stores if enabled, and what analytics collects.
- **P1 — A short "how this works" explainer** for the spelling feedback,
  reachable from the test screen. The diff's five error kinds are not
  self-evident on first encounter, and this is the product's core mechanic.

---

### 6.14 Inherited Defects That Must Not Survive — P0

[REBUILD_SPEC §13](../REBUILD_SPEC.md) catalogues twelve logic bugs and several
architectural footguns. The rebuild inherently discards most of them, but four
were **confirmed live on production** and are explicit launch-blocking
requirements rather than incidental cleanup:

| # | Defect | Requirement |
| --- | --- | --- |
| 1 | **Empty-set soft-lock.** A set with zero cards passes the guard, the menu buttons animate to `visibility: hidden`, navigation then throws and aborts — leaving a **blank, unusable screen until the page is reloaded**, with nothing on screen suggesting a reload. | **Validate before navigating, never after**, and **never drive visibility from an animation side-effect.** Starting a session with an empty set shows a clear message and stays put. |
| 2 | **Silent destructive overwrite.** Creating a set with an existing name destroys the original, no warning, no undo. | Set identity is an id, not a name ([§6.1](#61-card-sets--library--p0)); duplicate names prompt. |
| 3 | **Multi-file import loses files.** A single `FileReader` is reused across the loop with `readAsText` called before `onload` is assigned; selecting two files imports only the first, silently. | Import handles every selected file and reports per-file success or failure ([§6.7](#67-import-export--migration--p0--p1)). |
| 4 | **Stored XSS, confirmed executing on the production domain.** A card hint is rendered via `innerhtml` on the *normal* prompt path, so importing a hostile `.cards` file executes script on `vocabcards.com`. | **Eliminated by construction**: no user-supplied string is ever interpreted as markup. The structured diff ([§6.4](#64-spelling-feedback--p0--differentiator)) removes the last reason such a path would exist. |

**Not fixed:** the live Aurelia app is left untouched *(Kevin's default,
2026-08-07)*. These defects persist on production until the rebuild replaces it.

---

## 7. MVP Scope (v1)

### 7.1 The launch build — P0 only

The launch build is **parity with the existing app, plus the fixes, plus the
things whose absence would embarrass us in a store listing.** *(Kevin's
decision, 2026-08-07: ship early, then add TTS and spaced repetition.)*

**In the launch build:**

- Card set library: create / rename / delete / select / search / sort, id-based
  identity, duplicate-name prompt, starter sets ([§6.1](#61-card-sets--library--p0))
- Card authoring: rapid entry, list view, validation, autocorrect defeated
  ([§6.2](#62-card-authoring--p0))
- The test session: 10/all, correct shuffle, focused input, submit, retry,
  flip, progress, back, end test, counters ([§6.3](#63-the-test-session--p0))
- **The spelling diff**, verbatim-equivalent plus transposition detection,
  structured, five error kinds, missing-space marker, Unicode-correct,
  accessible
  ([§6.4](#64-spelling-feedback--p0--differentiator) and
  [spelling-diff-spec.md](./spelling-diff-spec.md))
- Session results and practice-missed-words ([§6.5](#65-session-results--missed-word-practice--p0))
- All 24 trophies, migrated, plus the trophies screen ([§6.6](#66-trophies--progress--p0))
- Legacy `.cards` import (multi-file), `localStorage` auto-migration, export,
  the new native format ([§6.7](#67-import-export--migration--p0--p1))
- Real settings ([§6.8](#68-settings--p0))
- **The sync-ready data model** — ids, timestamps, tombstones
  ([§6.9](#69-optional-cloud-sync--p1--v1-commitment))
- About, changelog-as-data, privacy policy ([§6.13](#613-about-changelog--help--p0))
- The four confirmed defects fixed ([§6.14](#614-inherited-defects-that-must-not-survive--p0))
- Non-functionals: accessibility, i18n-readiness, performance, privacy
  ([§9](#9-non-functional-requirements))
- Web, Android and iOS from one codebase

**Deliberately not in the launch build:** audio and dictation, spaced
repetition, trouble-words insights, multi-answer UI, delimited-text import,
`.apkg` import, and — per [§7.3](#73-resolving-the-sync-vs-ship-early-tension) —
cloud sync itself.

### 7.2 The fast-follow queue — P1, in order

1. **Optional cloud sync** ([§6.9](#69-optional-cloud-sync--p1--v1-commitment)) —
   first, because Kevin committed it to v1.
2. **Audio and dictation mode** ([§6.10](#610-audio--dictation--p1)) — the
   largest table-stakes gap.
3. **Delimited-text import/export and bulk paste**
   ([§6.7](#67-import-export--migration--p0--p1)) — the acquisition on-ramp.
4. **Spaced repetition and Review sessions** ([§6.11](#611-spaced-repetition--smart-review--p1)).
5. **Trouble words and error insights** ([§6.12](#612-trouble-words--error-insights--p1--differentiator)) —
   the genuine differentiator, and it wants a few weeks of real per-card data
   behind it before it says anything interesting, which is a reason to sequence
   it after launch rather than before.
6. **Multiple accepted answers UI** ([§6.2.1](#621-multiple-accepted-answers--p1)).
7. Show-the-user-their-own-attempt in the diff
   ([§6.4](#64-spelling-feedback--p0--differentiator)).

### 7.3 Resolving the "sync vs. ship early" tension

Two of Kevin's decisions pull against each other and the resolution needs to be
explicit rather than discovered during the build:

- *"Optional cloud sync IS in v1."*
- *"Parity + fixes, ship early."*

Sync is a large capability — auth on three platforms, a backend, security
rules, a merge policy, an anonymous-to-signed-in adoption path, and a
store-mandated account-deletion flow. Building it before launch would roughly
double the time to a store listing and defer every fix in
[§6.14](#614-inherited-defects-that-must-not-survive--p0), including a soft-lock
and an XSS that are live on production right now.

**Recommendation — and this is what the priority tags in this document
encode:**

| Part of sync | Priority | Rationale |
| --- | --- | --- |
| **Sync-ready data model** — UUIDs, `createdAt`/`updatedAt`, tombstones, name/identity separation | **P0, launch-blocking** | This is the irreversible part. It costs days now and a data migration on real users' libraries later. It is also independently required to fix the duplicate-name data-loss defect, so it earns its P0 twice over. |
| **The sync service itself** — auth, backend, merge, account deletion | **P1 · v1 commitment, first in the fast-follow queue** | Fully specified now ([CAP-13](./capability-spec.md#cap-13--optional-account--cloud-sync-p1--v1-commitment)), designed for now, built immediately after launch. |

**Release gating is therefore explicit: sync does not gate the launch build.**
If sync is finished before the launch build is ready, it ships in it — nothing
prevents that. If it slips, launch proceeds without it. Under no circumstance
does a slip in sync hold back the parity build, because the value of shipping
parity is realised immediately and the cost of not shipping it is that four
confirmed production defects stay live.

Concretely, this means the store listing at launch says nothing about sync, and
sync arrives as v1.1 within weeks. Because sync is a *pure addition* to a
local-first app — no migration, no behavior change for anyone who ignores it —
there is no user-visible cost to sequencing it second.

> **Kevin's call to confirm** ([§10](#10-open-questions)): if he would rather
> hold the launch until sync is ready and ship one complete v1, that is a
> legitimate choice and the only change is the release gate — the scope and the
> priorities in this document are unaffected.

---

## 8. Monetization

**Decision (Kevin, 2026-08-07): free at launch, no ads ever, and any future
paid tier is a one-time purchase — not a subscription.**

### 8.1 Why free-and-adless is the right position, not just a nice one

The market evidence is unusually clear
([Competitor Analysis](./competitor-analysis.md#pricing)):

- **AnkiDroid** carries **no ads and no in-app purchases** and holds the highest
  rating in the category — **4.8★ over 164K reviews, 23.2M installs.**
- Every ad-carrying competitor sits at 4.3–4.7★.
- **Quizlet** has 62M installs and a 4.7★ store rating but **1.4/5 on
  Trustpilot across 600+ reviews, where the single most common word is
  "paywall."** Locking Learn and Test behind Plus in 2022 generated sustained
  hostile coverage in student press and created the entire market position
  Knowt now occupies.

Positioning against that dynamic and then reproducing it would be
self-defeating. **No ads is a permanent commitment, not a launch tactic.**

### 8.2 The trap in "free now, paid unlock later" — and how to avoid it

There is a real hazard in the combination of Kevin's two decisions, and it needs
stating plainly:

> **Cloud sync now ships free in v1. It therefore cannot become the paid
> unlock later** — doing so would take a working feature away from existing
> users, which is *precisely* the Quizlet dynamic this product is positioned
> against. Any plan that assumes "sync will be the premium feature" is already
> foreclosed by the v1 scope.

The same argument disqualifies most of the obvious candidates:

| Candidate gate | Verdict | Reasoning |
| --- | --- | --- |
| **Cloud sync** | ❌ **Foreclosed** | Ships free in v1. Gating it later is a takeaway. |
| **Import (delimited text, Quizlet paste, `.apkg`)** | ❌ **Rejected** | Import is the *acquisition channel*. Charging at the exact moment a switcher is deciding whether to switch is the worst possible placement of a paywall. |
| **Trouble-words analytics** | ❌ **Rejected** | It is the differentiator. Gating the reason to choose us undermines the positioning and shrinks the audience that experiences what makes the product distinctive. |
| **Unlimited sets / cards / synced devices** | ❌ **Rejected** | This is Quizlet's 3-expenses-a-day pattern with different nouns. Capping core usage is exactly what we are positioned against. |
| **Themes, alternate app icons, cosmetic extras** | ✅ **Viable** | Takes nothing away, caps nothing, costs the user nothing to decline. Low revenue, zero harm. |
| **Cloud/neural TTS voices** | ✅ **Viable, and the only honestly cost-justified gate** | On-device TTS stays free forever ([§6.10](#610-audio--dictation--p1)). *Premium* neural voices carry a real per-character API cost, so charging for them is "this costs us money" rather than "we made the free version worse." |

### 8.3 Recommendation

**Ship a "Supporter" one-time purchase that gates nothing functional.**

- A single, modest one-time in-app purchase (indicative **$4.99–$9.99**; the
  exact number is Kevin's call and is not urgent, since nothing ships at
  launch).
- What the buyer gets: cosmetic recognition — alternate app icons and extra
  paper themes — and a supporter badge on the About screen. Nothing that
  changes what the app can do.
- Every functional feature stays free forever: drilling, the diff, trouble
  words, import, export, sync, audio.
- **If and only if** cloud/neural TTS voices are ever adopted (a P2 with a real
  marginal cost), those specific voices become the one functional thing the
  unlock includes — announced as an addition, never as a removal.

**Why this and not something more lucrative:** the honest read is that **there
is very little here worth gating.** The product's competitive position is
"free, adless, nothing gated, no account required," and it competes against a
free open-source app with a 4.8★ rating. Any meaningful paywall would cost more
in rating and word-of-mouth than it earns. A one-time price of $24.99 works for
AnkiMobile because it is the only iOS Anki client and it funds the whole
ecosystem — Vocab Cards has no such leverage.

**If the honest answer is "stay free," that is an acceptable outcome.**
This is a personal project with near-zero marginal cost: Firebase's free tier
covers a local-first app with opt-in sync comfortably at small scale, hosting is
already paid for, and on-device TTS is free. Revenue is not a launch
requirement, and the PRD should not invent a paywall to look complete.

### 8.4 The one honest cost risk to watch

Sync has a genuine ongoing cost (document reads/writes and stored bytes) that
scales with adoption. If it ever becomes material, the correct lever is a
**fair-use cap applied to new accounts with existing users grandfathered**, or
asking for support — **not** a retroactive paywall on a shipped free feature.
Recorded here so the decision is made deliberately if the situation arises
rather than under pressure.

---

## 9. Non-Functional Requirements

### Platforms
- **Web, Android and iOS from a single Expo / React Native / TypeScript
  codebase**, matching the stack Kevin already works in. TypeScript `strict`.
- The web build deploys to the existing `vocabcards.com` origin — which is what
  makes the `localStorage` auto-migration in
  [§6.7](#67-import-export--migration--p0--p1) possible, and is therefore a
  requirement rather than a convenience.
- **The app is fully functional offline on every platform.** On web this means
  an installable PWA with a service worker. Offline is not a degraded mode; it
  is the default mode.

### Accessibility
- **Never convey meaning by colour alone.** This is the sharpest a11y
  requirement in the product, because the core feedback mechanic is currently
  *red text*. Every diff error kind must carry a second signal — weight,
  underline, a marker glyph, or position — so the feedback is fully readable
  under deuteranopia, protanopia and tritanopia. Verify under simulation.
  The exact contract is in
  [spelling-diff-spec.md §7](./spelling-diff-spec.md#7-presentation-contract).
- **The feedback is announced to screen readers.** A wrong answer emits a
  polite live-region announcement naming the correct spelling and the specific
  errors — e.g. *"Incorrect. Correct spelling: r-a-v-e-n-o-u-s. You missed the
  letter o."* A blind user must get the same information a sighted user gets
  from the colours.
- **Respect the user's text size.** *(A regression risk inherited from today:
  the existing app sizes everything — including fonts — in viewport units, so a
  user who sets a larger system font gets no benefit at all.)* Do not disable
  font scaling; lay out so larger text reflows.
- WCAG AA contrast (4.5:1 text, 3:1 large text and UI). Touch targets ≥ 44×44pt.
- `accessibilityLabel` / `accessibilityRole` / `accessibilityState` on every
  interactive element. No action available only via a gesture.
- Keyboard operability on web: the whole drilling loop is usable without a
  mouse, with a visible focus indicator.

### The answer input — a specific, load-bearing requirement
The app must never help the user spell. On the test input **and** the editor's
answer field, all of the following are disabled: autocorrect, autocapitalise,
spellcheck, predictive text/keyboard suggestions, autofill, and any
"smart punctuation" substitution. Concretely: `autoCorrect={false}`,
`autoCapitalize="none"`, `spellCheck={false}`, `autoComplete="off"`,
`textContentType="none"`, `importantForAutofill="no"` on Android, and the
equivalent HTML attributes on web (`autocomplete`, `autocorrect`,
`autocapitalize`, `spellcheck`). Verified on a real device per platform, not
just in a browser — this silently regresses and it destroys the product when it
does.

### Internationalization (i18n-ready)
- Launches **English / US only**, built i18n-ready from day one: no hardcoded
  user-facing strings, resource files keyed by string id, `Intl`-based date and
  number formatting, ICU pluralisation, no sentence concatenation, Unicode
  end-to-end, layouts tolerant of text expansion and RTL-friendly.
- **Unicode is a correctness requirement, not just an i18n one.** Card content
  is arbitrary user text in any script. The diff must operate on user-perceived
  characters and normalise to NFC before comparison — see
  [spelling-diff-spec.md §5](./spelling-diff-spec.md#5-unicode-handling).
  Note that React Native's Hermes engine ships an **incomplete `Intl`**; any
  segmentation or formatting API used must be verified on-device, not only on
  web.

### Security & privacy
- **Local-only by default.** With no account, no card content leaves the device.
  This is a marketable property ([Competitor Analysis takeaway 10](./competitor-analysis.md#key-takeaways-for-our-product))
  and must be true, not approximately true: local-only mode makes no
  authentication calls of any kind.
- **No user-supplied string is ever interpreted as markup or code**, on any
  surface, ever. This closes the confirmed stored-XSS by construction
  ([§6.14](#614-inherited-defects-that-must-not-survive--p0)).
- **Imported files are untrusted input.** Every import path validates structure
  and types before anything is written, fails safely on malformed data, and
  never leaves the library in a partially-imported state.
- **Analytics never carries card content.** No hint, answer, set name, typed
  attempt, or diff output is ever sent to analytics. Events carry counts and
  categories only. Analytics is opt-out from Settings
  ([§6.8](#68-settings--p0)) and the opt-out is honoured before any event is
  sent.
- **Store privacy declarations** (Apple "App Privacy", Google "Data Safety")
  must accurately reflect the built behavior, including the difference between
  local-only and synced use.
- **Account and data deletion is available in-app** for any build that offers
  accounts — a launch requirement of both stores for that build, not a
  fast-follow.
- No secrets in the client bundle. The Firebase web config is publishable; keys
  are restricted by referrer/bundle id.
- Once sync exists: default-deny backend rules, a user can read and write only
  their own data, and every new collection or field ships with matching rule
  coverage.

### Performance
- The drilling loop must feel instant on a mid-range Android device: submitting
  an answer to seeing feedback is imperceptible.
- The diff is computed synchronously on every wrong answer. It is O(n·m) in the
  lengths of the two strings, which is trivially fast at word length; it must
  still be **bounded** so a pathologically long card (a pasted paragraph)
  cannot freeze the UI. See
  [spelling-diff-spec.md §8](./spelling-diff-spec.md#8-performance--bounds).
- Library and session screens stay responsive with **1 000 sets × 1 000 cards**.
  List rendering is virtualised.
- Cold start to interactive is fast enough that "time to first card typed"
  ([§5](#5-success-metrics)) is dominated by the user, not the app.

### Reliability
- **Corrupt stored data must never produce a blank screen.** *(Today there is
  no error handling on any `JSON.parse` of stored values; corrupt storage is a
  white screen.)* Every read validates against a schema, quarantines what it
  cannot parse rather than discarding it, and reports it to the user.
- **Storage writes are atomic per entity.** An interrupted write never leaves a
  set half-saved.
- **Animation never controls visibility.** An animation that fails, is
  interrupted, or is disabled by the OS's reduce-motion setting must be unable
  to leave any element permanently invisible. *(This is the exact mechanism of
  the confirmed production soft-lock.)* Respect reduce-motion throughout.

### Testability
- The spelling diff ships with **all 29 test vectors** as executable tests,
  written **before** any refactor of the ported algorithm: the 15 ground-truth
  vectors captured from production
  ([REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md)) plus the 14 transposition vectors
  in [spelling-diff-spec.md §9.2](./spelling-diff-spec.md#92-transposition-vectors--specified-behavior-new-in-v02).
  **The 15 legacy vectors are the regression gate on the transposition change**
  and must keep passing byte-identically.
- Storage round-trip tests, legacy-import fixtures, trophy-threshold and
  trophy-migration tests.
- An end-to-end run of create → drill → miss → see diff → practice missed →
  unlock trophy on at least one real platform.

---

## 10. Open Questions

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | ~~**Naming.**~~ **RESOLVED 2026-08-08 — Kevin confirmed *Vocab Cards*.** Store title *"Vocab Cards: Spelling Practice"* (30 chars — the em-dash form was 31 and both stores would have rejected it), app ids `com.kszapps.vocabcards`, repo `vocab-cards`. See [naming-research.md](./naming-research.md). **Action outstanding:** reserve the App Store name — globally unique, claimed at app-record creation, and the only authoritative availability check. This was never put to him explicitly. | Confirm as written. Both same-named store apps are dormant (10 installs; 3 ratings, last updated 2019), so the name is available in practice, and the subtitle carries the differentiator into store search. |
| 2 | **Does the launch build wait for sync?** [§7.3](#73-resolving-the-sync-vs-ship-early-tension) recommends no. | **Launch on parity; sync as v1.1.** Four confirmed defects — including a soft-lock and an XSS — are live on production now, and sync is a pure addition with no migration cost. If Kevin prefers one complete v1, only the release gate changes. |
| 3 | **How many people actually use vocabcards.com today?** Firebase Analytics has been collecting page views since 2022. The answer changes how hard we defend the `localStorage` migration path and how loudly we announce the change. | Assume **low but non-zero** and build both the `.cards` importer and the auto-migration regardless — the cost is small and the failure mode (a returning user loses years of sets) is unacceptable. Worth 10 minutes in the Firebase console to know. |
| 4 | **Is on-device TTS quality good enough** for dictation mode, or does it mangle exactly the hard words users most want to drill? SpellQuiz built its business on *human* recordings specifically because synthetic voices are poor at this. | Ship on-device TTS in P1 and evaluate with real word lists before committing to cloud voices. If quality is the blocker, that also settles [§8](#8-monetization)'s only viable functional gate. |
| 5 | **Supporter purchase price**, if we ship one. | **$4.99–$9.99 one-time.** Not urgent — nothing monetised ships at launch. |
| 6 | **Should the diff show the user's own attempt at launch** rather than as a P1? It is Anki's single most-complained-about gap. | **P1.** The data supports it from P0, so it is a presentation change. Getting parity shipped matters more, and the two-row layout is a real design problem worth giving the designer time on. |
| 7 | **Should trophies gain new categories** (streaks, accuracy, perfect sessions)? The current 24 are all "cards counted" and contain no retention hook. | **P2, and additive only.** Adding trophies later is safe; changing or removing existing ones would rewrite users' history. |
| 8 | **Sync conflict policy: is last-writer-wins acceptable?** It can lose an edit made on a device that was offline for a long time. | **Yes, with the limitation documented and surfaced.** This is single-user, multi-device sync, not collaboration; the blast radius is one person's own edit. Per-field merge is disproportionate. |

---

## 11. Out of Scope (for now)

- AI card generation, AI grading, AI tutoring, or any leniency-by-model
  feature — actively contrary to the product's stance.
- Community deck library, public set sharing, social features, leaderboards.
- Teacher/classroom management, student rosters, assignment tracking.
- Rich text, images on cards, cloze deletion, image occlusion, handwriting
  input. *(Handwriting is a real spelling-practice modality — Better Speller
  offers Apple Pencil practice on iPad — but it needs recognition, a new input
  surface, and a different feedback model. Revisit only if there is demand.)*
- Anki `.apkg` import ([§6.7](#67-import-export--migration--p0--p1), P2) and
  Quizlet URL import (P2).
- Per-card recorded audio ([§6.10](#610-audio--dictation--p1), P2).
- Any Google Play Families / under-13 audience
  ([§3](#3-goals--non-goals)).
- Translated locales at launch ([§9](#9-non-functional-requirements)).
- Fixing the live Aurelia app *(Kevin's default, 2026-08-07)*.
