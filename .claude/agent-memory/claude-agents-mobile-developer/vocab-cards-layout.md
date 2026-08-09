---
name: vocab-cards-layout
description: Where the vocab-cards rebuild lives, what is authoritative, and the conventions that are not obvious from the file tree.
metadata:
  type: project
---

**The rebuild lives in `/home/stonek4/Git/vocab-cards/mobile/`** — an Expo
(managed) + TypeScript strict + react-native-paper + expo-router app, targeting
web, iOS and Android. Same repo, no separate git init.

**Do not touch, in any pass:**

- `hmwt_app/` — the live 2017 Aurelia 1 production app, kept as a frozen
  reference.
- `documentation/` and `design/` — the specification, owned by the
  product-manager and mobile-ui-designer stages. **Implement from them, never
  edit them.** If a spec is wrong, report it; do not patch it.
- `REBUILD_SPEC.md` — the frozen record of the old app's behaviour.

**Status column:** keeping `documentation/capability-spec.md`'s Status column
current is the **one permitted edit** in `documentation/` (that document asks
implementers to do it). Everything else there is read-only — report spec
defects, never patch them. Note the cells are sometimes written `**partial**`
with bold markers, so a naive string replace on `partial` silently misses.

**Conventions not visible from the tree:**

- A feature module is `mobile/src/features/<feature>/{types,logic,api,hooks}.ts`
  — `logic.ts` is pure (no React, no storage, no platform APIs), `api.ts` is the
  only place that talks to storage, `hooks.ts` is the React glue.
- `features/evaluation/logic.ts` is the spelling diff and is the **most
  important code in the project**. Keep it pure. The tie-break order
  (`d → s → i → t`, each on a strict `<`) and the `script.length === 1 → 'i'`
  special case are behaviour, not style.
- The 29 ground-truth vectors live in `features/evaluation/vectors.json`
  (JSON deliberately — see [[vocab-cards-landmines]]).
- CAP-12 identity logic takes an injected `IdentityContext` (`newId` + `now`)
  rather than importing a clock or `expo-crypto`; `services/identityContext.ts`
  supplies the real one. This is what makes "did we stamp `updatedAt`?" testable.
- Design tokens: the design language says "paper", but the UI library is called
  react-native-paper, so **in code the notecard colours are `colors.page` and
  its construction constants are `pageSurface`**.
- `mobile/.claude/skills/verify/SKILL.md` is the runtime-verification recipe
  (Expo web + headless Chromium in WSL2, with the real-data seeding steps).
  **Seeding legacy `localStorage` via `context.addInitScript` before the app
  boots** is how CAP-8's migration, CAP-7's trophy recovery and any
  returning-user path get exercised — a fresh context only ever shows empty
  states.
- Storage lives under a `vc:` prefix (`services/storage.ts`). The legacy app's
  unprefixed keys on the same origin are read through
  `services/legacyStorage.ts`, which is **structurally read-only** — no
  `setItem`, no `removeItem` — so no code path can touch a returning user's
  original data.
- Session records deliberately carry **no card content**; the results screen
  gets its diffs from an in-memory hand-off (`features/session/handoff.ts`).
  That is the documented resolution of a genuine CAP-6 self-contradiction.

Related: [[spec-defects-spelling-diff]] · [[vocab-cards-landmines]]
