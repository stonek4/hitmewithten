# User Stories — vocab-cards

| | |
| --- | --- |
| **Status** | Draft v0.2 |
| **Last updated** | 2026-08-07 |
| **Owner** | Kevin Stoner |
| **Derived from** | [Product Requirements Document](./product-requirements.md) |
| **Related** | [Capability Spec](./capability-spec.md) · [Competitor Analysis](./competitor-analysis.md) · [Spelling Diff Spec](./spelling-diff-spec.md) · [REBUILD_SPEC.md](../REBUILD_SPEC.md) |

---

## How to read this

Stories follow **"As a `<persona>`, I want `<goal>`, so that `<benefit>`."**
Each story carries acceptance criteria and the priority of its source PRD
feature.

**Priority key** (inherited from [PRD §6](./product-requirements.md#6-feature-requirements)):

| Tag | Meaning |
| --- | --- |
| **P0** | Launch-blocking |
| **P1** | Fast follow |
| **P1 · v1 commitment** | Committed to the v1 product definition; does **not** gate the launch build (see [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension)) |
| **P2** | Later |

**Personas** are from [PRD §4](./product-requirements.md#4-target-users--personas):
**Speller** (primary), **Student**, **Language Learner**, **Returning User**,
**Switcher**.

IDs are `US-<epic><n>` so tickets, the capability spec and design specs can
reference them.

**A note for the designer:** many of these stories describe behavior that is
identical to the live app at [vocabcards.com](https://www.vocabcards.com) —
[REBUILD_SPEC.md](../REBUILD_SPEC.md) documents every existing screen in detail
and is worth reading before designing. Where a story changes existing behavior,
it says so explicitly.

---

## Epic A — Card Sets & Library ([PRD §6.1](./product-requirements.md#61-card-sets--library--p0))

### US-A1 — See all my card sets (P0)
**As a** Speller, **I want** one screen listing every card set I have with its
card count, **so that** I can pick what to drill without hunting.

- Each row shows the set name and the number of cards.
- The set currently selected for drilling is visibly marked as such.
- Tapping a set opens its actions: **Use** (make it current), **Edit**,
  **Export**, **Delete**. *(Preserved from today's set-actions modal.)*
- An empty library shows a helpful first-run state, never a dead end — and the
  starter sets from US-A7 mean this is rare.

### US-A2 — Create a set (P0)
**As a** Student, **I want** to create a named set, **so that** I can start
entering my word list.

- I name the set and land directly in the card editor, ready to type.
- The name must be non-empty after trimming; whitespace-only is rejected with a
  clear message.
- Any character is allowed in a name — names are no longer used as storage keys.

### US-A3 — Rename a set without risking my cards (P0)
**As a** Speller, **I want** to rename a set, **so that** I can fix a typo or
reorganise, **without** any chance of losing its cards.

- Renaming changes only the displayed name. No card is touched, no reference
  breaks, and the set stays selected if it was current.
- *(Behavior change: today the set name **is** the storage key, so this
  operation does not meaningfully exist. See
  [CAP-12](./capability-spec.md#cap-12--entity-identity--change-tracking-p0).)*

### US-A4 — Never lose a set to a duplicate name (P0)
**As a** Returning User, **I want** the app to stop me when I create or import a
set whose name I've already used, **so that** I don't silently destroy work.

- Creating or importing into an existing name prompts with three choices:
  **Replace** (with an explicit warning naming the card count that will be
  destroyed), **Rename** (pre-filled with an auto-suffixed suggestion such as
  `My Set (2)`), **Cancel**.
- If I choose Rename, both sets survive and both keep their own cards.
- Once I've chosen, duplicate names are allowed — identity is the id, not the
  name.
- *(Fixes a **confirmed data-loss defect**: today creating a set with an
  existing name silently overwrites it with no warning and no undo —
  [REBUILD_SPEC §13](../REBUILD_SPEC.md).)*

### US-A5 — Delete a set deliberately (P0)
**As a** Speller, **I want** deletion to require confirmation, **so that** I
don't lose a word list by mis-tapping.

- The confirmation names the set and its card count.
- If the deleted set was the current set, the app clears the selection cleanly
  and the home screen shows the "no set selected" state — it does not break.
- *(Today deleting the current set writes the literal string `"null"` into
  storage and only works by accident — [REBUILD_SPEC §13](../REBUILD_SPEC.md)
  bug 6.)*

### US-A6 — Find a set among many (P0)
**As a** Switcher who has just imported 30 sets, **I want** to search and sort
my library, **so that** it stays usable.

- Search filters by set name as I type.
- Sort by name, most recently used, or card count.
- The list stays smooth with 1 000 sets.

### US-A7 — Have something to drill immediately (P0)
**As a** new user, **I want** a few word lists already there, **so that** I can
try the app before deciding to type in my own.

- On first launch, four starter sets are present: *Commonly Misspelled Words*,
  *Tricky Doubles*, *Homophones & Confusables*, *SAT/GRE High-Frequency Words*.
- They behave as completely ordinary sets — I can edit, rename, or delete any of
  them.
- They are seeded exactly once. Deleting them is respected and they never come
  back.

### US-A8 — Duplicate a set (P1)
**As a** Student, **I want** to copy an existing set, **so that** I can make a
variant without retyping it.

- The copy gets a distinct name (auto-suffixed) and its own independent cards.

---

## Epic B — Card Authoring ([PRD §6.2](./product-requirements.md#62-card-authoring--p0))

### US-B1 — Enter a word list fast (P0)
**As a** Student typing in 40 words from a handout, **I want** to add cards
without touching the mouse, **so that** entry isn't a chore.

- Type the hint → advance to the answer → submit → a blank card appears with
  focus back in the hint field, ready for the next word.
- The keyboard's action key advances; on desktop web, Enter and Tab do the
  obvious things.
- *(Preserves today's one-card-at-a-time editor flow, which is genuinely fast.)*

### US-B2 — See and fix any card in a set (P0)
**As a** Speller, **I want** a list of every card in a set with inline editing,
**so that** I can correct one card without paging through the whole set.

- The list shows hint and answer for every card.
- I can edit a card in place, delete it, and reorder cards.
- *(New: today the only way to reach card 37 is to press "next" 37 times.)*

### US-B3 — Not lose a half-typed card (P0)
**As a** Student, **I want** leaving the editor to do something sensible with a
card I was mid-way through, **so that** I don't silently lose it.

- If both fields have content, it is saved.
- If only one field has content, I'm warned before discarding.
- If both are empty, leaving is silent.

### US-B4 — Never be helped to spell (P0)
**As a** Speller, **I want** autocorrect, predictive text, autocapitalisation
and spellcheck fully off in the answer field, **so that** the phone doesn't do
the work I'm here to practise.

- Applies to the editor's answer field and — critically — the test input.
- Verified on a real iOS device, a real Android device, and desktop web. This
  silently regresses across framework upgrades.

### US-B5 — Paste a whole list at once (P1)
**As a** Switcher, **I want** to paste many lines of `term<tab>definition` into
a set, **so that** I don't retype what I already have.

- Tab, comma, semicolon and pipe are auto-detected; I can override.
- A preview shows how many cards will be created and which column is the answer,
  before anything is written.
- This is the same parser as US-G5.

### US-B6 — Accept more than one right answer (P1)
**As a** Language Learner, **I want** a card to accept several answers, **so
that** a legitimate variant isn't marked wrong.

- A card can hold multiple accepted answers and multiple hints.
- Typing any accepted answer is correct.
- When I'm wrong, the feedback is computed against the accepted answer closest
  to what I typed — not an arbitrary one. *(See
  [spelling-diff-spec.md §6](./spelling-diff-spec.md#6-multiple-accepted-answers)
  for exactly why.)*
- The underlying data supports this from the launch build; only the authoring UI
  is P1.

---

## Epic C — The Test Session ([PRD §6.3](./product-requirements.md#63-the-test-session--p0))

### US-C1 — Start drilling in one tap (P0)
**As a** Speller, **I want** **10 Cards** and **All Cards** right on the home
screen, **so that** starting takes no thought.

- **10 Cards** draws a random selection (size configurable — US-H1) from the
  current set; **All Cards** uses the whole set.
- If the set has fewer cards than the quick-test size, the quick test uses what
  exists.
- Card order is genuinely random. *(Today's shuffle is
  `sort(() => 0.5 - Math.random())`, which is not a valid shuffle and mutates
  the caller's array — [REBUILD_SPEC §9.2](../REBUILD_SPEC.md).)*

### US-C2 — Be told clearly when I can't start (P0)
**As a** Speller with no set selected or an empty set, **I want** a clear
message, **so that** I know what to do next.

- Starting a test with no current set, or with a set containing zero cards,
  shows a specific message naming the problem and offering the fix
  ("Choose a set" / "Add cards").
- **The app remains fully usable.** Nothing disappears, nothing needs a reload.
- *(Fixes the **most serious confirmed defect in the live app**: today an empty
  set passes the guard, the menu buttons are animated to `visibility: hidden`,
  navigation then throws and aborts, and the user is left staring at a blank
  screen that only a page reload recovers —
  [REBUILD_SPEC §13, bug #1](../REBUILD_SPEC.md).)*

### US-C3 — Type the answer immediately (P0)
**As a** Speller, **I want** the input focused and the keyboard up the moment a
card appears, **so that** I can type without tapping first.

- Every card, every time, on every platform.
- The keyboard's action key submits.
- *(This is the specific ergonomic failure documented against AnkiDroid —
  [Competitor Analysis](./competitor-analysis.md#six-documented-weaknesses-in-ankis-implementation).)*

### US-C4 — Get an answer confirmed (P0)
**As a** Speller, **I want** an unmistakable signal when I'm right, **so that**
I can keep moving.

- A correct answer is confirmed visually **and** by a non-colour signal, and
  announced to screen readers.
- The confirmed answer is shown in the stored casing.
- A brief pause, then the next card.
- Comparison ignores case by default (US-H1), trims leading and trailing
  whitespace, and treats internal spaces as significant.

### US-C5 — Try again without retyping everything (P0)
**As a** Speller who got one letter wrong, **I want** my text kept and selected,
**so that** retrying is one keystroke, not a cleanup job.

- On a wrong answer the typed text stays in the field and is fully selected, so
  typing replaces it and the caret is never stranded mid-word.
- *(Today the wrong text simply sits there and must be manually cleared —
  [REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md).)*

### US-C6 — Not be let off the hook (P0)
**As a** Speller, **I want** unlimited retries and **no** way to skip or reveal,
**so that** the card doesn't advance until I've actually spelled it.

- No max-attempt limit, no "show answer", no "I was right" override.
- The progress bar does not move on a failed attempt. Only passing a card
  advances it.
- *(This is the product's stance and the thing every competitor is moving away
  from — see [PRD §2](./product-requirements.md#2-problem-statement).)*

### US-C7 — Drill in the other direction (P0)
**As a** Language Learner, **I want** to flip which side is the prompt
mid-session, **so that** I can practise recognition and production from one set.

- A control on the test screen swaps prompt and answer.
- When flipped, the hints become the accepted answers and the answers become the
  prompt, and every evaluation rule applies unchanged.
- *(Preserved exactly from today.)*

### US-C8 — Go back a card (P0)
**As a** Speller, **I want** to step back to the previous card, **so that** I can
re-check something I just did.

- Back moves to the previous card in the session.
- **On the first card, Back does nothing.** *(Behavior change: today it silently
  exits the whole test, which is almost certainly accidental —
  [REBUILD_SPEC §15](../REBUILD_SPEC.md).)*

### US-C9 — Leave a session on purpose (P0)
**As a** Student interrupted mid-drill, **I want** an obvious way to end the
test, **so that** I'm not stuck or forced to finish.

- An explicit **End test** control is always available.
- If cards remain, it confirms first.
- Ending early still produces the results screen for what I did (US-E1).
- Finishing takes me to the results screen, and **Done** from there returns to
  the home screen directly — never by walking backwards through history.
  *(Today's navigation calls browser back, sometimes twice, on an assumption
  about how I arrived — [REBUILD_SPEC §7](../REBUILD_SPEC.md).)*

### US-C10 — See how far through I am (P0)
**As a** Student, **I want** a progress indicator, **so that** I know how much is
left.

- Shows position through the session's cards.
- Advances only on a passed card, never on a failed attempt.
- *(Preserved exactly from today.)*

---

## Epic D — Spelling Feedback ([PRD §6.4](./product-requirements.md#64-spelling-feedback--p0--differentiator))

> The full algorithmic contract — tie-break order, alignment, Unicode rules, all
> 29 test vectors — is in
> **[spelling-diff-spec.md](./spelling-diff-spec.md)**. These stories describe
> what the user experiences.
>
> **The marking follows proofreaders' correction marks** — the conventions a
> teacher uses on a page — so the feedback reads the way a corrected essay does.

### US-D1 — See exactly which letters I got wrong (P0 · differentiator)
**As a** Speller, **I want** the correct spelling shown with precisely the
characters I got wrong marked, **so that** I learn the specific error rather
than just "wrong."

- A wrong answer immediately shows the correct spelling with per-character
  marking — no tap required, no self-grading.
- Behavior is equivalent to the live app for all 15 verified ground-truth cases.
- The correct spelling is always fully readable through the marking.

### US-D2 — Tell my five kinds of mistake apart (P0)
**As a** Speller, **I want** a wrong letter, a missing letter, an extra letter
and a swapped pair to look different from each other, **so that** I know what I
actually did.

- Five distinguishable treatments: correct, **wrong** letter, **missing**
  letter, **extra** letter I typed that doesn't belong, and a **transposed**
  pair (US-D3a).
- *(Improvement: today wrong and missing render identically, and a swap cannot
  be represented at all.)*

### US-D3 — See a missing space (P0)
**As a** Speller who typed `icecream`, **I want** the missing space visibly
marked, **so that** I can see an error that is otherwise invisible.

- A space I omitted renders as something with visible extent at the right
  position — never as literal whitespace.
- The mark is **`#`**, the standard proofreading space-insertion mark.
  *(Changed 2026-08-07, Kevin's decision — the underscore used since v0.1.6 was
  never a proofreading convention.)*
- *(The behavior is preserved from the v0.1.6 fix. **No competitor does this** —
  see [Competitor Analysis](./competitor-analysis.md#no-competitor-marks-a-missing-space-and-none-detects-a-transposition).)*

### US-D3a — See when I've swapped two letters (P0 · differentiator)
**As a** Speller who typed `recieve` for `receive`, **I want** the app to tell me
I wrote two letters the wrong way round, **so that** I learn the actual mistake
instead of being told two separate letters are wrong.

- A transposed pair is marked as **one** error with a single mark spanning both
  characters — the way a teacher would mark it — not as two independent wrong
  letters.
- Works anywhere in the word: at the start (`hte` for `the`), in the middle
  (`thier` for `their`), at the end (`ravenosu` for `ravenous`), and more than
  once in the same answer (`thier freind`).
- Works alongside other mistakes in the same answer — a swap plus a missing
  letter is reported as two distinct errors of the right kinds.
- **Does not produce phantom swaps** in words with repeated letters: `leter` for
  `letter` is a *missing letter*, not a swap.
- The screen reader announces it as one error naming both letters in the correct
  order — "you swapped e and i" — not as two wrong letters (see US-D5).
- *(Kevin's decision, 2026-08-07. Swapped letters are among the most common
  spelling errors, which is why proofreading has a dedicated mark for them.
  This requires Damerau–Levenshtein; the live app uses plain Levenshtein and
  therefore reports this case as two unrelated wrong letters — as does **Anki**,
  the only competitor with any character-level diff at all. It is a deliberate,
  approved departure from verbatim parity with the old app.)*

### US-D4 — Read the feedback without relying on colour (P0)
**As a** Speller with a colour-vision deficiency, **I want** the feedback
readable without distinguishing red from black, **so that** the app's core
mechanic works for me.

- Every error kind carries a second, non-colour signal.
- Verified under deuteranopia, protanopia and tritanopia simulation.

### US-D5 — Hear the feedback with a screen reader (P0)
**As a** blind Speller, **I want** the mistake announced, **so that** I get the
same information a sighted user gets from the marking.

- A wrong answer politely announces: the correct spelling **letter by letter**,
  then the specific errors in plain language ("you left out the letter o").
- A swapped pair is announced as **one** error naming both letters in the
  correct order — "you swapped e and i" — not as two wrong letters (US-D3a).
- The announcement never interrupts my typing of the retry.
- Long enumerations are capped ("and 4 more").

### US-D6 — See my own attempt next to the answer (P1 · differentiator)
**As a** Speller, **I want** to see what I actually typed lined up against the
correct spelling, **so that** I can compare them directly.

- Both strings shown, aligned, both marked.
- *(This is Anki's single most-complained-about gap in its own equivalent
  feature. The data supports it from the launch build; only the presentation is
  P1.)*

---

## Epic E — Session Results & Missed Words ([PRD §6.5](./product-requirements.md#65-session-results--missed-word-practice--p0))

### US-E1 — See how I did (P0)
**As a** Student, **I want** a summary when a session ends, **so that** the
effort has a visible outcome.

- Shows cards completed, **cards passed on the first try**, total wrong
  attempts, and elapsed time.
- Appears for sessions I finish **and** sessions I end early.
- *(New: today a test just ends and dumps me back at the menu.)*

### US-E2 — See exactly which words I missed (P0)
**As a** Speller, **I want** a list of every word I got wrong, **so that** I know
what to work on.

- Every card missed at least once, with its answer and a compact rendering of
  the first mistake I made on it.

### US-E3 — Immediately drill just my mistakes (P0)
**As a** Speller, **I want** one tap to re-test only the words I missed, **so
that** I can fix them while they're fresh.

- Starts a new session containing only those cards.
- Repeatable — I can keep going until the list is empty.

### US-E4 — See whether I'm improving (P1)
**As a** Student, **I want** to see my recent sessions for a set, **so that** I
can tell whether the drilling is working.

- A short history per set: date, cards, first-try accuracy.

---

## Epic F — Trophies & Progress ([PRD §6.6](./product-requirements.md#66-trophies--progress--p0))

### US-F1 — See all my trophies (P0)
**As a** Student, **I want** a screen listing every trophy, locked and unlocked,
**so that** they're worth having.

- All 24 trophies, with what each requires, which I've earned, when, and my
  progress toward the next one in each category.
- *(New, and close to free: today 24 trophies exist and the **only** way to ever
  see one is a 2-second toast — [REBUILD_SPEC §9.3](../REBUILD_SPEC.md).)*

### US-F2 — Be told when I unlock one (P0)
**As a** Speller, **I want** a notification when a trophy unlocks, **so that** I
notice the milestone.

- A dismissible toast on unlock, as today.
- Each trophy notifies once.
- A missed toast is not a lost event — it's on the trophies screen.

### US-F3 — Keep the trophies I already earned (P0)
**As a** Returning User of five years, **I want** my existing trophy progress
intact, **so that** the rebuild doesn't erase my history.

- Trophies I'd unlocked stay unlocked; counters carry over.
- Already-notified trophies do not re-notify.
- *(The legacy format stores a per-trophy counter that **freezes at its goal**,
  so recovering the true totals requires a specific rule — see
  [CAP-7](./capability-spec.md#cap-7--trophies--counters-p0). Getting this wrong
  silently resets years of progress.)*

### US-F4 — Have my counters mean what they meant before (P0)
**As a** Returning User, **I want** the counting rules unchanged, **so that**
thresholds arrive when I expect.

- `tested` counts each card advanced past; `passed` each correct submission;
  `failed` each **wrong attempt** — so three wrong tries on one card count
  three times. *(Preserved exactly.)*

---

## Epic G — Import, Export & Migration ([PRD §6.7](./product-requirements.md#67-import-export--migration--p0--p1))

### US-G1 — Find my sets already there (P0)
**As a** Returning User opening the rebuilt app at vocabcards.com, **I want** my
existing sets, my selected set and my trophies simply to be there, **so that**
nothing is asked of me.

- On first run on the same origin, existing browser storage is detected and
  adopted automatically — sets, cards, current selection and trophy progress.
- The legacy data is **read, never deleted**, until migration has demonstrably
  succeeded.
- If anything cannot be parsed, it is quarantined and reported — never silently
  dropped.

### US-G2 — Import my old `.cards` files (P0)
**As a** Returning User with exported files, **I want** to import them, **so
that** my archives still work.

- `.cards` files import cleanly, with the set name taken from the filename.
- The format stays supported indefinitely.

### US-G3 — Import several files at once (P0)
**As a** Returning User with a folder of `.cards` files, **I want** to select
them all, **so that** I don't import one at a time.

- Every selected file is imported.
- A per-file result is reported: imported, renamed, replaced or failed.
- *(Fixes a **confirmed defect**: today selecting two files imports only the
  first, silently, with no error — [REBUILD_SPEC §13](../REBUILD_SPEC.md)
  bug 5.)*

### US-G4 — Get my data out (P0)
**As a** Speller, **I want** to export one set, several, or everything, **so
that** I'm never locked in.

- Export produces a versioned, self-describing file containing everything about
  the exported sets.
- Legacy `.cards` export remains available for one set at a time, so I can still
  hand a file to someone on the old app.
- Exporting and re-importing a set reproduces it exactly.

### US-G5 — Bring my list over from Quizlet or Anki (P1)
**As a** Switcher, **I want** to paste or open a delimited list, **so that** I
can move without retyping.

- Accepts pasted text or a file.
- Auto-detects tab, comma, semicolon and pipe; I can override the delimiter and
  swap which column is the answer.
- A preview shows the resulting cards before anything is saved.
- This covers Quizlet's "Copy text" export, Anki's text export, and any
  spreadsheet.

### US-G6 — Export in a format other tools read (P1)
**As a** Switcher, **I want** delimited-text export, **so that** leaving is as
easy as arriving.

### US-G7 — Import an Anki deck (P2)
**As a** Switcher, **I want** to import an `.apkg`, **so that** I can bring an
Anki deck across directly.

---

## Epic H — Settings ([PRD §6.8](./product-requirements.md#68-settings--p0))

### US-H1 — Change how I'm graded and drilled (P0)
**As a** Speller, **I want** real settings, **so that** the app fits how I study.

- Case sensitivity (**Ignore case** by default — today's hard-coded behavior).
- Quick-test size: 5 / 10 / 20 / 50 (**10** by default).
- Default prompt side: hint first (default) or answer first.
- *(Today the Settings button shows "Currently there are no settings available
  to change." It has said that since 2017.)*

### US-H2 — Make the app comfortable to look at (P0)
**As a** Speller drilling at night, **I want** light, dark and match-system
appearance, **so that** the app isn't painful to use.

- **System** by default. The choice applies immediately.

### US-H3 — Turn off analytics (P0)
**As a** privacy-conscious Speller, **I want** to switch analytics off, **so
that** I control what leaves my device.

- A clear opt-out in Settings, honoured before any event is sent.
- Analytics **never** carries card content — no hint, answer, set name, typed
  attempt or feedback output, ever.

---

## Epic I — Optional Cloud Sync ([PRD §6.9](./product-requirements.md#69-optional-cloud-sync--p1--v1-commitment))

> **Kevin's decision (2026-08-07):** sync is in v1, and is **optional** in the
> strongest sense. US-I1 is the constraint every other story in this epic is
> subordinate to. Sequencing is resolved in
> [PRD §7.3](./product-requirements.md#73-resolving-the-sync-vs-ship-early-tension).

### US-I1 — Never be asked to sign in (P0)
**As a** Speller who wants nothing to do with accounts, **I want** the entire app
to work with no account, offline, forever, **so that** I'm never taxed for
privacy.

- There is **no** sign-in wall, no "sign in to continue", no signed-out empty
  state, and no feature except sync itself that requires an account.
- In local-only mode the app makes **no authentication calls of any kind** —
  including no silent anonymous account.
- Sign-in is discoverable in Settings and offered at most **once**
  contextually, dismissibly, and never during a drill.
- **This story is P0 and gates the launch build** even though the rest of this
  epic does not — it is a constraint on how everything else is built.

### US-I2 — Keep my sets on all my devices (P1 · v1 commitment)
**As a** Student with a phone and a laptop, **I want** to sign in and have my
sets, trophies and settings follow me, **so that** I can drill anywhere.

- Sign in with Google, Apple or email.
- Sets, cards, trophy progress and study settings sync.
- Appearance and the analytics preference stay device-local by design.

### US-I3 — Keep what I already made when I sign in (P1 · v1 commitment)
**As a** Speller who used the app locally for six months and then signed in,
**I want** my existing library uploaded and merged, **so that** signing in is
never a reset.

- Local data is uploaded and merged with anything already in the account —
  never replaced, never discarded.
- Name collisions between local and cloud sets use the same prompt as US-A4.
- I'm told what happened: how many sets were uploaded, merged or renamed.

### US-I4 — Sign out without losing anything (P1 · v1 commitment)
**As a** Speller, **I want** signing out to be safe, **so that** it's never an
accidental deletion.

- Signing out offers: **keep everything on this device** (default) or **remove
  this device's copy** (with an explicit warning).
- After signing out with "keep", everything still works exactly as local-only.

### US-I5 — Keep working when the network doesn't (P1 · v1 commitment)
**As a** Traveller, **I want** to drill offline while signed in, **so that**
connectivity never blocks studying.

- Everything works offline; changes queue and sync when connectivity returns.
- Sync state is visible but unobtrusive, and never blocks the drilling loop.

### US-I6 — Delete my account and my data (P0 *for any build that ships accounts*)
**As a** user who's done, **I want** to delete my account and all my data from
inside the app, **so that** I'm not left chasing support.

- Reachable in-app, no email required.
- Explains what is deleted, requires explicit confirmation.
- Removes the account and all its cloud data.
- Offers to export first, and separately asks whether to keep the local copy.
- **Required by both the App Store and Google Play for any app offering
  accounts — launch-blocking for that build, not a fast-follow.**

### US-I7 — Understand what happens when two devices disagree (P1 · v1 commitment)
**As a** Speller who edited the same set on two devices, **I want** predictable
behavior, **so that** I'm not surprised.

- The most recent change wins, per set and per card.
- The known limitation — a device offline for a long time can overwrite a newer
  edit made elsewhere — is documented in-app in plain language rather than
  hidden.

---

## Epic J — Audio & Dictation ([PRD §6.10](./product-requirements.md#610-audio--dictation--p1))

### US-J1 — Hear the word (P1)
**As a** Language Learner, **I want** to hear the answer pronounced, **so that**
I connect the sound to the spelling.

- A speak control on the test screen and the results screen.
- Uses the device's built-in speech — offline, free, no account.

### US-J2 — Type what I hear (P1)
**As a** Speller preparing for a spelling test, **I want** a mode where the
prompt is only the spoken word, **so that** I practise the way I'll be tested.

- No text prompt — audio only, replayable as often as I want.
- **The spelling feedback works exactly the same**, which is the whole point:
  every other spelling app has audio without letter-level feedback, and Anki has
  letter-level feedback without dictation.

### US-J3 — Choose the voice and slow it down (P1)
**As a** Language Learner, **I want** to pick a voice and reduce the rate, **so
that** hard words are intelligible.

- Voice list comes from the platform; rate is adjustable.

### US-J4 — Not be broken by a device with no voices (P1)
**As a** Speller on a device with no speech engine, **I want** the app to behave
sensibly, **so that** nothing appears broken.

- Audio controls hide rather than fail; dictation mode is unavailable with a
  short explanation.

---

## Epic K — Spaced Repetition & Smart Review ([PRD §6.11](./product-requirements.md#611-spaced-repetition--smart-review--p1))

### US-K1 — Drill what I actually need (P1)
**As a** Student, **I want** a Review session that picks cards by need, **so
that** I don't waste time on words I already know.

- Selects cards I've recently failed, haven't seen in a while, or have never
  seen.

### US-K2 — Have the app schedule for me (P1)
**As a** Student with an exam in three weeks, **I want** the app to space
repetitions, **so that** the words stick.

- An SM-2-derived scheduler with a per-card interval, driven by first-try
  success rather than self-rating. *(Self-rating is the thing this product
  deliberately doesn't do — the typed answer already tells us the truth.)*

### US-K3 — Still be able to just hammer a list (P1)
**As a** Speller cramming, **I want** **10 Cards** and **All Cards** to keep
working exactly as they do now, **so that** scheduling never takes the tool away
from me.

- Scheduling is an additional, opt-in mode. It never replaces or reorders the
  existing entry points.

---

## Epic L — Trouble Words & Error Insights ([PRD §6.12](./product-requirements.md#612-trouble-words--error-insights--p1--differentiator))

### US-L1 — Know which words keep beating me (P1)
**As a** Speller, **I want** a ranked list of the words I get wrong most, **so
that** I can focus.

- Ranked across sessions, per set and overall.
- One tap drills just those.

### US-L2 — Know *why* they keep beating me (P1 · differentiator)
**As a** Speller, **I want** the app to tell me the *pattern* in my mistakes,
**so that** I fix the habit rather than the word.

- Recurring error shapes surfaced in plain language: a repeatedly dropped
  doubled letter, a consistently transposed pair, a habitually omitted space, a
  specific vowel swap.
- Example: *"You've left out the second `r` in **embarrass** 4 times."*
- *(No competitor can offer this without first computing a character-level diff,
  and only one competitor computes one at all.)*

### US-L3 — See that I'm getting better (P1)
**As a** Student, **I want** first-try accuracy over time per set, **so that** I
can tell whether this is working.

### US-L4 — Keep my mistakes private (P0)
**As a** Speller, **I want** everything about what I spell wrong to stay on my
device, **so that** my weaknesses aren't someone else's data.

- Trouble-word data is computed and stored locally.
- With sync enabled it travels only inside my own account data.
- It is **never** sent to analytics, in any form.
- **P0 because it is a constraint on how the P0 data model and analytics are
  built**, even though the feature itself is P1.

---

## Epic M — About, Help & Trust ([PRD §6.13](./product-requirements.md#613-about-changelog--help--p0))

### US-M1 — Know what version I have and what changed (P0)
**As a** Returning User, **I want** a version and changelog, **so that** I can
see the app is maintained.

- Version derived from the build — one source of truth. *(Today it's hard-coded
  in four separate places — [REBUILD_SPEC §8.5](../REBUILD_SPEC.md).)*
- The changelog is data, not markup.

### US-M2 — Know what the app does with my data (P0)
**As a** privacy-conscious Speller, **I want** a plain privacy policy in the app,
**so that** I can decide whether to trust it.

- Reachable in-app and at a stable URL. Required by both stores.
- Accurately states: local-only by default; what sync stores if I enable it;
  what analytics collects and how to turn it off.

### US-M3 — Understand the feedback the first time I see it (P1)
**As a** new Speller, **I want** a short explainer of what the marks mean, **so
that** the core mechanic isn't a puzzle.

- Reachable from the test screen.
- Explains the five error kinds with examples, including the transpose mark and
  the `#` missing-space mark.

---

## MVP Story Set

The launch build ([PRD §7.1](./product-requirements.md#71-the-launch-build--p0-only))
is exactly these stories:

**Epic A** — US-A1, A2, A3, A4, A5, A6, A7
**Epic B** — US-B1, B2, B3, B4
**Epic C** — US-C1, C2, C3, C4, C5, C6, C7, C8, C9, C10
**Epic D** — US-D1, D2, D3, **D3a**, D4, D5
**Epic E** — US-E1, E2, E3
**Epic F** — US-F1, F2, F3, F4
**Epic G** — US-G1, G2, G3, G4
**Epic H** — US-H1, H2, H3
**Epic I** — **US-I1 only** (the no-account constraint) — plus the sync-ready
data model behind it ([CAP-12](./capability-spec.md#cap-12--entity-identity--change-tracking-p0))
**Epic L** — **US-L4 only** (the privacy constraint on the data model and
analytics)
**Epic M** — US-M1, M2

**Fast-follow order** ([PRD §7.2](./product-requirements.md#72-the-fast-follow-queue--p1-in-order)):

1. US-I2, I3, I4, I5, **I6** *(I6 is launch-blocking for whichever build ships
   accounts)*, I7 — optional cloud sync
2. US-J1, J2, J3, J4 — audio and dictation
3. US-B5, US-G5, US-G6 — delimited-text import/export and bulk paste
4. US-K1, K2, K3 — spaced repetition
5. US-L1, L2, L3 — trouble words and error insights
6. US-B6 — multiple accepted answers UI
7. US-D6 — show the user their own attempt
8. US-A8, US-E4, US-M3 — remaining P1 polish

**Deferred (P2):** US-G7 (`.apkg` import), plus the P2 items listed in
[PRD §11](./product-requirements.md#11-out-of-scope-for-now).
