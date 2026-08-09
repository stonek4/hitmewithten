/**
 * CAP-1 repository tests.
 *
 * These drive a **real** {@link LibraryRepository} over an in-memory store with
 * a deterministic clock — the same code path the app runs, with no module
 * mocking. Storage is the one place a mock would hide the bugs that matter.
 */

import type { IdentityContext } from '@/features/identity/types';
import { cardsKey, createMemoryStore, LIBRARY_KEY, QUARANTINE_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { LibraryRepository } from './api';

/**
 * Build a repository over a fresh in-memory store with a controllable clock.
 *
 * @returns The repository, its store, and a clock control.
 */
function makeRepo(): {
  repo: LibraryRepository;
  store: KeyValueStore;
  context: IdentityContext & { advanceDays(days: number): void };
} {
  let current = '2026-01-01T00:00:00.000Z';
  let counter = 0;
  const context = {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    now: () => current,
    advanceDays: (days: number) => {
      current = new Date(Date.parse(current) + days * 86_400_000).toISOString();
    },
  };
  const store = createMemoryStore();
  return { repo: new LibraryRepository(store, context), store, context };
}

/**
 * Create a set, asserting it did not hit a name conflict.
 *
 * @param repo The repository.
 * @param name The set name.
 * @returns The created set's id.
 */
async function createSetOrThrow(repo: LibraryRepository, name: string): Promise<string> {
  const result = await repo.createSet(name);
  if (result.status !== 'created') throw new Error(`Unexpected conflict creating ${name}`);
  return result.set.id;
}

describe('CAP-1 — first run', () => {
  it('reports an empty library rather than failing', async () => {
    const { repo } = makeRepo();
    expect(await repo.loadLibrary()).toEqual({
      summaries: [],
      currentSetId: null,
      quarantined: [],
    });
  });
});

describe('CAP-1 — creating and renaming sets', () => {
  it('creates a set and shows it in the library with a zero card count', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, '  SAT Words  ');
    const library = await repo.loadLibrary();
    expect(library.summaries).toEqual([
      expect.objectContaining({ id, name: 'SAT Words', cardCount: 0, isCurrent: false }),
    ]);
  });

  it('rejects an invalid name rather than storing it', async () => {
    const { repo } = makeRepo();
    await expect(repo.createSet('   ')).rejects.toThrow(RangeError);
    expect((await repo.loadLibrary()).summaries).toEqual([]);
  });

  it('SURFACES a duplicate name instead of destroying the existing set', async () => {
    // The confirmed legacy data-loss defect: the set name IS the storage key,
    // so creating a set with an existing name silently overwrote it.
    const { repo } = makeRepo();
    const originalId = await createSetOrThrow(repo, 'SAT Words');
    await repo.addCard(originalId, ['Extremely hungry'], ['ravenous']);

    const result = await repo.createSet('sat words');
    expect(result).toEqual({
      status: 'conflict',
      conflict: {
        existingSetId: originalId,
        existingName: 'SAT Words',
        existingCardCount: 1,
        suggestedName: 'sat words (2)',
      },
    });

    // Nothing was created and, crucially, nothing was destroyed.
    const library = await repo.loadLibrary();
    expect(library.summaries).toHaveLength(1);
    expect((await repo.listCards(originalId)).cards).toHaveLength(1);
  });

  it('resolves a conflict by renaming, keeping both sets and their cards', async () => {
    const { repo } = makeRepo();
    const originalId = await createSetOrThrow(repo, 'SAT Words');
    await repo.addCard(originalId, ['h'], ['a']);

    const created = await repo.createSetResolving('SAT Words', {
      kind: 'rename',
      name: 'SAT Words (2)',
    });
    expect(created.id).not.toBe(originalId);
    const library = await repo.loadLibrary();
    expect(library.summaries.map((s) => s.name).sort()).toEqual(['SAT Words', 'SAT Words (2)']);
    expect((await repo.listCards(originalId)).cards).toHaveLength(1);
  });

  it('resolves a conflict by replacing, which tombstones the old set explicitly', async () => {
    const { repo } = makeRepo();
    const originalId = await createSetOrThrow(repo, 'SAT Words');
    const created = await repo.createSetResolving('SAT Words', { kind: 'replace' });

    const library = await repo.loadLibrary();
    expect(library.summaries.map((s) => s.id)).toEqual([created.id]);
    // Soft, not destructive: the old set is recoverable within its window.
    expect(await repo.getSet(originalId)).toBeNull();
  });

  it('renames a set without touching its id or its cards', async () => {
    const { repo, context } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const card = await repo.addCard(id, ['Extremely hungry'], ['ravenous']);

    context.advanceDays(1);
    const result = await repo.renameSet(id, 'GRE Words');
    expect(result.status).toBe('created');

    const set = await repo.getSet(id);
    expect(set?.name).toBe('GRE Words');
    expect(set?.id).toBe(id);
    expect(set?.updatedAt).toBe('2026-01-02T00:00:00.000Z');
    const { cards } = await repo.listCards(id);
    expect(cards.map((c) => c.id)).toEqual([card.id]);
  });

  it('surfaces a conflict when renaming onto another set’s name', async () => {
    const { repo } = makeRepo();
    const a = await createSetOrThrow(repo, 'SAT Words');
    await createSetOrThrow(repo, 'GRE Words');
    const result = await repo.renameSet(a, 'gre words');
    expect(result.status).toBe('conflict');
    expect((await repo.getSet(a))?.name).toBe('SAT Words');
  });

  it('lets a set keep its own name on rename', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    expect((await repo.renameSet(id, 'SAT Words ')).status).toBe('created');
  });
});

