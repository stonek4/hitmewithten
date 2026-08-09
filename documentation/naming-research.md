# Naming Research — Vocab Cards

| | |
| --- | --- |
| **Status** | Draft v0.1 — recommendation, awaiting Kevin's decision |
| **Last updated** | 2026-08-08 |
| **Owner** | Kevin Stoner |
| **Resolves** | [PRD §10 Q1](./product-requirements.md#10-open-questions) · [Capability Spec Open Q10](./capability-spec.md#open-questions-capability-level) — **both now resolved: Kevin confirmed *Vocab Cards* on 2026-08-08**, and the store title was corrected to the 30-character colon form |
| **Related** | [Competitor Analysis](./competitor-analysis.md) · [PRD](./product-requirements.md) |

---

## Verdict

**Keep "Vocab Cards."** Put the differentiator in the store title, not the name.

Three findings decided it, and none of them is sentiment about the incumbent:

1. **Every good domain in this space is gone.** I checked 45 candidate `.com`s
   against Verisign's authoritative registry today. **Thirty-seven are
   registered**, including every single-word and every natural two-word
   compound — `speller`, `spellbound`, `misspell`, `spellcards`, `spelldeck`,
   `spellpad`, `wordcards`, `redpen`, `lexeme`. The eight that are free are
   coinages nobody would choose on merit (`spellverso`, `vocabverso`,
   `spellstrict`). Kevin already owns a **nine-year-old exact-match `.com`**.
   Renaming means trading that for something worse and paying for the privilege.
2. **The three "real word" names that would have preserved the V logo are all
   blocked by large existing brands.** *Verbatim* is a global data-storage brand
   in **trademark class 9 — the exact class software sits in**. *Vellum* is an
   established $199–$249 Mac publishing app. *Verso* is a 55-year-old publishing
   house, in the books/words space. Each would be a fight, and the second one
   would be us doing to someone else exactly what "AnkiApp" did to Anki.
3. **The name is not what needs to carry the differentiator — the store title
   is.** Both stores index a 30-character title. `Vocab Cards: Spelling
   Practice` is **exactly 30** and puts the winnable keyword in the indexed
   field, while keeping the name that owns the domain and fits the logo.

The one real argument for renaming — that "Vocab Cards" is descriptive and
therefore nearly unprotectable — is a business-defence concern for a free app
with no revenue whose author has no intention of litigating. **The cost of
renaming is certain and immediate; the benefit is an enforcement capability he
will never exercise.** That asymmetry is the whole decision.

> ⚠️ **One correction that matters regardless of the naming decision:** the store
> title proposed earlier in the PRD — `Vocab Cards — Spelling Practice` — is
> **31 characters and will be rejected by both stores.** The em dash costs three
> characters (space-dash-space) where a colon costs two. Use
> `Vocab Cards: Spelling Practice` (exactly 30). See
> [§6](#6-recommended-store-title).

---

## 1. Method, and what this document can and cannot prove

Held to the same evidential standard as the
[Competitor Analysis](./competitor-analysis.md): verified claims are labelled
with how and when they were checked; everything else is labelled unconfirmed.

| Check | Method | Strength |
| --- | --- | --- |
| **Domain availability** | RDAP query against `rdap.verisign.com`, the authoritative registry for `.com`, **2026-08-08** | ✅ **Authoritative.** Registration status and creation date are registry facts. |
| **App Store name collisions** | Apple iTunes Search API, exact and prefix matching, US storefront, **2026-08-08** | ⚠️ **Indicative only.** The API is *relevance-ranked*, not a name index. "No exact match in the top 50" is **not proof a name is free.** The only authoritative check is attempting to reserve the name in App Store Connect. |
| **Play Store collisions** | Listing scrape, **2026-08-07** | ⚠️ **Not re-verified today** — Google began refusing my requests mid-session. Figures below are as of 2026-08-07 and are flagged. Play titles are **not** required to be unique, so this matters less. |
| **Trademark** | ❌ **No programmatic search was possible.** USPTO's `tmsearch` endpoints returned 404, its bulk API was unreachable, and WIPO's Global Brand Database is behind a bot challenge. | ❌ **Not a search.** What follows is *documented commercial use* from public sources — strong evidence a mark exists, no evidence that one doesn't. |
| **ASO limits** | Published store limits, cross-checked against multiple ASO references | ⚠️ Secondary sources agree (30/30/100 Apple, 30/80 Play); not read off Apple's own docs, whose page refused my request. |

> **This is not legal clearance and must not be treated as it.** No
> knock-out search was performed. If Kevin ever intends to build a business on
> the name, take payments under it, or defend it, that wants a real search by
> someone qualified — which costs a few hundred dollars and is cheap next to
> rebranding after a cease-and-desist. The practical risk here is low precisely
> *because* the recommendation is to keep a descriptive name nobody can own,
> including us.

## 2. What the name actually has to do

| Criterion | Why it matters here | Weight |
| --- | --- | --- |
| **Spellable after hearing it** | Amusingly load-bearing for a spelling app. If someone recommends it out loud and the listener can't type it into a store search, the name has failed at its only job. **This single criterion eliminates most coinages** — `Verba`, `Vocably`, `Vocabee` all have three plausible spellings. | **High** |
| **Preserves the "V" logo** | The rounded-square **V** and script wordmark in `hmwt_app/logo/` (Illustrator source + vector PDF) are the product's only brand equity, and the designer declined to replace the mark. A non-V name **orphans it and costs a redraw**. | **High** |
| **Domain** | Kevin holds `vocabcards.com` (registered **2017-05-28**, Cloudflare — verified). Nine years of history. | **High** |
| **Store discoverability** | The title is an indexed ASO field on both stores. The name should either *be* a keyword or leave room for one. | **High** |
| **Says what the product is** | Spelling-first, strict, offline, free. | Medium |
| **Distinctive enough to protect** | Descriptive names are unownable. Real, but see the Verdict on why it loses here. | Medium |
| **No unfortunate readings** | Standard hygiene. | Medium |
| **Workable as a handle** | Nice to have; the product has no social presence. | Low |

## 3. The two constraints that dominate everything

### 3.1 The domain is a held asset, not a preference

`vocabcards.com` — **registered 2017-05-28, currently at Cloudflare** (verified
by RDAP, 2026-08-08). That is an exact-match `.com` for the product name, nine
years old, already serving the live app.

The market for alternatives is exhausted. **Of 45 candidates checked, 37 are
registered.** The full table is in [§7](#7-domain-findings-full-table); the
shape of it is that *every* name a reasonable person would want is gone, several
to registrars that hold names for resale (`TurnCommerce/NameBright`,
`Gname`), which means "available for purchase at a markup," not "available."

Two details worth noting: `vocabcard.com` (singular) was registered
**2025-10-29** and `redinkapp.com` on **2026-07-05** — recent enough to suggest
this naming space is being actively picked over.

### 3.2 A non-V name orphans the logo

Stated plainly, because it is a real cost that belongs in the comparison:
**any recommended name that does not begin with V throws away the existing
wordmark and glyph and requires a new mark to be drawn.** The designer has
already declined to replace it. In the table below, the **Logo** column is
binary and unforgiving: ✅ keeps it, ❌ orphans it.

## 4. The shortlist

Ten candidates, scored. **The incumbent is in the table as a peer, not as the
null option.**

| Candidate | Evokes | `.com` | App Store | Logo | Spellable by ear | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **Vocab Cards** *(incumbent)* | Exactly what it is | ✅ **Owned since 2017** | "Vocab Cards" (spaced) shows **no exact match**; **"VocabCards" (one word) is taken** by Peter McLeod | ✅ | ✅ | ⭐ **Recommended** |
| **Verbatim** | "Word for word, exactly" — a near-perfect fit for a strict speller | ❌ Taken 1995 | No exact match in results | ✅ | ✅ | ❌ **Blocked.** Global brand in **class 9** |
| **Vellum** | Paper, manuscript — matches the notecard aesthetic | ❌ Taken 1998 | No exact match | ✅ | ⚠️ (vellum/velum) | ❌ **Blocked.** Established Mac publishing app |
| **Verso** | Left-hand page; bookish, short, ownable-sounding | ❌ Taken 1996 | No exact match, but "Verso: Clean Music AI" (610 ratings) and "Verso App" exist | ✅ | ⚠️ (verso/versoe) | ❌ **Weak.** Verso Books since 1970 |
| **Red Pen** | The teacher's correcting pen — on-brand with the proofreading marks | ❌ Taken 1998 | No exact match; several "RedPen…" apps | ❌ **Orphans logo** | ✅ | ❌ Charming, but costs the logo *and* the domain |
| **Spellbound** | Spelling + enchantment | ❌ Taken 1999 | No exact match; **crowded with word games** | ❌ | ✅ | ❌ Reads as a *game*; we are deliberately not a game |
| **Speller** | Precisely the function | ❌ Taken 1999 | "Speller - Spell Checker" exists (★2.61) | ❌ | ✅ | ❌ Flat, unownable, domain gone |
| **Verba Cards** | Latin *verba*, "words" | ✅ `verbacards.com` **free** | Not checked — not viable enough to pursue | ✅ | ❌ **Fails** (Verba/Verber/Verbah) | ❌ Fails the load-bearing criterion |
| **Vocab Marks** | Vocab + the proofreading marks | ✅ `vocabmarks.com` **free** | Not checked | ✅ | ✅ | 🥈 **Runner-up** — the best genuine rename available |
| **Spell Verso / Vocab Verso** | — | ✅ free | — | ✅ | ⚠️ | ❌ Free only because nobody wants them |

### Notes on the ones that nearly worked

**Verbatim** is the painful one. The meaning is almost too good — *verbatim*
means "in exactly the same words," which is the product's entire stance — and it
starts with V. It is also a **global brand in trademark class 9**, the class
covering computer software and data products, currently owned by CMC Magnetics
after a $32M acquisition from Mitsubishi Chemical in 2019. Building a software
product called Verbatim would be picking a fight with a well-funded incumbent in
its own class. Dead on arrival, no matter how well it reads.

**Vellum** would have matched the paper aesthetic perfectly and kept the V. It
is a well-known Mac publishing app selling at $199–$249, squarely in
software-for-writers. Same problem, smaller opponent — and using it would be the
"AnkiApp" move the [Competitor Analysis](./competitor-analysis.md#brand-squatting-is-endemic-in-this-category)
specifically warns against doing to somebody else.

**Red Pen** is the best *idea* in the list. It captures the corrected-homework
metaphor the marking system now follows, it is memorable, and it is trivially
spellable. It costs the logo, the domain is gone, and `redinkapp.com` was taken
three weeks ago. Worth remembering if the product ever gets a companion or a
rebrand with budget behind it.

## 5. Recommendation

### ⭐ Keep **Vocab Cards**

- **Zero switching cost.** Domain, logo, app ids and every document already
  agree. Every hour spent renaming is an hour not spent on the four confirmed
  production defects.
- **The logo survives**, which the designer explicitly asked for.
- **The App Store name appears clear.** Only the *unspaced* "VocabCards" is
  taken (Peter McLeod, **3 ratings, last updated 2019-10-01**); the spaced form
  shows no exact match. *(Indicative, not authoritative — reserve it in App
  Store Connect early to find out for certain. See
  [§8](#8-what-to-do-next).)*
- **"Vocab" is a genuine search term**, and it sits in an indexed field for free.
- **Descriptive is a feature for comprehension**, even though it is a weakness
  for protection. Nobody has to be taught what Vocab Cards is.

**The honest cost of this choice:** the name is unprotectable, and the category
has a documented copycat problem. A `com.mertyigit0.vocabcards` already exists
on Play (**10+ installs as of 2026-08-07**). Kevin cannot stop that, and keeping
this name means accepting he never will. Given the app is free with no revenue,
that is a cost worth paying — but it should be paid **knowingly**, which is why
it is written down here.

### 🥈 Runner-up: **Vocab Marks**

If Kevin wants a mark he could actually own, this is the best available option
and it is **not close to the incumbent**. It keeps the V and the logo, retains
"Vocab" so existing users still recognise it, adds the proofreading-marks idea
the product now leans on, is unambiguously spellable by ear, and
`vocabmarks.com` is **free** (verified 2026-08-08).

It still costs a new domain, nine years of history, and every document header —
to gain a defence he has no plans to use. **Recommended only if the trademark
concern in [§5](#5-recommendation) turns out to matter more to him than it
appears to.**

## 6. Recommended store title

Both stores index a **30-character title**. Apple adds a **30-character
subtitle** and a 100-character keyword field; Play adds an **80-character short
description**. *(Limits per multiple ASO references, cross-checked; Apple's own
documentation page refused my request, so treat the exact numbers as
well-corroborated rather than primary.)*

| Field | Recommended | Length |
| --- | --- | --- |
| **Title** (both stores) | `Vocab Cards: Spelling Practice` | **30 / 30** ✅ |
| **Apple subtitle** | `See exactly what you got wrong` | **30 / 30** ✅ |
| **Play short description** | `Type the answer. See every letter you got wrong — and fix it. Free, offline, no account.` | 87 → trim to ≤80 |

**The correction:** the PRD currently proposes `Vocab Cards — Spelling Practice`.
That is **31 characters** and will be rejected. The em dash pattern costs three
characters (` — `) against the colon's two (`: `). Verified by counting:

```text
31  Vocab Cards — Spelling Practice   ← proposed, TOO LONG
31  Vocab Cards - Spelling Practice   ← hyphen, also too long
30  Vocab Cards: Spelling Practice    ← recommended, exactly fits
28  Vocab Cards: Spelling Drills      ← alternative, room to spare
```

**Why "Spelling Practice" and not "Flashcards":** competing for *flashcards* or
*vocabulary* means competing with Quizlet (62M installs), Anki (23M) and Memrise
(51M). Competing for **spelling practice** means competing with a field of kids'
apps that top out around 100K installs and don't do what this product does. It
is the one term the product can plausibly rank for, and it belongs in the
indexed field. See
[Competitor Analysis](./competitor-analysis.md#play-store-hard-data-scraped-2026-08-07).

## 7. Domain findings (full table)

RDAP against `rdap.verisign.com`, **2026-08-08**. Authoritative for `.com`.

**Available (8):** `vocabverso` · `spellverso` · `verbatimcards` · `spellstrict` ·
`vocabcardsapp` · `spellcardsapp` · `verbatimspelling` · `vocabcardsio` ·
`verbacards` · `vocabmarks` · `markedwrong`
*(11 — the count of genuinely desirable ones among them is zero.)*

**Registered (selected, with creation date):**

| Domain | Since | Domain | Since |
| --- | --- | --- | --- |
| `vocabcards.com` | **2017-05-28 (Kevin's)** | `spellcards.com` | 2015-02-28 |
| `verbatim.com` | 1995-03-01 | `spelldeck.com` | 2018-02-04 |
| `verso.com` | 1996-01-18 | `spellpad.com` | 2020-04-20 |
| `vellum.com` | 1998-09-11 | `spellnote.com` | 2025-03-07 |
| `redpen.com` | 1998-11-17 | `vocabcard.com` | **2025-10-29** |
| `spellbound.com` | 1999-03-07 | `spellwright.com` | **2026-04-19** |
| `speller.com` | 1999-11-21 | `redinkapp.com` | **2026-07-05** |
| `misspell.com` | 1999-02-04 | `vocably.com` | 2024-08-14 |
| `lexeme.com` | 1997-09-09 | `vocabee.com` | 2017-05-26 |
| `wordcards.com` | 1997-09-25 | `spellsmith.com` | 2001-08-05 |

## 8. What to do next

**If Kevin keeps the name (recommended) — three small actions:**

1. **Reserve the App Store name now**, before building anything. App Store names
   are globally unique and are claimed at app-record creation, not at
   submission. This is the *only* authoritative availability check, it is free,
   and it costs nothing to hold. If `Vocab Cards` is refused, that changes the
   recommendation and we should know early rather than at submission.
2. **Fix the store title** to the 30-character colon form
   ([§6](#6-recommended-store-title)).
3. **Update the two open questions** in
   [PRD §10](./product-requirements.md#10-open-questions) and
   [Capability Spec Open Q10](./capability-spec.md#open-questions-capability-level)
   from "assumed, pending confirmation" to decided — in the coordinated pass, not
   here.

**Optional, cheap insurance:** register `vocabcardsapp.com` (**free**) as a
defensive redirect. A few dollars a year against someone grabbing the obvious
adjacent name.

## 9. What changes if he renames

The full bill, so the decision is made with it visible:

| Area | Work | Cost |
| --- | --- | --- |
| **Domain** | Buy the new `.com`; keep `vocabcards.com` and 301-redirect it indefinitely (never let it lapse — an abandoned nine-year domain in this category *will* be picked up) | New registration + both renewals, forever |
| **Logo** | **New wordmark and glyph** unless the name starts with V. The Illustrator source and vector PDF in `hmwt_app/logo/` become dead assets | Designer time — the designer has already declined to do this |
| **App ids** | `com.kszapps.vocabcards` → new id. **Not changeable after first publish** on either store, so this must be settled *before* the first submission | Free before launch; effectively impossible after |
| **Store listing** | Title, subtitle, keywords, screenshots containing the wordmark | Redo the screenshot set |
| **Documentation** | Name appears in headers and body across all five docs in `documentation/` plus the `design/` set | One coordinated pass — the reason this doc doesn't rewrite anything |
| **Live site** | Rebrand `vocabcards.com`, redirect, and **keep the same origin serving the app** — the `localStorage` auto-migration in [PRD §6.7](./product-requirements.md#67-import-export--migration--p0--p1) is same-origin and **breaks if the app moves domains**. Returning users' sets live in `vocabcards.com`'s browser storage and cannot be read from anywhere else | ⚠️ **The expensive one** |
| **SEO** | Nine years of history on the old domain; redirects preserve some, not all | Unrecoverable in part |

> **The migration path is the hidden cost.** [CAP-8](./capability-spec.md#cap-8--legacy-import--migration-p0)
> recovers existing users' data by reading `localStorage` **on the
> `vocabcards.com` origin**. Browser storage is origin-scoped: a new domain
> cannot read it. Renaming therefore means either keeping the app served from
> `vocabcards.com` anyway (which undercuts the point of renaming), or building a
> cross-origin migration handoff, or accepting that returning web users must
> re-import from `.cards` files. That is a real engineering cost that only
> surfaces when you trace the rename through to the data.

## 10. Open questions for Kevin

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | **Keep "Vocab Cards"?** | **Yes** — [§5](#5-recommendation). The domain, the logo and the migration path all point the same way, and no available alternative is better. |
| 2 | **Does the unprotectability of a descriptive name bother you?** It is the one genuine argument against, and it is a business-defence concern, not a product one. | **Accept it.** If it does bother you, the answer is *Vocab Marks*, not *Verbatim* — the good real words are all blocked. |
| 3 | **Store title `Vocab Cards: Spelling Practice`?** | **Yes** — exactly 30 characters, and it puts the one winnable keyword in an indexed field. |
| 4 | **Reserve the App Store name now?** | **Yes, this week.** Free, authoritative, and the only way to actually know. |
| 5 | **Register `vocabcardsapp.com` defensively?** | Optional. A few dollars a year; genuinely low stakes either way. |
| 6 | **Pay for a real trademark search?** | **Not now.** Only worth it if the app ever earns money or you intend to defend the name. [§1](#1-method-and-what-this-document-can-and-cannot-prove) is explicitly not clearance. |

## Sources

**Domain registration** — RDAP, authoritative registry data, queried 2026-08-08:
- [Verisign RDAP service for `.com`](https://rdap.verisign.com/com/v1/) (per-domain queries; see [§7](#7-domain-findings-full-table))

**App Store** — Apple iTunes Search API, US storefront, queried 2026-08-08:
- [iTunes Search API](https://itunes.apple.com/search) · [VocabCards, Peter McLeod](https://apps.apple.com/us/app/vocabcards/id1116991036)

**Play Store** — scraped 2026-08-07, **not re-verified 2026-08-08** (requests refused):
- [VocabCards — `com.mertyigit0.vocabcards`](https://play.google.com/store/apps/details?id=com.mertyigit0.vocabcards)

**Existing brands in the candidate space:**
- [Verbatim (brand) — Wikipedia](https://en.wikipedia.org/wiki/Verbatim_(brand)) · [CMC Magnetics acquires Verbatim from Mitsubishi Chemical (StorageNewsletter)](https://www.storagenewsletter.com/2019/06/18/cmc-magnetics-acquires-verbatim-from-mitsubishi-chemical-for-32-million/)
- [Vellum — Mac book-formatting software (review)](https://thewritelife.com/vellum-review/) · [Vellum pricing/features overview](https://scribecount.com/author-resource/writing-tools-for-authors/vellum-editing-app)
- [Verso Books — Wikipedia](https://en.wikipedia.org/wiki/Verso_Books)

**ASO limits** (secondary, cross-checked — Apple's own docs page refused the request):
- [App Store Optimization Title: 2026 ASO Title Playbook (AppFollow)](https://appfollow.io/blog/app-store-optimization-title)
- [App Store & Google Play character limits, 2026 reference (Applyra)](https://www.applyra.io/blog/app-store-character-limits)
- [How to name an app for App Store & Google Play (MobileAction)](https://www.mobileaction.co/blog/how-to-name-an-app/)

**Trademark classes** (background only — no search was performed):
- [Trademark Class 9: software, electronics, digital products](https://tmexpress.com/trademark-class-9/) · [Trademark Class 41: education services](https://surge.law/trademark-class-41-education-entertainment/)

**Internal:**
- [Competitor Analysis](./competitor-analysis.md) — brand squatting, install/rating data
- [PRD](./product-requirements.md) · [Capability Spec](./capability-spec.md) — the open questions this resolves
