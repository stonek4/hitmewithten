/**
 * CAP-4 characterization and property tests.
 *
 * The 29 ground-truth vectors live in `vectors.json` and are shared with
 * `scripts/verify-diff-spec.mjs`, which runs the *spec's own* reference listing
 * against them. This file runs the *app's* implementation against the same
 * data, so a divergence between the two is impossible to miss.
 */

import { computeSpellingDiff, evaluateAnswer } from './logic';
import { renderLegacyHtml } from './legacyRender';
import { DIFF_LENGTH_CAP } from './types';
import type { DiffSegment } from './types';
import vectors from './vectors.json';

/** One legacy ground-truth vector as stored in `vectors.json`. */
interface LegacyVector {
  id: string;
  correct: string;
  typed: string;
  exactMatch: boolean;
  legacyHtml?: string;
  exercises: string;
}

/** One transposition or structured vector as stored in `vectors.json`. */
interface SegmentVector {
  id: string;
  correct: string;
  typed: string;
  swaps?: number;
  exercises?: string;
  segments: DiffSegment[];
}

const legacyVectors = vectors.legacy as LegacyVector[];
const transpositionVectors = vectors.transposition as SegmentVector[];
const structuredVectors = vectors.structured as SegmentVector[];

/**
 * Strip `undefined` optional keys so a segment compares equal to the vector's
 * plain-JSON form regardless of how the optional properties were spelled.
 *
 * @param segments The segments to canonicalise.
 * @returns Plain objects carrying only the keys that are actually set.
 */
function canon(segments: readonly DiffSegment[]): DiffSegment[] {
  return segments.map((s) => {
    const out: DiffSegment = { status: s.status, char: s.char };
    if (s.typed !== undefined) out.typed = s.typed;
    if (s.pairId !== undefined) out.pairId = s.pairId;
    return out;
  });
}

/**
 * Count the distinct transposition pairs in a diff.
 *
 * @param diff The diff to inspect.
 * @returns The number of distinct `pairId` values present.
 */
function swapCount(diff: readonly DiffSegment[]): number {
  return new Set(diff.filter((s) => s.pairId !== undefined).map((s) => s.pairId)).size;
}

/**
 * Plain Levenshtein distance over code points — no transposition.
 *
 * Used only as an oracle for the "no phantom swaps" property: where a swap buys
 * nothing, none may be reported.
 *
 * @param a One string.
 * @param b The other string.
 * @returns The Levenshtein edit distance.
 */
function levenshtein(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  const d: number[][] = Array.from({ length: x.length + 1 }, () =>
    new Array<number>(y.length + 1).fill(0),
  );
  for (let i = 0; i <= x.length; i++) d[i][0] = i;
  for (let j = 0; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
    }
  }
  return d[x.length][y.length];
}

/**
 * Restricted Damerau–Levenshtein distance over code points.
 *
 * The second half of the "no phantom swaps" oracle.
 *
 * @param a One string.
 * @param b The other string.
 * @returns The optimal-string-alignment edit distance.
 */
function damerau(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  const d: number[][] = Array.from({ length: x.length + 1 }, () =>
    new Array<number>(y.length + 1).fill(0),
  );
  for (let i = 0; i <= x.length; i++) d[i][0] = i;
  for (let j = 0; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      let best = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) {
        best = Math.min(best, d[i - 2][j - 2] + 1);
      }
      d[i][j] = best;
    }
  }
  return d[x.length][y.length];
}

/**
 * Enumerate every string over an alphabet up to a maximum length, including the
 * empty string.
 *
 * @param alphabet The characters to draw from.
 * @param maxLength The longest string to generate.
 * @returns Every string of length 0..maxLength, in generation order.
 */
function enumerateStrings(alphabet: readonly string[], maxLength: number): string[] {
  let level: string[] = [''];
  const all: string[] = [''];
  for (let n = 0; n < maxLength; n++) {
    const next: string[] = [];
    for (const prefix of level) for (const c of alphabet) next.push(prefix + c);
    all.push(...next);
    level = next;
  }
  return all;
}

// ── §9.1 Legacy vectors — captured from production ──────────────────────────

