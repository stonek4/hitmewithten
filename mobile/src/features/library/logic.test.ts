/**
 * CAP-1 pure-logic tests: name validation, duplicate detection, the auto-suffix
 * suggestion, and the summary index's sorting and search.
 */

import { SET_NAME_MAX_LENGTH } from '@/features/identity/types';
import type { CardSet } from '@/features/identity/types';

import {
  buildSummaries,
  detectNameConflict,
  findNameCollision,
  searchSummaries,
  selectionAfterDelete,
  sortSummaries,
  suggestAvailableName,
  validateSetName,
} from './logic';
import type { CardSetSummary } from './types';

/**
 * Build a card set for tests.
 *
 * @param id The set's id.
 * @param name The set's name.
 * @param overrides Any other fields to override.
 * @returns A live {@link CardSet}.
 */
function set(id: string, name: string, overrides: Partial<CardSet> = {}): CardSet {
  return {
    id,
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    syncedAt: null,
    schemaVersion: 1,
    lastUsedAt: null,
    order: 0,
    ...overrides,
  };
}

describe('CAP-1 — validateSetName', () => {
  it('trims and accepts a normal name', () => {
    expect(validateSetName('  SAT Words  ')).toEqual({ valid: true, name: 'SAT Words' });
  });

  it('rejects blank names', () => {
    expect(validateSetName('   ')).toEqual({ valid: false, error: 'empty' });
    expect(validateSetName('')).toEqual({ valid: false, error: 'empty' });
  });

  it(`rejects names longer than ${SET_NAME_MAX_LENGTH} characters`, () => {
    expect(validateSetName('a'.repeat(SET_NAME_MAX_LENGTH)).valid).toBe(true);
    expect(validateSetName('a'.repeat(SET_NAME_MAX_LENGTH + 1))).toEqual({
      valid: false,
      error: 'tooLong',
    });
  });

  it('permits any character — a name is not a filesystem key', () => {
    expect(validateSetName('French / Spanish: 日本語 😀 <script>')).toEqual({
      valid: true,
      name: 'French / Spanish: 日本語 😀 <script>',
    });
  });
});

describe('CAP-1 — duplicate names are surfaced, never silently resolved', () => {
  const sets = [set('a', 'SAT Words'), set('b', 'Tricky Doubles')];

  it('matches case-insensitively and ignoring surrounding whitespace', () => {
    expect(findNameCollision(sets, '  sat words ')?.id).toBe('a');
  });

  it('does not collide with a tombstoned set — a deleted name is free', () => {
    const withDeleted = [set('a', 'SAT Words', { deletedAt: '2026-02-01T00:00:00.000Z' })];
    expect(findNameCollision(withDeleted, 'SAT Words')).toBeNull();
  });

  it('suggests the first free suffix, incrementing until one is available', () => {
    expect(suggestAvailableName(sets, 'New Set')).toBe('New Set');
    expect(suggestAvailableName(sets, 'SAT Words')).toBe('SAT Words (2)');
    expect(suggestAvailableName([...sets, set('c', 'SAT Words (2)')], 'SAT Words')).toBe(
      'SAT Words (3)',
    );
  });

  it('suffixes the name the user typed, not the colliding set’s casing', () => {
    expect(suggestAvailableName(sets, 'sat words')).toBe('sat words (2)');
  });

  it('names the card count that Replace would destroy', () => {
    expect(detectNameConflict(sets, 'sat words', { a: 42 })).toEqual({
      existingSetId: 'a',
      existingName: 'SAT Words',
      existingCardCount: 42,
      suggestedName: 'sat words (2)',
    });
  });

  it('reports no conflict for a free name', () => {
    expect(detectNameConflict(sets, 'Homophones', {})).toBeNull();
  });
});

describe('CAP-1 — the summary index', () => {
  const sets = [
    set('a', 'SAT Words', { lastUsedAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-03-01T00:00:00.000Z' }),
    set('b', 'apple pie', { lastUsedAt: '2026-04-01T00:00:00.000Z' }),
    set('c', 'Zebra', { deletedAt: '2026-02-01T00:00:00.000Z' }),
    set('d', 'Beta'),
  ];
  const counts = { a: 10, b: 3, d: 55 };

  it('excludes tombstones and marks the current set', () => {
    const summaries = buildSummaries(sets, counts, 'b');
    expect(summaries.map((s) => s.id)).toEqual(['a', 'b', 'd']);
    expect(summaries.find((s) => s.id === 'b')?.isCurrent).toBe(true);
    expect(summaries.find((s) => s.id === 'a')?.cardCount).toBe(10);
  });

  it('defaults a missing count to 0 rather than undefined', () => {
    expect(buildSummaries([set('x', 'X')], {}, null)[0].cardCount).toBe(0);
  });

  /** @returns The summaries under test. */
  function summaries(): CardSetSummary[] {
    return buildSummaries(sets, counts, null);
  }

  it('sorts by name using locale collation, not raw code points', () => {
    // A naive `<` puts every capital before every lowercase letter, so
    // "apple pie" would sort after "Zebra". Collation is what a user expects.
    expect(sortSummaries(summaries(), 'name').map((s) => s.name)).toEqual([
      'apple pie',
      'Beta',
      'SAT Words',
    ]);
  });

  it('sorts by card count, largest first', () => {
    expect(sortSummaries(summaries(), 'size').map((s) => s.id)).toEqual(['d', 'a', 'b']);
  });

  it('sorts by recency, with never-used sets last', () => {
    expect(sortSummaries(summaries(), 'recent').map((s) => s.id)).toEqual(['b', 'a', 'd']);
  });

  it('is stable and does not mutate its input', () => {
    const input = summaries();
    const snapshot = [...input];
    sortSummaries(input, 'name');
    expect(input).toEqual(snapshot);
  });

  it('searches case-insensitively by substring', () => {
    expect(searchSummaries(summaries(), 'ap').map((s) => s.id)).toEqual(['b']);
    expect(searchSummaries(summaries(), 'WORDS').map((s) => s.id)).toEqual(['a']);
    expect(searchSummaries(summaries(), '   ').map((s) => s.id)).toEqual(['a', 'b', 'd']);
  });

  it('finds an accented name however it was encoded', () => {
    const accented = buildSummaries([set('x', 'Café Words')], {}, null);
    expect(searchSummaries(accented, 'café').map((s) => s.id)).toEqual(['x']);
  });
});

describe('CAP-1 — selectionAfterDelete', () => {
  it('clears the selection to a REAL null when the current set is deleted', () => {
    const result = selectionAfterDelete('a', 'a');
    expect(result).toBeNull();
    // The legacy app writes the literal string "null" and only works by accident.
    expect(result).not.toBe('null');
  });

  it('leaves an unrelated selection alone', () => {
    expect(selectionAfterDelete('a', 'b')).toBe('a');
    expect(selectionAfterDelete(null, 'b')).toBeNull();
  });
});