describe('CAP-1 — the current-set selection', () => {
  it('selects and clears to a real null', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    await repo.setCurrentSet(id);
    expect((await repo.loadLibrary()).currentSetId).toBe(id);

    await repo.setCurrentSet(null);
    const cleared = (await repo.loadLibrary()).currentSetId;
    expect(cleared).toBeNull();
    expect(cleared).not.toBe('null');
  });

  it('clears the selection when the current set is deleted', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    await repo.setCurrentSet(id);
    await repo.deleteSet(id);

    const library = await repo.loadLibrary();
    expect(library.currentSetId).toBeNull();
    expect(library.summaries).toEqual([]);
  });

  it('refuses to select a set that does not exist', async () => {
    const { repo } = makeRepo();
    await expect(repo.setCurrentSet('nope')).rejects.toThrow(RangeError);
  });
});

describe('CAP-1 — cards', () => {
  it('adds, lists, edits and soft-deletes cards, keeping the count in step', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');

    await repo.addCard(id, ['Extremely hungry'], ['ravenous']);
    const second = await repo.addCard(id, ['A frozen dessert'], ['ice cream']);
    expect((await repo.loadLibrary()).summaries[0].cardCount).toBe(2);

    await repo.updateCard(id, second.id, { answers: ['ice cream', 'icecream'] });
    const { cards } = await repo.listCards(id);
    expect(cards[1].answers).toEqual(['ice cream', 'icecream']);

    await repo.deleteCard(id, second.id);
    expect((await repo.listCards(id)).cards.map((c) => c.id)).toEqual([cards[0].id]);
    expect((await repo.loadLibrary()).summaries[0].cardCount).toBe(1);
  });

  it('preserves internal whitespace byte-exactly — the missing-space marker needs it', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'Food');
    await repo.addCard(id, ['  A frozen dessert  '], ['  ice cream  ']);
    expect((await repo.listCards(id)).cards[0].answers).toEqual(['ice cream']);
  });

  it('refuses an ungradeable card rather than storing one a session would choke on', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    await expect(repo.addCard(id, ['hint'], ['   '])).rejects.toThrow(RangeError);
    await expect(repo.addCard('nope', ['hint'], ['a'])).rejects.toThrow(RangeError);
    expect((await repo.listCards(id)).cards).toEqual([]);
  });

  it('refuses an edit that would leave a card ungradeable', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const card = await repo.addCard(id, ['hint'], ['ravenous']);
    await expect(repo.updateCard(id, card.id, { answers: [''] })).rejects.toThrow(RangeError);
    expect((await repo.listCards(id)).cards[0].answers).toEqual(['ravenous']);
  });

  it('reorders by rewriting order only, never identity', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const a = await repo.addCard(id, ['a'], ['a']);
    const b = await repo.addCard(id, ['b'], ['b']);
    const c = await repo.addCard(id, ['c'], ['c']);

    await repo.reorderCards(id, [c.id, a.id, b.id]);
    const { cards } = await repo.listCards(id);
    expect(cards.map((card) => card.id)).toEqual([c.id, a.id, b.id]);
    expect(cards.map((card) => card.order)).toEqual([0, 1, 2]);
  });

  it('refuses a reorder that does not name exactly the live cards', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const a = await repo.addCard(id, ['a'], ['a']);
    await expect(repo.reorderCards(id, [a.id, 'ghost'])).rejects.toThrow(RangeError);
  });

  it('duplicates a set with fresh card ids, so sync cannot merge the two', async () => {
    const { repo } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const original = await repo.addCard(id, ['Extremely hungry'], ['ravenous']);

    const copy = await repo.duplicateSet(id, 'SAT Words (copy)');
    const copied = await repo.listCards(copy.id);
    expect(copied.cards).toHaveLength(1);
    expect(copied.cards[0].id).not.toBe(original.id);
    expect(copied.cards[0].answers).toEqual(['ravenous']);
    expect((await repo.loadLibrary()).summaries.map((s) => s.cardCount)).toEqual([1, 1]);
  });
});

