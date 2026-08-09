# CLAUDE.md

Guidance for working in this repository. Read this before making changes.

## What this repo is

**Vocab Cards** — a spelling and vocabulary flashcard app. Its differentiator is
that a misspelled answer is marked **character by character** using real
proofreading marks, showing the user's own attempt aligned above the correct
spelling.

The repo currently holds two applications:

| Path | What it is | Status |
|---|---|---|
| `hmwt_app/` | The **live production app** — Aurelia 1, 2017–2022, deployed at vocabcards.com | **Frozen. Do not modify.** |
| `mobile/` | The **rebuild** — Expo / React Native / TypeScript, web + iOS + Android | Active development |

`hmwt_app/` is kept only as a reference for behaviour the rebuild must preserve.
Never modify, move or delete anything in it. `REBUILD_SPEC.md` is the frozen,
production-verified account of how it behaves — also not to be edited.

## Where the specification lives

The rebuild is spec-driven. Read before implementing; do not invent behaviour.

| Path | Contents |
|---|---|
| `documentation/capability-spec.md` | 20 capabilities `CAP-1`–`CAP-20` with dependencies and a **Status column that implementers keep current**. The scope boundary and build tracker. |
| `documentation/spelling-diff-spec.md` | The **normative, executable contract** for the diff. Has its own verification recipe in §1.2. |
| `documentation/product-requirements.md` | PRD; §7 has the MVP cut and release gating. |
| `documentation/user-stories.md` | 70 stories with acceptance criteria. |
| `documentation/competitor-analysis.md`, `naming-research.md` | Market and naming evidence. |
| `design/` | Design tokens, component and screen specs, and a self-contained `prototype.html` that runs the real diff algorithm. |

**Report spec defects; do not patch them.** Several have been found and are
recorded in place. The one permitted edit to `documentation/` during
implementation is keeping the `capability-spec.md` Status column current.

## Environment facts you can't read off the code

- **Firebase project is `vocards-62df8`** (display name **VoCards**, `.firebaserc`
  alias `vocards`). The **same project serves the rebuild** — do not create a new
  one. The legacy app uses it for Analytics and Hosting only; there is no
  Firestore/Auth/Storage usage anywhere today. Nothing in `mobile/` references
  Firebase yet, and that is correct: sync (`CAP-13`) and telemetry (`CAP-19`) are
  both P1 and unbuilt. Wire this project in when they are.
- The web `apiKey` in `hmwt_app/src/main.ts` is a public client identifier, not a
  secret. Because the project has Database and Storage configured but unused,
  confirm they are disabled or locked by rules, and restrict the key by HTTP
  referrer.
- Product name **Vocab Cards**, store title **"Vocab Cards: Spelling Practice"**
  (30 chars — the em-dash form is 31 and both stores reject it), app ids
  `com.kszapps.vocabcards`. **The App Store name has not been reserved**; that is
  the only authoritative availability check and it is still outstanding.
- **iOS and Android have never been run** — no simulators have been available.
  Everything is web-verified. Device-risky surfaces are isolated behind
  `mobile/src/services/`: `filePicker`, `fileShare`, haptics, and Hermes' partial
  `Intl`.

## Working style

- Branch: rebuild work lives on `rebuild/p0-foundation`, **not `master`**.
- All four gates must pass before any commit: `npx tsc --noEmit`, `npx eslint .`,
  `npx jest`, `npm run verify:diff-spec` (all from `mobile/`).
- **Verify by driving the app, not only by tests passing.** Every serious defect
  found so far — `react-native-web`'s missing `TextInput.setSelection`, i18next
  pluralising on a single `count`, trophy toasts latched on dismissal rather than
  presentation, reduce-motion losing a race with an async accessibility read —
  passed every static gate and appeared only when the app actually ran.
- The diff's tie-break order (delete → substitute → insert → transposition, each
  on a strict improvement) is **load-bearing**. Do not "clean it up"; a different
  tie-break produces different and worse output.
