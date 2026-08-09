/**
 * CAP-13 — the sync backend port, and its Firestore adapter.
 *
 * `SyncService` talks to this interface rather than to Firestore directly. Two
 * reasons, both practical:
 *
 * 1. **The engine becomes testable.** The merge *decisions* are pure and tested
 *    in `logic.ts`, but the engine's *sequencing* — apply the server's copies
 *    before uploading, erase data before deleting the auth user, batch under
 *    Firestore's write cap — is where the remaining bugs live, and none of it
 *    can be exercised without a backend. The Firestore emulator needs Java,
 *    which is not available in this environment, so an in-memory double is the
 *    honest substitute.
 * 2. **Every Firestore specific lives in one adapter**, so the collection
 *    paths, the server-timestamp sentinel and the batch limit are stated once.
 *
 * A double is not a substitute for running against the real thing. What it
 * catches is orchestration; what it cannot catch is rules, indexes and
 * serialisation. Those are listed in `SYNC-SETUP.md` §3 as the outstanding
 * verification.
 */

import type { Card, CardSet, Tracked } from '@/features/identity/types';
import { getFirebase } from '@/services/firebase';
import type { TrophyState } from '@/features/trophies/types';

import type { Remote } from './types';

/** Firestore rejects a batch larger than 500 writes; stay clear of the edge. */
export const BATCH_LIMIT = 400;

/** What the sync engine needs from a server. */
export interface SyncBackend {
  /**
   * @param uid The signed-in user's id.
   * @returns Every stored card set, including tombstones.
   */
  readSets(uid: string): Promise<Remote<CardSet>[]>;
  /**
   * @param uid The signed-in user's id.
   * @returns Every stored card, including tombstones.
   */
  readCards(uid: string): Promise<Remote<Card>[]>;
  /**
   * Write entities, stamping each with the **server's** clock.
   *
   * @param uid The signed-in user's id.
   * @param path Which collection to write to.
   * @param entities The entities to write.
   */
  writeEntities(uid: string, path: 'sets' | 'cards', entities: readonly Tracked[]): Promise<void>;
  /**
   * @param uid The signed-in user's id.
   * @returns The stored trophy state, or null when there is none.
   */
  readTrophies(uid: string): Promise<TrophyState | null>;
  /**
   * @param uid The signed-in user's id.
   * @param state The merged trophy state to store.
   */
  writeTrophies(uid: string, state: TrophyState): Promise<void>;
  /**
   * Erase every document belonging to a user.
   *
   * @param uid The user whose data to erase.
   */
  deleteAll(uid: string): Promise<void>;
}

/**
 * The Firestore implementation.
 *
 * Layout, per the capability spec:
 *
 * ```
 * users/{uid}/sets/{setId}     one document per set
 * users/{uid}/cards/{cardId}   ONE DOCUMENT PER CARD, flat, carrying setId
 * users/{uid}/meta/trophies    trophy state
 * ```
 *
 * Cards are flat and per-card rather than nested under their set, because a set
 * of 200 cards edited on two devices must merge per card; whole-set
 * granularity would discard one device's edits wholesale.
 */
export class FirestoreBackend implements SyncBackend {
  /**
   * Load the Firestore module.
   *
   * A guarded require, not a top-level import — see `services/firebase.ts`.
   * Calling this is the moment the SDK evaluates, so it happens only inside
   * methods, which only run for a signed-in user.
   *
   * @returns The Firestore module and the shared database handle.
   */
  private firestore(): {
    api: typeof import('firebase/firestore');
    db: import('firebase/firestore').Firestore;
  } {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- see services/firebase.ts
    const api = require('firebase/firestore') as typeof import('firebase/firestore');
    return { api, db: getFirebase().db };
  }

  /**
   * Read one collection, normalising the server timestamp to an ISO string.
   *
   * The pure merge logic must never see a Firestore `Timestamp`; letting one
   * through would make the comparisons silently wrong rather than loudly
   * broken.
   *
   * @param uid The signed-in user's id.
   * @param path Which collection to read.
   * @returns Every document in it.
   */
  private async read<T extends Tracked>(uid: string, path: 'sets' | 'cards'): Promise<Remote<T>[]> {
    const { api, db } = this.firestore();
    const snapshot = await api.getDocs(api.collection(api.doc(db, 'users', uid), path));
    return snapshot.docs.map((entry) => {
      const data = entry.data() as T & {
        serverUpdatedAt?: { toDate?: () => Date } | string | null;
      };
      return { ...data, serverUpdatedAt: toIsoOrNull(data.serverUpdatedAt) } as Remote<T>;
    });
  }

  /** @inheritdoc */
  async readSets(uid: string): Promise<Remote<CardSet>[]> {
    return this.read<CardSet>(uid, 'sets');
  }

  /** @inheritdoc */
  async readCards(uid: string): Promise<Remote<Card>[]> {
    return this.read<Card>(uid, 'cards');
  }

  /** @inheritdoc */
  async writeEntities(
    uid: string,
    path: 'sets' | 'cards',
    entities: readonly Tracked[],
  ): Promise<void> {
    if (entities.length === 0) return;
    const { api, db } = this.firestore();
    for (let i = 0; i < entities.length; i += BATCH_LIMIT) {
      const batch = api.writeBatch(db);
      for (const entity of entities.slice(i, i + BATCH_LIMIT)) {
        batch.set(api.doc(api.collection(api.doc(db, 'users', uid), path), entity.id), {
          ...entity,
          // The SERVER stamps the ordering timestamp, and the rules require
          // exactly this value. Last-writer-wins is only sound because a client
          // cannot choose its own position in the order.
          serverUpdatedAt: api.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  /** @inheritdoc */
  async readTrophies(uid: string): Promise<TrophyState | null> {
    const { api, db } = this.firestore();
    const snapshot = await api.getDoc(api.doc(db, 'users', uid, 'meta', 'trophies'));
    return snapshot.exists() ? (snapshot.data() as TrophyState) : null;
  }

  /** @inheritdoc */
  async writeTrophies(uid: string, state: TrophyState): Promise<void> {
    const { api, db } = this.firestore();
    await api.setDoc(api.doc(db, 'users', uid, 'meta', 'trophies'), {
      ...state,
      serverUpdatedAt: api.serverTimestamp(),
    });
  }

  /** @inheritdoc */
  async deleteAll(uid: string): Promise<void> {
    const { api, db } = this.firestore();
    for (const path of ['sets', 'cards', 'meta'] as const) {
      const snapshot = await api.getDocs(api.collection(api.doc(db, 'users', uid), path));
      for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
        const batch = api.writeBatch(db);
        for (const entry of snapshot.docs.slice(i, i + BATCH_LIMIT)) batch.delete(entry.ref);
        await batch.commit();
      }
    }
    await api.deleteDoc(api.doc(db, 'users', uid));
  }
}

/**
 * Normalise a Firestore timestamp field to an ISO string.
 *
 * @param value The raw field, which may be a Timestamp, a string, or absent.
 * @returns The ISO string, or null when there is no committed value.
 */
function toIsoOrNull(value: { toDate?: () => Date } | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return typeof value.toDate === 'function' ? value.toDate().toISOString() : null;
}