describe('CAP-4 §9.1 — the 15 legacy vectors (ground truth from production)', () => {
  it.each(legacyVectors.filter((v) => v.exactMatch).map((v) => [v.id, v] as const))(
    'vector %s takes the exact-match path and never reaches the diff',
    (_id, v) => {
      const result = evaluateAnswer(v.typed, [v.correct]);
      expect(result.correct).toBe(true);
      // The stored casing is echoed, never the user's.
      expect(result.matchedAnswer).toBe(v.correct);
      expect(result.diff).toEqual([]);
    },
  );

  it.each(legacyVectors.filter((v) => !v.exactMatch).map((v) => [v.id, v] as const))(
    'vector %s renders byte-identically to v0.2.0',
    (_id, v) => {
      const diff = computeSpellingDiff(v.typed, v.correct);
      expect(renderLegacyHtml(diff)).toBe(v.legacyHtml);
    },
  );

  it('adding transposition changed none of them — no legacy vector produces a swap', () => {
    for (const v of legacyVectors.filter((x) => !x.exactMatch)) {
      const diff = computeSpellingDiff(v.typed, v.correct);
      expect({ id: v.id, swaps: swapCount(diff) }).toEqual({ id: v.id, swaps: 0 });
    }
  });
});

// ── §9.2 Transposition vectors — specified behaviour ────────────────────────

describe('CAP-4 §9.2 — the 14 transposition vectors', () => {
  it.each(transpositionVectors.map((v) => [v.id, v] as const))(
    '%s produces the specified segments',
    (_id, v) => {
      expect(canon(computeSpellingDiff(v.typed, v.correct))).toEqual(v.segments);
    },
  );

  it.each(transpositionVectors.map((v) => [v.id, v] as const))(
    '%s reports exactly the specified number of swaps',
    (_id, v) => {
      expect(swapCount(computeSpellingDiff(v.typed, v.correct))).toBe(v.swaps);
    },
  );

  it('T7 double swap: four consecutive transposed segments carry TWO distinct pairIds', () => {
    // The case adjacency cannot disambiguate — this is why presenters must
    // group by pairId (spec §2.4).
    const diff = computeSpellingDiff('badc', 'abcd');
    expect(diff.map((s) => s.pairId)).toEqual([0, 0, 1, 1]);
  });

  it('T12/T13 negative controls: doubled letters report no swap at all', () => {
    for (const [typed, correct] of [
      ['leter', 'letter'],
      ['sucess', 'success'],
      ['commitee', 'committee'],
    ] as const) {
      const diff = computeSpellingDiff(typed, correct);
      expect({ correct, transposed: diff.filter((s) => s.status === 'transposed').length }).toEqual({
        correct,
        transposed: 0,
      });
    }
  });
});

// ── §9.4 Structured output for the tricky cases ─────────────────────────────

describe('CAP-4 §9.4 — expected structured output', () => {
  it.each(structuredVectors.map((v) => [v.id, v] as const))(
    'vector %s matches the documented DiffSegment[]',
    (_id, v) => {
      expect(canon(computeSpellingDiff(v.typed, v.correct))).toEqual(v.segments);
    },
  );

  it('vector 11 marks the missing space as a segment whose char is a literal space', () => {
    // The single easiest requirement in the project to lose in a rewrite.
    const diff = computeSpellingDiff('icecream', 'ice cream');
    const spaceSegments = diff.filter((s) => s.char === ' ' && s.status !== 'ok');
    expect(spaceSegments).toEqual([{ status: 'missing', char: ' ' }]);
  });

  it('vector 14 forces a one-operation script to insert, not substitute', () => {
    expect(canon(computeSpellingDiff('b', 'a'))).toEqual([{ status: 'missing', char: 'a' }]);
  });
});

// ── §2.3 Invariants, checked across every vector ────────────────────────────

