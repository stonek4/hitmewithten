/**
 * CAP-3 tests: the shuffle, the start guard, flip, the counter semantics that
 * feed trophy thresholds users have already partially earned, and the session
 * record CAP-6 consumes.
 */

import { computeSpellingDiff } from '@/features/evaluation/logic';
import type { Card } from '@/features/identity/types';

import {
  answersFor,
  buildSessionRecord,
  currentCard,
  endSession,
  flip,
  goBack,
  isFinished,
  missedCards,
  progress,
  promptFor,
  recordPass,
  recordWrongAttempt,
  shuffle,
  startSession,
} from './logic';
import type { SessionState } from './logic';

const STARTED = '2026-08-09T10:00:00.000Z';

/**
 * A randomness source that leaves Fisher-Yates order untouched.
 *
 * Each step swaps `out[i]` with `out[floor(r * (i + 1))]`, so a value just
 * under 1 always picks `i` itself. (`() => 0` is NOT identity — it swaps every
 * element to the front and genuinely reorders.)
 */
const NO_SHUFFLE = (): number => 0.999999;

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
    createdAt: STARTED,
    updatedAt: STARTED,
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

/**
 * Start a three-card session, failing loudly if the guard refuses.
 *
 * @param overrides Options to override.
 * @returns The session.
 */
function session(overrides: Partial<Parameters<typeof startSession>[0]> = {}): SessionState {
  const result = startSession({
    id: 'session-1',
    setId: 'set',
    cards,
    mode: 'all',
    startedAt: STARTED,
    random: NO_SHUFFLE,
    ...overrides,
  });
  if (!result.ok) throw new Error(`unexpected refusal: ${result.error}`);
  return result.session;
}

describe('CAP-3 — shuffle', () => {
  it('does not mutate the caller’s array', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input, () => 0.5);
    expect(input).toEqual(snapshot);
  });

  it('is a permutation — it never drops or duplicates an item', () => {
    const input = Array.from({ length: 50 }, (_, n) => n);
    expect([...shuffle(input)].sort((a, b) => a - b)).toEqual(input);
  });

  it('is uniform enough that no position is stuck', () => {
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
    expect(startSession({ id: 'x', setId: null, cards, mode: 'all', startedAt: STARTED })).toEqual({
      ok: false,
      error: 'noSet',
    });
  });

  it('refuses to start with an empty set — the legacy soft-lock’s exact input', () => {
    expect(startSession({ id: 'x', setId: 'set', cards: [], mode: 'all', startedAt: STARTED })).toEqual(
      { ok: false, error: 'emptySet' },
    );
  });

  it('uses every card in "all" mode and at most quickSize in "quick"', () => {
    expect(session().cardStates).toHaveLength(3);
    expect(session({ mode: 'quick', quickSize: 2 }).cardStates).toHaveLength(2);
    expect(session({ mode: 'quick', quickSize: 10 }).cardStates).toHaveLength(3);
  });

  it('carries every accepted answer through to the session', () => {
    const multi = [{ ...card('1', 'h', 'colour'), answers: ['colour', 'color'] }];
    expect(session({ cards: multi }).cardStates[0].answers).toEqual(['colour', 'color']);
  });
});

describe('CAP-3 — flip', () => {
  it('shows the hint and accepts the answer by default', () => {
    const state = session();
    const first = state.cardStates[0];
    expect(promptFor(first, state.flipped)).toBe('Extremely hungry');
    expect(answersFor(first, state.flipped)).toEqual(['ravenous']);
  });

  it('swaps the roles wholesale when flipped', () => {
    const state = flip(session());
    const first = state.cardStates[0];
    expect(state.flipped).toBe(true);
    expect(promptFor(first, state.flipped)).toBe('ravenous');
    expect(answersFor(first, state.flipped)).toEqual(['Extremely hungry']);
  });

  it('keeps progress across a flip — changing how you are asked is not a punishment', () => {
    const passed = recordPass(session());
    const flipped = flip(passed);
    expect(flipped.index).toBe(1);
    expect(flipped.counters).toEqual(passed.counters);
    expect(progress(flipped)).toBeCloseTo(1 / 3);
  });

  it('flips back', () => {
    expect(flip(flip(session())).flipped).toBe(false);
  });
});

