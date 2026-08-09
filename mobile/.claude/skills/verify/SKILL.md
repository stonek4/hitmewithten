---
name: verify
description: Build, launch and drive the Vocab Cards Expo app (web target) headlessly — seed real card data, drive the drilling loop, capture the diff strip in light and dark, and collect console errors.
---

# Verify the Vocab Cards app (Expo web + headless Chromium)

The fastest observable surface in this WSL2 environment is the **web target**.
There is no system browser and no sudo — use `playwright-core` with locally
extracted libs (recipe below, ~2 min warm / ~6 min cold).

## 0. Static gates first (necessary, not sufficient)

```bash
cd mobile
npx tsc --noEmit          # must be silent
npx eslint .              # must be silent
npx jest                  # 330 tests as of 2026-08-08
npm run verify:diff-spec  # the spelling spec's own §1.2 recipe, 29/29 vectors
```

`verify:diff-spec` extracts the `ts` blocks from
`documentation/spelling-diff-spec.md`, type-checks them under `tsc --strict`,
and runs all 29 ground-truth vectors against the **spec's own** reference
implementation. `src/features/evaluation/specConformance.test.ts` runs the same
script from Jest and then differentially compares the app's implementation
against the extracted one. Passing CI proves you can run CI — go drive the app.

## 1. Launch the dev server (detached)

```bash
cd mobile && (setsid npx expo start --web --port 8081 > /tmp/expo.log 2>&1 &)
```

- Ready when `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` → 200.
- Backgrounding with a plain `&` has been killed by the harness mid-run; use
  `setsid (… &)`.
- First page load compiles the bundle: allow **up to 3 min** on the first
  `waitFor`. Later loads are fast.
- Restart with `-c` if a change is not picked up.

## 2. Headless Chromium without sudo

The OS is missing `libnss3`, `libnspr4`, `libasound2`. Extract them locally:

```bash
mkdir -p libs && cd libs
apt-get download libnss3 libnspr4 libasound2t64
for f in *.deb; do dpkg -x "$f" extracted/; done
cd .. && npm init -y && npm i playwright-core @playwright/browser-chromium
npx playwright-core install chromium   # the postinstall is blocked; this CLI works
```

Run scripts with:

```bash
LD_LIBRARY_PATH=$PWD/libs/extracted/usr/lib/x86_64-linux-gnu node drive.mjs light
```

## 3. Drive it with REAL DATA — this is the whole point

A fresh browser context has empty `localStorage`, so **every list renders its
empty state and the interesting code paths never execute.** The script must seed
its own state before it asserts anything:

1. `create-set-fab` → `set-name-input` → `set-name-save`
2. Tap the set row → `hint-input` / `answer-input` / `add-card`, at least three
   cards including one with an **internal space** (`ice cream`) — that is the
   only way the missing-space marker gets exercised.
3. `start-quick` → `answer-field` → submit a **deliberately wrong** answer.

Wrong answers worth driving, one per diff status:

| Correct | Type | Exercises |
|---|---|---|
| `ravenous` | `ravenus` | `missing` — caret + dashed mark |
| `ice cream` | `icecream` | **missing space** — the `#` mark, the signature feature |
| `ice cream` | `ice  cream` | `extra` space — struck `#` + void cell |
| `ravenous` | `ravenious` | `extra` — void `·` in the correct row |
| `receive` | `recieve` | `transposed` — one ribbon spanning the pair |

Read the rendering back, don't just screenshot it:

```js
await page.getByTestId('diff-strip-correct').innerText();   // "i\nc\ne\n#\nc\nr\ne\na\nm"
await page.getByTestId('diff-strip').getAttribute('aria-label');  // the announcement
await page.getByTestId('diff-strip').getAttribute('aria-live');   // must be "polite"
```

Run **both** schemes: `colorScheme: 'light' | 'dark'` in `newContext`. Collect
`page.on('console')` errors and `pageerror` — the app must produce none.

## Gotchas found the hard way

- **`ref.setSelection(…)` does not exist on react-native-web's TextInput.** The
  session screen selects the user's wrong answer via the declarative
  `selection` prop instead. The imperative form threw on every wrong answer and
  passed every unit test.
- **Paper's `ProgressBar` stretches to fill a flex column on web and ignores a
  height passed through its own `style` prop.** It has to be pinned by a
  wrapper `View`. Unpinned it was 900 dp tall and pushed the entire session
  below the fold while the ScrollView collapsed to zero height.
- **`presentation: 'modal'` makes the document taller than the viewport on
  web**, offsetting the root and hiding the app bar. `app/_layout.tsx` uses
  `modal` on native (design A4: no accidental back-swipe out of a test) and
  `card` on web.
- **RNTL hides `accessibilityElementsHidden` elements from queries by default.**
  Diff cells are deliberately hidden, so *visual* assertions need
  `{ includeHiddenElements: true }`. Announcement assertions do not.
- Anchor waits on `testID`s, not on text — text comes from
  `src/i18n/en-US.json` and **must be read out of that file**, never invented.
