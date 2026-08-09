/**
 * CAP-4 — Answer Evaluation & Spelling Diff.
 *
 * **This is the most important module in the project and it is deliberately a
 * pure leaf.** No React, no storage, no platform APIs, no i18n, no logging:
 * strings in, data out. Its normative contract is
 * `documentation/spelling-diff-spec.md`, and every rule below cites the section
 * it implements.
 *
 * Three details are **load-bearing behaviour, not style**, and must not be
 * "cleaned up" (spelling-diff-spec.md §10):
 *
 * 1. The tie-break order in the distance matrix is `delete → substitute →
 *    insert → transposition`, each winning only on a strict `<`.
 * 2. The marking loop mutates working copies of both strings as it walks, so
 *    index `i` stays aligned across them.
 * 3. A one-operation script is forced to `insert`.
 *
 * Departure from the legacy app, deliberately approved: adjacent transpositions
 * are detected (restricted Damerau–Levenshtein / optimal string alignment), so
 * `receive` typed as `recieve` is one error rather than two wrong letters
 * (spelling-diff-spec.md §1.1). All 15 production vectors pass unchanged.
 */

import { foldCase, normalizeText, toGraphemes } from '@/lib/text';

import { DIFF_LENGTH_CAP } from './types';
import type { AnswerEvaluation, DiffSegment, EvaluationOptions } from './types';

/**
 * One edit operation in the script:
 *   'n' no change · 's' substitute · 'i' insert (the user omitted a character)
 *   'd' delete (the user typed a surplus character) · 't' adjacent transposition
 *
 * Internal to the algorithm — it is not part of the public contract, which is
 * `DiffSegment[]`.
 */
type EditOp = 'n' | 's' | 'i' | 'd' | 't';

/**
 * Compute the edit script transforming what the user typed into the correct
 * answer, using minimum edit distance with a specific, load-bearing tie-break.
 *
 * Variant: **Damerau–Levenshtein, restricted (optimal string alignment)** — a
 * transposition is available only when the two characters are adjacent in both
 * strings, and no substring is edited more than once.
 *
 * @param a What the user typed, as case-folded grapheme clusters.
 * @param b The correct answer, as case-folded grapheme clusters.
 * @returns One operation per aligned position: 'n' | 's' | 'i' | 'd' | 't',
 *          where 't' is always emitted as two consecutive entries.
 */
function calcDist(a: readonly string[], b: readonly string[]): EditOp[] {
  const n = a.length;
  const m = b.length;
  const dist: number[][] = [];
  const edits: EditOp[][] = [];
  const paths: ([number, number] | null)[][] = [];

  for (let i = 0; i <= n; i++) {
    dist.push(new Array<number>(m + 1).fill(0));
    edits.push(new Array<EditOp>(m + 1).fill('n'));
    paths.push(new Array<[number, number] | null>(m + 1).fill(null));
  }

  // Row 0 is all inserts (the user omitted everything);
  // column 0 is all deletes (the user typed characters that don't exist).
  for (let i = 0; i <= n; i++) {
    dist[i][0] = i;
    edits[i][0] = 'd';
    if (i > 0) paths[i][0] = [i - 1, 0];
  }
  for (let j = 0; j <= m; j++) {
    dist[0][j] = j;
    edits[0][j] = 'i';
    if (j > 0) paths[0][j] = [0, j - 1];
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      // ---- TIE-BREAK ORDER IS LOAD-BEARING ----
      // delete is considered first, then substitute, then insert, then
      // transposition, and each later candidate only wins on a STRICT
      // improvement (`<`, never `<=`). Changing this order, or relaxing the
      // comparison, changes which character gets marked on ties and produces
      // visibly different output. Transposition is LAST so that on a tie the
      // simpler explanation wins — asserting a swap we cannot evidence teaches
      // the user something we do not know (spelling-diff-spec.md §3.3).
      let best = dist[i - 1][j] + 1;
      let op: EditOp = 'd';
      let prev: [number, number] = [i - 1, j];

      const sub = dist[i - 1][j - 1] + cost;
      if (sub < best) {
        best = sub;
        op = 's';
        prev = [i - 1, j - 1];
      }

      const ins = dist[i][j - 1] + 1;
      if (ins < best) {
        best = ins;
        op = 'i';
        prev = [i, j - 1];
      }

      // Adjacent transposition (Damerau, restricted/OSA). Available only when
      // the two characters are swapped with respect to each other, and costed
      // as ONE edit — never 0, never `cost`. A genuine swap costs 1 here versus
      // 2 as a pair of substitutions, so it wins on a strict improvement and
      // never needs to win a tie. Costing it at `cost` would make repeated
      // letters ("letter", "success") report phantom swaps.
      const canTranspose = i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
      if (canTranspose) {
        const tr = dist[i - 2][j - 2] + 1;
        if (tr < best) {
          best = tr;
          op = 't';
          prev = [i - 2, j - 2];
        }
      }

      dist[i][j] = best;
      edits[i][j] = op;
      paths[i][j] = prev;
    }
  }

  // Walk the back-pointers from the bottom-right to the origin, building the
  // script front-to-back. A step where the distance did not change is 'n'.
  const script: EditOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const step = paths[i][j];
    /* istanbul ignore next -- unreachable: every reachable cell has a path */
    if (step === null) break;
    const [pi, pj] = step;
    if (edits[i][j] === 't' && pi === i - 2 && pj === j - 2) {
      // One transposition spans TWO positions of the correct answer, so it
      // contributes two script entries. Both are unshifted together, keeping
      // them adjacent and in order.
      script.unshift('t', 't');
    } else {
      script.unshift(dist[pi][pj] === dist[i][j] ? 'n' : edits[i][j]);
    }
    i = pi;
    j = pj;
  }

  // Special case, preserved verbatim from v0.2.0: a single-operation script is
  // forced to 'insert'. Without it, a one-character answer typed as a different
  // single character renders as nothing at all (ground-truth vector 14). A
  // transposition always yields at least two entries, so it can never reach
  // this branch.
  if (script.length === 1) script[0] = 'i';

  return script;
}

