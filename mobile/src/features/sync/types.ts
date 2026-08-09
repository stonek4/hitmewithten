/**
 * CAP-13 — Optional Account & Cloud Sync.
 *
 * **The governing constraint is §13.1, and it is P0:** anonymous, local-only,
 * offline use stays a first-class mode. Sync is an opt-in layer *on top of* a
 * local-first app — never a precondition, never a wall, and never a silent
 * anonymous account. A user who does not opt in must make **zero** auth calls
 * and zero network requests, and that is a property this feature must not
 * break.
 *
 * Everything here is built on CAP-12's identity model, which was made
 * launch-blocking precisely so that this capability is an addition rather than
 * a migration.
 */

import type { Tracked } from '@/features/identity/types';

/** Where the user is in the sync lifecycle. */
export type SyncStatus =
  /** No account. The default, and a complete, supported mode. */
  | 'signedOut'
  /** Signed in, nothing outstanding. */
  | 'idle'
  /** A sync pass is running. */
  | 'syncing'
  /** Signed in with local changes not yet pushed (offline, or mid-retry). */
  | 'pending'
  /** The last pass failed. Local data is untouched and usable. */
  | 'error';

/** The signed-in user, as the app needs to know them. */
export interface Account {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** Which provider authenticated them. */
  provider: 'password' | 'google' | 'apple';
}

/**
 * What a sync pass decided to do with one entity.
 *
 * Conflict resolution is **last-writer-wins at document granularity**, ordered
 * by a server-assigned timestamp so client clock skew cannot reorder writes.
 */
export type SyncAction =
  /** Present locally only, or locally changed — push it. */
  | 'upload'
  /** Present remotely only, or remotely changed — take it. */
  | 'download'
  /** Both sides changed. LWW picked one; the other is overwritten. */
  | 'conflictLocalWins'
  | 'conflictRemoteWins'
  /** Identical on both sides. */
  | 'noop';

/** One entity's place in a sync plan. */
export interface SyncDecision<T extends Tracked> {
  id: string;
  action: SyncAction;
  /** The entity to write, on whichever side the action names. */
  entity: T;
}

/** A complete plan for one collection. */
export interface SyncPlan<T extends Tracked> {
  decisions: SyncDecision<T>[];
  toUpload: T[];
  toApplyLocally: T[];
}

/**
 * What happened on first sign-in, reported to the user.
 *
 * **Sign-in adopts local data, never replaces it** (US-I3): local UUIDs are
 * globally unique, so the merge is a union by id and nothing can collide.
 */
export interface AdoptionReport {
  /** Local-only sets pushed to the account. */
  uploaded: number;
  /** Sets that existed on both sides and were reconciled. */
  merged: number;
  /** Sets renamed because a cloud set already used the name. */
  renamed: number;
  /** Sets that existed only in the cloud and were brought down. */
  downloaded: number;
  cards: number;
}

/**
 * A remote entity as stored in Firestore, with the server's own ordering
 * timestamp.
 *
 * `serverUpdatedAt` is written with the server's clock, never the client's,
 * which is what makes last-writer-wins well-defined across devices whose clocks
 * disagree. Offline edits take the timestamp of when they reach the server.
 */
export type Remote<T> = T & { serverUpdatedAt: string | null };

/** What the user chose to happen to local data when signing out. */
export type SignOutChoice =
  /** The default. Signing out must never be an accidental deletion (US-I4). */
  | 'keepLocal'
  /** Explicitly chosen, with a warning. */
  | 'removeLocal';
