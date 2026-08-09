/**
 * CAP-13 engine tests.
 *
 * The merge *decisions* are pure and tested in `logic.test.ts`. What is tested
 * here is the engine's *sequencing*, against real repositories over in-memory
 * storage and an in-memory backend.
 *
 * **What this cannot prove:** rules, indexes and Firestore serialisation. The
 * emulator needs Java, which is not available in this environment, so those
 * remain the outstanding verification recorded in `SYNC-SETUP.md` §3. A double
 * catches orchestration bugs; it does not catch backend bugs, and this file
 * does not pretend otherwise.
 */

import type { Card, CardSet, IdentityContext, Tracked } from '@/features/identity/types';
import { LibraryRepository } from '@/features/library/api';
import { TrophyRepository } from '@/features/trophies/api';
import { emptyTrophyState } from '@/features/trophies/logic';
import type { TrophyState } from '@/features/trophies/types';
import { createMemoryStore } from '@/services/storage';

import { SyncService } from './api';
import type { SyncBackend } from './backend';
import type { Remote } from './types';

/** An in-memory {@link SyncBackend} that records what it was asked to do. */
class FakeBackend implements SyncBackend {
  sets = new Map<string, Remote<CardSet>>();
  cards = new Map<string, Remote<Card>>();
  trophies: TrophyState | null = null;
  /** Every call, in order — the point of the whole double. */
  calls: string[] = [];
  /** Set to make the next write throw, simulating a mid-pass failure. */
  failWrites = false;
  /** The server clock, so writes get a deterministic ordering stamp. */
  now = '2026-09-01T00:00:00.000Z';

  /** @inheritdoc */
  async readSets(): Promise<Remote<CardSet>[]> {
    this.calls.push('readSets');
    return [...this.sets.values()];
  }

  /** @inheritdoc */
  async readCards(): Promise<Remote<Card>[]> {
    this.calls.push('readCards');
    return [...this.cards.values()];
  }

  /** @inheritdoc */
  async writeEntities(
    _uid: string,
    path: 'sets' | 'cards',
    entities: readonly Tracked[],
  ): Promise<void> {
    this.calls.push(`write:${path}:${entities.length}`);
    if (this.failWrites) throw Object.assign(new Error('nope'), { code: 'unavailable' });
    for (const entity of entities) {
      // The server stamps the ordering timestamp, exactly as the rules require.
      const stamped = { ...entity, serverUpdatedAt: this.now };
      if (path === 'sets') this.sets.set(entity.id, stamped as Remote<CardSet>);
      else this.cards.set(entity.id, stamped as Remote<Card>);
    }
  }

  /** @inheritdoc */
  async readTrophies(): Promise<TrophyState | null> {
    this.calls.push('readTrophies');
    return this.trophies;
  }

  /** @inheritdoc */
  async writeTrophies(_uid: string, state: TrophyState): Promise<void> {
    this.calls.push('writeTrophies');
    this.trophies = state;
  }

  /** @inheritdoc */
  async deleteAll(): Promise<void> {
    this.calls.push('deleteAll');
    this.sets.clear();
    this.cards.clear();
    this.trophies = null;
  }
}

/**
 * Build a full stack over in-memory storage.
 *
 * @param seed A prefix for generated ids, so two stacks never collide.
 * @returns The service and the pieces behind it.
 */
