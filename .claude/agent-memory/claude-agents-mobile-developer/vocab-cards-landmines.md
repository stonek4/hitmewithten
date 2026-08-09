---
name: vocab-cards-landmines
description: Toolchain and environment gotchas hit while building the vocab-cards Expo app — Jest dynamic import, tsc 6 TS5112, Node TS stripping, WSL2 headless browser.
metadata:
  type: project
---

Environment: Expo SDK 57 · RN 0.86 · React 19.2 · TypeScript 6.0 ·
react-native-paper 5.x · expo-router · Node 24 · WSL2, no sudo, no system browser.

- **Jest/Babel here does not support dynamic `import()`** —
  `TypeError: A dynamic import callback was invoked without
  --experimental-vm-modules`. Use static imports in tests, or a guarded
  `require()` when the load must be deferred. (Same gotcha as the bill-split
  reference project.)
- **`tsc` 6 fails with TS5112** when a `tsconfig.json` is discoverable *and*
  files are passed on the command line. `--ignoreConfig` restores the
  bare-directory behaviour that `spelling-diff-spec.md` §1.2's recipe assumes.
  This matters for `mobile/scripts/verify-diff-spec.mjs`.
- **Node 24 strips TypeScript natively**, but only with *explicit* file
  extensions in import specifiers. Extension-less imports (`./types`) and path
  aliases (`@/…`) do not resolve. That is why the 29 ground-truth vectors live
  in `vectors.json`, not a `.ts` module: JSON is loadable by both the Jest suite
  and the plain-Node harness, so the two can never drift.
- **`@expo-google-fonts/jetbrains-mono` tops out at 0.4.1** while
  `@expo-google-fonts/inter` is at 0.4.2 — do not assume the families are
  version-locked together.
- **`expo-crypto` and `@react-native-async-storage/async-storage` need Jest
  mocks** (`mobile/jest/setup.js`). AsyncStorage ships its own; `expo-crypto` is
  backed by Node's `crypto.randomUUID` so identity tests still exercise real v4
  UUIDs.

Related: [[spec-defects-spelling-diff]] · [[vocab-cards-layout]]
