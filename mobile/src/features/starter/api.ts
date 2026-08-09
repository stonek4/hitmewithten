/**
 * CAP-11 — Starter Content.
 *
 * Seeds a first-run library so the app is **never an empty room** — and, just
 * as importantly, so the empty-set path is not the first thing a new user
 * meets. In the legacy app a brand-new user with no sets could trip the
 * empty-set soft-lock before doing anything at all.
 *
 * The seeded sets are **ordinary sets**: fully editable, renameable, deletable
 * and exportable. There is no read-only concept.
 */

import { importService as defaultImportService } from '@/features/import/api';
import type { ImportService } from '@/features/import/api';
import { libraryRepository } from '@/features/library/api';
import type { LibraryRepository } from '@/features/library/api';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import type { IdentityContext } from '@/features/identity/types';
import { deviceStore, STARTER_CONTENT_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import starterContent from './content.en-US.json';

/** One starter set as the data file declares it. */
interface StarterSet {
  name: string;
  /** `[hint, answer]` pairs. */
  cards: [string, string][];
}

/** The shape of the starter content data file. */
interface StarterContent {
  version: number;
  sets: StarterSet[];
}

const CONTENT = starterContent as unknown as StarterContent;

/** What a seeding attempt did. */
export interface SeedResult {
  seeded: boolean;
  sets: number;
  cards: number;
  /** Why nothing was seeded, when `seeded` is false. */
  reason: 'alreadySeeded' | 'libraryNotEmpty' | 'none';
}

/** The marker recorded once starter content has been considered. */
interface StarterMarker {
  version: number;
  seededAt: string;
  setIds: string[];
}

/** Seeds the first-run library. */
export class StarterContentService {
  private readonly library: LibraryRepository;
  private readonly importer: ImportService;
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param library The repository to seed into.
   * @param importer Used only to check whether a legacy migration has run.
   * @param store The key/value store holding the seed marker.
   * @param context The clock, for the marker's timestamp.
   */
  constructor(
    library: LibraryRepository = libraryRepository,
    importer: ImportService = defaultImportService,
    store: KeyValueStore = deviceStore,
    context: IdentityContext = defaultIdentityContext,
  ) {
    this.library = library;
    this.importer = importer;
    this.store = store;
    this.context = context;
  }

  /**
   * Read the seed marker.
   *
   * @returns The marker, or null when starter content has never been considered.
   */
  private async readMarker(): Promise<StarterMarker | null> {
    const raw = await this.store.getItem(STARTER_CONTENT_KEY);
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as StarterMarker;
      return typeof parsed?.version === 'number' ? parsed : null;
    } catch {
      // An unreadable marker must not cause a second seed, which would give the
      // user four duplicate sets. Treat it as "already done".
      return { version: CONTENT.version, seededAt: 'unknown', setIds: [] };
    }
  }

  /**
   * Seed the starter sets, at most once ever.
   *
   * Three guards, each defending a different failure:
   *
   * 1. **The marker.** Seeded exactly once. If the user deletes the sets they
   *    never return, and bumping the content version in a future release must
   *    **not** re-seed sets the user already deleted or edited — so the marker
   *    is checked for presence, never compared against the current version.
   * 2. **A non-empty library.** A returning user whose legacy library CAP-8
   *    just adopted does not want four new sets appearing beside their own.
   * 3. **A completed legacy migration**, even if it adopted nothing — the user
   *    came from the old app, so this is not a first run.
   *
   * @returns What was seeded, and why not when nothing was.
   */
  async seedIfFirstRun(): Promise<SeedResult> {
    if ((await this.readMarker()) !== null) {
      return { seeded: false, sets: 0, cards: 0, reason: 'alreadySeeded' };
    }

    const summaries = await this.library.listSummaries();
    const migrated = await this.importer.getMigrationRecord();
    if (summaries.length > 0 || migrated !== null) {
      // Record the marker anyway: this user has a library, so starter content
      // is settled forever and must not be reconsidered on every launch.
      await this.writeMarker([]);
      return { seeded: false, sets: 0, cards: 0, reason: 'libraryNotEmpty' };
    }

    const setIds: string[] = [];
    let cards = 0;
    for (const set of CONTENT.sets) {
      const { set: created } = await this.library.importSet(
        set.name,
        set.cards.map(([hint, answer]) => ({ hints: [hint], answers: [answer] })),
      );
      setIds.push(created.id);
      cards += set.cards.length;
    }

    await this.writeMarker(setIds);
    return { seeded: true, sets: setIds.length, cards, reason: 'none' };
  }

  /**
   * Record that starter content has been considered.
   *
   * @param setIds The sets created, if any.
   */
  private async writeMarker(setIds: readonly string[]): Promise<void> {
    const marker: StarterMarker = {
      version: CONTENT.version,
      seededAt: this.context.now(),
      setIds: [...setIds],
    };
    await this.store.setItem(STARTER_CONTENT_KEY, JSON.stringify(marker));
  }
}

/** The service the running app uses. */
export const starterContentService = new StarterContentService();
