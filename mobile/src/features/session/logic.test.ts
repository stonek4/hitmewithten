/**
 * CAP-3 (partial) tests: the shuffle, the start guard, and the counter
 * semantics that feed trophy thresholds users have already partially earned.
 */

import type { Card } from '@/features/identity/types';

import {
  currentCard,
  goBack,
  isFinished,
  progress,
  recordPass,
  recordWrongAttempt,
  shuffle,
  startSession,
} from './logic';
import type { SessionState } from './logic';

/**
 * Build a card for tests.
 *
 * @param id The card id.
 * @param hint The prompt.
 * @param answer The accepted answer.
 * @returns A live {@link Card}.
 */
function card(id: string, hint: string, answer: string): Card {
  return {
    id,
    setId: 'set',
    hints: [hint],
    answers: [answer],
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    syncedAt: null,
    schemaVersion: 1,
  };
}

const cards = [
  card('1', 'Extremely hungry', 'ravenous'),
  card('2', 'A frozen dessert', 'ice cream'),
  card('3', 'To get something', 'receive'),
];

describe('CAP-3 — shuffle', () => {
  it('does not mutate the caller’s array', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input, () => 0.5);
    expect(input).toEqual(snapshot);
  });

  it('is a permutation — it never drops or duplicates an item', () => {
    const input = Array.from({ length: 50 }, (_, n) => n);
    const out = shuffle(input);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('is uniform enough that no position is stuck', () => {
    // A `sort(() => 0.5 - Math.random())` shuffle (the legacy implementation)
    // leaves items strongly biased toward their original positions.
    const counts = new Map<number, number>();
    for (let run = 0; run < 2000; run++) {
      const first = shuffle([0, 1, 2, 3, 4])[0];
      counts.set(first, (counts.get(first) ?? 0) + 1);
    }
    for (const value of [0, 1, 2, 3, 4]) {
      expect(counts.get(value) ?? 0).toBeGreaterThan(2000 / 5 / 2);
    }
  });
});

describe('CAP-3 — validate before navigating', () => {
  it('refuses to start with no set selected', () => {
    expect(startSession({ setId: null, cards, mode: 'all' })).toEqual({
      ok: false,
      error: 'noSet',
    });
  });

  it('refuses to start with an empty set — the legacy soft-lock’s exact input', () => {
    expect(startSession({ setId: 'set', cards: [], mode: 'all' })).toEqual({
      ok: false,
      error: 'emptySet',
    });
  });

  it('uses every card in "all" mode', () => {
    const result = startSession({ setId: 'set', cards, mode: 'all', random: () => 0 });
    expect(result.ok && result.session.cardStates).toHaveLength(3);
  });

  it('draws at most quickSize cards in "quick" mode', () => {
    const result = startSession({
      setId: 'set',
      cards,
      mode: 'quick',
      quickSize: 2,
      random: () => 0,
    });
    expect(result.ok && result.session.cardStates).toHaveLength(2);
  });

  it('uses what exists when the set holds fewer than quickSize', () => {
    const result = startSession({ setId: 'set', cards, mode: 'quick', quickSize: 10 });
    expect(result.ok && result.session.cardStates).toHaveLength(3);
  });

  it('carries every accepted answer through to the session', () => {
    const multi = [{ ...card('1', 'h', 'colour'), answers: ['colour', 'color'] }];
    const result = startSession({ setId: 'set', cards: multi, mode: 'all' });
    expect(result.ok && result.session.cardStates[0].answersExpected).toEqual(['colour', 'color']);
  });
});

describe('CAP-3 — counter semantics are preserved exactly', () => {
  /** @returns A fresh three-card session. */
  function session(): SessionState {
    const result = startSession({ setId: 'set', cards, mode: 'all', random: () => 0 });
    if (!result.ok) throw new Error('unreachable');
    return result.session;
  }

  it('increments failed on EVERY wrong attempt, three tries counting three times', () => {
    let state = session();
    state = recordWrongAttempt(recordWrongAttempt(recordWrongAttempt(state)));
    expect(state.counters).toEqual({ tested: 0, passed: 0, failed: 3 });
    // The card does not advance and progress does not move.
    expect(state.index).toBe(0);
    expect(progress(state)).toBe(0);
    expect(state.cardStates[0].attempts).toBe(3);
  });

  it('increments passed and tested together on a correct submission', () => {
    const state = recordPass(session());
    expect(state.counters).toEqual({ tested: 1, passed: 1, failed: 0 });
    expect(state.index).toBe(1);
    expect(progress(state)).toBeCloseTo(1 / 3);
  });

  it('runs a whole session to completion', () => {
    let state = session();
    state = recordPass(recordWrongAttempt(state));
    state = recordPass(state);
    state = recordPass(state);
    expect(isFinished(state)).toBe(true);
    expect(currentCard(state)).toBeNull();
    expect(progress(state)).toBe(1);
    expect(state.counters).toEqual({ tested: 3, passed: 3, failed: 1 });
  });
});

describe('CAP-3 — back', () => {
  it('is a NO-OP on the first card, not an exit from the whole test', () => {
    const result = startSession({ setId: 'set', cards, mode: 'all' });
    if (!result.ok) throw new Error('unreachable');
    expect(goBack(result.session)).toBe(result.session);
  });

  it('moves to the previous card otherwise', () => {
    const result = startSession({ setId: 'set', cards, mode: 'all' });
    if (!result.ok) throw new Error('unreachable');
    expect(goBack(recordPass(result.session)).index).toBe(0);
  });
});
