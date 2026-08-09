/**
 * CAP-13 — the sync engine.
 *
 * Orchestration only: it asks `logic.ts` what to do and a {@link SyncBackend}
 * to do it. Nothing here runs unless the user has signed in.
 *
 * The ordering decisions in this file are the ones that matter, and each is
 * commented where it happens:
 *
 * - The server's copies are applied locally **before** anything is uploaded,
 *   so a half-failed pass leaves the user with strictly more data, never less.
 * - Cloud data is erased **before** the auth user is deleted, because after
 *   deletion the rules deny every write and the documents would be orphaned
 *   beyond their owner's reach.
 * - A failure never damages local data and never blocks the app.
 */

import type { Card, CardSet, IdentityContext } from '@/features/identity/types';
import { libraryRepository } from '@/features/library/api';
import type { LibraryRepository } from '@/features/library/api';
import { trophyRepository } from '@/features/trophies/api';
import type { TrophyRepository } from '@/features/trophies/api';
import { mergeTrophyState } from '@/features/trophies/logic';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';

import { FirestoreBackend } from './backend';
import type { SyncBackend } from './backend';
import { planSync, summarizeAdoption } from './logic';
import type { AdoptionReport } from './types';

/** The result of one sync pass. */
export interface SyncOutcome {
  ok: boolean;
  /** Present when the pass succeeded. */
  report?: AdoptionReport;
  /** An i18n key, present when it failed. */
  reasonKey?: string;
}

/** Runs sync passes for a signed-in user. */
export class SyncService {
  private readonly library: LibraryRepository;
  private readonly trophies: TrophyRepository;
  private readonly backend: SyncBackend;
  private readonly context: IdentityContext;

  /**
   * @param library The card repository to read and write.
   * @param trophies The trophy repository.
   * @param backend The server to sync against. Tests inject an in-memory
   *                double; the app uses Firestore.
   * @param context The clock, for the local watermark.
   */
  constructor(
    library: LibraryRepository = libraryRepository,
    trophies: TrophyRepository = trophyRepository,
    backend: SyncBackend = new FirestoreBackend(),
    context: IdentityContext = defaultIdentityContext,
  ) {
    this.library = library;
    this.trophies = trophies;
    this.backend = backend;
    this.context = context;
  }

  /**
   * Run a full sync pass.
   *
   * Safe to call repeatedly: it is a reconciliation, not a queue drain, so an
   * interrupted pass simply leaves work for the next one.
   *
   * @param uid The signed-in user's id.
   * @returns What the pass did, or the reason it failed.
   */
  async sync(uid: string): Promise<SyncOutcome> {
    try {
      // The watermark is captured BEFORE reading, not after writing. If it were
      // taken at the end of the pass, any edit made *during* the pass would get
      // a timestamp earlier than the watermark, be marked reconciled, and never
      // be uploaded — a silently lost change. Taking it first means such an
      // edit stays dirty and the next pass picks it up.
      const watermark = this.context.now();
      const local = await this.library.readAllForSync();
      const [remoteSets, remoteCards] = await Promise.all([
        this.backend.readSets(uid),
        this.backend.readCards(uid),
      ]);

      const setPlan = planSync(local.sets, remoteSets);
      const cardPlan = planSync(local.cards, remoteCards);

      // Download first. If the upload half then fails, the user has strictly
      // more data than they started with — never less.
      await this.library.applyFromSync(
        setPlan.toApplyLocally as CardSet[],
        cardPlan.toApplyLocally as Card[],
      );

      await this.backend.writeEntities(uid, 'sets', setPlan.toUpload);
      await this.backend.writeEntities(uid, 'cards', cardPlan.toUpload);

      // Trophies merge by max() per counter and a union of notified ids —
      // order-independent, because the counters are monotonic.
      const remoteTrophies = await this.backend.readTrophies(uid);
      const localTrophies = await this.trophies.load();
      const mergedTrophies =
        remoteTrophies === null ? localTrophies : mergeTrophyState(localTrophies, remoteTrophies);
      await this.trophies.save(mergedTrophies);
      await this.backend.writeTrophies(uid, mergedTrophies);

      // Recorded only for what actually moved, and only after it moved — a
      // watermark written optimistically would make a failed upload look
      // reconciled and the change would never be retried.
      await this.library.markSynced(
        watermark,
        [...setPlan.toUpload, ...setPlan.toApplyLocally].map((entity) => entity.id),
        [...cardPlan.toUpload, ...cardPlan.toApplyLocally].map((entity) => entity.id),
      );

      return { ok: true, report: summarizeAdoption(setPlan, cardPlan, 0) };
    } catch (error) {
      // Local data is untouched and the app stays fully usable offline.
      return { ok: false, reasonKey: toSyncErrorKey(error) };
    }
  }

  /**
   * Erase every document belonging to a user.
   *
   * Called *before* the auth user is deleted — see the file header.
   *
   * @param uid The user whose data to erase.
   */
  async deleteAllCloudData(uid: string): Promise<void> {
    await this.backend.deleteAll(uid);
  }
}

/**
 * Map a Firestore or network error onto an i18n key.
 *
 * Firebase's own messages are developer-facing, so they are never shown.
 *
 * @param error The thrown value.
 * @returns The i18n key describing it.
 */
export function toSyncErrorKey(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  if (code === 'permission-denied') return 'sync.error.permissionDenied';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'sync.error.network';
  return 'sync.error.unknown';
}

/** The sync service the running app uses. */
export const syncService = new SyncService();
