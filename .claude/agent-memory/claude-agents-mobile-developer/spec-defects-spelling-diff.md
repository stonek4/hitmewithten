---
name: spec-defects-spelling-diff
description: Two properties in spelling-diff-spec.md §9.5 are provably over-stated; the spec's own reference implementation violates them too. Do not "fix" the code to satisfy them.
metadata:
  type: project
---

`documentation/spelling-diff-spec.md` §9.5 lists two properties that are **false
as written**. Verified 2026-08-08 by running the spec's *own* reference listing
(extracted per its §1.2 recipe) over every string pair on `{a,b,c}` up to
length 4 (14 400 pairs). The app's implementation and the spec's reference
agree byte-for-byte on all of them.

1. **"The attempt is recoverable"** — concatenating `typed ?? char` over
   non-`missing` segments reproduces the case-folded attempt. Broken by the
   `script.length === 1 → 'i'` special case in §3.1 (which §10 rule 5 pins as
   *behaviour* and which vector 14 depends on): `a` typed as `b` yields a single
   `missing` segment carrying no record of `b`. **6 violations**, all of them
   one-character answers.
2. **"No phantom swaps"** — "for any pair whose Damerau distance equals its
   Levenshtein distance, no `transposed` segment is produced." False: the
   tie-break is applied **per matrix cell**, not per whole alignment, so a
   transposition can strictly improve locally while the two global distances tie
   via a different route. `ab` typed as `baa` is the minimal case (both
   distances 2, a swap is reported, correctly). **324 violations.**

   The property the negative controls (T12/T13) actually generalise to, and
   which *is* true: **a reported swap always names two distinct characters**
   (`char !== typed`). Measured 0 violations. Because a transposition costs
   exactly 1, it can never strictly improve on a free substitution, so a "swap"
   of a character with itself is unreachable by construction.

**Why:** these were found while building CAP-4 and cost a real debugging detour
— the instinct on a red property test is to assume the implementation is wrong.
It was not.

**How to apply:** if a property test in
`src/features/evaluation/logic.test.ts` around these two ideas ever goes red,
check `specConformance.test.ts` first — it differentially compares the app
against the spec's extracted reference. If the two still agree, the spec is
wrong, not the code. Both defects are pinned by explicit `SPEC DEFECT pin` tests
so they cannot silently widen. **Reported to Kevin, not patched into the spec**
(`documentation/` is owned by the product/design stages).

Related: [[vocab-cards-layout]]
