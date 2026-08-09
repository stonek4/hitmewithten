/**
 * CAP-5 pure-logic tests: pair grouping, the announcement summary, and spelling
 * the answer out.
 */

import { computeSpellingDiff } from '@/features/evaluation/logic';

import { spellOutRuns, summarizeDiff, toColumns } from './logic';

describe('CAP-5 — toColumns groups by pairId, never by adjacency', () => {
  it('marks the two halves of a single swap', () => {
    const columns = toColumns(computeSpellingDiff('recieve', 'receive'));
    expect(columns.map((c) => c.pairPosition)).toEqual([
      null,
      null,
      null,
      'first',
      'second',
      null,
      null,
    ]);
    expect(columns.filter((c) => c.ownsRibbon)).toHaveLength(1);
  });

  it('disambiguates FOUR consecutive transposed segments into TWO pairs', () => {
    // The case adjacency cannot distinguish: (0,1)(2,3) vs (1,2).
    const columns = toColumns(computeSpellingDiff('badc', 'abcd'));
    expect(columns.map((c) => c.pairPosition)).toEqual(['first', 'second', 'first', 'second']);
    expect(columns.filter((c) => c.ownsRibbon).map((c) => c.index)).toEqual([0, 2]);
  });

  it('leaves non-transposed segments unpaired', () => {
    const columns = toColumns(computeSpellingDiff('ravenus', 'ravenous'));
    expect(columns.every((c) => c.pairPosition === null && !c.ownsRibbon)).toBe(true);
  });
});

describe('CAP-5 — summarizeDiff', () => {
  it('describes a missing letter', () => {
    expect(summarizeDiff(computeSpellingDiff('ravenus', 'ravenous'))).toEqual({
      errors: [{ kind: 'missing', char: 'o' }],
      more: 0,
    });
  });

  it('describes a missing SPACE distinctly from a missing letter', () => {
    expect(summarizeDiff(computeSpellingDiff('icecream', 'ice cream'))).toEqual({
      errors: [{ kind: 'missingSpace' }],
      more: 0,
    });
  });

  it('describes a wrong letter, naming both characters', () => {
    expect(summarizeDiff(computeSpellingDiff('ravanous', 'ravenous'))).toEqual({
      errors: [{ kind: 'wrong', char: 'e', typed: 'a' }],
      more: 0,
    });
  });

  it('describes an extra letter and an extra space distinctly', () => {
    expect(summarizeDiff(computeSpellingDiff('ravenious', 'ravenous'))).toEqual({
      errors: [{ kind: 'extra', typed: 'i' }],
      more: 0,
    });
    expect(summarizeDiff(computeSpellingDiff('ice  cream', 'ice cream'))).toEqual({
      errors: [{ kind: 'extraSpace' }],
      more: 0,
    });
  });

  it('reports a swap as ONE error, naming the characters in the CORRECT order', () => {
    // spelling-diff-spec.md §7.3. Never two separate wrong-letter reports —
    // that is the misleading output this status exists to remove.
    expect(summarizeDiff(computeSpellingDiff('recieve', 'receive'))).toEqual({
      errors: [{ kind: 'transposed', first: 'e', second: 'i' }],
      more: 0,
    });
  });

  it('counts a transposed PAIR as one error toward the cap', () => {
    const summary = summarizeDiff(computeSpellingDiff('thier freind', 'their friend'));
    expect(summary).toEqual({
      errors: [
        { kind: 'transposed', first: 'e', second: 'i' },
        { kind: 'transposed', first: 'i', second: 'e' },
      ],
      more: 0,
    });
  });

  it('caps the enumeration at three and reports the remainder', () => {
    // "xyz" against "ravenous" makes every character its own error.
    const summary = summarizeDiff(computeSpellingDiff('xyz', 'ravenous'));
    expect(summary.errors).toHaveLength(3);
    expect(summary.more).toBe(5);
  });

  it('honours a caller-supplied cap', () => {
    const summary = summarizeDiff(computeSpellingDiff('xyz', 'ravenous'), 1);
    expect(summary.errors).toHaveLength(1);
    expect(summary.more).toBe(7);
  });

  it('produces nothing for an all-ok diff', () => {
    expect(summarizeDiff([{ status: 'ok', char: 'a' }])).toEqual({ errors: [], more: 0 });
  });
});

describe('CAP-5 — spellOutRuns', () => {
  it('spells a single word letter by letter', () => {
    expect(spellOutRuns(computeSpellingDiff('ravenus', 'ravenous'))).toEqual([
      ['r', 'a', 'v', 'e', 'n', 'o', 'u', 's'],
    ]);
  });

  it('splits on spaces so each space can be named aloud', () => {
    expect(spellOutRuns(computeSpellingDiff('icecream', 'ice cream'))).toEqual([
      ['i', 'c', 'e'],
      ['c', 'r', 'e', 'a', 'm'],
    ]);
  });

  it('ignores extra segments, which carry no character of the answer', () => {
    expect(spellOutRuns(computeSpellingDiff('ravenious', 'ravenous'))).toEqual([
      ['r', 'a', 'v', 'e', 'n', 'o', 'u', 's'],
    ]);
  });

  it('keeps a grapheme cluster whole rather than splitting it', () => {
    expect(spellOutRuns(computeSpellingDiff('resume', 'résumé'))).toEqual([
      ['r', 'é', 's', 'u', 'm', 'é'],
    ]);
  });
});
