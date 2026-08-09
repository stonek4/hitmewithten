/**
 * CAP-8 — the importer.
 *
 * Two entry points, one shared engine:
 * - {@link ImportService.importFiles} — one or many `.cards` files.
 * - {@link ImportService.migrateLegacyStorage} — the automatic, one-time
 *   same-origin adoption of a returning web user's library.
 *
 * Everything is written through {@link LibraryRepository}, so imported entities
 * get fresh CAP-12 ids and timestamps (the legacy format carries neither) and
 * name collisions route through CAP-1's conflict handling.
 */

import { libraryRepository } from '@/features/library/api';
import type { LibraryRepository } from '@/features/library/api';
import { validateSetName } from '@/features/library/logic';
import { trophyRepository } from '@/features/trophies/api';
import type { TrophyRepository } from '@/features/trophies/api';
import { migrateLegacyTrophies } from '@/features/trophies/logic';
import type { IdentityContext } from '@/features/identity/types';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import { getLegacyStore } from '@/services/legacyStorage';
import type { LegacyStore } from '@/services/legacyStorage';
import { deviceStore, LEGACY_MIGRATION_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import {
  legacyCardsKey,
  parseLegacyCards,
  parseLegacyCurrent,
  parseLegacyKeys,
  parseLegacyTrophiesJson,
  setNameFromFilename,
} from './logic';
import type {
  ImportFile,
  ImportItemResult,
  ImportReport,
  LegacyCard,
  LegacyMigrationRecord,
} from './types';

/**
 * How a name collision is resolved during an import.
 *
 * Interactive imports can route through CAP-1's conflict prompt, but a bulk
 * import of twelve files cannot stop twelve times, and the automatic migration
 * has no user present at all. `rename` is therefore the default: it is the only
 * resolution that **cannot destroy data**, which is the whole point of this
 * capability.
 */
export type ImportCollisionPolicy = 'rename' | 'replace';

/** Runs imports and the one-time legacy migration. */
export class ImportService {
  private readonly library: LibraryRepository;
  private readonly trophies: TrophyRepository;
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param library The card-set repository to write through.
   * @param trophies The trophy repository, for legacy progress.
   * @param store The app's key/value store, for the migration marker.
   * @param context The clock, for timestamps.
   */
  constructor(
    library: LibraryRepository = libraryRepository,
    trophies: TrophyRepository = trophyRepository,
    store: KeyValueStore = deviceStore,
    context: IdentityContext = defaultIdentityContext,
  ) {
    this.library = library;
    this.trophies = trophies;
    this.store = store;
    this.context = context;
  }

  /**
   * Import one set's worth of legacy cards under a wanted name.
   *
   * @param sourceName What to call this item in the report.
   * @param wantedName The set name to create.
   * @param cards The already-validated legacy cards.
   * @param policy How to resolve a name collision.
   * @returns The item's outcome.
   */
  private async importOne(
    sourceName: string,
    wantedName: string,
    cards: readonly LegacyCard[],
    policy: ImportCollisionPolicy,
  ): Promise<ImportItemResult> {
    const validation = validateSetName(wantedName);
    if (!validation.valid) {
      return {
        sourceName,
        outcome: 'failed',
        setId: null,
        cardCount: 0,
        reasonKey: `import.reason.name${validation.error === 'empty' ? 'Empty' : 'TooLong'}`,
      };
    }

    const conflict = await this.library.checkNameConflict(validation.name);
    let name = validation.name;
    let outcome: ImportItemResult['outcome'] = 'imported';

    if (conflict !== null) {
      if (policy === 'replace') {
        await this.library.deleteSet(conflict.existingSetId);
        outcome = 'replaced';
      } else {
        name = conflict.suggestedName;
        outcome = 'renamed';
      }
    }

    const { set, cards: created } = await this.library.importSet(
      name,
      cards.map((card) => ({ hints: card.definitions, answers: card.answers })),
    );
    return {
      sourceName,
      outcome,
      setId: set.id,
      cardCount: created.length,
      reasonKey: null,
      reasonParams: outcome === 'renamed' ? { name } : undefined,
    };
  }

  /**
   * Import one or many `.cards` files.
   *
   * **Every selected file is imported.** The legacy app reused a single
   * `FileReader` across the loop and called `readAsText` before assigning
   * `onload`, so selecting two files imported only the first, silently — while
   * its picker advertised `multiple`, actively inviting users into the broken
   * path. Here each file is parsed and written independently, and one bad file
   * never stops the others.
   *
   * @param files The picked files, with their decoded text.
   * @param policy How to resolve a name collision. Defaults to `rename`, the
   *               only non-destructive resolution.
   * @returns One result per file, in the order given.
   */
  async importFiles(
    files: readonly ImportFile[],
    policy: ImportCollisionPolicy = 'rename',
  ): Promise<ImportReport> {
    const items: ImportItemResult[] = [];

    for (const file of files) {
      const parsed = parseLegacyCards(file.text);
      if (!parsed.ok) {
        // Quarantined, not dropped: the reason is surfaced to the user.
        items.push({
          sourceName: file.name,
          outcome: 'quarantined',
          setId: null,
          cardCount: 0,
          reasonKey: parsed.reasonKey,
        });
        continue;
      }
      items.push(
        await this.importOne(
          file.name,
          setNameFromFilename(file.name),
          parsed.value.cards,
          policy,
        ),
      );
    }

    return summarize(items);
  }

  /**
   * Whether the one-time legacy migration has already run.
   *
   * @returns The record of the previous run, or null if it has never run.
   */
  async getMigrationRecord(): Promise<LegacyMigrationRecord | null> {
    const raw = await this.store.getItem(LEGACY_MIGRATION_KEY);
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as LegacyMigrationRecord;
      return typeof parsed?.migratedAt === 'string' ? parsed : null;
    } catch {
      // An unreadable marker must not cause a second migration, which would
      // duplicate a returning user's entire library. Treat it as "has run".
      return { migratedAt: 'unknown', sets: 0, cards: 0, trophiesMigrated: false, items: [] };
    }
  }

  /**
   * Detect how much legacy data is sitting on this origin.
   *
   * @param legacy The legacy store to inspect. Defaults to the real one.
   * @returns The number of legacy sets found and whether trophies are present.
   */
  detectLegacyData(legacy: LegacyStore | null = getLegacyStore()): {
    setNames: string[];
    hasTrophies: boolean;
  } {
    if (legacy === null) return { setNames: [], hasTrophies: false };
    const setNames = parseLegacyKeys(legacy.getItem('keys')).filter(
      (name) => legacy.getItem(legacyCardsKey(name)) !== null,
    );
    return { setNames, hasTrophies: legacy.getItem('trophies') !== null };
  }

  /**
   * Adopt a returning web user's legacy library, once.
   *
   * Runs with no user action on first launch. **Legacy data is read, never
   * written and never deleted**: the "already migrated" marker lives in our own
   * namespace, so the old app's storage is left exactly as it was found. If the
   * user later clears our data, their original library is still there.
   *
   * Idempotent: a second call after a successful run does nothing.
   *
   * @param legacy The legacy store to read. Defaults to the real one.
   * @returns The migration record, or null when there was nothing to migrate or
   *          it had already run.
   */
  async migrateLegacyStorage(
    legacy: LegacyStore | null = getLegacyStore(),
  ): Promise<LegacyMigrationRecord | null> {
    if (legacy === null) return null;
    if ((await this.getMigrationRecord()) !== null) return null;

    const { setNames, hasTrophies } = this.detectLegacyData(legacy);
    if (setNames.length === 0 && !hasTrophies) return null;

    const items: ImportItemResult[] = [];
    // Name → new set id, so the legacy `current` selection can be re-pointed.
    const created = new Map<string, string>();

    for (const name of setNames) {
      const key = legacyCardsKey(name);
      const raw = legacy.getItem(key);
      if (raw === null) continue;
      const parsed = parseLegacyCards(raw);
      if (!parsed.ok) {
        items.push({
          sourceName: key,
          outcome: 'quarantined',
          setId: null,
          cardCount: 0,
          reasonKey: parsed.reasonKey,
        });
        continue;
      }
      // `rename` on collision: the migration runs unattended, and no unattended
      // path may destroy an existing set.
      const result = await this.importOne(key, name, parsed.value.cards, 'rename');
      items.push(result);
      if (result.setId !== null) created.set(name, result.setId);
    }

    // Re-point the legacy current-set selection at the new id.
    const currentName = parseLegacyCurrent(legacy.getItem('current'));
    if (currentName !== null) {
      const setId = created.get(currentName);
      if (setId !== undefined) await this.library.setCurrentSet(setId);
    }

    // Trophy progress, via CAP-7's max() recovery rule. Merged rather than
    // written, so progress already made in the rebuild is never reduced.
    let trophiesMigrated = false;
    if (hasTrophies) {
      const raw = parseLegacyTrophiesJson(legacy.getItem('trophies'));
      if (raw !== null) {
        const { state } = migrateLegacyTrophies(raw, this.context.now());
        await this.trophies.merge(state);
        trophiesMigrated = true;
      }
    }

    const summary = summarize(items);
    const record: LegacyMigrationRecord = {
      migratedAt: this.context.now(),
      sets: summary.imported,
      cards: summary.cards,
      trophiesMigrated,
      items,
    };
    // The marker is written whenever we have looked, even if nothing came of
    // it, so a legacy store full of unreadable values is not rescanned on every
    // launch forever.
    await this.store.setItem(LEGACY_MIGRATION_KEY, JSON.stringify(record));

    // ...but only *return* a record when there is something worth telling the
    // user about. "We adopted nothing and there was nothing wrong" is not a
    // report; showing a banner for it would be noise on first launch.
    const worthReporting = record.sets > 0 || record.trophiesMigrated || items.length > 0;
    return worthReporting ? record : null;
  }
}

/**
 * Roll a list of item outcomes into a report.
 *
 * @param items The per-item outcomes.
 * @returns The report, with counts.
 */
function summarize(items: ImportItemResult[]): ImportReport {
  return {
    items,
    imported: items.filter((item) => item.setId !== null).length,
    failed: items.filter((item) => item.setId === null).length,
    cards: items.reduce((total, item) => total + item.cardCount, 0),
  };
}

/** The import service the running app uses. */
export const importService = new ImportService();
