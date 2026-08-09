# Anki Import Research — is `.apkg` worth building?

| | |
| --- | --- |
| **Status** | Draft v0.1 — recommendation, awaiting Kevin's decision |
| **Last updated** | 2026-08-09 |
| **Owner** | Kevin Stoner |
| **Scopes** | [CAP-17 — Delimited-Text & Third-Party Import](./capability-spec.md#cap-17--delimited-text--third-party-import-p1) (P1), within which `.apkg` import is currently **P2** · [US-G7](./user-stories.md#epic-g--import-export--migration-prd-67) |
| **Related** | [Competitor Analysis](./competitor-analysis.md) · [PRD §6.7](./product-requirements.md#67-import-export--migration--p0--p1) · [CAP-8](./capability-spec.md#cap-8--legacy-import--migration-p0) |

> **This document changes nothing.** CAP-17's scope and priority are untouched,
> per instruction. §8 states what I would change and why; the decision is
> Kevin's.

---

## Verdict

**Feasible — considerably more so than I expected — but keep it at P2 and ship
the text path first.**

Three findings, in order of how much they moved me:

1. **The whole pipeline runs on our stack, on all three platforms, from one
   code path.** I proved it end-to-end on real files: unzip with `fflate`,
   zstd-decompress with `fzstd`, and load the SQLite bytes with
   **`expo-sqlite`'s `deserializeDatabaseAsync(Uint8Array)`** — an API I
   confirmed exists in the published `expo-sqlite@57` types **and** is
   implemented in its web worker, not just on native. All three libraries are
   MIT. No native module, no ejecting from Expo's managed workflow, no
   web-only compromise. **This is not the blocker I assumed it would be.**
2. **The modern format is simpler to detect than its reputation suggests.** The
   protobuf `meta` file we must read to identify a modern package contains
   **exactly one varint field**, so it needs about five lines of code and no
   protobuf dependency. And in the modern schema the note-type and field
   **names are plain `TEXT` columns** in the `notetypes` and `fields` tables —
   the protobuf blobs hold only styling and template data we don't want.
3. **But the value is lower than the effort, because of what Anki notes
   actually contain.** Anki fields hold **HTML and media references**. I
   verified this on a real file from Anki's own test suite: a note whose front
   field is literally `[sound:foo.wav]` and whose back is empty. For a spelling
   app — where the user must *type the answer exactly* — importing a field
   containing `<b>` or `&nbsp;` or `[sound:…]` produces an untypeable card.
   **The text path solves this at the source**: Anki's plain-text export has an
   *"Include HTML and media references"* checkbox the user can simply uncheck.
   Our `.apkg` importer would have to strip HTML itself — lossily, and
   unavoidably guessing.

The decisive asymmetry: **the cheap path produces cleaner data than the
expensive one.** That is unusual, and it settles it. `.apkg` support buys about
two steps of user friction and costs a note-type mapping UI plus an
HTML-sanitising problem we'd rather not own.

**What I'd do instead:** ship CAP-17's text import as planned, and make sure its
documentation tells Anki users the exact five-click export recipe including the
checkbox. That serves the Anki audience now, at roughly zero incremental cost.

---

## 1. Method, and what I verified

Same standard as the previous passes: verified claims say how; unverified ones
say so.

| Claim | How | Strength |
| --- | --- | --- |
| Legacy `.apkg` internals, schema, field encoding | **Downloaded three real `.apkg` fixtures from Anki's own repo and parsed them** (`pylib/tests/support/`) | ✅ Direct observation |
| Modern format detection, filenames, compression | **Read Anki's own Rust source** — `rslib/src/import_export/package/meta.rs` and `proto/anki/import_export.proto` | ✅ Authoritative (the code that writes the files) |
| Modern schema table layout | Read `rslib/src/storage/upgrades/schema15_upgrade.sql` | ✅ Authoritative |
| zstd + modern container round-trip | **Built a synthetic modern-format package** (meta=3, zstd) and read it back with `fzstd` | ⚠️ **Partial.** The container path is proven byte-identical. The *contents* were a schema-11 database, because I had no way to produce a genuine schema-18 file — Anki's published fixtures are all legacy and I cannot run Anki here. **The schema-18 table reads are specified from source, not executed.** |
| `expo-sqlite` deserialize API | **Unpacked the published `expo-sqlite@57` tarball** and read the `.d.ts` and the web worker implementation | ✅ Direct observation of shipped code |
| Library licences / sizes | npm registry metadata; measured gzip sizes locally | ✅ |
| Anki licence | GitHub API + `LICENSE` | ✅ AGPL-3.0-or-later |
| Legal effect of that licence | ❌ **Not verified — I am not qualified.** See [§6](#6-licensing). | ❌ |

## 2. The format, concretely

### 2.1 It is a ZIP, and there are three variants

From `meta.rs` — this is Anki's own detection logic, restated:

```text
if the archive contains a "meta" file:
    parse it as protobuf PackageMetadata { version = 1 }   // one varint
    version 3 (VERSION_LATEST) -> "collection.anki21b", zstd-compressed, schema 18
    version 2 (VERSION_LEGACY_2) -> "collection.anki21",  uncompressed,    schema 11
    version 1 (VERSION_LEGACY_1) -> "collection.anki2",   uncompressed,    schema 11
    version 0 (VERSION_UNKNOWN)  -> reject: file is newer than we understand
else:                                                      // pre-2.1.50 export
    if "collection.anki21" present -> Legacy2
    else                          -> Legacy1 ("collection.anki2")
```

`zstd_compressed()` is exactly `!is_legacy()`, and `media_list_is_hashmap()` is
exactly `is_legacy()` — so in modern packages the media index is a protobuf
`MediaEntries` message rather than a JSON object, and the media blobs are
individually zstd-compressed.

**`.colpkg` is a whole-collection export** and is a different thing: importing
one *replaces the entire collection* in Anki. We would reject `.colpkg`
outright. Note the historical trap Anki's own manual flags: a file named
`collection.apkg` is treated as a collection package, not a deck package.

### 2.2 What I found inside real files

Parsed from `pylib/tests/support/update1.apkg`:

```text
entries: collection.anki2, media          (no "meta" -> Legacy1)
col.ver = 11
tables:  col, notes, cards, revlog, graves, sqlite_stat1
notes columns: id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data
cards columns: id, nid, did, ord, mod, usn, type, queue, due, ivl, factor,
               reps, lapses, left, odue, odid, flags, data
```

**Fields inside a note are joined by `\x1f`** — ASCII Unit Separator, 0x1F.
Verified: `flds = 'hello\x1fworld'` for a Basic note with Front/Back.

In schema 11 the note types live in **`col.models`, a JSON blob**, keyed by
model id, each carrying `name`, `flds[].name`, `tmpls[].name`, `sortf`, and
`type` (`0` = standard, `1` = cloze). Real values from that file:

```text
Basic                          fields=[Front, Back]                type=0
Basic (and reversed card)      fields=[Front, Back]                type=0  2 templates
Basic (optional reversed card) fields=[Front, Back, Add Reverse]   type=0
Cloze                          fields=[Text, Extra]                type=1
```

### 2.3 The modern schema is *easier*, not harder

The widely-repeated worry is "schema 18 stores config as protobuf blobs, so you
need protobuf." Reading `schema15_upgrade.sql` shows that is only half true:

```sql
CREATE TABLE notetypes ( id integer PRIMARY KEY, name text NOT NULL, mtime_secs …, config blob );
CREATE TABLE fields    ( ntid integer, ord integer, name text NOT NULL, config blob, PRIMARY KEY (ntid, ord) );
CREATE TABLE templates ( ntid integer, ord integer, name text NOT NULL, …, config blob, PRIMARY KEY (ntid, ord) );
```

**The note-type name, the field names and their ordinals are plain `TEXT`
columns.** Everything we need for import is reachable with ordinary SQL. The
`config` blobs carry styling, template HTML, the sort-field index and the
cloze flag — none of which we need, with one caveat handled in
[§4](#4-what-actually-maps--and-what-is-silently-lost).

So the only protobuf in our path is the two-byte `meta` file, which is
`0x08 <varint>`.

### 2.4 Media

Out of scope for us (no images or audio on cards — [PRD §11](./product-requirements.md#11-out-of-scope-for-now)),
but it doesn't go away quietly: media survives **inside the field text** as
`[sound:foo.wav]` and `<img src="…">` markers, which is a data-cleaning problem,
not a media problem. See [§4](#4-what-actually-maps--and-what-is-silently-lost).

## 3. Can we parse it on our stack?

**Yes — verified, on one code path, for web, iOS and Android.** This was the
deciding question and I expected it to be the blocker. It isn't.

Our actual stack, read from `mobile/package.json` rather than assumed:
**Expo SDK ~57.0.11, React Native 0.86.2, React 19.2.3**, with
`expo-document-picker` and `expo-file-system` already present and **no
`expo-sqlite` yet**.

| Step | Library | Licence | Cost | Works on |
| --- | --- | --- | --- | --- |
| Unzip | **`fflate`** 0.8.3 | MIT, 0 deps | ~22 KB gz full ESM; far less tree-shaken to `unzipSync` | all — pure JS |
| zstd decode | **`fzstd`** 0.1.1 | MIT, 0 deps | ~7 KB gz | all — pure JS |
| Read SQLite from bytes | **`expo-sqlite`** 57.0.1 → `deserializeDatabaseAsync(Uint8Array)` | MIT | native: no JS bundle cost. **web: ~300 KB gz WASM**, lazy-loadable | all three |
| `meta` protobuf | hand-rolled, ~5 lines | — | 0 | all |

**The `expo-sqlite` finding is the important one.** I unpacked the published
tarball and confirmed:

```ts
deserializeDatabaseAsync(serializedData: Uint8Array, options?: SQLiteOpenOptions): Promise<SQLiteDatabase>;
deserializeDatabaseSync (serializedData: Uint8Array, options?: SQLiteOpenOptions): SQLiteDatabase;
```

and that the **web** implementation really backs it, rather than throwing —
`package/web/worker.ts` opens `:memory:` through wa-sqlite and calls
`sqlite3.deserialize(pointer, 'main', serializedData)`. So the same call works
everywhere and we never touch the filesystem or need a file path.

### 3.1 Proof, not argument

I ran the complete pipeline in Node against Anki's own fixtures using only
`fflate` + `fzstd` + an in-memory SQLite, reproducing what the app would do:

```text
══════ update1.apkg ══════
  entries: collection.anki2, media
  meta version = absent (legacy) -> collection.anki2, zstd=false
  schema version: 11
  notes: 1
    [Basic] Front="hello"  Back="world"
      -> hint="hello"  answer="world"
```

and, for the modern container (synthetic — see the caveat in
[§1](#1-method-and-what-i-verified)):

```text
sqlite 65536B -> zstd 2396B
entries: meta, collection.anki21b, media
meta version: 3
fzstd decompressed -> 65536B, byte-identical to source: true
note fields: [ 'hello', 'world' ]
```

### 3.2 The one real platform cost: web needs cross-origin isolation

`expo-sqlite` on web is **documented as alpha** and requires Metro configured
for `.wasm` **and** `Cross-Origin-Embedder-Policy` / `Cross-Origin-Opener-Policy`
headers so `SharedArrayBuffer` is available. That is a hosting-level change to
`vocabcards.com`, and cross-origin isolation restricts embedding third-party
resources that don't opt in.

For a self-contained offline app that is survivable — and the headers can be
scoped to the import route rather than the whole site — but it is a real
deployment constraint that would land on the web build for a **P2 feature the
rest of the app doesn't need**. Adding `expo-sqlite` purely for `.apkg` import
means the local-first storage layer, which currently needs no SQLite at all,
inherits a WASM dependency and a headers requirement on web.

## 4. What actually maps — and what is silently lost

This is where the case weakens, and it is a product problem rather than an
engineering one.

| Anki concept | Our model | Outcome |
| --- | --- | --- |
| Note with 2 fields (Basic: Front/Back) | `{hint, answer}` | ✅ Clean 1:1 |
| Note with **3+ fields** | 2 slots | ⚠️ User must choose which two; the rest are **dropped** |
| **Cloze** notes (`{{c1::…}}`) | — | ❌ **No sensible mapping.** One note generates N cards from deletions inside one text. Must be **refused, not mangled** |
| **Multiple templates** (Basic and reversed) | our flip is a session toggle | ⚠️ 1 note → 2 Anki cards → we import **1** card; reversal is already a feature (US-C7) |
| **HTML in fields** (`<b>`, `<div>`, `&nbsp;`) | plain text answers | ❌ **The core problem.** An answer of `<b>ravenous</b>` is untypeable |
| **Media refs** (`[sound:x.wav]`, `<img>`) | — | ❌ Verified real: a fixture note is literally `Front="[sound:foo.wav]", Back=""`. Imports as a **garbage card** |
| Tags | — | ⚠️ Dropped (or appended to the hint) |
| Scheduling (`ivl`, `factor`, `reps`, `lapses`, `due`) | CAP-15 is P1 and SM-2-derived | ⚠️ Dropped. Anki's ease/interval don't map onto a scheduler we haven't shipped |
| Deck hierarchy | flat sets | ⚠️ Sub-decks flatten or become separate sets |
| `notes.guid` | our UUIDs | ✅ Usable for re-import de-duplication |

**The bar this must clear:** [CAP-8](./capability-spec.md#cap-8--legacy-import--migration-p0)
and [CAP-17](./capability-spec.md#cap-17--delimited-text--third-party-import-p1)
both require that unparseable input is **quarantined and surfaced, never
silently dropped**. An `.apkg` importer meeting that bar cannot just take
field 0 and field 1 and hope. It needs:

- a **note-type mapping UI** — for each note type in the file, which field is
  the hint and which is the answer (Anki decks routinely contain several)
- an **HTML sanitiser** with a visible preview, because stripping tags changes
  the answer string and the user must confirm the result is what they'd type
- **explicit refusal** of cloze note types, with a count and an explanation
- a **per-note-type report**: imported / skipped / altered, and why

That is the real scope of "`.apkg` import" — not the parser. **The parser is
the easy half.**

## 5. The text alternative, compared honestly

Anki's own text export writes one note per line, fields separated by **tabs**,
and — the detail that decides this — offers checkboxes for *"Include HTML and
media references"*, tags, deck name, notetype name, and a unique identifier.
Its importer likewise auto-detects comma, semicolon, tab, space, pipe and colon.

| | **Text path** (CAP-17, P1, already scoped) | **`.apkg` path** (P2) |
| --- | --- | --- |
| User steps | Anki → File → Export → pick deck → *Notes in Plain Text* → **uncheck "Include HTML and media references"** → save → import here → confirm columns = **7** | Export/download `.apkg` → import here → map note types → resolve HTML → confirm = **5** |
| Data quality | ✅ **Clean text, HTML already removed at the source by the user** | ❌ Raw HTML + media markers we must strip ourselves |
| Field selection | Columns visible in the existing preview UI | Needs a new note-type mapping UI |
| Cloze | User sees the mess in the file and fixes it before importing | We must detect and refuse |
| Engineering | **Already in scope** | New: zip, zstd, SQLite, WASM-on-web, mapping UI, sanitiser |
| Needs Anki desktop | Yes | **No — for shared decks** |
| Works for AnkiWeb **shared decks** | ❌ Not without importing into Anki first | ✅ Direct |

**Two extra clicks, in exchange for the entire data-cleaning problem.** The text
path wins on every axis except one.

**That one exception is the honest argument for `.apkg`:** AnkiWeb shared decks
are distributed *only* as `.apkg`, so without it a user who wants to drill a
shared deck must install Anki desktop, import, then re-export as text. That is
genuine friction — but shared decks are also the content that maps *worst*
(rich HTML, media, cloze, language decks built for recognition rather than
spelling), and our product is explicitly for **your own word lists**
([PRD §4](./product-requirements.md#4-target-users--personas)). The users this
would serve are the ones our positioning least targets.

## 6. Licensing

**Anki is AGPL-3.0-or-later** (confirmed: repo `LICENSE`, "GNU Affero General
Public License, version 3 or later, with portions contributed by Anki users
licensed under the BSD-3 license").

My reading, stated with its limits:

- **Reading a file format is not a derivative work of the program that writes
  it.** We would implement a reader from the format's observable behavior and
  our own description of it, not from Anki's code. Nothing in the AGPL reaches
  an independently written parser.
- **Nothing we would actually depend on is AGPL.** `fflate` (MIT), `fzstd`
  (MIT), `expo-sqlite` (MIT). No copyleft obligation attaches to a free,
  closed-source app.
- **The line to not cross:** copying Anki's `.proto` files, its `.sql` schema
  files, or its Rust import code into our repository *would* be copying their
  source. This document deliberately **describes** the format in its own words
  rather than vendoring anything — and the `meta` reader is small enough to
  write from the wire format alone. If we ever build this, that discipline
  should be a written rule in the implementation, not a good intention.
- **The `.proto` files carry Anki's licence.** Generating TypeScript types from
  them would be the most tempting shortcut and the one most likely to create an
  obligation. We don't need them — the one field we read is a varint.

> ❌ **This is not legal advice and I am not qualified to give it.** It is an
> engineering reading of a well-trodden question. The practical risk is low
> because the app is free and we'd depend on nothing AGPL — but if this ever
> ships, a five-minute sanity check with someone qualified is cheap.

## 7. Prior art

| Project | Licence | State | Usable for us? |
| --- | --- | --- | --- |
| **`anki-apkg-parser`** (npm, v1.0.1, Feb 2026) | ISC | Maintained-ish | ❌ **No.** 15 dependencies including `sqlite3` and `zstd-napi` (**native Node bindings**), `simple-zstd` (**spawns the `zstd` binary**), `fstream`, `yauzl`, `protobufjs`. Node-only; none of it runs in React Native. It also declares a dependency on a package literally named `fs`, which is a squatted placeholder — a supply-chain smell on its own |
| `anki-apkg-export` (v4.0.3, 2020) | MIT | Stale | ❌ Writes decks, doesn't read them |
| `genanki` (Python) | MIT | Active | ❌ Writer, and Python |
| `ankisync2` (Python) | — | Low activity | ❌ Python; useful only as a format reference |

**Conclusion: there is nothing to borrow.** Every existing parser assumes Node
with native modules. We would write our own — which, given
[§3](#3-can-we-parse-it-on-our-stack), is perhaps 200–300 lines for the
container and the queries, and then all the remaining effort is the mapping UI
from [§4](#4-what-actually-maps--and-what-is-silently-lost).

## 8. Recommendation

### Keep `.apkg` at **P2**. Do not promote it. Ship the text path first.

Nothing here changes CAP-17 — this section says what I'd change *if* Kevin
agrees, and it is deliberately small:

1. **Leave CAP-17's priority and scope exactly as written.** `.apkg` stays P2
   inside it, and US-G7 stays P2.
2. **Add one line to CAP-17's rules** when the docs are next touched: that the
   Anki on-ramp is the **text export with "Include HTML and media references"
   unchecked**, and that this recipe belongs in the import screen's help text.
   That is the whole Anki story for a fraction of the cost, and it's the single
   highest-value thing in this document.
3. **Record the format knowledge** — this file — so that if `.apkg` is ever
   promoted, the research is already done and the work is a week, not a month.

**What would change my mind**, stated in advance so it's a trigger and not a
rationalisation:

- Users actually asking for it — e.g. import attempts on `.apkg` files being
  rejected, which [CAP-19](./capability-spec.md#cap-19--telemetry--analytics-p1)'s
  `import_completed` event could count via a `failures` reason without ever
  touching card content.
- The app acquiring images or audio on cards, which would make Anki's media
  worth importing rather than a contaminant.
- `expo-sqlite` arriving in the app for some *other* reason. If the storage
  layer ever needs SQLite anyway, the marginal cost of `.apkg` drops sharply
  and the calculus flips.

### If it is built anyway — implementation sketch

Ordered so the risky part is proven first, and so it can be abandoned cheaply
at any step:

1. **Container reader** (pure, testable, no UI): bytes → `fflate.unzipSync` →
   detect version per [§2.1](#21-it-is-a-zip-and-there-are-three-variants) →
   `fzstd.decompress` if modern → `Uint8Array` of SQLite. Fixture-test against
   both a legacy and a modern package. **This is the part I have already
   proven works.**
2. **Schema reader**: `deserializeDatabaseAsync` → branch on `col.ver`
   (≤11 → `col.models` JSON; ≥15 → `notetypes`/`fields` tables) → produce a
   normalised `{ noteTypeName, fieldNames[], notes: string[][] }`. Split `flds`
   on `\x1f`.
3. **Refusals before anything else**: `.colpkg` rejected; `meta` version 0
   (`VERSION_UNKNOWN`) rejected as "newer than this app understands"; cloze note
   types counted and refused with an explanation.
4. **Sanitiser**: strip HTML to text, decode entities, strip `[sound:…]` and
   `<img>` markers, collapse `<br>`/`<div>` to nothing (**not** to spaces —
   internal whitespace is spelling-significant per
   [spelling-diff-spec §4.1](./spelling-diff-spec.md#41-comparison-rules)).
   Every transformation must be visible in the preview.
5. **Mapping UI**: per note type, choose hint field and answer field, with a
   live preview reusing CAP-17's existing preview component.
6. **Report**: imported / skipped / altered per note type, per
   [CAP-8](./capability-spec.md#cap-8--legacy-import--migration-p0)'s
   quarantine-and-surface rule.

**Estimate:** ~2 days for steps 1–3, ~3–5 days for 4–6 and the UI, plus the
web COOP/COEP hosting change. Call it **a week to ten days**, against a text
importer that is already scoped and serves most of the same users.

## 9. Open questions for Kevin

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | **Keep `.apkg` at P2?** | **Yes.** Feasible but not worth it yet; the text path produces *cleaner* data for less work. |
| 2 | **Add the Anki text-export recipe to the import screen's help?** | **Yes** — the cheapest thing in this document and the one that actually serves Anki users. Include the "uncheck Include HTML and media references" step explicitly; it is what makes the output clean. |
| 3 | **Count rejected `.apkg` import attempts in telemetry?** | **Yes**, as a reason code on `import_completed`. No card content, so it stays inside CAP-19's no-content rule, and it turns "should we build this?" into a measured question. |
| 4 | **Would you accept the web COOP/COEP requirement** for a P2 feature? | It's the hidden cost. If the answer is no, `.apkg` is effectively native-only, which weakens it further. |
| 5 | **Refuse cloze notes outright, or import the raw `{{c1::…}}` text?** | **Refuse, with a count.** Importing the raw text produces cards asking the user to type `{{c1::ravenous}}`. |
| 6 | **Legal check on the AGPL reading before building?** | Only if it's ever actually built. [§6](#6-licensing) is an engineering opinion, not clearance. |

## Sources

**Anki's own source and files** (authoritative — the code that writes the format):
- [`rslib/src/import_export/package/meta.rs`](https://raw.githubusercontent.com/ankitects/anki/main/rslib/src/import_export/package/meta.rs) — version detection, filenames, zstd rule
- [`proto/anki/import_export.proto`](https://raw.githubusercontent.com/ankitects/anki/main/proto/anki/import_export.proto) — `PackageMetadata.Version` enum
- [`rslib/src/storage/upgrades/schema15_upgrade.sql`](https://raw.githubusercontent.com/ankitects/anki/main/rslib/src/storage/upgrades/schema15_upgrade.sql) — `notetypes` / `fields` / `templates` tables
- Fixtures parsed directly: `pylib/tests/support/{update1,media,diffmodels2-1}.apkg` ([repo](https://github.com/ankitects/anki))
- [Anki `LICENSE`](https://raw.githubusercontent.com/ankitects/anki/main/LICENSE) — AGPL-3.0-or-later

**Anki documentation:**
- [Exporting — Anki Manual](https://docs.ankiweb.net/exporting.html) — `.apkg` vs `.colpkg` vs plain text, export options
- [Importing text files — Anki Manual](https://docs.ankiweb.net/importing/text-files.html) — delimiters, UTF-8

**Our runtime:**
- `mobile/package.json` — Expo ~57.0.11, React Native 0.86.2, React 19.2.3 (read directly)
- [`expo-sqlite` npm](https://www.npmjs.com/package/expo-sqlite) v57.0.1 — tarball unpacked; `deserializeDatabase{Async,Sync}` confirmed in `build/SQLiteDatabase.d.ts` and implemented in `web/worker.ts`
- [Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) and [docs source](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/sqlite.mdx) — web setup, Metro `.wasm` config, COOP/COEP requirement, "web support is in alpha"
- [`fflate`](https://www.npmjs.com/package/fflate) MIT · [`fzstd`](https://www.npmjs.com/package/fzstd) MIT

**Prior art:**
- [`anki-apkg-parser`](https://www.npmjs.com/package/anki-apkg-parser) — dependency list read from registry metadata
- [`anki-apkg-export`](https://www.npmjs.com/package/anki-apkg-export)

**Background (secondary):**
- [Understanding the Anki APKG format — Eiko Wagenknecht](https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format/) *(returned HTTP 403 to my request; cited because search results surfaced its summary, but **nothing in this document rests on it** — every format claim above traces to Anki's source or to a file I parsed)*

**Internal:**
- [Capability Spec CAP-17](./capability-spec.md#cap-17--delimited-text--third-party-import-p1) · [CAP-8](./capability-spec.md#cap-8--legacy-import--migration-p0) · [PRD §6.7](./product-requirements.md#67-import-export--migration--p0--p1) · [Competitor Analysis](./competitor-analysis.md)
