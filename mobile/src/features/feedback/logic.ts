/**
 * CAP-5 — pure presentation decisions for the spelling feedback.
 *
 * Everything here is data-to-data: grouping transposed pairs, summarising the
 * errors for the screen-reader announcement, and spelling the correct answer
 * out letter by letter. The rendering itself lives in `components/`.
 *
 * Normative contract: `documentation/spelling-diff-spec.md` §7.
 */

import type { DiffSegment } from '@/features/evaluation/types';

/**
 * How many errors the announcement enumerates before collapsing the rest into
 * "and N more".
 *
 * A wildly wrong answer must not produce a minute of speech
 * (spelling-diff-spec.md §7.3).
 */
export const ANNOUNCEMENT_ERROR_CAP = 3;

/**
 * One error, described in the terms the announcement needs.
 *
 * Deliberately a **structured descriptor**, not a sentence: the sentence is an
 * ICU message assembled in the component, so grammar and word order can vary by
 * language. Nothing here is ever concatenated into prose.
 */
export type DiffErrorDescriptor =
  | { kind: 'missing'; char: string }
  | { kind: 'missingSpace' }
  | { kind: 'wrong'; char: string; typed: string }
  | { kind: 'extra'; typed: string }
  | { kind: 'extraSpace' }
  /**
   * One swap, **not two wrong letters**. `first` and `second` are the two
   * characters in the **correct** order, per spelling-diff-spec.md §7.3.
   */
  | { kind: 'transposed'; first: string; second: string };

/** The announcement's error list, capped. */
export interface DiffErrorSummary {
  /** At most {@link ANNOUNCEMENT_ERROR_CAP} descriptors, in reading order. */
  errors: DiffErrorDescriptor[];
  /** How many further errors were omitted. Zero when nothing was cut. */
  more: number;
}

/**
 * One rendering column, resolved from a {@link DiffSegment}.
 *
 * `pairPosition` is derived by **grouping on `pairId`, never on adjacency** —
 * two consecutive swaps produce four consecutive `transposed` segments and
 * adjacency alone cannot tell `(0,1)(2,3)` from `(1,2)`.
 */
export interface DiffColumn {
  segment: DiffSegment;
  /** The segment's index in the original diff. */
  index: number;
  /** Which half of a swap this is, or null when it is not a transposition. */
  pairPosition: 'first' | 'second' | null;
  /**
   * True on the first column of a pair — the one that owns the ribbon, so a
   * single stroke spans two cells rather than two half-strokes meeting at a
   * seam.
   */
  ownsRibbon: boolean;
}

/**
 * Resolve a diff into rendering columns, grouping transposed pairs by `pairId`.
 *
 * @param diff The diff to resolve.
 * @returns One column per segment, in order.
 */
export function toColumns(diff: readonly DiffSegment[]): DiffColumn[] {
  const seen = new Set<number>();
  return diff.map((segment, index) => {
    if (segment.status !== 'transposed' || segment.pairId === undefined) {
      return { segment, index, pairPosition: null, ownsRibbon: false };
    }
    const isFirst = !seen.has(segment.pairId);
    seen.add(segment.pairId);
    return {
      segment,
      index,
      pairPosition: isFirst ? 'first' : 'second',
      ownsRibbon: isFirst,
    };
  });
}

/**
 * Summarise a diff's errors for the screen-reader announcement.
 *
 * Grouped by kind in reading order, with **a transposed pair counted as one
 * error** — both for the wording and for the cap, matching how it is rendered
 * and how a person would describe it.
 *
 * @param diff The diff to summarise.
 * @param cap How many errors to enumerate before collapsing the rest.
 * @returns The capped error list and the number omitted.
 */
export function summarizeDiff(
  diff: readonly DiffSegment[],
  cap: number = ANNOUNCEMENT_ERROR_CAP,
): DiffErrorSummary {
  const all: DiffErrorDescriptor[] = [];
  const pairedSecondHalves = new Set<number>();

  diff.forEach((segment, index) => {
    switch (segment.status) {
      case 'ok':
        return;
      case 'missing':
        all.push(segment.char === ' ' ? { kind: 'missingSpace' } : { kind: 'missing', char: segment.char });
        return;
      case 'wrong':
        all.push({ kind: 'wrong', char: segment.char, typed: segment.typed ?? '' });
        return;
      case 'extra':
        all.push(segment.typed === ' ' ? { kind: 'extraSpace' } : { kind: 'extra', typed: segment.typed ?? '' });
        return;
      case 'transposed': {
        if (segment.pairId === undefined || pairedSecondHalves.has(index)) return;
        // Find this pair's other half by pairId, not by assuming index + 1.
        const otherIndex = diff.findIndex(
          (candidate, candidateIndex) =>
            candidateIndex !== index &&
            candidate.status === 'transposed' &&
            candidate.pairId === segment.pairId,
        );
        if (otherIndex === -1) return;
        pairedSecondHalves.add(otherIndex);
        // Named in the order the USER TYPED them, not the correct order:
        // "you swapped the i and the e" describes what they actually did.
        // Kevin's decision, 2026-08-09, resolving a contradiction between
        // design/spec.md §3.2.7 (typed order — this) and the older wording in
        // spelling-diff-spec.md §7.3 (correct order); the spec has been
        // corrected to match. On a `transposed` segment, `typed` is the other
        // half of the pair, so reading `typed` left to right yields the
        // sequence the user entered.
        all.push({
          kind: 'transposed',
          first: segment.typed ?? segment.char,
          second: diff[otherIndex].typed ?? diff[otherIndex].char,
        });
        return;
      }
    }
  });

  return { errors: all.slice(0, cap), more: Math.max(0, all.length - cap) };
}

/**
 * Split the correct answer into runs of characters separated by spaces.
 *
 * The announcement spells the answer letter by letter — reading "ravenous" as a
 * word tells a screen-reader user nothing about spelling — and names each space
 * explicitly, because a missing space is one of the errors it must be able to
 * describe.
 *
 * @param diff The diff whose correct answer to spell.
 * @returns One entry per space-delimited run; each entry is that run's
 *          characters, in order. Empty runs (from adjacent spaces) are kept, so
 *          the caller can render "space, space" faithfully.
 */
export function spellOutRuns(diff: readonly DiffSegment[]): string[][] {
  const runs: string[][] = [[]];
  for (const segment of diff) {
    if (segment.status === 'extra') continue; // no character of the answer here
    if (segment.char === ' ') runs.push([]);
    else runs[runs.length - 1].push(segment.char);
  }
  return runs;
}