/**
 * Compute the minimum edit distance between two cluster arrays, under the same
 * restricted Damerau–Levenshtein recurrence {@link calcDist} uses.
 *
 * Only the scalar distance is produced — no script, no back-pointers — because
 * its one caller (nearest-candidate selection, spelling-diff-spec.md §6) needs
 * a number and nothing else.
 *
 * @param a One cluster array, case-folded.
 * @param b The other cluster array, case-folded.
 * @returns The edit distance, counting an adjacent transposition as one edit.
 */
function editDistance(a: readonly string[], b: readonly string[]): number {
  const n = a.length;
  const m = b.length;
  // Three rows must be retained: the Damerau recurrence reads dist[i-2][j-2],
  // so the usual two-row rolling optimisation is not valid here.
  const rows: number[][] = [];
  for (let i = 0; i <= n; i++) rows.push(new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) rows[i][0] = i;
  for (let j = 0; j <= m; j++) rows[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(rows[i - 1][j] + 1, rows[i - 1][j - 1] + cost, rows[i][j - 1] + 1);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, rows[i - 2][j - 2] + 1);
      }
      rows[i][j] = best;
    }
  }
  return rows[n][m];
}

/**
 * Compute the character-level difference between what the user typed and the
 * correct answer, as a renderable structure.
 *
 * The returned array has one segment per position of the correct answer, plus
 * one `extra` segment per surplus character the user typed. It is **data, never
 * markup** — which is what eliminates by construction the stored-XSS present in
 * the legacy app.
 *
 * Callers are responsible for bounding the input: this is O(n·m) in time and
 * space. {@link evaluateAnswer} applies {@link DIFF_LENGTH_CAP}.
 *
 * @param typed Exactly what the user submitted, after trimming leading and
 *              trailing whitespace. Internal whitespace is significant.
 * @param correct The accepted answer, in its stored casing.
 * @param options Comparison options; `caseSensitive` defaults to false.
 * @returns A segment per position of the correct answer, plus one `extra`
 *          segment per surplus character the user typed.
 */
export function computeSpellingDiff(
  typed: string,
  correct: string,
  options: EvaluationOptions = {},
): DiffSegment[] {
  const fold = options.caseSensitive !== true;

  // Segment into user-perceived characters and fold per cluster, so folding can
  // never change the array length and desynchronise the two sides. (Folding the
  // whole string first can: some characters lowercase to more than one.)
  const typedClusters = toGraphemes(normalizeText(typed));
  const correctClusters = toGraphemes(normalizeText(correct));
  const foldedTyped = fold ? typedClusters.map(foldCase) : typedClusters;
  const foldedCorrect = fold ? correctClusters.map(foldCase) : correctClusters;

  const script = calcDist(foldedTyped, foldedCorrect);

  const inp = foldedTyped.slice(); // working copy of the user's attempt
  const act = correctClusters.slice(); // working copy of the answer, in STORED casing
  const segments: DiffSegment[] = [];
  let nextPairId = 0; // pairs `transposed` segments; see spec §2.4

  for (let i = 0; i < script.length; i++) {
    switch (script[i]) {
      case 'n':
        segments.push({ status: 'ok', char: act[i] });
        break;

      case 'd': {
        // The user typed a character that doesn't belong. Pad the answer at
        // this position so subsequent indices stay aligned. The padding
        // character is never emitted — but removing the splice silently
        // corrupts every segment after the first extra character.
        const surplus = inp[i];
        act.splice(i, 0, '-');
        segments.push({ status: 'extra', char: '', typed: surplus });
        break;
      }

      case 'i': {
        // The user omitted this character. Splice it into the working attempt.
        const c = act[i];
        inp.splice(i, 0, c);
        segments.push({ status: 'missing', char: c });
        break;
      }

      case 's': {
        // The user typed the wrong character here. Substitute the correct one
        // into the working attempt.
        const c = act[i];
        const wrong = inp[i];
        inp.splice(i, 1, c);
        segments.push({ status: 'wrong', char: c, typed: wrong });
        break;
      }

      case 't': {
        // Adjacent transposition. calcDist always emits 't' as a PAIR of
        // consecutive entries, so this arm handles both positions and then
        // advances the loop past the second one.
        //
        // Capture BOTH typed characters before mutating `inp`: reading
        // inp[i + 1] after the swap returns the already-corrected character and
        // produces two segments that both claim the same `typed` value —
        // breaking the pairing invariant in a way that still renders plausibly.
        const first = inp[i]; // what the user typed at i     (= act[i + 1])
        const second = inp[i + 1]; // what the user typed at i + 1 (= act[i])
        inp.splice(i, 2, second, first);

        const id = nextPairId++;
        segments.push({ status: 'transposed', char: act[i], typed: first, pairId: id });
        segments.push({ status: 'transposed', char: act[i + 1], typed: second, pairId: id });

        i++; // consume the paired second 't'
        break;
      }
    }
  }

  return segments;
}

