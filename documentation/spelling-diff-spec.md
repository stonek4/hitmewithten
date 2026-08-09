# Spelling Diff Specification

| | |
| --- | --- |
| **Status** | Draft v0.3 — **verified** (see [§1.2](#12-how-to-verify-this-document)) |
| **Last updated** | 2026-08-08 |
| **Owner** | Kevin Stoner |
| **Implements** | [PRD §6.4](./product-requirements.md#64-spelling-feedback--p0--differentiator) · [CAP-4](./capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator) · [CAP-5](./capability-spec.md#cap-5--feedback-presentation-p0) |
| **Stories** | [US-D1 – US-D6, incl. US-D3a (transposition)](./user-stories.md#epic-d--spelling-feedback-prd-64) |
| **Source of truth for legacy behavior** | [REBUILD_SPEC.md §9.1 and §9.1.1](../REBUILD_SPEC.md) |

---

## 1. Why this document exists

This is the product's signature feature and the single piece of the rebuild most
likely to be reimplemented "more cleanly" and thereby broken in ways nobody
notices until users complain. The tie-break order in the distance matrix and the
mutate-as-you-go alignment in the marking loop are **load-bearing**: they are
what make the highlighting read correctly to a human. A textbook edit-distance
implementation with a different tie-break produces different — and worse —
output for the same input.

It is separated from the PRD because it is a **testable contract**, not a
product requirement. An engineering agent should be able to implement from this
document alone and verify correctness without reading anything else.

> **This specification has been executed and verified.** The reference
> implementation below was run against all 15 ground-truth vectors from
> [REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md) (13 of which exercise the diff path;
> 2 exercise the exact-match path) **and** the 14 transposition vectors in
> [§9.2](#92-transposition-vectors--specified-behavior-new-in-v02). All pass, the
> structured output round-trips to byte-identical legacy HTML, and **adding
> transposition changed none of the 15 legacy vectors.** See
> [§9](#9-test-contract--ground-truth-vectors).
>
> **Don't take that on trust — reproduce it.** The recipe is in
> [§1.2](#12-how-to-verify-this-document).

### 1.1 Intentional departure from verbatim parity — transposition (added 2026-08-07)

**Kevin's decision, 2026-08-07: detect adjacent transpositions, in v1.**

Everything else in this document is a faithful port of v0.2.0 behavior. This one
thing is deliberately **not**. Plain Levenshtein has no concept of a swap, so the
live app scores `recieve` for `receive` as **two independent substitutions** and
marks both letters wrong — which tells the user the wrong thing about the most
common class of spelling error there is.

This document therefore specifies **Damerau–Levenshtein** (restricted /
optimal-string-alignment variant), in which an adjacent transposition is a single
edit, and adds a `transposed` status.

> ⚠️ **Do not "fix" this back to match the old app.**
> [REBUILD_SPEC.md](../REBUILD_SPEC.md) is the frozen record of v0.2.0 and
> correctly states that the old app does not do transposition. That is a
> divergence we chose, not a porting error. The 15 legacy vectors still pass
> **unchanged** ([§9.1](#91-legacy-vectors--captured-from-production)), which is
> what proves the divergence is *additive* rather than a regression.

**Why it earns its place in v1:** the design was audited against real
proofreading convention (proofreaders' marks as used in manuscript correction).
The caret for an omission and the strikethrough for a deletion already matched;
the missing-space mark did not (corrected — see
[§7](#7-presentation-contract)); and **transposition, which has its own
long-standing correction mark precisely because swapped letters are so common,
was missing entirely.** Adding it makes the feedback match what a teacher would
actually write on the page.

It is also **a second axis on which this product beats Anki.** Anki's
`{{type:Field}}` comparison — the only character-level typed-answer diff in the
market — has the same no-transposition limitation, so it too reports a single
swap as two unrelated wrong letters. See
[Competitor Analysis](./competitor-analysis.md#the-character-level-diff-question).

### 1.2 How to verify this document

The `ts` blocks in [§2.1](#21-types) and [§3](#3-the-algorithm) are a **complete,
runnable listing**, not fragments. Concatenated in document order they compile
under `tsc --strict` and execute with no additions. To check that yourself:

````bash
# 1. Extract every ```ts block, dropping the ONE bodiless forward declaration
#    of computeSpellingDiff in §2.2 (it is a signature for readers; keeping it
#    alongside the real implementation is a duplicate-declaration error:
#    "TS2391: Function implementation is missing or not immediately following
#    the declaration").
python3 - <<'PY' > spec.ts
import re
src = open('spelling-diff-spec.md', encoding='utf-8').read()
blocks = re.findall(r'```ts\n(.*?)```', src, re.S)
kept = [b for b in blocks if not re.search(r'\)\s*:\s*DiffSegment\[\];\s*$', b.strip())]
print('\n'.join(kept))
PY

# 2. Type-check it (catches undeclared types, which step 3 cannot — Node erases
#    type annotations rather than checking them).
npx tsc --noEmit --strict --target es2022 --moduleDetection force spec.ts

# 3. Run it. Node 22.6+ strips TypeScript natively; no build step, no deps.
#    Write your own harness importing { computeSpellingDiff } from './spec.ts'
#    and assert the vectors in §9.
node your-harness.ts
````

**Both steps 2 and 3 are required.** Step 3 alone will happily run code with
undeclared *types*, because Node strips annotations without checking them — an
undeclared `EditOp` was found in exactly this way, having survived a
runtime-only check. Step 2 alone proves nothing about the vectors.

> **Rule for anyone editing this file:** if you change a `ts` block, re-run all
> three steps before claiming the spec is verified, and say which of them you
> ran. A verification claim that wasn't executed on the document *as it stands*
> is worse than no claim, because the next reader will build on it.

---

## 2. The contract

### 2.1 Types

```ts
/** What happened at one position of the correct answer. */
export type DiffStatus =
  | 'ok'          // the user typed this character correctly
  | 'wrong'       // the user typed a different character here
  | 'missing'     // the user omitted this character entirely
  | 'extra'       // the user typed a character that does not belong here
  | 'transposed'; // this character and its neighbour were swapped

export interface DiffSegment {
  status: DiffStatus;
  /**
   * The character from the CORRECT answer that this segment represents.
   * Empty string for `extra` — there is no corresponding character in the
   * correct answer.
   */
  char: string;
  /**
   * What the user actually typed at this position, when it is known and
   * differs from `char`:
   *   - 'wrong'      → the character they typed instead
   *   - 'extra'      → the surplus character they typed
   *   - 'transposed' → the character they typed here, i.e. the OTHER half of
   *                    the swapped pair
   *   - 'ok'         → omitted (identical to `char` under the comparison rules)
   *   - 'missing'    → omitted (they typed nothing here)
   */
  typed?: string;
  /**
   * Present ONLY on 'transposed' segments. Links the two halves of one swap.
   * Exactly two segments share each value, and they are always adjacent in the
   * array. Values are unique per diff, assigned left to right from 0.
   *
   * A presenter MUST use this rather than inferring pairs from adjacency: two
   * consecutive swaps produce four consecutive 'transposed' segments, and
   * adjacency alone cannot tell (0,1)(2,3) from (1,2). See §2.4.
   */
  pairId?: number;
}

/** The full result of evaluating one submitted answer. */
export interface AnswerEvaluation {
  correct: boolean;
  /** The accepted answer the attempt was scored against (see §6). */
  matchedAnswer: string;
  /** Empty when `correct` is true. */
  diff: DiffSegment[];
}
```

### 2.2 Function signature

```ts
/**
 * Compute the character-level difference between what the user typed and the
 * correct answer, as a renderable structure.
 *
 * @param typed   Exactly what the user submitted, after trimming leading and
 *                trailing whitespace. Internal whitespace is significant.
 * @param correct The accepted answer, in its stored casing.
 * @returns       A segment per position of the correct answer, plus one
 *                `extra` segment per surplus character the user typed.
 */
export function computeSpellingDiff(typed: string, correct: string): DiffSegment[];
```

### 2.3 Invariants

These must hold for every input and are worth asserting in tests:

1. **Reconstruction.** Concatenating `char` over all segments whose status is
   not `extra` reproduces `correct` exactly.
2. **Casing.** Output characters come from the **stored** answer's casing, never
   the user's. `ravenous` typed as `RAVENOUS` is *correct*; `ravenous` typed as
   `RAVANOUS` yields `rav`, wrong `e`, `nous` — lowercase, as stored.
   *(Verified — [REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md) vector 2.)*
3. **Non-empty.** For any wrong answer, the diff has at least one segment whose
   status is not `ok`. A diff that is entirely `ok` means the answer was
   correct and `computeSpellingDiff` should not have been called.
4. **`extra` carries no correct-answer character.** `char === ''` and
   `typed` is set.
5. **Legacy equivalence.** Rendering the structure per
   [§7.4](#74-legacy-equivalence-rendering) produces byte-identical output to
   the live v0.2.0 app for all 15 ground-truth vectors.
6. **Transposition pairing** (see [§2.4](#24-how-a-transposed-pair-is-represented)).
   For every `pairId` value present: exactly **two** segments carry it, they are
   **adjacent** in the array, both have status `transposed`, and their contents
   are mirror images — `segments[p].char === segments[p+1].typed` and
   `segments[p+1].char === segments[p].typed`.
7. **No segment carries `pairId` unless its status is `transposed`.**

### 2.4 How a transposed pair is represented

A transposition covers **two** positions of the correct answer, so it emits
**two segments, not one.** This is deliberate and it is the choice that makes
everything else work:

- **Reconstruction still holds.** Invariant 1 requires that concatenating `char`
  over non-`extra` segments reproduces `correct`. A single segment covering two
  characters would either break that invariant or force `char` to hold a
  two-character string, which then breaks per-character alignment in the
  renderer.
- **The marking loop stays uniform** — one segment per position of the correct
  answer, exactly as for every other status.
- **The presenter keeps full freedom.** It can draw one transpose mark spanning
  both segments (recommended, matching proofreading convention) precisely
  because `pairId` tells it which two segments belong together.

For a swap at positions *p* and *p+1*:

| | `status` | `char` | `typed` | `pairId` |
| --- | --- | --- | --- | --- |
| segment *p* | `transposed` | `correct[p]` | what the user typed at *p* (= `correct[p+1]`) | *n* |
| segment *p+1* | `transposed` | `correct[p+1]` | what the user typed at *p+1* (= `correct[p]`) | *n* |

Worked example — `receive` typed as `recieve`:

```text
ok(r) ok(e) ok(c) tr#0(e←i) tr#0(i←e) ok(v) ok(e)
                  └──────── one swap, pairId 0 ────┘
```

Reading it: the correct answer has `e` then `i`; the user typed `i` then `e`.
`char` reconstructs `receive`; `typed` reconstructs `recieve`. Both strings are
recoverable from the same structure, which is what lets
[§6.4 / US-D6](./user-stories.md#epic-d--spelling-feedback-prd-64) render the
user's own attempt aligned beneath the correct one without recomputing anything.

---

## 3. The algorithm

**Build this exactly as written and get every vector in
[§9](#9-test-contract--ground-truth-vectors) green before changing anything.**
The PRD requires characterization tests to exist before any refactor
([PRD §9 — Testability](./product-requirements.md#9-non-functional-requirements)).

**Suggested build order:** implement the three-way version first (delete /
substitute / insert) and get the 15 legacy vectors green — that proves the port
is faithful. *Then* append the transposition candidate and confirm the 15 are
**still** green while the 14 transposition vectors go green. Doing it in that
order means that if a legacy vector ever breaks you know precisely which change
broke it.

### 3.1 `calcDist` — the edit script

Both arguments are already case-folded (see [§4.1](#41-comparison-rules)).
Returns a character-aligned array of edit operations:
`'n'` (no change) · `'s'` (substitute) · `'i'` (insert) · `'d'` (delete) ·
`'t'` (transposition — always emitted as **two** consecutive entries).

**Variant: Damerau–Levenshtein, restricted (optimal string alignment).** A
transposition is available only when the two characters are *adjacent* in both
strings, and no substring is edited more than once. The unrestricted variant
buys nothing here — its extra power concerns edits that overlap a previously
transposed region, which for word-length spelling input produces alignments a
human would find harder to read, not easier — and it costs an alphabet-indexed
table.

```ts
/**
 * One edit operation in the script:
 *   'n' no change · 's' substitute · 'i' insert (the user omitted a character)
 *   'd' delete (the user typed a surplus character) · 't' adjacent transposition
 *
 * Internal to the algorithm — it is not part of the public contract in §2.1,
 * which is `DiffSegment[]`.
 */
type EditOp = 'n' | 's' | 'i' | 'd' | 't';

/**
 * Compute the edit script transforming what the user typed into the correct
 * answer, using minimum edit distance with a specific, load-bearing tie-break.
 *
 * @param a What the user typed, case-folded.
 * @param b The correct answer, case-folded.
 * @returns One operation per aligned position: 'n' | 's' | 'i' | 'd' | 't'.
 */
function calcDist(a: string, b: string): EditOp[] {
  const n = a.length, m = b.length;
  const dist: number[][]  = [];
  const edits: EditOp[][] = [];
  const paths: ([number, number] | null)[][] = [];

  for (let i = 0; i <= n; i++) {
    dist.push(new Array(m + 1).fill(0));
    edits.push(new Array(m + 1).fill('n'));
    paths.push(new Array(m + 1).fill(null));
  }

  // Row 0 is all inserts (the user omitted everything);
  // column 0 is all deletes (the user typed characters that don't exist).
  for (let i = 0; i <= n; i++) { dist[i][0] = i; edits[i][0] = 'd'; if (i > 0) paths[i][0] = [i - 1, 0]; }
  for (let j = 0; j <= m; j++) { dist[0][j] = j; edits[0][j] = 'i'; if (j > 0) paths[0][j] = [0, j - 1]; }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      // ---- TIE-BREAK ORDER IS LOAD-BEARING ----
      // delete is considered first, then substitute, then insert, then
      // transposition, and each later candidate only wins on a STRICT
      // improvement (`<`, never `<=`). Changing this order, or relaxing the
      // comparison, changes which character gets marked on ties and produces
      // visibly different output. See §3.3 for why transposition is LAST.
      let best = dist[i - 1][j] + 1;
      let op: EditOp = 'd';
      let prev: [number, number] = [i - 1, j];

      const sub = dist[i - 1][j - 1] + cost;
      if (sub < best) { best = sub; op = 's'; prev = [i - 1, j - 1]; }

      const ins = dist[i][j - 1] + 1;
      if (ins < best) { best = ins; op = 'i'; prev = [i, j - 1]; }

      // Adjacent transposition (Damerau, restricted/OSA). Available only when
      // the two characters are swapped with respect to each other, and costed
      // as ONE edit — which is the whole point: a genuine swap costs 1 here
      // versus 2 as a pair of substitutions, so it wins on a strict
      // improvement and never needs to win a tie.
      const canTranspose =
        i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
      if (canTranspose) {
        const tr = dist[i - 2][j - 2] + 1;
        if (tr < best) { best = tr; op = 't'; prev = [i - 2, j - 2]; }
      }

      dist[i][j] = best; edits[i][j] = op; paths[i][j] = prev;
    }
  }

  // Walk the back-pointers from the bottom-right to the origin, building the
  // script front-to-back. A step where the distance did not change is 'n'.
  const script: EditOp[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const [pi, pj] = paths[i][j]!;
    if (edits[i][j] === 't' && pi === i - 2 && pj === j - 2) {
      // One transposition spans TWO positions of the correct answer, so it
      // contributes two script entries. Both are unshifted together, keeping
      // them adjacent and in order.
      script.unshift('t', 't');
    } else {
      script.unshift(dist[pi][pj] === dist[i][j] ? 'n' : edits[i][j]);
    }
    i = pi; j = pj;
  }

  // Special case, preserved verbatim from v0.2.0: a single-operation script is
  // forced to 'insert'. Without it, a one-character answer typed as a different
  // single character renders as nothing at all. A transposition always yields
  // at least two entries, so it can never reach this branch.
  if (script.length === 1) script[0] = 'i';

  return script;
}
```

A transposition step never records `'n'`: it always costs exactly 1, so
`dist[i-2][j-2] !== dist[i][j]` by construction. The `'n'` check above is
therefore unreachable for `'t'` and the explicit branch is safe.

### 3.2 The marking loop

The loop walks the edit script and mutates **working copies** of the typed and
correct strings so that index `i` stays aligned across both as characters are
inserted. This mutate-as-you-go alignment is the second load-bearing detail.

```ts
/**
 * Locale-independent lowercasing. Deliberately `toLowerCase`, NOT
 * `toLocaleLowerCase` — grading must not vary by device locale. (The v0.2.0
 * app mixed the two; see §6.)
 */
function foldCase(s: string): string {
  return s.toLowerCase();
}

export function computeSpellingDiff(typed: string, correct: string): DiffSegment[] {
  const script = calcDist(foldCase(typed), foldCase(correct));

  let inp = foldCase(typed);  // working copy of the user's attempt
  let act = correct;          // working copy of the answer, in STORED casing
  const segments: DiffSegment[] = [];
  let nextPairId = 0;         // pairs `transposed` segments; see §2.4

  for (let i = 0; i < script.length; i++) {
    switch (script[i]) {
      case 'n':
        segments.push({ status: 'ok', char: act[i] });
        break;

      case 'd': {
        // The user typed a character that doesn't belong. Pad the answer at
        // this position so subsequent indices stay aligned.
        const surplus = inp[i];
        act = act.slice(0, i) + '-' + act.slice(i);
        segments.push({ status: 'extra', char: '', typed: surplus });
        break;
      }

      case 'i': {
        // The user omitted this character. Splice it into the working attempt.
        const c = act[i];
        inp = inp.slice(0, i) + c + inp.slice(i);
        segments.push({ status: 'missing', char: c });
        break;
      }

      case 's': {
        // The user typed the wrong character here. Substitute the correct one
        // into the working attempt.
        const c = act[i];
        const wrong = inp[i];
        inp = inp.slice(0, i) + c + inp.slice(i + 1);
        segments.push({ status: 'wrong', char: c, typed: wrong });
        break;
      }

      case 't': {
        // Adjacent transposition. calcDist always emits 't' as a PAIR of
        // consecutive entries, so this arm handles both positions and then
        // advances the loop past the second one.
        const first  = inp[i];      // what the user typed at i     (= act[i + 1])
        const second = inp[i + 1];  // what the user typed at i + 1 (= act[i])
        // Swap them in the working attempt so it now matches act at both
        // positions — the same "make the attempt correct as you go" discipline
        // that 'i' and 's' use to keep index i aligned.
        inp = inp.slice(0, i) + second + first + inp.slice(i + 2);

        const id = nextPairId++;
        segments.push({ status: 'transposed', char: act[i],     typed: first,  pairId: id });
        segments.push({ status: 'transposed', char: act[i + 1], typed: second, pairId: id });

        i++; // consume the paired second 't'
        break;
      }
    }
  }

  return segments;
}
```

`pairId`s are assigned left to right, so they are stable and reproducible for a
given input.

> **Note on `'t'`:** capture **both** typed characters *before* mutating `inp`.
> Reading `inp[i + 1]` after the swap returns the already-corrected character and
> silently produces two segments that both claim the same `typed` value —
> breaking invariant 6 in a way that still renders plausibly. This is the single
> easiest place to introduce a subtle bug in this arm.

> **Note on `'d'`:** the legacy implementation inserts a literal `-` into the
> working answer and then emits `act[i]`, which is that `-`. The structured
> version above emits `char: ''` instead and lets the presentation layer decide
> how to render a surplus character. The `-` insertion into `act` is still
> required — it is what keeps `i` aligned for every subsequent segment. Removing
> it silently corrupts everything after the first extra character.

### 3.3 Why transposition is evaluated LAST in the tie-break

Adding a fourth operation to a three-way tie-break is a real behavioral decision,
not a formality: the order determines which edit script is chosen whenever two
candidates cost the same, and that is exactly what the user sees. Two placements
were implemented and measured.

| Placement | Behavior |
| --- | --- |
| **LAST** (chosen) | Existing `d → s → i` order untouched; transposition appended as a fourth candidate winning only on a strict improvement. |
| **FIRST** | Transposition seeded as the initial best, so it wins every tie against delete, substitute and insert. |

**Measured results:**

1. **Both placements pass all 15 legacy vectors unchanged.** The regression risk
   did not materialise either way. LAST was therefore *not* chosen because FIRST
   broke something — it was chosen on the three grounds below.
2. **On real spelling errors the two are indistinguishable.** Across a corpus of
   **49 real English misspellings** chosen to stress doubled and repeated letters
   (`receive`/`recieve`, `their`/`thier`, `occurrence`/`occurrnece`,
   `committee`/`commitee`, `success`/`sucess`, `letter`/`lettre`, `angel`/`angle`,
   `united`/`untied`, …), the two placements produced **identical output in
   49/49 cases**. LAST detects every genuine transposition FIRST does.
3. **They diverge only on degenerate ties.** Exhaustively comparing all 132 132
   `(correct, typed)` pairs over a three-letter alphabet up to length 5, the
   renderings differ in 6.8% of cases, and FIRST reports a swap where LAST does
   not in 8 574 of them — **but LAST never reports a swap FIRST misses.** Every
   divergence is a case like `correct="ab"`, `typed="bba"`, where "surplus
   character plus a swap" and "wrong character plus a surplus character" cost
   exactly the same and neither reading is more true.

**The three reasons LAST wins:**

- **Minimal disturbance.** The three-way order is verified against production
  behavior. Appending a candidate that wins only on a strict improvement is the
  smallest possible change to a verified algorithm, and it makes the "did we
  break anything?" question answerable by construction rather than by hope.
- **No cost in detection power.** A genuine adjacent swap of two distinct
  characters costs **1** as a transposition versus **2** as a pair of
  substitutions. It therefore *strictly improves* and wins regardless of
  placement. Putting it last sacrifices nothing that matters — confirmed
  empirically at 49/49.
- **On a tie, the simpler explanation should win.** The transpose mark is a
  specific pedagogical claim: *"you wrote these two letters the wrong way
  round."* If that reading merely ties with a simpler one-character edit, the
  evidence does not support the claim, and asserting it anyway teaches the user
  something we do not actually know. **Under-claiming an ambiguous swap is
  better than over-claiming one.**

> If this order is ever revisited, re-run **both** the 15 legacy vectors and the
> 14 transposition vectors, and re-run the real-word corpus. The order is
> behavior.

### 3.4 What v0.2.0 got wrong that this fixes

| Legacy behavior | Rebuild |
| --- | --- |
| Emits an HTML string consumed by `innerhtml.bind`, which is a **confirmed stored-XSS executing on the production domain** ([REBUILD_SPEC §13](../REBUILD_SPEC.md)) | Returns data. No user string is ever interpreted as markup. |
| `missing` and `wrong` render identically (both a red character) | Distinct statuses, distinct presentation ([§7](#7-presentation-contract)) |
| **A swapped pair is reported as two unrelated wrong letters** — plain Levenshtein has no transposition | `transposed` status, one mark spanning the pair ([§1.1](#11-intentional-departure-from-verbatim-parity--transposition-added-2026-08-07)) |
| Colour is the only signal | Colour plus a second non-colour signal, plus a screen-reader announcement |
| Discards which character the user actually typed | `typed` is carried on `wrong`, `extra` and `transposed` segments |
| Missing space marked with `_`, which is not a proofreading convention | `#`, the standard space-insertion mark ([§7](#7-presentation-contract)) |
| Indexes UTF-16 code units; no normalisation | Grapheme-aware, NFC-normalised ([§5](#5-unicode-handling)) |
| No trimming — a leading space fails the answer | Leading/trailing whitespace trimmed before evaluation |
| Unbounded | Bounded ([§8](#8-performance--bounds)) |

---

## 4. Evaluation rules

### 4.1 Comparison rules

An answer is **correct** when the normalised, trimmed, case-folded attempt
equals the normalised, case-folded accepted answer.

| Rule | Behavior | Notes |
| --- | --- | --- |
| **Trim** | Leading and trailing whitespace removed from the attempt before anything else. | *Change from v0.2.0*, which trims nothing. A leading space is not a spelling error. |
| **Internal whitespace** | **Exactly significant.** `ice cream` ≠ `icecream` ≠ `ice  cream`. | Non-negotiable — the missing-space marker is a signature feature. Never collapse runs of whitespace. |
| **Case** | Folded by default; `Ignore case` / `Require exact case` is a user setting ([PRD §6.8](./product-requirements.md#68-settings--p0)). | v0.2.0 is hard-coded case-insensitive; that stays the default. `foldCase` uses locale-independent lowercasing so behavior doesn't vary by device locale. |
| **Punctuation & accents** | **Significant.** `resume` ≠ `résumé`. | An accent is a spelling property. A future "ignore diacritics" setting (Anki has `{{type:nc:}}`) is a P2 idea, not a default. |
| **Unicode form** | Both sides NFC-normalised before comparison. | So `é` (U+00E9) and `e`+U+0301 compare equal — same character, different encoding, not a spelling error. |

### 4.2 When the diff is computed

Only on an **incorrect** submission. A correct submission produces
`{ correct: true, diff: [] }` and the UI shows the confirmed answer in its
stored casing.

The diff is computed **per attempt**, so a user who gets a card wrong three
times sees three (probably different) diffs. Counters follow
[PRD §6.3](./product-requirements.md#63-the-test-session--p0): `failed`
increments on every wrong attempt; `tested` and progress do not move until the
card is passed.

---

## 5. Unicode handling

**Phase 1** ports the algorithm operating on UTF-16 code units, exactly as
v0.2.0 does, and gets the 15 vectors green. Every vector is ASCII, so this is
safe and it establishes the baseline.

**Phase 2 — required before launch** generalises to user-perceived characters.
This is not optional polish: it is the same class of bug that produces Anki's
documented mis-marking in Korean
([Competitor Analysis](./competitor-analysis.md#six-documented-weaknesses-in-ankis-implementation)),
and card content is arbitrary user text.

Rules:

1. **Normalise both strings to NFC** before doing anything else.
2. **Segment into grapheme clusters, not code units**, and run the entire
   algorithm over arrays of clusters rather than over strings. A `DiffSegment`'s
   `char` may therefore be a multi-code-unit string — that is correct and
   intended.
   - Never index a JavaScript string with `[i]` for this purpose: it yields a
     UTF-16 code unit and will split an astral character or a combining
     sequence in half.
3. **Segmentation implementation.** `Intl.Segmenter` with
   `granularity: 'grapheme'` where available. **React Native's Hermes engine
   ships an incomplete `Intl`**, so this must be polyfilled and verified
   **on-device**, not only on web — a missing `Intl` API throws at render time
   on device while working perfectly in a browser. If a polyfill proves
   impractical, code-point iteration (`Array.from(str)`) is an acceptable
   fallback that handles astral characters correctly but not combining
   sequences; the shortfall must be documented, not silently accepted.
4. **The `extra` padding character.** The `-` spliced into the working answer in
   [§3.2](#32-the-marking-loop) must be a single cluster. `-` (U+002D) is safe.
5. **Transposition compares clusters, not code units.** The `canTranspose`
   condition in [§3.1](#31-calcdist--the-edit-script) compares
   `a[i-1] === b[j-2]` and `a[i-2] === b[j-1]`; over cluster arrays these are
   cluster equality checks. Comparing code units instead would both miss real
   swaps of accented characters (`é`/`è` transposed) and — worse — report
   spurious swaps between the halves of two different combining sequences.
6. **Because every vector in [§9](#9-test-contract--ground-truth-vectors) is
   ASCII, the phase-2 change must leave all 29 of them passing.** If any breaks,
   the generalisation is wrong.

---

## 6. Multiple accepted answers

Per [PRD §6.2.1](./product-requirements.md#621-multiple-accepted-answers--p1) a
card may accept several answers. The data model supports this at P0; the
authoring UI is P1. The evaluation rules apply from P0 regardless, because a
card with one accepted answer is just the degenerate case.

> **Pseudocode — not runnable.** Unlike the listings in
> [§3](#3-the-algorithm), this is illustrative. `matches()` is the comparison
> defined in [§4.1](#41-comparison-rules) and `editDistance()` is the final cell
> of `calcDist`'s matrix; neither is provided as code here.

```text
evaluate(typed, acceptedAnswers):
    for each candidate in acceptedAnswers:
        if matches(typed, candidate):
            return { correct: true, matchedAnswer: candidate, diff: [] }

    # No match. Score against the answer the user was evidently reaching for:
    # the candidate with the LOWEST edit distance to what they typed.
    best = argmin over candidates of editDistance(foldCase(typed), foldCase(candidate))
    # Tie-break: the FIRST candidate in the card's declared order wins, so the
    # result is deterministic and the card author controls the primary answer.
    return { correct: false, matchedAnswer: best, diff: computeSpellingDiff(typed, best) }
```

**Why lowest-distance and not first-declared:** if a card accepts `colour` and
`color` and the user types `collor`, marking it against `colour` would tell them
they are missing a `u` they never needed. Scoring against the nearest candidate
is the only rule that gives honest feedback.

**Flipped sessions** ([PRD §6.3](./product-requirements.md#63-the-test-session--p0))
swap the roles: the card's hints become the accepted answers and the answers
become the prompt. Every rule in this document applies unchanged to the swapped
values.

---

## 7. Presentation contract

The designer owns the visual treatment; this section owns what the treatment
must **distinguish** and **communicate**. Handing a designer a `DiffSegment[]`
without these constraints is how the accessibility requirement gets lost.

### 7.1 Five kinds must be visually distinguishable

The marking follows **proofreaders' correction marks** — the conventions a
teacher actually uses on a page — so that the feedback is legible to anyone
who has ever had an essay handed back. *(Design audited against proofreading
convention, 2026-08-07; Kevin's decisions recorded in the Convention column.)*

| Status | Meaning to the user | Must be distinguishable from | Convention | Legacy treatment |
| --- | --- | --- | --- | --- |
| `ok` | You got this right | everything | — | plain black |
| `wrong` | You typed a different letter here | `missing`, `transposed` | strike/replace mark | red |
| `missing` | You left this letter out | `wrong`, `transposed` | **caret** (`‸`), the standard insertion mark — already matched | red *(indistinguishable from `wrong` — fixed)* |
| `extra` | You typed a letter that doesn't belong | `wrong`, `missing` | **strikethrough**, the standard deletion mark — already matched | a red `-` |
| `transposed` | You wrote these two letters the wrong way round | all of the above | the **transpose mark**, a single mark spanning the pair | ❌ **did not exist** — reported as two unrelated wrong letters |
| any non-`ok` **where `char` is a space** | You left out a space | all of the above | **`#`**, the standard space-insertion mark *(changed 2026-08-07 — Kevin's decision)* | red `_` flanked by non-breaking spaces |

> **The missing-space mark changed from `_` to `#`.** The underscore used since
> v0.1.6 was never a proofreading convention; `#` is. This is a **presentation**
> change only — the diff data is unaffected, and
> [§7.4](#74-legacy-equivalence-rendering) still emits `_` because its only job
> is reproducing v0.2.0 output for the characterization tests.

### 7.2 Hard rules

1. **Never colour alone.** Every non-`ok` status carries at least one
   additional signal — weight, underline, a marker glyph, or a container — so
   the feedback is fully legible under deuteranopia, protanopia and tritanopia,
   and in high-contrast and monochrome modes.
   ([PRD §9](./product-requirements.md#9-non-functional-requirements))
2. **A space error is always visibly marked.** `char === ' '` with a non-`ok`
   status must render as something with visible extent — the `#` mark, or a
   designed equivalent. It must never render as literal whitespace, which is
   invisible and defeats the entire v0.1.6 fix. **This is the single easiest
   requirement in the document to lose in a rewrite.**
3. **A transposed pair reads as ONE error, not two.** The two segments sharing a
   `pairId` must be marked with a single mark spanning both — not two
   independent wrong-letter marks, which is exactly the misleading output this
   feature exists to eliminate. **Use `pairId` to group; never infer pairing
   from adjacency** ([§2.4](#24-how-a-transposed-pair-is-represented)) — two
   consecutive swaps produce four consecutive `transposed` segments and
   adjacency alone cannot disambiguate them.
4. **Character alignment.** Characters must line up predictably; a tabular or
   monospaced treatment is expected. Anki uses a monospaced font for exactly
   this reason.
5. **The correct answer is always fully readable.** Whatever the marking,
   a user must be able to read the correct spelling straight off the feedback.

### 7.3 Screen-reader announcement

A wrong answer emits a **polite** live-region announcement. It must convey the
same information a sighted user gets from the marking:

```text
Incorrect. Correct spelling: r-a-v-e-n-o-u-s. You left out the letter o.
Incorrect. Correct spelling: r-e-c-e-i-v-e. You swapped the i and the e.
```

Rules:
- Spell the correct answer **letter by letter** — reading "ravenous" as a word
  tells a screen-reader user nothing about spelling.
- Summarise the errors in plain language, grouped by kind: *left out*, *typed X
  instead of Y*, *extra letter X*, *left out a space*, ***swapped X and Y***.
- **A transposed pair is announced as one error**, naming both characters in the
  order **the user typed them** — "you swapped the i and the e", not two
  separate wrong-letter reports. This mirrors rule 3.

  > **Resolved 2026-08-09 (Kevin's decision).** This rule previously said
  > *correct* order, contradicting
  > [design/spec.md §3.2.7](../design/spec.md) rule 2, which says typed order.
  > The design document wins: the sentence describes **what the user did**, and
  > naming the letters in the sequence they entered is the more natural reading
  > at the moment they've just made the mistake. Implementations read `typed`
  > on each half of the pair, not `char`.
- Cap the enumeration (e.g. first three errors, then "and N more") so a wildly
  wrong answer doesn't produce a minute of speech.
- Announce politely, never assertively — it must not interrupt the user typing
  their retry.

### 7.4 Legacy-equivalence rendering

For characterization tests only, this mapping reproduces the v0.2.0 HTML
byte-for-byte and is how the legacy vectors in
[§9.1](#91-legacy-vectors--captured-from-production) are verified. **It is not
the production renderer** — production renders elements, never an HTML string,
and uses `#` for a missing space per
[§7.1](#71-five-kinds-must-be-visually-distinguishable).

```text
ok                        → char
extra                     → <em>-</em>
non-ok where char === ' ' → <em>&nbsp;_&nbsp;</em>
any other non-ok          → <em>{char}</em>
```

> **Do not "modernise" this mapping.** Its `_` and its collapsing of
> `wrong`/`missing`/`transposed` into one `<em>` treatment are *deliberate* —
> that is precisely what v0.2.0 emitted, and reproducing it byte-for-byte is the
> entire point. A `transposed` segment maps here to `<em>{char}</em>`, i.e. what
> the old app would have shown for the same input, which is what lets the legacy
> vectors keep passing after transposition was added.

---

## 8. Performance & bounds

- Time and space are **O(n·m)** in the two string lengths. At word length
  (< 30 characters) this is microseconds and three ~900-cell matrices.
- **The input must be bounded.** A card whose answer is a pasted paragraph, or a
  user who pastes a paragraph into the answer box, would allocate and fill
  matrices large enough to freeze the UI thread. Enforce a cap
  (**suggested: 256 characters per side**, applied by truncating for the
  purposes of the diff only — never truncating stored data). Beyond the cap,
  fall back to a plain "incorrect" message with no character marking.
- Card content should additionally be length-limited at authoring and import
  time, so the cap is a backstop rather than a routine path.
- The computation is synchronous on the UI thread by design — it must complete
  imperceptibly. If profiling ever shows otherwise, bound the input further
  rather than moving the work off-thread; a delayed diff breaks the feedback
  loop.

---

## 9. Test contract — ground-truth vectors

**29 vectors total**, in two groups with **different evidential status** — do
not conflate them:

| Group | Count | Status | What a failure means |
| --- | --- | --- | --- |
| [§9.1 Legacy](#91-legacy-vectors--captured-from-production) | **15** | **Captured from the live production site.** Ground truth. | You broke compatibility with what users see today. |
| [§9.2 Transposition](#92-transposition-vectors--specified-behavior-new-in-v02) | **14** | **Specified behavior**, new in v0.2. No production counterpart exists — the old app cannot do this. | You broke the new feature, or the tie-break changed. |

Together they are the acceptance criteria for
[CAP-4](./capability-spec.md#cap-4--answer-evaluation--spelling-diff-p0--differentiator)
and must be written as executable tests **before** any refactor.

### 9.1 Legacy vectors — captured from production

These 15 were captured by driving the **live production site** and reading the
rendered `innerHTML` ([REBUILD_SPEC §9.1.1](../REBUILD_SPEC.md)).

> **These must pass unchanged after transposition was added.** They are the
> regression gate on the Damerau change, and they were re-verified against the
> Damerau implementation on 2026-08-07 — see
> [§9.3](#93-verification-status).

| # | Correct answer | User typed | Expected (legacy-equivalent rendering) | Exercises |
| --- | --- | --- | --- | --- |
| 1 | `ravenous` | `ravenous` | *correct path* — `<correct>ravenous</correct>` | Exact match |
| 2 | `ravenous` | `RaVeNoUs` | *correct path* — `<correct>ravenous</correct>` | Case-insensitivity; **echoes the stored casing** |
| 3 | `ravenous` | `ravenus` | `raven<em>o</em>us` | Omitted character → `missing` |
| 4 | `ravenous` | `ravenious` | `raven<em>-</em>ous` | Extra character → `extra` |
| 5 | `ravenous` | `ravanous` | `rav<em>e</em>nous` | Wrong character → `wrong` |
| 6 | `ravenous` | `ravenou` | `ravenou<em>s</em>` | Truncated at the end |
| 7 | `ravenous` | `avenous` | `<em>r</em>avenous` | Missing first character |
| 8 | `ravenous` | `ravenouss` | `ravenous<em>-</em>` | Doubled last character |
| 9 | `ravenous` | `xyz` | `<em>r</em><em>a</em><em>v</em><em>e</em><em>n</em><em>o</em><em>u</em><em>s</em>` | Every character its own segment |
| 10 | `ravenous` | *(empty)* | `<em>r</em><em>a</em><em>v</em><em>e</em><em>n</em><em>o</em><em>u</em><em>s</em>` | Empty submission |
| 11 | `ice cream` | `icecream` | `ice<em>&nbsp;_&nbsp;</em>cream` | **The missing-space case** |
| 12 | `ice cream` | `ice creem` | `ice cre<em>a</em>m` | Substitution after a space |
| 13 | `ice cream` | `ice  cream` | `ice <em>-</em>cream` | Extra space |
| 14 | `a` | `b` | `<em>a</em>` | The `script.length === 1` special case |
| 15 | `ab` | `a` | `a<em>b</em>` | Single missing character |

### 9.2 Transposition vectors — specified behavior, new in v0.2

Generated from the reference implementation in [§3](#3-the-algorithm) and
reviewed against what a teacher would mark. Notation:
`ok(c)` · `wrong(c<-t)` · `missing(c)` · `extra(<-t)` · `tr#N(c<-t)`, where `c`
is the correct character, `t` is what the user typed there, and `N` is the
`pairId`. `␣` denotes a literal space.

| # | Correct | Typed | Expected segments | Swaps | Exercises |
| --- | --- | --- | --- | --- | --- |
| T1 | `receive` | `recieve` | `ok(r) ok(e) ok(c) tr#0(e<-i) tr#0(i<-e) ok(v) ok(e)` | 1 | The canonical ie/ei swap |
| T2 | `their` | `thier` | `ok(t) ok(h) tr#0(e<-i) tr#0(i<-e) ok(r)` | 1 | Classic ie swap |
| T3 | `friend` | `freind` | `ok(f) ok(r) tr#0(i<-e) tr#0(e<-i) ok(n) ok(d)` | 1 | Classic ei swap |
| T4 | `the` | `hte` | `tr#0(t<-h) tr#0(h<-t) ok(e)` | 1 | Swap at the very start |
| T5 | `ravenous` | `arvenous` | `tr#0(r<-a) tr#0(a<-r) ok(v) ok(e) ok(n) ok(o) ok(u) ok(s)` | 1 | Swap at the start, longer word |
| T6 | `ravenous` | `ravenosu` | `ok(r) ok(a) ok(v) ok(e) ok(n) ok(o) tr#0(u<-s) tr#0(s<-u)` | 1 | Swap at the very end |
| T7 | `abcd` | `badc` | `tr#0(a<-b) tr#0(b<-a) tr#1(c<-d) tr#1(d<-c)` | **2** | **Double swap — `pairId` disambiguates four consecutive `transposed` segments** |
| T8 | `their friend` | `thier freind` | `ok(t) ok(h) tr#0(e<-i) tr#0(i<-e) ok(r) ok(␣) ok(f) ok(r) tr#1(i<-e) tr#1(e<-i) ok(n) ok(d)` | 2 | Two swaps across two words |
| T9 | `receive` | `recieved` | `ok(r) ok(e) ok(c) tr#0(e<-i) tr#0(i<-e) ok(v) ok(e) extra(<-d)` | 1 | Swap plus a surplus character |
| T10 | `receive` | `reciev` | `ok(r) ok(e) ok(c) tr#0(e<-i) tr#0(i<-e) ok(v) missing(e)` | 1 | Swap plus an omitted character |
| T11 | `ice cream` | `iec cream` | `ok(i) tr#0(c<-e) tr#0(e<-c) ok(␣) ok(c) ok(r) ok(e) ok(a) ok(m)` | 1 | Swap immediately before a space |
| T12 | `letter` | `leter` | `ok(l) ok(e) missing(t) ok(t) ok(e) ok(r)` | **0** | **Repeated letters must NOT report a swap** |
| T13 | `success` | `sucess` | `ok(s) ok(u) missing(c) ok(c) ok(e) ok(s) ok(s)` | **0** | **Repeated letters + omission must NOT report a swap** |
| T14 | `ab` | `ba` | `tr#0(a<-b) tr#0(b<-a)` | 1 | Minimal case: the whole word is one swap |

**T12 and T13 are the negative controls and matter as much as the positives.**
The transposition precondition (`a[i-1] === b[j-2] && a[i-2] === b[j-1]`) is
trivially satisfiable by repeated characters, so an implementation that costs a
transposition at 0, or lets it win ties, will report phantom swaps in words like
`letter` and `success`. If T12 or T13 shows a swap, the tie-break or the
transposition cost is wrong.

### 9.3 Verification status

Both groups were run against the reference implementation in
[§3](#3-the-algorithm) on **2026-08-07**:

- **Legacy (§9.1): 13/13 diff-path vectors pass, byte-identical.** Vectors 1 and
  2 exercise the exact-match path and never reach `computeSpellingDiff`.
  **Adding Damerau transposition changed none of them**, and none produces a
  `transposed` segment. Verified both as the legacy HTML string and via the
  structured output round-tripped through
  [§7.4](#74-legacy-equivalence-rendering).
- **Transposition (§9.2): 14/14 pass**, and all invariants in
  [§2.3](#23-invariants) hold — including reconstruction and the pairing
  invariant — across both groups.
- **Both candidate tie-break placements** ([§3.3](#33-why-transposition-is-evaluated-last-in-the-tie-break))
  preserve all 15 legacy vectors, and agree on **49/49** real-word transposition
  misspellings. Transposition-last was chosen on the grounds set out there, not
  because the alternative regressed.

### 9.4 Expected structured output for the tricky legacy cases

Assert against these directly, not only against the rendered string — the
structured form is what the UI consumes.

> **Shorthand — not valid JSON, do not paste into a fixture.** `{ok,"c"}`
> abbreviates `{ "status": "ok", "char": "c" }`; segments with other statuses are
> written out in full. Expand the `{ok,…}` forms before using this as data.

```text
// #3  ravenous ← "ravenus"   (omitted character)
[ {ok,"r"},{ok,"a"},{ok,"v"},{ok,"e"},{ok,"n"},
  {"status":"missing","char":"o"},
  {ok,"u"},{ok,"s"} ]

// #4  ravenous ← "ravenious"  (extra character)
[ {ok,"r"},{ok,"a"},{ok,"v"},{ok,"e"},{ok,"n"},
  {"status":"extra","char":"","typed":"i"},
  {ok,"o"},{ok,"u"},{ok,"s"} ]

// #5  ravenous ← "ravanous"   (wrong character)
[ {ok,"r"},{ok,"a"},{ok,"v"},
  {"status":"wrong","char":"e","typed":"a"},
  {ok,"n"},{ok,"o"},{ok,"u"},{ok,"s"} ]

// #11 "ice cream" ← "icecream"  (MISSING SPACE — char is a literal space)
[ {ok,"i"},{ok,"c"},{ok,"e"},
  {"status":"missing","char":" "},
  {ok,"c"},{ok,"r"},{ok,"e"},{ok,"a"},{ok,"m"} ]

// #13 "ice cream" ← "ice  cream"  (extra space)
[ {ok,"i"},{ok,"c"},{ok,"e"},{ok," "},
  {"status":"extra","char":"","typed":" "},
  {ok,"c"},{ok,"r"},{ok,"e"},{ok,"a"},{ok,"m"} ]

// #14 "a" ← "b"  (the length-1 special case: forced to insert, NOT substitute)
[ {"status":"missing","char":"a"} ]

// T1  "receive" ← "recieve"  (TRANSPOSITION — two segments, one pairId)
[ {ok,"r"},{ok,"e"},{ok,"c"},
  {"status":"transposed","char":"e","typed":"i","pairId":0},
  {"status":"transposed","char":"i","typed":"e","pairId":0},
  {ok,"v"},{ok,"e"} ]

// T7  "abcd" ← "badc"  (TWO swaps — pairIds 0 and 1, assigned left to right)
[ {"status":"transposed","char":"a","typed":"b","pairId":0},
  {"status":"transposed","char":"b","typed":"a","pairId":0},
  {"status":"transposed","char":"c","typed":"d","pairId":1},
  {"status":"transposed","char":"d","typed":"c","pairId":1} ]
```

### 9.5 Additional tests to write

Beyond the ground-truth vectors:

- **Property: reconstruction.** For random `(typed, correct)` pairs,
  concatenating `char` over non-`extra` segments equals `correct`.
- **Property: the attempt is recoverable.** Concatenating `typed ?? char` over
  non-`missing` segments reproduces the (case-folded) attempt. This is what
  US-D6 depends on.
- **Property: pairing.** Every `pairId` appears on exactly two adjacent
  `transposed` segments whose `char`/`typed` values mirror each other
  (invariant 6), and no non-`transposed` segment carries a `pairId`.
- **Property: determinism.** The same inputs always produce the same output.
- **Property: no phantom swaps.** For any `(typed, correct)` pair whose true
  Damerau distance equals its Levenshtein distance, no `transposed` segment is
  produced. This is T12/T13 generalised.
- **Case folding.** `RAVENOUS` is correct; `RAVANOUS` produces vector 5's diff
  with lowercase output.
- **Whitespace.** `" ravenous "` is correct (trimmed);
  `"raven ous"` is *not* correct and produces an `extra` space segment.
- **Unicode (phase 2).** `résumé` typed as `resume` marks the two accented
  characters and nothing else; `é` as U+0065 U+0301 is *correct* after NFC;
  an emoji or CJK character is never split across segments; two accented
  characters typed in the wrong order report **one** transposition, not two
  wrong letters.
- **Bounds.** A 10 000-character input returns within the budget and does not
  allocate a 10⁸-cell matrix.
- **Multiple answers.** With accepted answers `["colour","color"]`, typing
  `collor` diffs against `color`, not `colour` ([§6](#6-multiple-accepted-answers)).

---

## 10. Refactoring rules

1. **Port first, test, then refactor.** No cleanup of `calcDist` before all 29
   vectors are green.
2. **The tie-break order (`d`, then `s`, then `i`, then `t`, each on strict `<`)
   is behavior, not style.** Any change requires re-verifying every vector in
   [§9](#9-test-contract--ground-truth-vectors) *and* the real-word corpus. The
   reasoning behind the placement of `t` is in
   [§3.3](#33-why-transposition-is-evaluated-last-in-the-tie-break).
3. **Transposition costs exactly 1, never 0 and never `cost`.** Costing it at
   `cost` (which is 0 whenever the characters happen to match) makes repeated
   letters report phantom swaps — T12 and T13 are the guards.
4. **A transposition emits two script entries and two segments.** Collapsing it
   to one breaks the reconstruction invariant and per-character alignment
   ([§2.4](#24-how-a-transposed-pair-is-represented)).
5. **The `script.length === 1 → 'i'` special case is behavior.** It is what makes
   vector 14 render at all. A transposition can never reach it.
6. **The mutate-as-you-go alignment is behavior.** In particular, the `-`
   splice on `'d'` must stay, even though the structured output no longer emits
   that character, and the `'t'` arm must read both typed characters **before**
   swapping.
7. **The algorithm is pure.** No React, no storage, no platform APIs, no i18n
   layer. It takes two strings and returns an array. Keep it in a module that
   can be unit-tested with no test environment beyond a JS runtime.
8. **Optimising memory is fine; changing output is not.** The three matrices can
   become one with packed cells — but note the Damerau recurrence reads
   `dist[i-2][j-2]`, so a two-row rolling optimisation is **no longer valid**;
   at least three rows must be retained. Any optimisation must preserve the
   back-pointer walk and every vector.

---

## 11. Open questions

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | **Should `wrong` and `missing` be visually distinguished, or is that a regression in familiarity** for long-time users who are used to both being plain red? | **Distinguish them.** It is an accessibility requirement (never colour alone) and it is strictly more informative. The change is additive — the correct answer still reads the same way. |
| 2 | **Should there be an "ignore diacritics" setting**, as Anki has (`{{type:nc:}}`)? | **P2, off by default.** An accent is a spelling property, and defaulting to leniency contradicts the product's stance. Worth having for language learners drilling meaning rather than orthography. |
| 3 | **Should the diff be shown for a *correct* answer too** — e.g. confirming a hard word letter by letter? | **No.** Correct is correct; extra ceremony slows the loop. The stored answer is already echoed on success. |
| 4 | **What is the right character cap** ([§8](#8-performance--bounds))? 256 is a guess. | **256 per side**, revisited if any real card legitimately exceeds it. Cards are words and short phrases. |
| 5 | **Grapheme segmentation on Hermes** — is `Intl.Segmenter` polyfillable at acceptable bundle cost, or do we accept code-point iteration? | Attempt the polyfill; if the cost is unreasonable, ship code-point iteration and **document the combining-sequence limitation** in this file rather than leaving it implicit. Either way, verify on a physical device. |
| 6 | **Should a *non-adjacent* swap be detected** — e.g. `casual` typed as `causal`, where the swapped letters are not neighbours? Restricted Damerau only sees adjacent pairs. | **No, and not later either.** Adjacent swaps are the overwhelming majority of real transposition errors, and non-adjacent detection needs the unrestricted variant plus an alphabet table, for alignments that read *worse* to a human. *(Note `casual`/`causal` **is** adjacent — `su`→`us` — and is detected today; the genuinely non-adjacent cases are rare.)* |
| 7 | **Should a transposed pair count as one error or two** in the trouble-word aggregation ([CAP-16](./capability-spec.md#cap-16--trouble-words--error-insights-p1--differentiator))? | **One.** It is one mistake the user made, one mark on the page, and one thing to learn. Counting it as two would over-weight swaps in the trouble-pattern ranking — and "you keep swapping *ei*" is exactly the kind of pattern that feature exists to surface. |
| 8 | **Does the transpose mark survive being read letter-by-letter aloud** ([§7.3](#73-screen-reader-announcement))? "You swapped e and i" is unambiguous for a pair, but a double swap produces two such phrases. | **Acceptable as specified.** Announce each pair separately, in order, under the same three-error cap as every other kind. Revisit only if testing with real screen-reader users shows confusion. |
