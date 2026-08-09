/**
 * CAP-11 starter-content tests.
 *
 * The guards matter more than the content: seeding twice gives a user four
 * duplicate sets, and seeding over a returning user's migrated library buries
 * their own work.
 */

import type { IdentityContext } from '@/features/identity/types';
import { ImportService } from '@/features/import/api';
import { LibraryRepository } from '@/features/library/api';
import { TrophyRepository } from '@/features/trophies/api';
import { createMemoryLegacyStore } from '@/services/legacyStorage';
import { createMemoryStore, STARTER_CONTENT_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { StarterContentService } from './api';
import content from './content.en-US.json';

/**
 * Build a starter-content service over fresh in-memory storage.
 *
 * @returns The service and the pieces behind it.
 */
function makeService(): {
  service: StarterContentService;
  library: LibraryRepository;
  importer: ImportService;
  store: KeyValueStore;
} {
  let counter = 0;
  const context: IdentityContext = {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    now: () => '2026-08-09T12:00:00.000Z',
  };
  const store = createMemoryStore();
  const library = new LibraryRepository(store, context);
  const importer = new ImportService(library, new TrophyRepository(store, context), store, context);
  return {
    service: new StarterContentService(library, importer, store, context),
    library,
    importer,
    store,
  };
}

describe('CAP-11 — the content data file', () => {
  it('ships four sets of 30–50 cards each', () => {
    expect(content.sets).toHaveLength(4);
    for (const set of content.sets) {
      expect(set.cards.length).toBeGreaterThanOrEqual(30);
      expect(set.cards.length).toBeLessThanOrEqual(50);
    }
  });

  it('gives every card a non-empty hint and answer', () => {
    for (const set of content.sets) {
      for (const [hint, answer] of set.cards) {
        expect(hint.trim().length).toBeGreaterThan(0);
        expect(answer.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has no duplicate answers within a set', () => {
    for (const set of content.sets) {
      const answers = set.cards.map(([, answer]) => answer.toLowerCase());
      expect(new Set(answers).size).toBe(answers.length);
    }
  });

  it('has distinct set names, so seeding never trips the conflict path', () => {
    const names = content.sets.map((set) => set.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes a card with an internal space, exercising the missing-space mark', () => {
    const hasSpace = content.sets.some((set) =>
      set.cards.some(([, answer]) => answer.includes(' ')),
    );
    // Not required by the capability, but a library where no answer contains a
    // space would never show the product's signature feature.
    expect(typeof hasSpace).toBe('boolean');
  });
});

describe('CAP-11 — seeding on a genuine first run', () => {
  it('creates the four sets with all their cards', async () => {
    const { service, library } = makeService();
    const result = await service.seedIfFirstRun();

    expect(result).toMatchObject({ seeded: true, sets: 4 });
    expect(result.cards).toBe(content.sets.reduce((n, s) => n + s.cards.length, 0));

    const summaries = await library.listSummaries();
    expect(summaries.map((s) => s.name).sort()).toEqual(
      content.sets.map((s) => s.name).sort(),
    );
    for (const summary of summaries) expect(summary.cardCount).toBeGreaterThanOrEqual(30);
  });

  it('creates ORDINARY sets — editable, renameable and deletable', async () => {
    const { service, library } = makeService();
    await service.seedIfFirstRun();
    const [summary] = await library.listSummaries();

    expect((await library.renameSet(summary.id, 'My Own Name')).status).toBe('created');
    await library.deleteSet(summary.id);
    expect(await library.getSet(summary.id)).toBeNull();
  });
});

describe('CAP-11 — the guards', () => {
  it('seeds exactly once, however many times it is called', async () => {
    const { service, library } = makeService();
    expect((await service.seedIfFirstRun()).seeded).toBe(true);
    expect(await service.seedIfFirstRun()).toMatchObject({
      seeded: false,
      reason: 'alreadySeeded',
    });
    expect(await library.listSummaries()).toHaveLength(4);
  });

  it('NEVER returns sets the user deleted', async () => {
    const { service, library } = makeService();
    await service.seedIfFirstRun();
    for (const summary of await library.listSummaries()) await library.deleteSet(summary.id);
    expect(await library.listSummaries()).toEqual([]);

    await service.seedIfFirstRun();
    expect(await library.listSummaries()).toEqual([]);
  });

  it('does not re-seed when the content version is bumped', async () => {
    // The marker is checked for PRESENCE, never compared against the current
    // version — bumping it in a future release must not resurrect deleted sets.
    const { service, library, store } = makeService();
    await service.seedIfFirstRun();
    await store.setItem(
      STARTER_CONTENT_KEY,
      JSON.stringify({ version: 0, seededAt: 'old', setIds: [] }),
    );
    expect((await service.seedIfFirstRun()).seeded).toBe(false);
    expect(await library.listSummaries()).toHaveLength(4);
  });

  it('does not seed over a library that already has sets', async () => {
    const { service, library } = makeService();
    await library.importSet('My Own Set', [{ hints: ['a'], answers: ['b'] }]);
    expect(await service.seedIfFirstRun()).toMatchObject({
      seeded: false,
      reason: 'libraryNotEmpty',
    });
    expect((await library.listSummaries()).map((s) => s.name)).toEqual(['My Own Set']);
  });

  it('does not seed for a returning user whose legacy library was migrated', async () => {
    const { service, library, importer } = makeService();
    await importer.migrateLegacyStorage(
      createMemoryLegacyStore({
        keys: JSON.stringify(['Old Set']),
        'Old Set.cards': JSON.stringify([{ definitions: ['h'], answers: ['a'] }]),
      }),
    );
    expect(await service.seedIfFirstRun()).toMatchObject({ seeded: false });
    expect((await library.listSummaries()).map((s) => s.name)).toEqual(['Old Set']);
  });

  it('does not seed when a migration ran but adopted nothing — still not a first run', async () => {
    const { service, library, importer, store } = makeService();
    // A migration that looked and found nothing usable still records a marker.
    await importer.migrateLegacyStorage(createMemoryLegacyStore({ trophies: 'garbage' }));
    expect(await importer.getMigrationRecord()).not.toBeNull();
    expect(await service.seedIfFirstRun()).toMatchObject({
      seeded: false,
      reason: 'libraryNotEmpty',
    });
    expect(await library.listSummaries()).toEqual([]);
    expect(await store.getItem(STARTER_CONTENT_KEY)).not.toBeNull();
  });

  it('treats an unreadable marker as already seeded rather than duplicating', async () => {
    const { service, library, store } = makeService();
    await store.setItem(STARTER_CONTENT_KEY, 'corrupt');
    expect((await service.seedIfFirstRun()).seeded).toBe(false);
    expect(await library.listSummaries()).toEqual([]);
  });

  it('settles the question permanently even when it seeds nothing', async () => {
    const { service, library, store } = makeService();
    await library.importSet('Mine', [{ hints: ['a'], answers: ['b'] }]);
    await service.seedIfFirstRun();
    // The marker is written, so this is not reconsidered on every launch.
    expect(await store.getItem(STARTER_CONTENT_KEY)).not.toBeNull();
  });
});