describe('CAP-3 — counter semantics are preserved exactly', () => {
  it('increments failed on EVERY wrong attempt, three tries counting three times', () => {
    let state = session();
    state = recordWrongAttempt(recordWrongAttempt(recordWrongAttempt(state)));
    expect(state.counters).toEqual({ tested: 0, passed: 0, failed: 3 });
    expect(state.index).toBe(0);
    expect(progress(state)).toBe(0);
    expect(state.cardStates[0].attempts).toBe(3);
  });

  it('increments passed and tested together on a correct submission', () => {
    const state = recordPass(session());
    expect(state.counters).toEqual({ tested: 1, passed: 1, failed: 0 });
    expect(state.index).toBe(1);
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

describe('CAP-3 — the FIRST diff is what the results screen keeps', () => {
  it('records the first diff and never overwrites it with a later attempt', () => {
    // The first mistake is the one the user actually made, before they started
    // narrowing in on the answer.
    const first = computeSpellingDiff('ravenus', 'ravenous');
    const second = computeSpellingDiff('ravenaus', 'ravenous');
    let state = recordWrongAttempt(session(), first);
    state = recordWrongAttempt(state, second);
    expect(state.cardStates[0].firstDiff).toEqual(first);
    expect(state.cardStates[0].attempts).toBe(2);
  });

  it('leaves firstDiff null on a card passed first time', () => {
    expect(recordPass(session()).cardStates[0].firstDiff).toBeNull();
  });
});

describe('CAP-3 — back', () => {
  it('is a NO-OP on the first card, not an exit from the whole test', () => {
    const state = session();
    expect(goBack(state)).toBe(state);
  });

  it('moves to the previous card otherwise', () => {
    expect(goBack(recordPass(session())).index).toBe(0);
  });
});

describe('CAP-3 — the session record handed to CAP-6', () => {
  it('summarises a completed session', () => {
    let state = session();
    state = recordPass(recordWrongAttempt(state, computeSpellingDiff('ravenus', 'ravenous')));
    state = recordPass(state);
    state = recordPass(state);
    state = endSession(state, '2026-08-09T10:02:30.000Z');

    expect(buildSessionRecord(state, '2026-08-09T10:02:30.000Z')).toEqual({
      id: 'session-1',
      setId: 'set',
      mode: 'all',
      flipped: false,
      startedAt: STARTED,
      endedAt: '2026-08-09T10:02:30.000Z',
      endedEarly: false,
      cardsCompleted: 3,
      firstTryPasses: 2,
      wrongAttempts: 1,
      elapsedMs: 150_000,
      missedCardIds: ['1'],
    });
  });

  it('produces a record for an abandoned session, reporting only what was completed', () => {
    let state = recordPass(session());
    state = recordWrongAttempt(state);
    state = endSession(state, '2026-08-09T10:00:30.000Z');

    const record = buildSessionRecord(state, '2026-08-09T10:00:30.000Z');
    expect(record.endedEarly).toBe(true);
    expect(record.cardsCompleted).toBe(1);
    expect(record.firstTryPasses).toBe(1);
    expect(record.wrongAttempts).toBe(1);
  });

  it('carries NO card content — only ids, counts and timings', () => {
    let state = recordWrongAttempt(session(), computeSpellingDiff('ravenus', 'ravenous'));
    state = endSession(recordPass(state), '2026-08-09T10:01:00.000Z');
    const record = buildSessionRecord(state, '2026-08-09T10:01:00.000Z');
    const serialized = JSON.stringify(record);
    for (const content of ['ravenous', 'Extremely hungry', 'ice cream', 'receive']) {
      expect(serialized).not.toContain(content);
    }
  });

  it('references missed cards by id, so an edit cannot break "practice missed"', () => {
    let state = recordWrongAttempt(session());
    state = recordPass(state);
    state = recordPass(state);
    state = recordWrongAttempt(state);
    expect(missedCards(state).map((c) => c.cardId)).toEqual(['1', '3']);
  });

  it('never reports a negative elapsed time if the clock moves backwards', () => {
    const state = endSession(session(), '2026-08-09T09:00:00.000Z');
    expect(buildSessionRecord(state, '2026-08-09T09:00:00.000Z').elapsedMs).toBe(0);
  });
});
