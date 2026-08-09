# Competitor Analysis — Flashcard, Vocabulary & Spelling Apps

_Last updated: 2026-08-07 (rev. b — transposition findings added). Background research feeding into the
[Product Requirements Document](./product-requirements.md)._

## Purpose

Vocab Cards is being rebuilt from scratch (see
[REBUILD_SPEC.md](../REBUILD_SPEC.md) for what the existing 2017–2022 Aurelia 1
app does today) and taken to the Play Store and App Store for the first time.
This document surveys the market it will land in, to establish:

- **Table stakes** — what every serious app in this category has, and we
  therefore must have.
- **Differentiators** — what would actually make someone choose us.
- **Gaps** — unaddressed needs we can own.

The single most important question this research had to answer:
**does anyone else already do character-level spelling-error feedback?**
The existing app's signature feature is that a misspelling produces a
minimum-edit-distance diff, rendering the correct spelling with exactly the
wrong characters highlighted in red (plus a dedicated marker for a missing
space). The answer is **yes — one competitor does, and only one** — and the
details of *how* it does it are where our opening is. See
[The Character-Level Diff Question](#the-character-level-diff-question) below.

> **Scope note:** this profiles the English-language US market (where Vocab
> Cards launches). It covers general-purpose flashcard apps, vocabulary apps,
> and dedicated spelling-practice apps, because the product sits at the
> intersection of all three.

> **Evidence standard:** Play Store install counts, ratings, review counts,
> ads/IAP flags and in-app-purchase price ranges below were **scraped directly
> from the live listings on 2026-08-07** and are primary data. App Store
> figures came from the public iTunes lookup API on the same date. Subscription
> prices sourced from third-party articles rather than the vendor are marked
> **unconfirmed**. Two specific facts that circulate widely and that I could
> **not** verify from a primary source are flagged inline: see
> [Unconfirmed Claims](#unconfirmed-claims).

---

## The Landscape

| App | Positioning | Paid tier (see [Pricing](#pricing)) | Notable strength | Notable weakness |
| --- | --- | --- | --- | --- |
| **Anki / AnkiDroid / AnkiMobile** | Power-user spaced repetition, open source | **Free** (AnkiDroid) · **$24.99 one-time** (AnkiMobile, iOS) | Best-in-class scheduling; **the only competitor with character-level typed-answer diff**; no ads, no IAP; 4.8★ | Steep learning curve; the diff is a hand-edited card-template feature most users never find, and it has **no concept of a transposition** |
| **Quizlet** | Mass-market student flashcards | Quizlet Plus — **~$35.99/yr** *(unconfirmed)*; Play IAP up to **$44.99** | Enormous library and brand; Learn/Test/Match/Spell modes | Learn & Test paywalled since 2022; **1.4/5 on Trustpilot, most common review word: "paywall"**; ads in free tier |
| **Memrise** | Gamified language learning | Play IAP **$0.99–$349.99** | Video of native speakers; big install base | Community courses removed from the new app; lowest rating of the majors (4.4★); ads |
| **Brainscape** | Confidence-based repetition, exam prep | **$19.99/mo → $199.99 lifetime** | Clean CBR model; no ads | Expensive monthly; small review base for its install count |
| **Vocabulary.com** | Adaptive vocabulary + **audio Spelling Bee** | Freemium *(price unconfirmed)* | Genuinely adaptive spelling bee driven by high-quality audio | Web-centric; not a custom-list tool |
| **Knowt** | "Free Quizlet" — the switcher play | Premium **~$99.99/yr** *(unconfirmed)* | **One-click Quizlet set import**; free Learn/Test | Ads; AI-first positioning; small next to Quizlet |
| **RemNote** | Notes + spaced repetition for power users | Play IAP **$14.99–$399.99** | Typed answers integrated with note-taking | Heavy; not a drilling app |
| **Drops / DuoCards / Duolingo** | Gamified language acquisition | Various, ads + IAP | Habit formation, huge reach | Fixed content; **no custom lists**; Drops deliberately avoids typing |
| **Dedicated spelling apps** (Spelling Shed, Spell It, Spell4Fun, Better Speller, SpellQuiz, SpellingJoy, Nessy, Word Club) | K–6 spelling homework, audio dictation | $3.99–$15.50/mo, many free | **Audio dictation is universal**; custom word lists common | Aimed at children; gamified; **none surfaced does character-level error marking** |

### Play Store hard data (scraped 2026-08-07)

| App | Package | Installs (exact) | Rating | Reviews | Ads | In-app purchases |
| --- | --- | --- | --- | --- | --- | --- |
| Duolingo | `com.duolingo` | 500M+ | 4.7 | 48.4M | Yes | $0.99–$239.99 |
| Quizlet | `com.quizlet.quizletandroid` | 50M+ (61,925,615) | 4.7 | 906K | **Yes** | $1.99–$44.99 |
| Memrise | `com.memrise.android.memrisecompanion` | 50M+ (51,107,517) | 4.4 | 1.57M | **Yes** | $0.99–$349.99 |
| **AnkiDroid** | `com.ichi2.anki` | 10M+ (23,234,075) | **4.8** | 164K | **No** | **None** |
| Drops | `com.languagedrops.drops.international` | 10M+ (12,054,402) | 4.3 | 317K | Yes | $0.99–$269.99 |
| DuoCards | `com.duocards.app` | 5M+ (5,438,447) | 4.6 | 55.5K | Yes | $6.70–$109.00 |
| Brainscape | `com.brainscape.mobile.portal` | 1M+ (1,181,056) | 4.7 | 13.7K | No | $19.99–$199.99 |
| AnkiApp *(unaffiliated)* | `com.ankiapp.client` | 1M+ (1,300,923) | 4.4 | 4.62K | No | None listed |
| Lexilize Flashcards | `com.lexilize.fc` | 1M+ (1,839,553) | 4.6 | 37.6K | Yes | $3.89–$97.99 |
| Knowt | `com.knowt.app` | 500K+ (773,593) | 4.4 | 8.3K | Yes | $7.99–$249.99 |
| RemNote | `com.remnote.v2` | 100K+ (447,995) | 4.7 | 5.14K | No | $14.99–$399.99 |
| Spelling Shed | `com.edshed.spellingshed` | 10K+ | 3.3 | 253 | No | None |

**The most important row is AnkiDroid.** It is the only major app in the
category with **no ads and no in-app purchases**, and it has **the highest
rating (4.8★ over 164K reviews)** and 23.2 million installs. Free-and-adless is
not a naive position in this market — it is the winning one.

**The second most important row is Quizlet.** 62M installs and a 4.7★ store
rating, but a **1.4/5 Trustpilot score across 600+ reviews where the single
most frequent word is "paywall."** The store rating lags sentiment. That gap is
our opening.

---

## Pricing

Prices as of 2026-08-07, USD. Play Store IAP ranges are primary data scraped
from the listings; subscription prices from vendor pages or third-party
articles are labelled accordingly.

| App | Free tier | Paid tier | Price | Source quality |
| --- | --- | --- | --- | --- |
| **AnkiDroid** (Android) | Fully free, open source, no ads, no IAP | — | **$0** | Primary (Play listing) |
| **AnkiMobile** (iOS) | — (paid up front) | — | **$24.99 one-time** · ★4.04, 2,315 ratings | Primary (iTunes API) |
| **Anki** (desktop) | Fully free, open source | — | **$0** | Primary |
| **Quizlet** | Flashcard viewing + Match, with ads; Learn & Test gated | Quizlet Plus / Plus Unlimited | **~$35.99/yr** *(unconfirmed — quizlet.com/upgrade returns HTTP 403 to non-browser clients; figure is from secondary reporting)*. Play IAP range **$1.99–$44.99 per item** is primary and consistent with it. | Mixed |
| **Memrise** | Limited, ads | Pro (monthly/annual/lifetime) | Play IAP **$0.99–$349.99 per item**. Third-party sources disagree wildly on the subscription figures (annual quoted anywhere from $61.99 to $89.99; lifetime $119.99 to $329.99) — **treat all specific Memrise subscription numbers as unconfirmed.** | Primary range only |
| **Brainscape** | Limited free decks | Pro | **$19.99/mo · $9.99/mo semester · $7.99/mo yearly · $199.99 lifetime**. Play IAP range **$19.99–$199.99** corroborates exactly. | Good (vendor pricing page + primary IAP range) |
| **Knowt** | Unlimited manual sets, free Learn/Test, ads | Premium (AI features) | **~$99.99/yr** *(unconfirmed)*; Play IAP **$7.99–$249.99** | Mixed |
| **SpellQuiz** | Free tier | Parent / Teacher plans | **$12.95/mo · $119.95/yr** (parents); $15.95/mo · $149.95/yr (teacher, 2 seats); $29.95/mo · $299/yr (teacher, 25 seats) | Vendor pricing page |
| **Spelling Shed** | — | Home subscription | **$4.99/mo · $29.99/yr** (up to 5 students) | Secondary |
| **Nessy** | — | Home | **$15.50/mo · $126/yr** | Secondary |
| **Word Club** | 7-day trial | Subscription | **$3.99/mo** | Secondary |
| **SpellingJoy / Khan Academy Kids** | Fully free, no subscription | — | **$0** | Secondary |

### What the price data tells us

1. **There is no established price for "a spelling drill app with custom
   lists."** The general study apps charge $30–$45/yr; the kids' spelling apps
   charge $30–$150/yr and are bought by parents; the highest-rated app in the
   category charges nothing.
2. **A one-time purchase is viable.** AnkiMobile sustains **$24.99 paid up
   front** with a 4.04★ rating and no free tier at all. Brainscape sells a
   $199.99 lifetime alongside its subscription. The category does not require a
   subscription.
3. **Ads correlate with lower ratings.** Every ad-carrying app in the table
   sits at 4.3–4.7★; the two adless, IAP-free ones (AnkiDroid, and Anki
   desktop) sit at the top. Combined with the Quizlet sentiment data, "no ads,
   nothing gated" is a defensible product position, not just a nicety.

---

## The Character-Level Diff Question

This is the question the whole product hinges on, so it gets its own section.

### Anki does it — and it is the only one that does

Anki's `{{type:Field}}` card-template directive renders a text box; on reveal,
Anki compares the typed answer to the field and "show[s] you which parts you got
right and which parts you got wrong," using three CSS classes:

| Class | Meaning | Default colour |
| --- | --- | --- |
| `typeGood` | Correctly typed | Green |
| `typeBad` | Typed incorrectly | Red |
| `typeMissed` | Omitted from the answer | Grey |

It renders in a monospaced font specifically so the provided and correct
strings line up. ([Anki Manual — Fields](https://docs.ankiweb.net/templates/fields.html))

**So the algorithm is not our differentiator.** Anything the PRD claims about
"the diff" being novel must be qualified. What *is* differentiating is
everything around it — see below.

### Six documented weaknesses in Anki's implementation

1. **It is a hand-edited template feature, not a mode.** Enabling it requires
   the user to open a note type's card template and type `{{type:Field}}` into
   the HTML by hand. It is off by default and the overwhelming majority of Anki
   users never turn it on. There is no "spelling mode" toggle.
2. **It does not affect grading.** The manual is explicit: it "doesn't alter how
   cards are ultimately graded — you retain final evaluation responsibility."
   You type an answer, see the diff, and then still self-rate Again/Hard/Good/
   Easy. There is no retry loop, and nothing forces you to type it correctly.
3. **Users can't see their own input.** A long-running complaint thread has
   users reporting they see the correct answer with grey missing letters
   rather than their own attempt marked up against it: *"I cannot see the
   input I made? At least some red highlighting would be welcome."*
   ([Anki Forums](https://forums.ankiweb.net/t/error-highlighting-after-typing-the-answer/25755))
4. **The marking has real bugs.** Reported and open: mis-marking with
   **repeated characters**, correctly-typed characters flagged wrong in
   **non-Latin scripts** (Korean specifically), malformed "correct" output, and
   platform inconsistency between desktop and iOS.
   ([forum](https://forums.ankiweb.net/t/error-in-text-comparison-highlighting-type-card/40643),
   [AnkiDroid #14530](https://github.com/ankidroid/Anki-Android/issues/14530),
   [2.1.55 regression](https://forums.ankiweb.net/t/for-basic-type-in-the-answer-card-types-does-red-green-highlighting-still-work-2-1-55/25949))
5. **The mobile experience is worse than desktop.** On AnkiDroid the typing box
   is **not automatically focused** — you must tap it before typing every
   card — and it has repeatedly failed to appear at all under certain settings.
   ([#15569](https://github.com/ankidroid/Anki-Android/issues/15569),
   [#15466](https://github.com/ankidroid/Anki-Android/issues/15466),
   [#14419](https://github.com/ankidroid/Anki-Android/issues/14419))
6. **It has no concept of a transposition.** Anki's comparison is a plain
   character diff with no notion of a swap, so `recieve` for `receive` — one of
   the most common spelling errors in English — is reported as **two unrelated
   wrong letters** rather than as two letters written the wrong way round. The
   `typeGood`/`typeBad`/`typeMissed` vocabulary has no fourth category for it,
   so the limitation is structural rather than a bug. *(This is also true of
   Vocab Cards v0.2.0 today, which is why the rebuild moves to
   Damerau–Levenshtein and adds a transposed status — see
   [spelling-diff-spec.md §1.1](./spelling-diff-spec.md#11-intentional-departure-from-verbatim-parity--transposition-added-2026-08-07).)*

### No competitor marks a missing space, and none detects a transposition

Two small, specific gaps that nobody in the market fills:

**Missing space.** The existing Vocab Cards renders an omitted space as a
distinct marker (added in v0.1.6 specifically to make the case visible —
[REBUILD_SPEC §9.1](../REBUILD_SPEC.md); the rebuild switches the glyph to `#`,
the proofreading convention). No competitor surveyed has an analogous treatment.
It is small, but "ice cream" vs "icecream" is a real spelling error that every
other tool renders as an invisible failure.

**Transposed letters.** No surveyed product — Anki included — reports a swapped
pair as a *swap*. Everything either marks both letters wrong independently
(Anki) or marks the whole answer wrong (everyone else). Proofreading has had a
dedicated transpose mark for as long as manuscripts have been corrected by hand,
precisely because swapped letters are so common; matching that convention is a
second, independent axis on which the rebuilt product beats the only competitor
that does character-level marking at all.

### Everyone else is moving in the *opposite* direction

Quizlet's grading is deliberately typo-**tolerant**, with three levels:

- **Relaxed** — "the general meaning of your answer is accepted as correct, and
  synonyms, rephrasing, and typos are also accepted."
- **Standard** — "an exact match is required, but minor misspellings such as
  accent mark errors or missing letters are accepted."
- **Strict** — exact match, only case/punctuation slack.

On top of that sits AI **Smart Grading**, which credits understanding over
wording, and an explicit **"Override: I was correct"** button.
([grading options](https://help.quizlet.com/hc/en-us/articles/360048313652-Using-grading-options-US),
[Smart Grading](https://quizlet.com/blog/how-smart-grading-helps-students))

RemNote and StudySmarter simply compare the typed string to the answer and mark
it right or wrong, with no per-character breakdown.
([RemNote](https://help.remnote.com/en/articles/7752298-typing-in-answers),
[StudySmarter](https://studysmarter.zendesk.com/hc/en-gb/articles/4471309936284-Type-the-answer-feature))

**For a spelling product this industry drift is exactly backwards.** A
"missing letter" is not noise to be forgiven — it is precisely the thing being
trained. Every leniency feature Quizlet ships makes it worse at the job Vocab
Cards exists to do.

### The dedicated spelling apps don't do it either

Spelling Shed, Spell It, Spell4Fun, Spelling Notebook, SpellingJoy, Nessy,
Word Club and Better Speller are all K–6-oriented, audio-dictation-driven and
game-shaped. None surfaced in this research advertises character-level error
marking; feedback is word-level right/wrong plus a missed-word list.

**Better Speller** is the closest philosophical relative in the entire market:
custom word lists, voice playback, trophies, Apple Pencil handwriting, and the
explicit promise *"No account required, no data ever sent to a server."* It is
**iOS-only** ("Android coming soon") and its published feature list contains no
per-letter feedback. ([betterspeller.app](https://www.betterspeller.app/))

### Conclusion

> The **algorithm** is table stakes for exactly one competitor and absent from
> everyone else. The **product built around it** — typing as the only input,
> immediate automatic correction, retry until right, a missing-space marker,
> and zero setup — does not exist anywhere. That is the wedge, and the PRD
> should claim that and not more.

---

## Feature Breakdown by App

### Anki / AnkiDroid / AnkiMobile
- **Scheduling:** SM-2-derived by default, with **FSRS** available since Anki
  23.10 / AnkiMobile 23.10 / AnkiWeb, and AnkiDroid 2.17+. FSRS was trained on
  ~700M reviews and produces 20–30% fewer reviews for equivalent retention.
  ([FSRS wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm))
- **Typed answers:** `{{type:Field}}` with `typeGood`/`typeBad`/`typeMissed`
  (see above). `{{type:nc:Field}}` ignores diacritics. **Limits:** one typing
  comparison per card; single-line fields only; absent from previews and
  AnkiWeb.
- **Import/export:** plain-text with auto-detected **comma, semicolon, tab,
  space, pipe or colon** delimiters, UTF-8; `.apkg` deck packages and `.colpkg`
  collection packages for full fidelity including media.
  ([text import](https://docs.ankiweb.net/importing/text-files.html))
- **Sync:** free AnkiWeb sync across desktop/mobile.
- **Business model:** free and open source everywhere except iOS, where
  AnkiMobile is $24.99 up front and funds development.
- **Weakness:** notoriously steep onboarding. The features that matter are
  buried in deck options and card templates.

### Quizlet
- **Modes:** Flashcards, Learn, Test, Match, Blast, and **Spell** — the last
  being "type what you hear," now folded into Learn's options and **web-only**.
  ([Spell mode](https://help.quizlet.com/hc/en-us/articles/360030645752-Studying-with-Spell-mode))
- **Grading:** three typo-tolerance levels plus AI Smart Grading (Plus).
- **Export:** "Copy text" / download with selectable term-definition and
  row delimiters (tab or comma common), UTF-8; produces a `.txt`.
- **Monetization:** Learn and Test moved behind Quizlet Plus on 2022-08-01, and
  the free tier has narrowed since. Ads in free.
- **Sentiment:** 1.4/5 on Trustpilot across 600+ reviews; "paywall" the modal
  word; sustained hostile coverage in student press.
  ([North Texas Daily](https://www.ntdaily.com/opinion/quizlet-s-paywalls-place-priority-on-profits-over-pupils/article_848d54c6-4eca-11ef-b6bd-bba8eff900d3.html),
  [pawebpage](https://pawebpage.com/3269/opinions/quizlets-paywall-proves-that-students-are-its-last-priority/))

### Knowt
- Positioned explicitly as free-Quizlet: unlimited manual sets, free Learn and
  Test, spaced repetition, Match.
- **The growth lever is import:** paste a Quizlet set URL, or use a Chrome
  extension, and the terms come across in one click.
- Ads in free; AI generation behind Premium.

### Memrise / Drops / DuoCards / Duolingo
- Fixed, publisher-authored content with gamified streaks. **Duolingo and Drops
  have no user-authored word lists at all**; DuoCards and Memrise have limited
  ones (Memrise removed community courses from the new app experience in 2024).
- Duolingo does use typed input in exercises, but grading is lenient and
  feedback is word-level.
- Relevance to us: these are the habit-formation benchmark, not feature
  competitors. Their streaks and daily-goal mechanics are what users expect
  from *any* learning app in 2026.

### Brainscape
- **Confidence-based repetition**: rate 1–5 after each card; the scheduler uses
  that rating. No typed input as the primary mode.
- No ads. Aggressive monthly price with a lifetime escape hatch.

### Vocabulary.com
- **The Spelling Bee** is the closest thing in the market to a serious adult
  spelling trainer: high-quality audio, and **adaptive** — keep getting words
  right and the words get harder. **Community Spelling Bees** let subscribers
  generate a bee from any word list, including other people's.
  ([VT Spelling Bee](https://www.vocabulary.com/articles/announcements/introducing-the-vt-spelling-bee/),
  [Community Spelling Bees](https://www.vocabulary.com/articles/announcements/introducing-community-spelling-bees/))
- Web-centric; not a personal-list drilling tool; feedback is right/wrong.

### Dedicated spelling apps
- **Universal pattern:** audio dictation ("type what you hear"), custom word
  lists, games (unscramble, multiple choice, word search), progress tracking,
  missed-word review.
- **SpellQuiz** differentiates on *human* recordings by North American voice
  artists rather than synthetic TTS, plus a global spelling-bee leaderboard.
- **Better Speller** adds Apple Pencil handwriting practice on iPad and
  teacher list sharing; privacy-first and account-free.
- **Price ceiling is set by parents**, not students — hence $120–$150/yr being
  tolerable at the top end (SpellQuiz, Nessy).

---

## Adjacent Market Observations

### Brand squatting is endemic in this category

`AnkiApp` (1.3M installs) and `Anki Pro` are **unaffiliated** with Anki, cannot
sync with it, and were named years later to trade on the brand. Anki's own
community documents this actively.
([SPEAKADA](https://speakada.com/official-anki-vs-fake-apps-the-critical-mistake-costing-language-learners-hours/),
[Anki Forums](https://forums.ankiweb.net/t/fake-reviews-on-ankiweb/45192))

Two apps already carry the *VocabCards* name, and neither is a competitor:

| Listing | Store | Scale | Status |
| --- | --- | --- | --- |
| `com.mertyigit0.vocabcards` — "VocabCards" | Play | **10+ installs** | Live, trivial |
| `id1116991036` — "VocabCards" (Peter McLeod) | App Store | **3 ratings** | Last updated 2019-10-01 |

Neither is a competitive threat. Both are a mild store-search and trademark
consideration — see [PRD §10](./product-requirements.md#10-open-questions).

### Google Play Families policy — out of scope

Play's Families programme imposes certified-ad-SDK-only, no personalised ads,
no precise location, no device identifiers from children, plus COPPA and GDPR
compliance. ([Play Families policies](https://support.google.com/googleplay/android-developer/answer/9893335))
**Kevin's decision (2026-08-07): the audience is students and adults, not
children.** Vocab Cards will not enrol in the Families programme and will not
be marketed to under-13s, which takes this entire compliance surface off the
table. Recorded here so a later pass does not re-open it casually — changing
the target audience to children would reintroduce all of it.

---

## Key Takeaways for Our Product

1. **Character-level typed-answer diffing exists in exactly one competitor
   (Anki), where it is an opt-in card-template hack that doesn't affect
   grading, hides the user's own input, has open marking bugs, cannot represent
   a transposition, and is noticeably worse on mobile.** Everyone else has
   nothing. The algorithm is not the moat — *the product built around it* is.
   See [The Character-Level Diff Question](#the-character-level-diff-question).

   **Transposition is an unfilled gap even within that one competitor.** No
   surveyed product reports swapped letters as a *swap* — Anki marks both
   letters wrong independently, everyone else marks the whole answer wrong —
   even though proofreading has a dedicated transpose mark and swaps are among
   the commonest spelling errors. Cheap to close (Damerau–Levenshtein instead of
   Levenshtein), and a **second axis of advantage** over the only competitor
   doing character-level marking at all. See
   [PRD §6.4](./product-requirements.md#64-spelling-feedback--p0--differentiator)
   and [spelling-diff-spec.md](./spelling-diff-spec.md).
2. **The rest of the market is actively getting *more* forgiving of typos**
   (Quizlet's Relaxed/Standard grading, Smart Grading, "I was correct"
   override). For a spelling product that is the wrong direction, and it means
   incumbents cannot copy our stance without contradicting their own roadmap.
3. **Audio dictation is table stakes for spelling and we have none.** Every
   dedicated spelling app, Quizlet's Spell mode, Vocabulary.com's Spelling Bee
   and SpellQuiz's entire product are built on "type what you hear." This is
   our largest table-stakes gap. See
   [PRD §6.10](./product-requirements.md#610-audio--dictation--p1).
4. **Spaced repetition is table stakes.** Anki (SM-2 + FSRS), Quizlet Learn,
   Memrise and Brainscape all schedule. Vocab Cards currently uses
   `sort(() => 0.5 - Math.random())`, which is not even a correct shuffle. See
   [PRD §6.11](./product-requirements.md#611-spaced-repetition--smart-review--p1).
5. **A generous, adless, nothing-gated free tier is the single strongest
   position available**, and it is empirically the winning one: AnkiDroid is
   adless, IAP-free and the highest-rated app in the category (4.8★ / 164K
   reviews / 23.2M installs), while Quizlet's paywall has produced a 1.4/5
   Trustpilot score. See [PRD §8](./product-requirements.md#8-monetization).
6. **Import is the acquisition channel, not a convenience.** Knowt's growth
   lever is a one-click Quizlet importer; Tricount-style "import from the
   incumbent" is a proven switching-cost reducer. Anki accepts six delimiters
   and Quizlet exports tab/comma text — the on-ramp is cheap to build. See
   [PRD §6.7](./product-requirements.md#67-import-export--migration--p0--p1).
7. **A one-time purchase is a proven model here.** AnkiMobile charges **$24.99
   up front** with no free tier and holds 4.04★. Brainscape sells a $199.99
   lifetime. Nothing about this category demands a subscription — which
   supports Kevin's "free now, one-time unlock later" decision.
8. **Session results and missed-word practice are universal and we lack them
   entirely.** Every competitor ends a study session with a score and a list of
   what you got wrong. Today a Vocab Cards test simply ends and returns to the
   menu. See [PRD §6.5](./product-requirements.md#65-session-results--missed-word-practice--p0).
9. **Achievements are only worth having if they're visible.** We ship 24
   trophies with no screen that lists them — the only way to see one is a
   2-second toast ([REBUILD_SPEC §9.3](../REBUILD_SPEC.md)). Competitors that
   gamify (Duolingo, Memrise, Better Speller) all surface progress
   persistently. Fixing this is close to free. See
   [PRD §6.6](./product-requirements.md#66-trophies--progress--p0).
10. **Account-free operation is a marketable property, not a limitation.**
    Better Speller advertises "No account required, no data ever sent to a
    server" as a headline feature. This is the property the existing app
    already has for free, and it constrains how sync must be built: sync has to
    be genuinely optional, not a soft requirement. See
    [PRD §6.9](./product-requirements.md#69-optional-cloud-sync--p1--v1-commitment).
11. **Nobody analyses *which characters* users get wrong.** The diff already
    computes this on every failure and then throws it away. Aggregating it into
    a "trouble words / trouble patterns" view is a feature no competitor can
    ship without first building the diff — the only genuinely novel idea in the
    set. See [PRD §6.12](./product-requirements.md#612-trouble-words--error-insights--p1--differentiator).
12. **The store name is effectively available**, and the two same-named apps
    are dormant (10 installs; 3 ratings, last updated 2019). But brand squatting
    is endemic in this category (AnkiApp, Anki Pro), so a distinctive store
    title is worth the effort.

---

## Unconfirmed Claims

Recorded explicitly so no downstream document states them as fact.

| Claim | Status | Detail |
| --- | --- | --- |
| **"FSRS is Anki's default scheduler."** | ❌ **Unconfirmed** | Widely repeated by secondary sources. The official manual still instructs users to "Enable FSRS under the 'FSRS' section, at the bottom of the deck options page," and the official FAQ says only that "as of Anki 23.10, Anki has two available algorithms," the first being SM-2-based. **What is confirmed:** FSRS is *available* in Anki 23.10+, AnkiMobile 23.10+, AnkiWeb, and AnkiDroid 2.17+. Do not claim it is the default. |
| **"Quizlet Plus costs $35.99/year."** | ⚠️ **Unconfirmed** | `quizlet.com/upgrade` returns HTTP 403 to non-browser clients, so no primary confirmation was possible. Multiple secondary sources converge on $35.99/yr and ~$7.99/mo, and the **primary** Play Store IAP range of **$1.99–$44.99 per item** is consistent with it. Cite the IAP range when precision matters. |
| **Memrise subscription prices** | ⚠️ **Unconfirmed** | Secondary sources give annual figures from $61.99 to $89.99 and lifetime from $119.99 to $329.99. Only the Play IAP range ($0.99–$349.99) is primary. |
| **Knowt Premium at $99.99/yr** | ⚠️ **Unconfirmed** | Secondary only; Play IAP range $7.99–$249.99 is primary. |
| **Vocabulary.com premium pricing** | ⚠️ **Not found** | No reliable figure located. |

---

## Sources

**Anki / AnkiDroid / AnkiMobile**
- [Anki Manual — Fields (`{{type:Field}}`)](https://docs.ankiweb.net/templates/fields.html)
- [Anki Manual — Deck Options (FSRS)](https://docs.ankiweb.net/deck-options.html)
- [Anki Manual — Importing text files](https://docs.ankiweb.net/importing/text-files.html)
- [Anki FAQ — What spaced repetition algorithm does Anki use?](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)
- [FSRS — The Algorithm (wiki)](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
- [Anki Forums — Error highlighting after typing the answer](https://forums.ankiweb.net/t/error-highlighting-after-typing-the-answer/25755)
- [Anki Forums — Error in text comparison highlighting (type: card)](https://forums.ankiweb.net/t/error-in-text-comparison-highlighting-type-card/40643)
- [Anki Forums — Does red/green highlighting still work? (2.1.55)](https://forums.ankiweb.net/t/for-basic-type-in-the-answer-card-types-does-red-green-highlighting-still-work-2-1-55/25949)
- [AnkiDroid #14530 — incorrect colors for typed-answer difference](https://github.com/ankidroid/Anki-Android/issues/14530)
- [AnkiDroid #15569 — typing box not automatically highlighted](https://github.com/ankidroid/Anki-Android/issues/15569)
- [AnkiDroid #15466 — "Type Answer" box not appearing](https://github.com/ankidroid/Anki-Android/issues/15466)
- [AnkiDroid #14419 — Type answer box absent when answer buttons set to None](https://github.com/ankidroid/Anki-Android/issues/14419)
- [AnkiDroid Manual — Type in answer](https://krmanik.github.io/ankidroiddocs/advanced-features/type-in-answer.html)
- [SPEAKADA — Official Anki vs fake apps](https://speakada.com/official-anki-vs-fake-apps-the-critical-mistake-costing-language-learners-hours/)
- [Anki Forums — Fake reviews on AnkiWeb](https://forums.ankiweb.net/t/fake-reviews-on-ankiweb/45192)

**Quizlet**
- [Quizlet — Using grading options](https://help.quizlet.com/hc/en-us/articles/360048313652-Using-grading-options-US)
- [Quizlet — Studying with Write mode](https://help.quizlet.com/hc/en-us/articles/360030990531-Studying-with-Write-mode)
- [Quizlet — Studying with Spell mode](https://help.quizlet.com/hc/en-us/articles/360030645752-Studying-with-Spell-mode)
- [Quizlet — Studying with Learn](https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn)
- [Quizlet Blog — How Smart Grading helps students study more effectively](https://quizlet.com/blog/how-smart-grading-helps-students)
- [Quizlet — Exporting your sets](https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets)
- [North Texas Daily — Quizlet's paywalls place priority on profits over pupils](https://www.ntdaily.com/opinion/quizlet-s-paywalls-place-priority-on-profits-over-pupils/article_848d54c6-4eca-11ef-b6bd-bba8eff900d3.html)
- [pawebpage — Quizlet's paywall proves that students are its last priority](https://pawebpage.com/3269/opinions/quizlets-paywall-proves-that-students-are-its-last-priority/)
- [MintDeck — Quizlet Paywall: what you've lost](https://www.mintdeck.app/blog/quizlet-paywall-free-alternative)

**Other flashcard / vocabulary apps**
- [RemNote — Typing in answers](https://help.remnote.com/en/articles/7752298-typing-in-answers)
- [StudySmarter — Type the answer feature](https://studysmarter.zendesk.com/hc/en-gb/articles/4471309936284-Type-the-answer-feature)
- [Knowt vs Quizlet (2026)](https://studygenie.io/blog/knowt-vs-quizlet)
- [Brainscape — Pricing](https://www.brainscape.com/pricing)
- [Vocabulary.com — Introducing the VT Spelling Bee](https://www.vocabulary.com/articles/announcements/introducing-the-vt-spelling-bee/)
- [Vocabulary.com — Introducing Community Spelling Bees](https://www.vocabulary.com/articles/announcements/introducing-community-spelling-bees/)

**Dedicated spelling apps**
- [Better Speller](https://www.betterspeller.app/)
- [SpellQuiz — Pricing](https://spellquiz.com/pricing)
- [SpellQuiz — Introduction](https://blog.spellquiz.com/spell-quiz-the-ultimate-spelling-test-and-practice-website-for-all-ages/)
- [SpellingJoy — Best spelling apps for kids 2026](https://spellingjoy.com/best-apps/spelling-apps-for-kids)
- [Brighterly — 13 best spelling apps for kids in 2026](https://brighterly.com/blog/best-spelling-apps-for-kids/)
- [EducationalAppStore — Best spelling apps](https://www.educationalappstore.com/best-apps/our-5-best-apps-for-super-spelling)

**Store policy**
- [Google Play Families policies](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Families Self-Certified Ads SDK Program](https://support.google.com/googleplay/android-developer/answer/9900633)

**Store listings (scraped 2026-08-07)**
- Play: [AnkiDroid](https://play.google.com/store/apps/details?id=com.ichi2.anki) ·
  [Quizlet](https://play.google.com/store/apps/details?id=com.quizlet.quizletandroid) ·
  [Memrise](https://play.google.com/store/apps/details?id=com.memrise.android.memrisecompanion) ·
  [Brainscape](https://play.google.com/store/apps/details?id=com.brainscape.mobile.portal) ·
  [Knowt](https://play.google.com/store/apps/details?id=com.knowt.app) ·
  [Drops](https://play.google.com/store/apps/details?id=com.languagedrops.drops.international) ·
  [DuoCards](https://play.google.com/store/apps/details?id=com.duocards.app) ·
  [RemNote](https://play.google.com/store/apps/details?id=com.remnote.v2) ·
  [Lexilize](https://play.google.com/store/apps/details?id=com.lexilize.fc) ·
  [Spelling Shed](https://play.google.com/store/apps/details?id=com.edshed.spellingshed) ·
  [AnkiApp (unaffiliated)](https://play.google.com/store/apps/details?id=com.ankiapp.client) ·
  [VocabCards (name collision)](https://play.google.com/store/apps/details?id=com.mertyigit0.vocabcards)
- App Store: [AnkiMobile Flashcards](https://apps.apple.com/us/app/ankimobile-flashcards/id373493387) ·
  [VocabCards (name collision)](https://apps.apple.com/us/app/vocabcards/id1116991036)