describe('CAP-1 — corrupt storage is quarantined, never fatal', () => {
  it('does not blank the library when the document is not JSON', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(LIBRARY_KEY, '{ this is not json');

    const library = await repo.loadLibrary();
    expect(library.summaries).toEqual([]);
    expect(library.quarantined).toHaveLength(1);
    expect(library.quarantined[0].reasonKey).toBe('import.reason.notJson');
    // Nothing is ever actually lost.
    expect(library.quarantined[0].raw).toBe('{ this is not json');
    expect(await repo.listQuarantined()).toHaveLength(1);
  });

  it('keeps the readable sets when one entry is corrupt', async () => {
    const { repo, store } = makeRepo();
    const id = await createSetOrThrow(repo, 'Good Set');
    const raw = JSON.parse((await store.getItem(LIBRARY_KEY)) as string) as {
      sets: unknown[];
    };
    raw.sets.push({ id: 'broken', name: 42 });
    await store.setItem(LIBRARY_KEY, JSON.stringify(raw));

    const library = await repo.loadLibrary();
    expect(library.summaries.map((s) => s.id)).toEqual([id]);
    expect(library.quarantined).toHaveLength(1);
    expect(library.quarantined[0].reasonKey).toBe('storage.reason.badSet');
  });

  it('refuses a document written by a newer build rather than half-reading it', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(
      LIBRARY_KEY,
      JSON.stringify({ schemaVersion: 99, sets: [], cardCounts: {}, currentSetId: null }),
    );
    const library = await repo.loadLibrary();
    expect(library.quarantined[0].reasonKey).toBe('storage.reason.futureSchema');
  });

  it('never treats the literal string "null" as a set selection', async () => {
    // The legacy app writes exactly this for "no current set".
    const { repo, store } = makeRepo();
    await store.setItem(
      LIBRARY_KEY,
      JSON.stringify({ schemaVersion: 1, sets: [], cardCounts: {}, currentSetId: 'null' }),
    );
    const library = await repo.loadLibrary();
    expect(library.currentSetId).toBeNull();
  });

  it('drops a selection pointing at a set that no longer parses', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(
      LIBRARY_KEY,
      JSON.stringify({ schemaVersion: 1, sets: [], cardCounts: {}, currentSetId: 'ghost' }),
    );
    expect((await repo.loadLibrary()).currentSetId).toBeNull();
  });

  it('keeps the readable cards when one card is corrupt', async () => {
    const { repo, store } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    const good = await repo.addCard(id, ['h'], ['a']);
    const stored = JSON.parse((await store.getItem(cardsKey(id))) as string) as unknown[];
    stored.push({ id: 'broken' });
    await store.setItem(cardsKey(id), JSON.stringify(stored));

    const result = await repo.listCards(id);
    expect(result.cards.map((c) => c.id)).toEqual([good.id]);
    expect(result.quarantined[0].reasonKey).toBe('storage.reason.badCard');
  });

  it('survives a corrupt quarantine log without throwing', async () => {
    const { repo, store } = makeRepo();
    await store.setItem(QUARANTINE_KEY, 'not json either');
    expect(await repo.listQuarantined()).toEqual([]);
    await store.setItem(LIBRARY_KEY, 'also not json');
    expect((await repo.loadLibrary()).quarantined).toHaveLength(1);
  });
});

