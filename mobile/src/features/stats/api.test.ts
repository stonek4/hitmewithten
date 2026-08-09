/**
 * CAP-15 (P0 recording half) tests.
 *
 * Getting this wrong is invisible until a future release turns scheduling on
 * and finds no history, which is exactly why it ships in v1.
 */

import type { IdentityContext } from '@/features/identity/types';
import type { SessionCardState } from '@/features/session/logic';
import { CARD_STATS_KEY, createMemoryStore } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { applySessionToStats, CardStatsRepository, emptyCardStats } from './api';

/**
 * Build a session card state.
 *
 * @param cardId The card id.
 * @param attempts Wrong attempts in the session.
 * @param passed Whether the card was passed.
 * @returns The state.
 */
function state(cardId: string, attempts: number, passed: boolean): SessionCardState {
  return { cardId, hints: ['h'], answers: ['a'], attempts, passed, firstDiff: null };
}

/**
 * Build a repository over fresh in-memory storage.
 *
 * @returns The repository and its store.
 */
function makeRepo(): { repo: CardStatsRepository; store: KeyValueStore } {
  const context: IdentityContext = {
    newId: () => 'unused',
    now: () => '2026-08-09T12:00:00.000Z',
  };
  const store = createMemoryStore();
  return { repo: new CardStatsRepository(store, context), store };
}

describe('CAP-15 — the reserved scheduling fields exist from v1', () => {
  it('writes them as null rather than omitting them', () => {
    expect(emptyCardStats('c')).toEqual({
      cardId: 'c',
      attempts: 0,
      firstTryPasses: 0,
      failures: 0,
      lastSeenAt: null,
      interval: null,
      ease: null,
      dueAt: null,
    });
  });
});

describe('CAP-15 — folding a session into stats', () => {
  it('counts one attempt per card drilled, and every wrong submission', () => {
    const stats = applySessionToStats({}, [state('a', 0, true), state('b', 3, true)], 'now');
    expect(stats.a).toMatchObject({ attempts: 1, firstTryPasses: 1, failures: 0 });
    expect(stats.b).toMatchObject({ attempts: 1, firstTryPasses: 0, failures: 3 });
  });

  it('accumulates monotonically across sessions', () => {
    let stats = applySessionToStats({}, [state('a', 1, true)], 't1');
    stats = applySessionToStats(stats, [state('a', 0, true)], 't2');
    expect(stats.a).toMatchObject({
      attempts: 2,
      firstTryPasses: 1,
      failures: 1,
      lastSeenAt: 't2',
    });
  });

  it('does not credit a first-try pass to a card that was never passed', () => {
    const stats = applySessionToStats({}, [state('a', 0, false)], 'now');
    expect(stats.a.firstTryPasses).toBe(0);
  });

  it('leaves cards that were not in the session untouched', () => {
    const before = applySessionToStats({}, [state('a', 1, true)], 't1');
    const after = applySessionToStats(before, [state('b', 0, true)], 't2');
    expect(after.a).toEqual(before.a);
  });
});

describe('CAP-15 — persistence', () => {
  it('records a session and reads it back', async () => {
    const { repo } = makeRepo();
    await repo.recordSession([state('a', 2, true)]);
    expect(await repo.get('a')).toMatchObject({
      attempts: 1,
      failures: 2,
      lastSeenAt: '2026-08-09T12:00:00.000Z',
    });
    expect(await repo.get('never-drilled')).toBeNull();
  });

  it('survives a corrupt store rather than throwing', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(CARD_STATS_KEY, 'not json');
    expect(await repo.load()).toEqual({});
    await store.setItem(CARD_STATS_KEY, JSON.stringify({ a: { cardId: 'a' }, b: null }));
    expect(await repo.load()).toEqual({});
  });

  it('is keyed by id, so it survives editing a card and is pruned with it', async () => {
    const { repo } = makeRepo();
    await repo.recordSession([state('keep', 1, true), state('gone', 1, true)]);
    await repo.pruneTo(['keep']);
    expect(await repo.get('keep')).not.toBeNull();
    expect(await repo.get('gone')).toBeNull();
  });
});