describe('CAP-4 §2.3 — invariants hold across all 29 vectors', () => {
  const all = [
    ...legacyVectors.filter((v) => !v.exactMatch),
    ...transpositionVectors,
    ...structuredVectors,
  ];

  it.each(all.map((v) => [v.id, v] as const))(
    '%s: concatenating char over non-extra segments reproduces the correct answer',
    (_id, v) => {
      const diff = computeSpellingDiff(v.typed, v.correct);
      const rebuilt = diff
        .filter((s) => s.status !== 'extra')
        .map((s) => s.char)
        .join('');
      expect(rebuilt).toBe(v.correct);
    },
  );

  it.each(all.map((v) => [v.id, v] as const))(
    '%s: every extra segment has char === "" and a typed value',
    (_id, v) => {
      for (const s of computeSpellingDiff(v.typed, v.correct)) {
        if (s.status === 'extra') {
          expect(s.char).toBe('');
          expect(typeof s.typed).toBe('string');
        }
      }
    },
  );

  it.each(all.map((v) => [v.id, v] as const))('%s: a wrong answer never diffs to all-ok', (_id, v) => {
    const diff = computeSpellingDiff(v.typed, v.correct);
    expect(diff.some((s) => s.status !== 'ok')).toBe(true);
  });

  it.each(all.map((v) => [v.id, v] as const))(
    '%s: pairIds come in exactly two adjacent mirror-image transposed segments',
    (_id, v) => {
      const diff = computeSpellingDiff(v.typed, v.correct);
      const byPair = new Map<number, number[]>();
      diff.forEach((s, index) => {
        if (s.pairId === undefined) return;
        expect(s.status).toBe('transposed');
        byPair.set(s.pairId, [...(byPair.get(s.pairId) ?? []), index]);
      });
      for (const indices of byPair.values()) {
        expect(indices).toHaveLength(2);
        const [p, q] = indices;
        expect(q).toBe(p + 1);
        expect(diff[p].char).toBe(diff[q].typed);
        expect(diff[q].char).toBe(diff[p].typed);
      }
    },
  );
});

// ── §9.5 Properties ─────────────────────────────────────────────────────────