/**
 * Whether a trimmed attempt matches an accepted answer exactly.
 *
 * Comparison rules (spelling-diff-spec.md §4.1): NFC-normalised both sides,
 * case folded unless `caseSensitive`, **internal whitespace exactly
 * significant** (`ice cream` ≠ `icecream` ≠ `ice  cream`), punctuation and
 * accents significant.
 *
 * @param trimmedTyped The attempt, already trimmed.
 * @param candidate One accepted answer, in stored casing.
 * @param options Comparison options; `caseSensitive` defaults to false.
 * @returns True when the attempt is accepted as correct.
 */
function matches(trimmedTyped: string, candidate: string, options: EvaluationOptions): boolean {
  const a = normalizeText(trimmedTyped);
  const b = normalizeText(candidate);
  return options.caseSensitive === true ? a === b : foldCase(a) === foldCase(b);
}

/**
 * Evaluate one submitted answer against a card's accepted answers.
 *
 * A card with a single accepted answer is the degenerate case of the general
 * rule, so this is the only evaluation entry point the app uses.
 *
 * Selection rule when nothing matches (spelling-diff-spec.md §6): score against
 * the candidate with the **lowest edit distance** to what was typed, ties going
 * to the first declared. Marking `collor` against `colour` when `color` is also
 * accepted would tell the user they are missing a `u` they never needed.
 *
 * @param typed Exactly what the user submitted; leading and trailing
 *              whitespace is trimmed here, internal whitespace is preserved.
 * @param acceptedAnswers The card's accepted answers, in the author's declared
 *                        order. Must contain at least one entry.
 * @param options Comparison options; `caseSensitive` defaults to false.
 * @returns The evaluation: correctness, the answer scored against, and the
 *          diff (empty when correct or when over the length cap).
 * @throws {RangeError} If `acceptedAnswers` is empty — a card with no accepted
 *         answer cannot be graded, and silently passing or failing it would
 *         both be wrong.
 */
export function evaluateAnswer(
  typed: string,
  acceptedAnswers: readonly string[],
  options: EvaluationOptions = {},
): AnswerEvaluation {
  if (acceptedAnswers.length === 0) {
    throw new RangeError('evaluateAnswer requires at least one accepted answer');
  }

  const trimmed = typed.trim();

  for (const candidate of acceptedAnswers) {
    if (matches(trimmed, candidate, options)) {
      return { correct: true, matchedAnswer: candidate, diff: [], diffOmitted: false };
    }
  }

  const fold = options.caseSensitive !== true;
  const typedClusters = toGraphemes(normalizeText(trimmed));
  const foldedTyped = fold ? typedClusters.map(foldCase) : typedClusters;

  let best = acceptedAnswers[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of acceptedAnswers) {
    const clusters = toGraphemes(normalizeText(candidate));
    const distance = editDistance(foldedTyped, fold ? clusters.map(foldCase) : clusters);
    // Strict `<` keeps the FIRST declared candidate on a tie, so the card
    // author controls the primary answer and the result is deterministic.
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  // Bounded input (spelling-diff-spec.md §8). Beyond the cap the O(n·m)
  // matrices get big enough to stall the UI thread, so we degrade to a plain
  // "incorrect" rather than moving the work off-thread — a delayed diff breaks
  // the feedback loop, which is worse than no diff at all.
  const correctClusterCount = toGraphemes(normalizeText(best)).length;
  if (typedClusters.length > DIFF_LENGTH_CAP || correctClusterCount > DIFF_LENGTH_CAP) {
    return { correct: false, matchedAnswer: best, diff: [], diffOmitted: true };
  }

  return {
    correct: false,
    matchedAnswer: best,
    diff: computeSpellingDiff(trimmed, best, options),
    diffOmitted: false,
  };
}
