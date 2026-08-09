/**
 * CAP-3 / CAP-6 session-history tests, over a real repository and an in-memory
 * store.
 */

import { createMemoryStore, SESSION_HISTORY_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { SessionHistoryRepository, SESSION_HISTORY_LIMIT } from './api';
import type { SessionRecord } from './logic';

/**
 * Build a session record.
 *
 * @param id The record id.
 * @param setId The set it belongs to.
 * @param overrides Any fields to override.
 * @returns A {@link SessionRecord}.
 */
function record(id: string, setId: string, overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id,
    setId,
    mode: 'all',
    flipped: false,
    startedAt: '2026-08-09T10:00:00.000Z',
    endedAt: '2026-08-09T10:01:00.000Z',
    endedEarly: false,
    cardsCompleted: 3,
    firstTryPasses: 2,
    wrongAttempts: 1,
    elapsedMs: 60_000,
    missedCardIds: ['card-1'],
    ...overrides,
  };
}

/**
 * Build a repository over a fresh in-memory store.
 *
 * @returns The repository and its store.
 */
function makeRepo(): { repo: SessionHistoryRepository; store: KeyValueStore } {
  const store = createMemoryStore();
  return {
    repo: new SessionHistoryRepository(store, {
      newId: () => 'unused',
      now: () => '2026-08-09T10:00:00.000Z',
    }),
    store,
  };
}

describe('CAP-6 — session history', () => {
  it('starts empty and stores newest first', async () => {
    const { repo } = makeRepo();
    expect(await repo.list()).toEqual([]);

    await repo.append(record('a', 'set-1'));
    await repo.append(record('b', 'set-1'));
    expect((await repo.list()).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('reads one record by id and one set’s history', async () => {
    const { repo } = makeRepo();
    await repo.append(record('a', 'set-1'));
    await repo.append(record('b', 'set-2'));

    expect((await repo.get('a'))?.setId).toBe('set-1');
    expect(await repo.get('missing')).toBeNull();
    expect((await repo.listForSet('set-2')).map((r) => r.id)).toEqual(['b']);
  });

  it('replaces a record appended twice rather than duplicating it', async () => {
    const { repo } = makeRepo();
    await repo.append(record('a', 'set-1', { cardsCompleted: 1 }));
    await repo.append(record('a', 'set-1', { cardsCompleted: 5 }));
    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].cardsCompleted).toBe(5);
  });

  it(`prunes oldest-first past ${SESSION_HISTORY_LIMIT} PER SET, never across sets`, async () => {
    const { repo } = makeRepo();
    for (let n = 0; n < SESSION_HISTORY_LIMIT + 10; n++) {
      await repo.append(record(`busy-${n}`, 'set-busy'));
    }
    await repo.append(record('quiet-1', 'set-quiet'));
    for (let n = 0; n < 5; n++) await repo.append(record(`busy-extra-${n}`, 'set-busy'));

    const busy = await repo.listForSet('set-busy');
    expect(busy).toHaveLength(SESSION_HISTORY_LIMIT);
    // The newest survive.
    expect(busy[0].id).toBe('busy-extra-4');
    // A heavily-drilled set must not evict another set's history.
    expect((await repo.listForSet('set-quiet')).map((r) => r.id)).toEqual(['quiet-1']);
  });

  it('drops a set’s history when the set is deleted, leaving others alone', async () => {
    const { repo } = makeRepo();
    await repo.append(record('a', 'set-1'));
    await repo.append(record('b', 'set-2'));
    await repo.clearForSet('set-1');
    expect((await repo.list()).map((r) => r.id)).toEqual(['b']);
  });

  it('yields an empty history rather than throwing on a corrupt store', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(SESSION_HISTORY_KEY, 'not json');
    expect(await repo.list()).toEqual([]);

    await store.setItem(SESSION_HISTORY_KEY, '{"not":"an array"}');
    expect(await repo.list()).toEqual([]);
  });

  it('drops individually malformed records but keeps the readable ones', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify([record('good', 'set-1'), { id: 'broken' }, null, 42]),
    );
    expect((await repo.list()).map((r) => r.id)).toEqual(['good']);
  });
});