describe('CAP-4 §9.5 — properties over an exhaustive small corpus', () => {
  // Every string over {a,b,c} up to length 4 against every other: 14 641 pairs.
  // Small enough to run in a second, dense enough to hit every tie-break arm.
  const corpus = enumerateStrings(['a', 'b', 'c'], 4);

  it('reconstruction holds for every pair', () => {
    const broken: string[] = [];
    for (const correct of corpus) {
      for (const typed of corpus) {
        if (correct === typed || correct === '') continue;
        const rebuilt = computeSpellingDiff(typed, correct)
          .filter((s) => s.status !== 'extra')
          .map((s) => s.char)
          .join('');
        if (rebuilt !== correct) broken.push(`${JSON.stringify(correct)} <- ${JSON.stringify(typed)}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('the user attempt is recoverable from the diff (US-D6), except in the length-1 special case', () => {
    // SPEC DEFECT — §9.5 property 2 is stated without exception, but §3.1's
    // `script.length === 1 → 'i'` special case (which §10 rule 5 pins as
    // behaviour, and which vector 14 depends on) necessarily breaks it: a
    // single wrong character becomes one `missing` segment, and a `missing`
    // segment carries no record of what the user typed. Reproduced against the
    // spec's own reference implementation — see specConformance.test.ts.
    const broken: string[] = [];
    for (const correct of corpus) {
      for (const typed of corpus) {
        if (correct === typed || correct === '') continue;
        const diff = computeSpellingDiff(typed, correct);
        const recovered = diff
          .filter((s) => s.status !== 'missing')
          .map((s) => s.typed ?? s.char)
          .join('');
        if (recovered === typed) continue;
        // The only permitted exception: a single-segment diff produced by the
        // length-1 special case.
        if (diff.length === 1 && diff[0].status === 'missing') continue;
        broken.push(`${JSON.stringify(correct)} <- ${JSON.stringify(typed)}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('SPEC DEFECT pin: the length-1 special case is the ONLY place US-D6 recovery fails', () => {
    // Pinned so that if the special case is ever removed (it must not be — it
    // is what makes vector 14 render at all), this test fails loudly rather
    // than the exception above silently widening.
    const exceptions: string[] = [];
    for (const correct of corpus) {
      for (const typed of corpus) {
        if (correct === typed || correct === '') continue;
        const diff = computeSpellingDiff(typed, correct);
        const recovered = diff
          .filter((s) => s.status !== 'missing')
          .map((s) => s.typed ?? s.char)
          .join('');
        if (recovered !== typed) exceptions.push(`${correct} <- ${typed}`);
      }
    }
    // Every one-character correct answer against every other one-character
    // attempt over a 3-letter alphabet: 3 × 2 = 6.
    expect(exceptions.sort()).toEqual(['a <- b', 'a <- c', 'b <- a', 'b <- c', 'c <- a', 'c <- b']);
  });

  it('no phantom swaps (T12/T13 generalised): a reported swap always names two DISTINCT characters', () => {
    // This — not §9.5 property 5 as written — is the real content of the
    // negative controls. A doubled letter trivially satisfies the transposition
    // precondition `a[i-1] === b[j-2] && a[i-2] === b[j-1]`, but because a
    // transposition costs exactly 1 (never 0, never `cost`) it can never
    // strictly improve on a free substitution, so a "swap" of a character with
    // itself is unreachable by construction.
    const selfSwaps: string[] = [];
    for (const correct of corpus) {
      for (const typed of corpus) {
        if (correct === typed || correct === '') continue;
        for (const s of computeSpellingDiff(typed, correct)) {
          if (s.status === 'transposed' && s.char === s.typed) {
            selfSwaps.push(`${JSON.stringify(correct)} <- ${JSON.stringify(typed)}`);
          }
        }
      }
    }
    expect(selfSwaps).toEqual([]);
  });

  it('SPEC DEFECT pin: §9.5 property 5 as written is too strong — a swap may TIE with Levenshtein', () => {
    // §9.5 claims "for any pair whose true Damerau distance equals its
    // Levenshtein distance, no transposed segment is produced." That is false:
    // the tie-break is applied per MATRIX CELL, not per whole alignment, so a
    // transposition can strictly improve locally while the two global distances
    // still tie via a different route.
    //
    // `ab` typed as `baa`: Levenshtein = 2 (delete b, substitute) and Damerau
    // = 2 (transpose ba→ab, delete the surplus a). The transposition strictly
    // wins at its own cell, so a swap IS reported — correctly, and the spec's
    // own reference implementation does exactly the same (see
    // specConformance.test.ts). Reported, not patched.
    const diff = computeSpellingDiff('baa', 'ab');
    expect(damerau('baa', 'ab')).toBe(levenshtein('baa', 'ab'));
    expect(canon(diff)).toEqual([
      { status: 'transposed', char: 'a', typed: 'b', pairId: 0 },
      { status: 'transposed', char: 'b', typed: 'a', pairId: 0 },
      { status: 'extra', char: '', typed: 'a' },
    ]);
  });

  it('is deterministic', () => {
    for (const correct of corpus.slice(0, 40)) {
      for (const typed of corpus.slice(0, 40)) {
        if (correct === '') continue;
        expect(computeSpellingDiff(typed, correct)).toEqual(computeSpellingDiff(typed, correct));
      }
    }
  });
});

// ── §4.1 Comparison rules ───────────────────────────────────────────────────

describe('CAP-4 §4.1 — comparison rules', () => {
  it('folds case by default and echoes the STORED casing', () => {
    expect(evaluateAnswer('RAVENOUS', ['ravenous']).correct).toBe(true);
    const wrong = evaluateAnswer('RAVANOUS', ['ravenous']);
    expect(wrong.correct).toBe(false);
    expect(canon(wrong.diff)).toEqual([
      { status: 'ok', char: 'r' },
      { status: 'ok', char: 'a' },
      { status: 'ok', char: 'v' },
      { status: 'wrong', char: 'e', typed: 'a' },
      { status: 'ok', char: 'n' },
      { status: 'ok', char: 'o' },
      { status: 'ok', char: 'u' },
      { status: 'ok', char: 's' },
    ]);
  });

  it('honours the case-sensitive setting (CAP-10)', () => {
    expect(evaluateAnswer('RAVENOUS', ['ravenous'], { caseSensitive: true }).correct).toBe(false);
    expect(evaluateAnswer('ravenous', ['ravenous'], { caseSensitive: true }).correct).toBe(true);
  });

  it('trims leading and trailing whitespace but never internal whitespace', () => {
    expect(evaluateAnswer('  ravenous  ', ['ravenous']).correct).toBe(true);
    expect(evaluateAnswer('ice cream', ['ice cream']).correct).toBe(true);
    expect(evaluateAnswer('icecream', ['ice cream']).correct).toBe(false);
    expect(evaluateAnswer('ice  cream', ['ice cream']).correct).toBe(false);

    const internal = evaluateAnswer('raven ous', ['ravenous']);
    expect(internal.correct).toBe(false);
    expect(internal.diff.filter((s) => s.status === 'extra')).toEqual([
      { status: 'extra', char: '', typed: ' ' },
    ]);
  });

  it('treats punctuation and accents as significant', () => {
    expect(evaluateAnswer('resume', ['résumé']).correct).toBe(false);
    expect(evaluateAnswer('résumé', ['résumé']).correct).toBe(true);
  });

  it('NFC-normalises, so the same character in two encodings is not an error', () => {
    const decomposed = 'resumé'.normalize('NFD');
    expect(evaluateAnswer(decomposed, ['résumé'.normalize('NFC')]).correct).toBe(false);
    expect(evaluateAnswer('résumé', ['résumé']).correct).toBe(true);
  });
});

// ── §5 Unicode ──────────────────────────────────────────────────────────────

describe('CAP-4 §5 — Unicode handling', () => {
  it('marks only the accented characters in résumé typed as resume', () => {
    const diff = computeSpellingDiff('resume', 'résumé');
    expect(diff.filter((s) => s.status !== 'ok').map((s) => s.char)).toEqual(['é', 'é']);
  });

  it('never splits an astral character across segments', () => {
    const diff = computeSpellingDiff('ab', 'a\u{1F600}b');
    expect(diff.map((s) => s.char)).toEqual(['a', '\u{1F600}', 'b']);
    expect(diff[1].status).toBe('missing');
  });

  it('reports two swapped accented characters as ONE transposition', () => {
    const diff = computeSpellingDiff('èé', 'éè');
    expect(diff.map((s) => s.status)).toEqual(['transposed', 'transposed']);
    expect(swapCount(diff)).toBe(1);
  });

  it('keeps a CJK character in a single cell', () => {
    const diff = computeSpellingDiff('日本', '日本語');
    expect(diff.map((s) => s.char)).toEqual(['日', '本', '語']);
  });
});

// ── §6 Multiple accepted answers ────────────────────────────────────────────

describe('CAP-4 §6 — multiple accepted answers', () => {
  it('accepts any declared answer', () => {
    expect(evaluateAnswer('color', ['colour', 'color']).matchedAnswer).toBe('color');
    expect(evaluateAnswer('colour', ['colour', 'color']).correct).toBe(true);
  });

  it('scores a miss against the CLOSEST candidate, not the first declared', () => {
    // Marking `collor` against `colour` would tell the user they are missing a
    // `u` they never needed.
    const result = evaluateAnswer('collor', ['colour', 'color']);
    expect(result.matchedAnswer).toBe('color');
    expect(result.diff.filter((s) => s.status !== 'ok')).toEqual([
      { status: 'extra', char: '', typed: 'l' },
    ]);
  });

  it('breaks a distance tie in favour of the FIRST declared candidate', () => {
    expect(evaluateAnswer('cat', ['bat', 'hat']).matchedAnswer).toBe('bat');
  });

  it('refuses to grade a card with no accepted answer', () => {
    expect(() => evaluateAnswer('anything', [])).toThrow(RangeError);
  });
});

// ── §8 Bounds ───────────────────────────────────────────────────────────────

describe('CAP-4 §8 — bounded input', () => {
  it('degrades to an unmarked incorrect result beyond the cap instead of allocating', () => {
    const huge = 'a'.repeat(10_000);
    const started = Date.now();
    const result = evaluateAnswer(huge, ['ravenous']);
    expect(result.correct).toBe(false);
    expect(result.diffOmitted).toBe(true);
    expect(result.diff).toEqual([]);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('still diffs an input exactly at the cap', () => {
    const atCap = 'a'.repeat(DIFF_LENGTH_CAP);
    const result = evaluateAnswer(atCap.slice(0, -1), [atCap]);
    expect(result.diffOmitted).toBe(false);
    expect(result.diff).toHaveLength(DIFF_LENGTH_CAP);
  });

  it('a long but correct answer is still graded correct', () => {
    const long = 'b'.repeat(10_000);
    expect(evaluateAnswer(long, [long]).correct).toBe(true);
  });
});
