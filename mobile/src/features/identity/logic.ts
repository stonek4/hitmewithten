/**
 * CAP-12 — pure entity identity and change-tracking operations.
 *
 * Every function here is total, side-effect free and framework free: it takes
 * entities and an {@link IdentityContext} and returns new entities. Nothing in
 * this file reads a clock, generates a UUID, or touches storage on its own —
 * that is what makes "did we stamp `updatedAt`?" a testable question rather
 * than a hopeful one.
 *
 * **Mutations return new objects.** An in-place mutation is how a missed
 * `updatedAt` stamp happens, and a missed stamp is a silently-lost sync later.
 */

import { SCHEMA_VERSION, TOMBSTONE_RETENTION_DAYS } from './types';
import type { Card, CardSet, IdentityContext, Tracked } from './types';

/** Milliseconds in a day, for tombstone-retention arithmetic. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Build the identity fields for a brand-new entity.
 *
 * @param context The id generator and clock to use.
 * @returns A fresh {@link Tracked} block: new id, both timestamps set to now,
 *          no tombstone, never synced, stamped with the current schema version.
 */
export function createTracked(context: IdentityContext): Tracked {
  const now = context.now();
  return {
    id: context.newId(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncedAt: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Apply a change to an entity, stamping `updatedAt`.
 *
 * **This is the only sanctioned way to mutate a tracked entity.** Going around
 * it is how an `updatedAt` stamp gets missed.
 *
 * @param entity The entity to change.
 * @param changes The fields to overwrite. Identity fields (`id`, `createdAt`)
 *                cannot be supplied — they are not the caller's to change.
 * @param context The clock to stamp with.
 * @returns A new entity with the changes applied and `updatedAt` stamped.
 */
export function touch<T extends Tracked>(
  entity: T,
  changes: Partial<Omit<T, keyof Tracked>>,
  context: IdentityContext,
): T {
  return { ...entity, ...changes, updatedAt: context.now() };
}

/**
 * Soft-delete an entity.
 *
 * Deleting an already-deleted entity is a no-op that returns the original
 * object, so a double delete cannot move the tombstone's date forward and
 * extend its retention window.
 *
 * @param entity The entity to delete.
 * @param context The clock to stamp with.
 * @returns A new tombstoned entity, or the original if already deleted.
 */
export function tombstone<T extends Tracked>(entity: T, context: IdentityContext): T {
  if (entity.deletedAt !== null) return entity;
  const now = context.now();
  return { ...entity, deletedAt: now, updatedAt: now };
}

/**
 * Undo a soft delete, bringing an entity back within its retention window.
 *
 * @param entity The entity to restore.
 * @param context The clock to stamp with.
 * @returns A new live entity, or the original if it was not deleted.
 */
export function restore<T extends Tracked>(entity: T, context: IdentityContext): T {
  if (entity.deletedAt === null) return entity;
  return { ...entity, deletedAt: null, updatedAt: context.now() };
}

/**
 * Whether an entity is live (not tombstoned).
 *
 * @param entity The entity to test.
 * @returns True when the entity has no tombstone.
 */
export function isAlive(entity: Tracked): boolean {
  return entity.deletedAt === null;
}

/**
 * Whether an entity has local changes a sync engine would need to push.
 *
 * @param entity The entity to test.
 * @returns True when the entity has never synced, or has changed since it did.
 */
export function isDirty(entity: Tracked): boolean {
  return entity.syncedAt === null || entity.updatedAt > entity.syncedAt;
}

/**
 * Mark an entity as reconciled with the server as of `now`.
 *
 * Does **not** stamp `updatedAt` — recording that a sync happened is not a
 * change to the entity's content, and stamping it would make the entity
 * permanently dirty.
 *
 * @param entity The entity that was synced.
 * @param context The clock to stamp with.
 * @returns A new entity with `syncedAt` set.
 */
export function markSynced<T extends Tracked>(entity: T, context: IdentityContext): T {
  return { ...entity, syncedAt: context.now() };
}

/**
 * Whether a tombstone may be purged.
 *
 * Two conditions, both required: the retention window has elapsed, **and**
 * either no account exists or the tombstone has already been synced. Purging an
 * unsynced tombstone while signed in would resurrect the entity on the next
 * sync — the exact failure mode tombstones exist to prevent.
 *
 * @param entity The entity to test.
 * @param options.now The current instant, as an ISO-8601 string.
 * @param options.hasAccount Whether the user is currently signed in (CAP-13).
 * @returns True when the tombstone is safe to purge.
 */
export function isPurgeableTombstone(
  entity: Tracked,
  options: { now: string; hasAccount: boolean },
): boolean {
  if (entity.deletedAt === null) return false;
  const ageMs = Date.parse(options.now) - Date.parse(entity.deletedAt);
  if (!(ageMs >= TOMBSTONE_RETENTION_DAYS * MS_PER_DAY)) return false;
  if (!options.hasAccount) return true;
  // Signed in: the deletion must have reached the server before we forget it.
  return entity.syncedAt !== null && entity.syncedAt >= entity.deletedAt;
}

/**
 * Drop every tombstone that is safe to purge.
 *
 * @param entities The entities to filter.
 * @param options.now The current instant, as an ISO-8601 string.
 * @param options.hasAccount Whether the user is currently signed in.
 * @returns The entities that must be retained, in their original order.
 */
export function pruneTombstones<T extends Tracked>(
  entities: readonly T[],
  options: { now: string; hasAccount: boolean },
): T[] {
  return entities.filter((entity) => !isPurgeableTombstone(entity, options));
}

/**
 * Create a new card set.
 *
 * The name is metadata: it is trimmed here but never becomes part of the
 * entity's identity. Two sets may deliberately share a name.
 *
 * @param fields.name The display name, trimmed by this function.
 * @param fields.order The position in the library. Defaults to 0.
 * @param context The id generator and clock to use.
 * @returns A new, live {@link CardSet}.
 */
export function createCardSet(
  fields: { name: string; order?: number },
  context: IdentityContext,
): CardSet {
  return {
    ...createTracked(context),
    name: fields.name.trim(),
    lastUsedAt: null,
    order: fields.order ?? 0,
  };
}

/**
 * Create a new card belonging to a set.
 *
 * Hints and answers are trimmed at their ends and empty entries dropped;
 * **internal whitespace is preserved byte-exactly**, because it is
 * spelling-significant and the missing-space marker depends on it.
 *
 * @param fields.setId The owning set's id.
 * @param fields.hints The prompts. At least one must be non-empty after trimming.
 * @param fields.answers The accepted answers. At least one must be non-empty.
 * @param fields.order The position within the set. Defaults to 0.
 * @param context The id generator and clock to use.
 * @returns A new, live {@link Card}.
 * @throws {RangeError} If no non-empty hint or no non-empty answer remains
 *         after trimming — an ungradeable card must never reach storage.
 */
export function createCard(
  fields: { setId: string; hints: readonly string[]; answers: readonly string[]; order?: number },
  context: IdentityContext,
): Card {
  const hints = normalizeTextList(fields.hints);
  const answers = normalizeTextList(fields.answers);
  if (hints.length === 0) throw new RangeError('A card requires at least one non-empty hint');
  if (answers.length === 0) throw new RangeError('A card requires at least one non-empty answer');
  return {
    ...createTracked(context),
    setId: fields.setId,
    hints,
    answers,
    order: fields.order ?? 0,
  };
}

/**
 * Trim the ends of each entry and drop the ones that become empty.
 *
 * @param values The raw hint or answer strings.
 * @returns The non-empty trimmed values, in their original order.
 */
export function normalizeTextList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

/**
 * Assign contiguous `order` values, stamping every entity whose position moved.
 *
 * Reordering rewrites `order` and nothing else — identity is untouched, so a
 * reorder can never break a reference to a card.
 *
 * @param entities The entities in their new intended order.
 * @param context The clock to stamp moved entities with.
 * @returns New entities with `order` set to their index; entities already at
 *          their index are returned unchanged so they do not become dirty.
 */
export function reorder<T extends Tracked & { order: number }>(
  entities: readonly T[],
  context: IdentityContext,
): T[] {
  return entities.map((entity, index) =>
    entity.order === index ? entity : { ...entity, order: index, updatedAt: context.now() },
  );
}