function makeStack(seed = 'a'): {
  sync: SyncService;
  library: LibraryRepository;
  trophies: TrophyRepository;
  backend: FakeBackend;
} {
  let counter = 0;
  // A TICKING clock. A frozen one makes every mutation share a timestamp with
  // the sync watermark, which hides exactly the class of bug the watermark
  // ordering exists to prevent.
  let tick = 0;
  const context: IdentityContext = {
    newId: () => `${seed}0000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    now: () => new Date(Date.UTC(2026, 8, 2, 0, 0, ++tick)).toISOString(),
  };
  const store = createMemoryStore();
  const library = new LibraryRepository(store, context);
  const trophies = new TrophyRepository(store, context);
  const backend = new FakeBackend();
  return { sync: new SyncService(library, trophies, backend, context), library, trophies, backend };
}

describe('CAP-13 — first sign-in ADOPTS local data', () => {
  it('uploads a library created before signing in', async () => {
    const { sync, library, backend } = makeStack();
    await library.importSet('Made offline', [
      { hints: ['Extremely hungry'], answers: ['ravenous'] },
      { hints: ['A frozen dessert'], answers: ['ice cream'] },
    ]);

    const outcome = await sync.sync('uid-1');
    expect(outcome.ok).toBe(true);
    expect(outcome.report).toMatchObject({ uploaded: 1, downloaded: 0, cards: 2 });
    expect(backend.sets.size).toBe(1);
    expect(backend.cards.size).toBe(2);
    // Nothing local was destroyed.
    expect((await library.listSummaries())[0].name).toBe('Made offline');
  });

  it('brings down a library that exists only in the cloud', async () => {
    const { sync, library, backend } = makeStack();
    const other = makeStack('b');
    await other.library.importSet('From another device', [{ hints: ['h'], answers: ['a'] }]);
    await other.sync.sync('uid-1');
    backend.sets = other.backend.sets;
    backend.cards = other.backend.cards;

    await sync.sync('uid-1');
    const summaries = await library.listSummaries();
    expect(summaries.map((s) => s.name)).toEqual(['From another device']);
    expect((await library.listCards(summaries[0].id)).cards).toHaveLength(1);
  });

  it('merges both sides without losing either', async () => {
    const { sync, library, backend } = makeStack();
    const other = makeStack('b');
    await other.library.importSet('Theirs', [{ hints: ['h'], answers: ['a'] }]);
    await other.sync.sync('uid-1');
    backend.sets = new Map(other.backend.sets);
    backend.cards = new Map(other.backend.cards);

    await library.importSet('Mine', [{ hints: ['h'], answers: ['b'] }]);
    const outcome = await sync.sync('uid-1');

    expect(outcome.report).toMatchObject({ uploaded: 1, downloaded: 1 });
    expect((await library.listSummaries()).map((s) => s.name).sort()).toEqual(['Mine', 'Theirs']);
    expect(backend.sets.size).toBe(2);
  });
});

describe('CAP-13 — sequencing', () => {
  it('reads and applies the server’s copies BEFORE uploading', async () => {
    // If the upload half fails, the user must end up with more data, not less.
    const { sync, library, backend } = makeStack();
    await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');

    const readIndex = backend.calls.indexOf('readSets');
    const writeIndex = backend.calls.findIndex((c) => c.startsWith('write:'));
    expect(readIndex).toBeGreaterThanOrEqual(0);
    expect(writeIndex).toBeGreaterThan(readIndex);
  });

  it('keeps downloaded data when the upload half fails', async () => {
    const { sync, library, backend } = makeStack();
    const other = makeStack('b');
    await other.library.importSet('Theirs', [{ hints: ['h'], answers: ['a'] }]);
    await other.sync.sync('uid-1');
    backend.sets = new Map(other.backend.sets);
    backend.cards = new Map(other.backend.cards);

    await library.importSet('Mine', [{ hints: ['h'], answers: ['b'] }]);
    backend.failWrites = true;

    const outcome = await sync.sync('uid-1');
    expect(outcome).toEqual({ ok: false, reasonKey: 'sync.error.network' });
    // Strictly more, never less: the download landed, the local set survived.
    expect((await library.listSummaries()).map((s) => s.name).sort()).toEqual(['Mine', 'Theirs']);
  });

  it('does not mark anything synced when the pass failed, so it retries', async () => {
    const { sync, library, backend } = makeStack();
    await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    backend.failWrites = true;
    await sync.sync('uid-1');

    const { sets } = await library.readAllForSync();
    expect(sets[0].syncedAt).toBeNull();

    // A later successful pass uploads it.
    backend.failWrites = false;
    expect((await sync.sync('uid-1')).ok).toBe(true);
    expect(backend.sets.size).toBe(1);
  });

  it('does not lose an edit made DURING a pass to an entity that pass is uploading', async () => {
    // The subtle one. `markSynced` only stamps the ids that were in the plan,
    // which already protects an entity edited mid-pass that was NOT being
    // uploaded. The gap is an entity that IS in the plan: it gets uploaded with
    // its old content, edited during the pass, and then stamped as reconciled.
    // Capturing the watermark BEFORE the read is what closes it — the new edit
    // carries a later timestamp than the watermark and stays dirty.
    const { sync, library, backend } = makeStack();
    const { set } = await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');

    // Make the SET itself dirty, so it is in the upload plan.
    await library.renameSet(set.id, 'First rename');

    let edited = false;
    const realWrite = backend.writeEntities.bind(backend);
    backend.writeEntities = async (uid, path, entities) => {
      await realWrite(uid, path, entities);
      if (path === 'sets' && !edited) {
        edited = true;
        await library.renameSet(set.id, 'Renamed mid-pass');
      }
    };

    await sync.sync('uid-1');
    backend.writeEntities = realWrite;

    // The mid-pass rename must still be pending, not swallowed.
    const { sets } = await library.readAllForSync();
    const mine = sets.find((entry) => entry.id === set.id) as CardSet;
    expect(mine.name).toBe('Renamed mid-pass');
    expect(mine.syncedAt === null || mine.updatedAt > mine.syncedAt).toBe(true);

    // And the next pass actually uploads it.
    await sync.sync('uid-1');
    expect(backend.sets.get(set.id)?.name).toBe('Renamed mid-pass');
  });

  it('is idempotent — a second pass with no changes uploads nothing', async () => {
    const { sync, library, backend } = makeStack();
    await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');
    backend.calls = [];

    const outcome = await sync.sync('uid-1');
    expect(outcome.ok).toBe(true);
    // A write call with zero entities is fine and cheap; a write call carrying
    // entities means the pass re-uploaded something that had not changed.
    expect(backend.calls.filter((c) => /^write:(sets|cards):[1-9]/.test(c))).toEqual([]);
  });
});

describe('CAP-13 — tombstones propagate', () => {
  it('uploads a deletion and does not resurrect the entity', async () => {
    const { sync, library, backend } = makeStack();
    const { set } = await library.importSet('Doomed', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');

    await library.deleteSet(set.id);
    await sync.sync('uid-1');
    expect(backend.sets.get(set.id)?.deletedAt).not.toBeNull();

    // A further pass must not bring it back from the server.
    await sync.sync('uid-1');
    expect(await library.getSet(set.id)).toBeNull();
  });

  it('applies a remote deletion locally', async () => {
    const { sync, library, backend } = makeStack();
    const { set } = await library.importSet('Doomed', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');

    // Another device deleted it, later.
    const remote = backend.sets.get(set.id) as Remote<CardSet>;
    backend.sets.set(set.id, {
      ...remote,
      deletedAt: '2026-09-05T00:00:00.000Z',
      updatedAt: '2026-09-05T00:00:00.000Z',
      serverUpdatedAt: '2026-09-05T00:00:00.000Z',
    });

    await sync.sync('uid-1');
    expect(await library.getSet(set.id)).toBeNull();
  });
});

describe('CAP-13 — trophies merge by max()', () => {
  it('takes the higher counter from either side', async () => {
    const { sync, trophies, backend } = makeStack();
    await trophies.increment({ tested: 40 });
    backend.trophies = { ...emptyTrophyState('2026-08-01T00:00:00.000Z'), tested: 12, passed: 99 };

    await sync.sync('uid-1');

    const merged = await trophies.load();
    expect(merged.tested).toBe(40);
    expect(merged.passed).toBe(99);
    expect(backend.trophies?.tested).toBe(40);
  });

  it('writes local state when the server has none', async () => {
    const { sync, trophies, backend } = makeStack();
    await trophies.increment({ failed: 7 });
    await sync.sync('uid-1');
    expect(backend.trophies?.failed).toBe(7);
  });
});

describe('CAP-13 — account deletion', () => {
  it('erases every cloud document', async () => {
    const { sync, library, backend } = makeStack();
    await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    await sync.sync('uid-1');
    expect(backend.sets.size).toBe(1);

    await sync.deleteAllCloudData('uid-1');
    expect(backend.sets.size).toBe(0);
    expect(backend.cards.size).toBe(0);
    expect(backend.trophies).toBeNull();
    // Local data is NOT touched here — keeping or removing it is a separate,
    // explicit choice the user makes (US-I4/US-I6).
    expect(await library.listSummaries()).toHaveLength(1);
  });
});

describe('CAP-13 — failures never damage local data', () => {
  it('reports a nameable reason and leaves the library intact', async () => {
    const { sync, library, backend } = makeStack();
    await library.importSet('Mine', [{ hints: ['h'], answers: ['a'] }]);
    backend.failWrites = true;

    const outcome = await sync.sync('uid-1');
    expect(outcome.ok).toBe(false);
    expect(outcome.reasonKey).toBe('sync.error.network');
    expect((await library.listSummaries()).map((s) => s.name)).toEqual(['Mine']);
  });
});
