/**
 * CAP-13 — pure sync decisions.
 *
 * No Firebase, no React, no storage: local entities and remote entities in, a
 * plan out. This is where the merge semantics live, and they are the part that
 * can silently lose a user's work, so they are decided here where they can be
 * tested exhaustively rather than inside an I/O callback.
 *
 * The rules, all from the capability spec:
 *
 * - **Union by id.** Local UUIDs are globally unique (CAP-12), so sign-in
 *   *adopts* local data rather than replacing it and nothing can collide.
 * - **Last-writer-wins at document granularity**, ordered by a **server**
 *   timestamp so client clock skew cannot reorder writes.
 * - **Per-card documents**, never one document per set: a 200-card set edited
 *   on two devices must merge per card.
 * - **Tombstones sync**, or deletions silently resurrect.
 * - **Trophy merge is `max()` per counter and a union of notified ids** —
 *   order-independent because the counters are monotonic.
 */

import { isDirty } from '@/features/identity/logic';
import type { Tracked } from '@/features/identity/types';

import type { Remote, SyncAction, SyncDecision, SyncPlan } from './types';

/**
 * Decide what to do with one entity that may exist on either or both sides.
 *
 * @param local The local entity, or undefined when it exists only remotely.
 * @param remote The remote entity, or undefined when it exists only locally.
 * @returns The action, and the entity that action applies to.
 * @throws {RangeError} If both sides are absent, which is a programming error —
 *         the caller builds the id set from the union of what exists.
 */
export function decide<T extends Tracked>(
  local: T | undefined,
  remote: Remote<T> | undefined,
): { action: SyncAction; entity: T } {
  if (local === undefined && remote === undefined) {
    throw new RangeError('decide() requires at least one side to exist');
  }
  // Present on one side only. Note this covers tombstones too: a deleted
  // entity is still an entity, so the deletion propagates instead of the
  // record simply reappearing from the other side.
  if (remote === undefined) return { action: 'upload', entity: local as T };
  if (local === undefined) return { action: 'download', entity: stripServerFields(remote) };

  const localChanged = isDirty(local);
  const remoteChanged = hasRemoteMoved(local, remote);

  if (!localChanged && !remoteChanged) return { action: 'noop', entity: local };
  if (localChanged && !remoteChanged) return { action: 'upload', entity: local };
  if (!localChanged && remoteChanged) {
    return { action: 'download', entity: stripServerFields(remote) };
  }

  // Both sides changed since we last reconciled. Last-writer-wins, and the
  // local write is the later one by construction: it has not reached the server
  // yet, so the server will stamp it after the remote edit it is overwriting.
  //
  // **This is the accepted limitation, documented not hidden (US-I7):** a
  // device offline for a long time can overwrite a newer edit made elsewhere.
  // This is single-user multi-device sync, not collaboration — the blast radius
  // is one person's own edit, and per-field merge is disproportionate. The rule
  // is surfaced in plain language in-app.
  return { action: 'conflictLocalWins', entity: local };
}

/**
 * Whether the remote copy has changed since this device last reconciled it.
 *
 * Compared against the local `syncedAt` watermark rather than against
 * `updatedAt`: the question is "has the server seen a write we have not?", and
 * only the watermark answers that.
 *
 * @param local The local entity.
 * @param remote The remote entity.
 * @returns True when the remote copy is newer than our watermark.
 */
function hasRemoteMoved<T extends Tracked>(local: T, remote: Remote<T>): boolean {
  if (remote.serverUpdatedAt === null) return false; // never committed
  if (local.syncedAt === null) return true; // we have never reconciled it
  return remote.serverUpdatedAt > local.syncedAt;
}

/**
 * Drop the server-only fields from a remote entity.
 *
 * `serverUpdatedAt` belongs to the transport, not to the domain model, and
 * letting it into local storage would put a second, competing timestamp beside
 * CAP-12's.
 *
 * @param remote The remote entity.
 * @returns The plain domain entity.
 */
export function stripServerFields<T extends Tracked>(remote: Remote<T>): T {
  const { serverUpdatedAt: _ignored, ...entity } = remote;
  return entity as unknown as T;
}

/**
 * Build a sync plan for one collection.
 *
 * @param locals The local entities, including tombstones.
 * @param remotes The remote entities, including tombstones.
 * @returns The plan: every decision, plus the two lists a caller acts on.
 */
export function planSync<T extends Tracked>(
  locals: readonly T[],
  remotes: readonly Remote<T>[],
): SyncPlan<T> {
  const localById = new Map(locals.map((entity) => [entity.id, entity]));
  const remoteById = new Map(remotes.map((entity) => [entity.id, entity]));
  // Union by id — the whole reason CAP-12 insisted on client-generated UUIDs.
  const ids = [...new Set([...localById.keys(), ...remoteById.keys()])];

  const decisions: SyncDecision<T>[] = ids.map((id) => {
    const { action, entity } = decide(localById.get(id), remoteById.get(id));
    return { id, action, entity };
  });

  return {
    decisions,
    toUpload: decisions
      .filter((d) => d.action === 'upload' || d.action === 'conflictLocalWins')
      .map((d) => d.entity),
    toApplyLocally: decisions
      .filter((d) => d.action === 'download' || d.action === 'conflictRemoteWins')
      .map((d) => d.entity),
  };
}

/**
 * Whether an entity should be pushed at all.
 *
 * Used to skip clean entities without building a whole plan, for the common
 * case of a routine incremental sync.
 *
 * @param entity The entity to test.
 * @returns True when it has local changes the server has not seen.
 */
export function needsUpload(entity: Tracked): boolean {
  return isDirty(entity);
}

/**
 * Count what a first sign-in did, for the adoption report shown to the user.
 *
 * @param setPlan The plan for the user's card sets.
 * @param cardPlan The plan for their cards.
 * @param renamed How many sets were renamed to resolve a name collision.
 * @returns The report.
 */
export function summarizeAdoption<T extends Tracked>(
  setPlan: SyncPlan<T>,
  cardPlan: SyncPlan<T>,
  renamed: number,
): {
  uploaded: number;
  downloaded: number;
  merged: number;
  renamed: number;
  cards: number;
} {
  const count = (plan: SyncPlan<T>, actions: SyncAction[]): number =>
    plan.decisions.filter((d) => actions.includes(d.action)).length;

  return {
    uploaded: count(setPlan, ['upload']),
    downloaded: count(setPlan, ['download']),
    merged: count(setPlan, ['noop', 'conflictLocalWins', 'conflictRemoteWins']),
    renamed,
    cards: cardPlan.decisions.length,
  };
}
