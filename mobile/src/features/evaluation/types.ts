/**
 * Public contract for CAP-4 — Answer Evaluation & Spelling Diff.
 *
 * Normative source: `documentation/spelling-diff-spec.md` §2 ("The contract").
 * The shapes here are that document's, expressed in code. Nothing in this file
 * may drift from it without the spec being updated first.
 */

/** What happened at one position of the correct answer. */
export type DiffStatus =
  | 'ok' // the user typed this character correctly
  | 'wrong' // the user typed a different character here
  | 'missing' // the user omitted this character entirely
  | 'extra' // the user typed a character that does not belong here
  | 'transposed'; // this character and its neighbour were swapped

/**
 * One position of the correct answer (or one surplus character the user typed).
 *
 * `char` may be a multi-code-unit grapheme cluster — the algorithm operates on
 * user-perceived characters, not UTF-16 code units
 * (spelling-diff-spec.md §5). A renderer must treat it as one opaque cell and
 * must never index into it.
 */
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
   * adjacency alone cannot tell (0,1)(2,3) from (1,2).
   * See spelling-diff-spec.md §2.4.
   */
  pairId?: number;
}

/** The full result of evaluating one submitted answer. */
export interface AnswerEvaluation {
  correct: boolean;
  /** The accepted answer the attempt was scored against (diff spec §6). */
  matchedAnswer: string;
  /** Empty when `correct` is true, or when `diffOmitted` is true. */
  diff: DiffSegment[];
  /**
   * True when the attempt was wrong but either side exceeded
   * {@link DIFF_LENGTH_CAP}, so no character marking was computed
   * (spelling-diff-spec.md §8 — bounded input).
   *
   * **Extension beyond spelling-diff-spec.md §2.1.** The spec requires the
   * fall-back behaviour but does not say how it is signalled; an empty `diff`
   * on an incorrect answer would otherwise be indistinguishable from a bug and
   * would contradict invariant 3. CAP-5 branches on this to show the plain
   * "not quite" state instead of a strip.
   */
  diffOmitted: boolean;
}

/** Options controlling how an attempt is compared to an accepted answer. */
export interface EvaluationOptions {
  /**
   * When true, `Ravenous` does NOT match `ravenous`.
   * Default false — matches the legacy app and CAP-10's default ("Ignore case").
   */
  caseSensitive?: boolean;
}

/**
 * Maximum number of grapheme clusters per side that will be character-diffed.
 *
 * spelling-diff-spec.md §8 / capability-spec open question 8. Beyond this the
 * O(n·m) matrices get large enough to stall the UI thread, so evaluation
 * degrades to a plain "incorrect" with no marking. Stored data is never
 * truncated — this bounds the diff only.
 */
export const DIFF_LENGTH_CAP = 256;