describe('CAP-1 — the summary index self-heals', () => {
  it('repairs a card count that drifted from what is on disk', async () => {
    // Simulates a crash between the card write and the index write.
    const { repo, store } = makeRepo();
    const id = await createSetOrThrow(repo, 'SAT Words');
    await repo.addCard(id, ['h'], ['a']);

    const document = JSON.parse((await store.getItem(LIBRARY_KEY)) as string) as {
      cardCounts: Record<string, number>;
    };
    document.cardCounts[id] = 99;
    await store.setItem(LIBRARY_KEY, JSON.stringify(document));
    expect((await repo.loadLibrary()).summaries[0].cardCount).toBe(99);

    await repo.listCards(id);
    expect((await repo.loadLibrary()).summaries[0].cardCount).toBe(1);
  });
});

describe('CAP-1 — import', () => {
  it('creates a set and its cards in one operation', async () => {
    const { repo } = makeRepo();
    const { set, cards } = await repo.importSet('Imported', [
      { hints: ['Extremely hungry'], answers: ['ravenous'] },
      { hints: ['A frozen dessert'], answers: ['ice cream'] },
    ]);
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.order)).toEqual([0, 1]);
    expect((await repo.loadLibrary()).summaries).toEqual([
      expect.objectContaining({ id: set.id, name: 'Imported', cardCount: 2 }),
    ]);
  });

  it('reports a name conflict before importing anything', async () => {
    const { repo } = makeRepo();
    await createSetOrThrow(repo, 'Imported');
    expect(await repo.checkNameConflict('imported')).toEqual(
      expect.objectContaining({ suggestedName: 'imported (2)' }),
    );
    expect(await repo.checkNameConflict('Something else')).toBeNull();
  });
});

describe('CAP-1 — scale', () => {
  it('serves the library list without reading a single card document', async () => {
    const { repo, store } = makeRepo();
    const id = await createSetOrThrow(repo, 'Big Set');
    for (let n = 0; n < 50; n++) await repo.addCard(id, [`hint ${n}`], [`answer${n}`]);

    let cardReads = 0;
    const counting: KeyValueStore = {
      ...store,
      getItem: async (key) => {
        if (key.startsWith('vc:cards:')) cardReads++;
        return store.getItem(key);
      },
    };
    const counted = new LibraryRepository(counting, {
      newId: () => 'unused',
      now: () => '2026-01-01T00:00:00.000Z',
    });

    const library = await counted.loadLibrary();
    expect(library.summaries[0].cardCount).toBe(50);
    expect(cardReads).toBe(0);
  });
});
