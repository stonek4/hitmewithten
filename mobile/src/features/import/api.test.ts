/**
 * CAP-8 importer tests.
 *
 * Driven against a **real** LibraryRepository and TrophyRepository over
 * in-memory stores — the same code paths the app runs. The legacy store is a
 * real read-only view over a real legacy `localStorage` snapshot.
 */

import type { IdentityContext } from '@/features/identity/types';
import { LibraryRepository } from '@/features/library/api';
import { TrophyRepository } from '@/features/trophies/api';
import { createMemoryLegacyStore } from '@/services/legacyStorage';
import { createMemoryStore, LEGACY_MIGRATION_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { ImportService } from './api';

/** The exact shape REBUILD_SPEC §6 documents for a `.cards` payload. */
const SAT_WORDS = JSON.stringify([
  { definitions: ['Extremely hungry'], answers: ['ravenous'] },
  { definitions: ['To speak in favor of'], answers: ['advocate'] },
]);
const SPANISH = JSON.stringify([{ definitions: ['Hello'], answers: ['hola'] }]);
const FOOD = JSON.stringify([{ definitions: ['A frozen dessert'], answers: ['ice cream'] }]);

/**
 * Build an importer over fresh in-memory storage.
 *
 * @returns The service and the repositories behind it.
 */
function makeService(): {
  service: ImportService;
  library: LibraryRepository;
  trophies: TrophyRepository;
  store: KeyValueStore;
} {
  let counter = 0;
  const context: IdentityContext = {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    now: () => '2026-08-09T00:00:00.000Z',
  };
  const store = createMemoryStore();
  const library = new LibraryRepository(store, context);
  const trophies = new TrophyRepository(store, context);
  return { service: new ImportService(library, trophies, store, context), library, trophies, store };
}

describe('CAP-8 — .cards file import', () => {
  it('imports a real legacy file, taking the set name from the filename', async () => {
    const { service, library } = makeService();
    const report = await service.importFiles([{ name: 'SAT Words.cards', text: SAT_WORDS }]);

    expect(report).toMatchObject({ imported: 1, failed: 0, cards: 2 });
    expect(report.items[0]).toMatchObject({ outcome: 'imported', cardCount: 2 });

    const summaries = await library.listSummaries();
    expect(summaries).toEqual([expect.objectContaining({ name: 'SAT Words', cardCount: 2 })]);
    const { cards } = await library.listCards(summaries[0].id);
    expect(cards.map((c) => c.answers[0])).toEqual(['ravenous', 'advocate']);
    expect(cards.map((c) => c.hints[0])).toEqual(['Extremely hungry', 'To speak in favor of']);
  });

  it('IMPORTS EVERY SELECTED FILE — the legacy app silently dropped all but the first', async () => {
    // REBUILD_SPEC defect #5: a single reused FileReader with readAsText called
    // before onload was assigned. The picker advertised `multiple`, so users
    // were actively invited into the broken path.
    const { service, library } = makeService();
    const report = await service.importFiles([
      { name: 'SAT Words.cards', text: SAT_WORDS },
      { name: 'Spanish 101.cards', text: SPANISH },
      { name: 'Food.cards', text: FOOD },
    ]);

    expect(report.imported).toBe(3);
    expect(report.cards).toBe(4);
    const names = (await library.listSummaries()).map((s) => s.name).sort();
    expect(names).toEqual(['Food', 'SAT Words', 'Spanish 101']);
  });

  it('keeps importing the good files when one in the middle is broken', async () => {
    const { service, library } = makeService();
    const report = await service.importFiles([
      { name: 'Good.cards', text: SAT_WORDS },
      { name: 'Broken.cards', text: '{ not json at all' },
      { name: 'Also Good.cards', text: SPANISH },
    ]);

    expect(report.items.map((i) => i.outcome)).toEqual(['imported', 'quarantined', 'imported']);
    expect(report.items[1].reasonKey).toBe('import.reason.notJson');
    expect((await library.listSummaries()).map((s) => s.name).sort()).toEqual([
      'Also Good',
      'Good',
    ]);
  });

  it('quarantines and names the reason rather than failing silently', async () => {
    const { service, library } = makeService();
    const report = await service.importFiles([
      { name: 'Empty.cards', text: '   ' },
      { name: 'NotArray.cards', text: '{"a":1}' },
      { name: 'NoCards.cards', text: '[]' },
      { name: '.cards', text: SAT_WORDS },
    ]);

    expect(report.items.map((i) => [i.outcome, i.reasonKey])).toEqual([
      ['quarantined', 'import.reason.empty'],
      ['quarantined', 'import.reason.notAnArray'],
      ['quarantined', 'import.reason.noUsableCards'],
      ['failed', 'import.reason.nameEmpty'],
    ]);
    expect(report.failed).toBe(4);
    expect(await library.listSummaries()).toEqual([]);
  });

  it('renames on a collision by default, so an import can never destroy a set', async () => {
    const { service, library } = makeService();
    await service.importFiles([{ name: 'SAT Words.cards', text: SAT_WORDS }]);
    const report = await service.importFiles([{ name: 'SAT Words.cards', text: SPANISH }]);

    expect(report.items[0]).toMatchObject({ outcome: 'renamed', cardCount: 1 });
    const summaries = await library.listSummaries();
    expect(summaries.map((s) => s.name).sort()).toEqual(['SAT Words', 'SAT Words (2)']);
    // The original is untouched.
    const original = summaries.find((s) => s.name === 'SAT Words');
    expect(original?.cardCount).toBe(2);
  });

  it('replaces only when the caller explicitly asks for it', async () => {
    const { service, library } = makeService();
    await service.importFiles([{ name: 'SAT Words.cards', text: SAT_WORDS }]);
    const report = await service.importFiles(
      [{ name: 'SAT Words.cards', text: SPANISH }],
      'replace',
    );

    expect(report.items[0].outcome).toBe('replaced');
    const summaries = await library.listSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ name: 'SAT Words', cardCount: 1 });
  });

  it('assigns fresh ids and timestamps — the legacy format carries neither', async () => {
    const { service, library } = makeService();
    await service.importFiles([{ name: 'A.cards', text: SAT_WORDS }]);
    const [summary] = await library.listSummaries();
    const { cards } = await library.listCards(summary.id);
    for (const card of cards) {
      expect(card.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(card.createdAt).toBe('2026-08-09T00:00:00.000Z');
      expect(card.deletedAt).toBeNull();
      expect(card.schemaVersion).toBe(1);
    }
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('imports nothing at all from an empty selection', async () => {
    const { service } = makeService();
    expect(await service.importFiles([])).toEqual({ items: [], imported: 0, failed: 0, cards: 0 });
  });
});

describe('CAP-8 — automatic same-origin migration', () => {
  /** A realistic legacy `localStorage` snapshot. */
  const LEGACY = {
    keys: JSON.stringify(['Spanish 101', 'SAT Words']),
    current: 'SAT Words',
    'Spanish 101.cards': SPANISH,
    'SAT Words.cards': SAT_WORDS,
    trophies: JSON.stringify([
      { type: 'CardsTestedTrophy', goal: 10, cards: 10, newObtained: false },
      { type: 'CardsTestedTrophy', goal: 50, cards: 14, newObtained: true },
      { type: 'CardsPassedTrophy', goal: 50, cards: 9, newObtained: true },
    ]),
  };

  it('adopts sets, cards, the selection and trophies with no user action', async () => {
    const { service, library, trophies } = makeService();
    const record = await service.migrateLegacyStorage(createMemoryLegacyStore(LEGACY));

    expect(record).toMatchObject({ sets: 2, cards: 3, trophiesMigrated: true });

    const snapshot = await library.loadLibrary();
    expect(snapshot.summaries.map((s) => s.name).sort()).toEqual(['SAT Words', 'Spanish 101']);
    // The legacy selection is re-pointed at the NEW id.
    const sat = snapshot.summaries.find((s) => s.name === 'SAT Words');
    expect(snapshot.currentSetId).toBe(sat?.id);

    const state = await trophies.load();
    expect(state.tested).toBe(14);
    expect(state.passed).toBe(9);
    expect(state.unlockedAt['tested-10']).toBeDefined();
    expect(state.notifiedTrophyIds).toEqual(['tested-10']);
  });

  it('NEVER writes to or deletes the legacy store', async () => {
    const { service } = makeService();
    const snapshot = { ...LEGACY };
    const legacy = createMemoryLegacyStore(snapshot);
    // The interface has no mutators at all, which is the structural guarantee.
    expect('setItem' in legacy).toBe(false);
    expect('removeItem' in legacy).toBe(false);

    await service.migrateLegacyStorage(legacy);
    for (const key of Object.keys(LEGACY)) {
      expect(legacy.getItem(key)).toBe(LEGACY[key as keyof typeof LEGACY]);
    }
  });

  it('runs exactly once — a second call cannot duplicate the library', async () => {
    const { service, library } = makeService();
    const legacy = createMemoryLegacyStore(LEGACY);

    expect(await service.migrateLegacyStorage(legacy)).not.toBeNull();
    expect(await service.migrateLegacyStorage(legacy)).toBeNull();
    expect(await library.listSummaries()).toHaveLength(2);
  });

  it('treats an unreadable marker as "already run" rather than risking a duplicate', async () => {
    const { service, store } = makeService();
    await store.setItem(LEGACY_MIGRATION_KEY, 'corrupt');
    expect(await service.migrateLegacyStorage(createMemoryLegacyStore(LEGACY))).toBeNull();
  });

  it('does nothing when there is no legacy data', async () => {
    const { service } = makeService();
    expect(await service.migrateLegacyStorage(createMemoryLegacyStore({}))).toBeNull();
    expect(await service.migrateLegacyStorage(null)).toBeNull();
  });

  it('treats the literal string "null" as no selection', async () => {
    const { service, library } = makeService();
    await service.migrateLegacyStorage(
      createMemoryLegacyStore({ ...LEGACY, current: 'null' }),
    );
    expect((await library.loadLibrary()).currentSetId).toBeNull();
  });

  it('ignores a selection naming a set that no longer exists', async () => {
    const { service, library } = makeService();
    await service.migrateLegacyStorage(
      createMemoryLegacyStore({ ...LEGACY, current: 'Deleted Set' }),
    );
    expect((await library.loadLibrary()).currentSetId).toBeNull();
  });

  it('skips a key listed in `keys` whose cards value is missing', async () => {
    const { service, library } = makeService();
    const record = await service.migrateLegacyStorage(
      createMemoryLegacyStore({
        keys: JSON.stringify(['Ghost', 'SAT Words']),
        'SAT Words.cards': SAT_WORDS,
      }),
    );
    expect(record?.sets).toBe(1);
    expect((await library.listSummaries()).map((s) => s.name)).toEqual(['SAT Words']);
  });

  it('quarantines a corrupt set but still adopts the readable ones', async () => {
    const { service, library } = makeService();
    const record = await service.migrateLegacyStorage(
      createMemoryLegacyStore({
        keys: JSON.stringify(['Broken', 'SAT Words']),
        'Broken.cards': 'not json',
        'SAT Words.cards': SAT_WORDS,
      }),
    );
    expect(record?.sets).toBe(1);
    expect(record?.items.map((i) => i.outcome)).toEqual(['quarantined', 'imported']);
    expect(record?.items[0].reasonKey).toBe('import.reason.notJson');
    expect(await library.listSummaries()).toHaveLength(1);
  });

  it('migrates trophies even when there are no sets at all', async () => {
    const { service, trophies } = makeService();
    const record = await service.migrateLegacyStorage(
      createMemoryLegacyStore({ trophies: LEGACY.trophies }),
    );
    expect(record).toMatchObject({ sets: 0, trophiesMigrated: true });
    expect((await trophies.load()).tested).toBe(14);
  });

  it('never reduces progress already made in the rebuild', async () => {
    const { service, trophies } = makeService();
    await trophies.increment({ tested: 500 });
    await service.migrateLegacyStorage(createMemoryLegacyStore(LEGACY));
    // max(500, 14) — adopting legacy progress must not roll the user back.
    expect((await trophies.load()).tested).toBe(500);
  });

  it('renames rather than replacing when a legacy name collides with an existing set', async () => {
    const { service, library } = makeService();
    await library.importSet('SAT Words', [{ hints: ['mine'], answers: ['mine'] }]);
    await service.migrateLegacyStorage(createMemoryLegacyStore(LEGACY));

    const names = (await library.listSummaries()).map((s) => s.name).sort();
    expect(names).toEqual(['SAT Words', 'SAT Words (2)', 'Spanish 101']);
    const original = (await library.listSummaries()).find((s) => s.name === 'SAT Words');
    expect(original?.cardCount).toBe(1);
  });

  it('reports what is available before migrating, for the prompt', async () => {
    const { service } = makeService();
    expect(service.detectLegacyData(createMemoryLegacyStore(LEGACY))).toEqual({
      setNames: ['Spanish 101', 'SAT Words'],
      hasTrophies: true,
    });
    expect(service.detectLegacyData(createMemoryLegacyStore({}))).toEqual({
      setNames: [],
      hasTrophies: false,
    });
    expect(service.detectLegacyData(null)).toEqual({ setNames: [], hasTrophies: false });
  });

  it('survives a legacy store that is entirely garbage', async () => {
    const { service } = makeService();
    const record = await service.migrateLegacyStorage(
      createMemoryLegacyStore({ keys: 'garbage', current: '{{{', trophies: 'nope' }),
    );
    expect(record).toBeNull();
  });
});
