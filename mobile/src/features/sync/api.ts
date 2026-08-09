/**
 * CAP-13 — the sync engine.
 *
 * Moves entities between the local repositories and Firestore, using the pure
 * decisions in `logic.ts`. Nothing here runs unless the user has signed in.
 *
 * Firestore layout, per the capability spec:
 *
 * ```
 * users/{uid}                 profile
 * users/{uid}/sets/{setId}    one document per set
 * users/{uid}/cards/{cardId}  ONE DOCUMENT PER CARD, flat, carrying setId
 * users/{uid}/meta/trophies   trophy state
 * users/{uid}/meta/preferences the syncing subset of preferences
 * ```
 *
 * Cards are flat and per-card rather than nested under a set, because a set of
 * 200 cards edited on two devices must merge per card; whole-set granularity
 * would discard one device's edits wholesale.
 */

import type { Card, CardSet, IdentityContext, Tracked } from '@/features/identity/types';
import { libraryRepository } from '@/features/library/api';
import type { LibraryRepository } from '@/features/library/api';
import { trophyRepository } from '@/features/trophies/api';
import type { TrophyRepository } from '@/features/trophies/api';
import { mergeTrophyState } from '@/features/trophies/logic';
import type { TrophyState } from '@/features/trophies/types';
import { getFirebase } from '@/services/firebase';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';

import { planSync, summarizeAdoption } from './logic';
import type { AdoptionReport, Remote } from './types';

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
  private readonly context: IdentityContext;

  /**
   * @param library The card repository to read and write.
   * @param trophies The trophy repository.
   * @param context The clock, for the local watermark.
   */
  constructor(
    library: LibraryRepository = libraryRepository,
    trophies: TrophyRepository = trophyRepository,
    context: IdentityContext = defaultIdentityContext,
  ) {
    this.library = library;
    this.trophies = trophies;
    this.context = context;
  }

  /**
   * Run a full sync pass.
   *
   * Safe to call repeatedly: it is a reconciliation, not a queue drain, so an
   * interrupted pass simply leaves work for the next one. Local data is never
   * destroyed by a failure — the plan is computed first and only then applied.
   *
   * @param uid The signed-in user's id.
   * @returns What the pass did, or the reason it failed.
   */
  async sync(uid: string): Promise<SyncOutcome> {
    try {
      /* eslint-disable @typescript-eslint/no-require-imports -- see services/firebase.ts */
      const firestore = require('firebase/firestore') as typeof import('firebase/firestore');
      /* eslint-enable @typescript-eslint/no-require-imports */
      const { db } = getFirebase();
      const { collection, doc, serverTimestamp, writeBatch } = firestore;

      const local = await this.library.readAllForSync();

      const remoteSets = await readCollection<CardSet>(firestore, db, uid, 'sets');
      const remoteCards = await readCollection<Card>(firestore, db, uid, 'cards');

      const setPlan = planSync(local.sets, remoteSets);
      const cardPlan = planSync(local.cards, remoteCards);

      // Apply the server's copies locally first. If the upload half then fails,
      // the user has strictly more data than they started with, never less.
      await this.library.applyFromSync(
        setPlan.toApplyLocally as CardSet[],
        cardPlan.toApplyLocally as Card[],
      );

      // Upload in batches. Firestore caps a batch at 500 writes.
      const uploads: { path: 'sets' | 'cards'; entity: Tracked }[] = [
        ...setPlan.toUpload.map((entity) => ({ path: 'sets' as const, entity })),
        ...cardPlan.toUpload.map((entity) => ({ path: 'cards' as const, entity })),
      ];
      for (let i = 0; i < uploads.length; i += 400) {
        const batch = writeBatch(db);
        for (const { path, entity } of uploads.slice(i, i + 400)) {
          batch.set(doc(collection(doc(db, 'users', uid), path), entity.id), {
            ...entity,
            // The SERVER stamps the ordering timestamp. The rules require
            // exactly this, because last-writer-wins is only sound if a client
            // cannot choose its own position in the order.
            serverUpdatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      // Trophies: max() per counter and a union of notified ids —
      // order-independent because the counters are monotonic.
      await this.syncTrophies(firestore, db, uid);

      const syncedAt = this.context.now();
      await this.library.markSynced(
        syncedAt,
        [...setPlan.toUpload, ...setPlan.toApplyLocally].map((e) => e.id),
        [...cardPlan.toUpload, ...cardPlan.toApplyLocally].map((e) => e.id),
      );

      return { ok: true, report: summarizeAdoption(setPlan, cardPlan, 0) };
    } catch (error) {
      // A failed sync must never damage local data or block the app; the user
      // stays fully functional offline and the next pass retries.
      return { ok: false, reasonKey: toSyncErrorKey(error) };
    }
  }

  /**
   * Merge trophy state with the server's copy.
   *
   * @param firestore The Firestore module.
   * @param db The Firestore handle.
   * @param uid The signed-in user's id.
   */
  private async syncTrophies(
    firestore: typeof import('firebase/firestore'),
    db: import('firebase/firestore').Firestore,
    uid: string,
  ): Promise<void> {
    const { doc, getDoc, setDoc, serverTimestamp } = firestore;
    const ref = doc(db, 'users', uid, 'meta', 'trophies');
    const snapshot = await getDoc(ref);
    const localState = await this.trophies.load();
    const merged = snapshot.exists()
      ? mergeTrophyState(localState, snapshot.data() as TrophyState)
      : localState;
    await this.trophies.save(merged);
    await setDoc(ref, { ...merged, serverUpdatedAt: serverTimestamp() });
  }

  /**
   * Erase every document belonging to a user.
   *
   * Called before the auth user is deleted: once it is gone the rules deny
   * every write, so the documents would be orphaned beyond the user's reach.
   *
   * @param uid The user whose data to erase.
   */
  async deleteAllCloudData(uid: string): Promise<void> {
    /* eslint-disable @typescript-eslint/no-require-imports -- see services/firebase.ts */
    const firestore = require('firebase/firestore') as typeof import('firebase/firestore');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const { collection, deleteDoc, doc, getDocs, writeBatch } = firestore;
    const { db } = getFirebase();

    for (const path of ['sets', 'cards', 'meta'] as const) {
      const snapshot = await getDocs(collection(doc(db, 'users', uid), path));
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        for (const entry of docs.slice(i, i + 400)) batch.delete(entry.ref);
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', uid));
  }
}

/**
 * Read one of a user's collections.
 *
 * @param firestore The Firestore module.
 * @param db The Firestore handle.
 * @param uid The signed-in user's id.
 * @param path The collection name.
 * @returns Every document, with the server timestamp normalised to an ISO
 *          string so the pure merge logic never sees a Firestore `Timestamp`.
 */
async function readCollection<T extends Tracked>(
  firestore: typeof import('firebase/firestore'),
  db: import('firebase/firestore').Firestore,
  uid: string,
  path: 'sets' | 'cards',
): Promise<Remote<T>[]> {
  const { collection, doc, getDocs } = firestore;
  const snapshot = await getDocs(collection(doc(db, 'users', uid), path));
  return snapshot.docs.map((entry) => {
    const data = entry.data() as T & { serverUpdatedAt?: { toDate?: () => Date } | string | null };
    const raw = data.serverUpdatedAt;
    const serverUpdatedAt =
      raw === null || raw === undefined
        ? null
        : typeof raw === 'string'
          ? raw
          : typeof raw.toDate === 'function'
            ? raw.toDate().toISOString()
            : null;
    return { ...data, serverUpdatedAt } as Remote<T>;
  });
}

/**
 * Map a Firestore error onto an i18n key.
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
