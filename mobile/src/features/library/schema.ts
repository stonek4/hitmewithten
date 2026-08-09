/**
 * Runtime schema validation for everything read out of storage.
 *
 * **Every read validates** (CAP-1, cross-cutting constraint C6). Anything that
 * does not parse is quarantined and reported — never discarded, never fatal.
 * Corrupt storage producing a blank screen is the legacy app's behaviour and is
 * treated here as a defect class in its own right.
 *
 * Pure: these functions take unknown values and return verdicts.
 */

import { SCHEMA_VERSION } from '@/features/identity/types';
import type { Card, CardSet, Tracked } from '@/features/identity/types';

import type { LibraryDocument } from './types';

/** A successful parse, or an i18n-keyed reason it failed. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; reasonKey: string };

/**
 * Whether a value is a plain JSON object (not null, not an array).
 *
 * @param value The value to test.
 * @returns True when the value is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a string.
 *
 * @param value The value to test.
 * @returns True when the value is a string.
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Whether a value is a finite number.
 *
 * @param value The value to test.
 * @returns True when the value is a finite number (rejects NaN and Infinity).
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Whether a value is a string or null.
 *
 * Also rejects the **string** `"null"`, which the legacy app writes for "no
 * selection" and which must never be mistaken for an id.
 *
 * @param value The value to test.
 * @returns True when the value is null or a string other than `"null"`.
 */
function isNullableString(value: unknown): value is string | null {
  return value === null || (isString(value) && value !== 'null');
}

/**
 * Validate the {@link Tracked} identity block every persisted entity carries.
 *
 * @param value The candidate entity.
 * @returns True when every identity field is present and well-typed.
 */
function hasValidTracked(value: Record<string, unknown>): boolean {
  return (
    isString(value.id) &&
    value.id.length > 0 &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isNullableString(value.deletedAt) &&
    isNullableString(value.syncedAt) &&
    isFiniteNumber(value.schemaVersion)
  );
}

/**
 * Read the {@link Tracked} block off a validated record.
 *
 * @param value A record already checked by {@link hasValidTracked}.
 * @returns The identity fields.
 */
function readTracked(value: Record<string, unknown>): Tracked {
  return {
    id: value.id as string,
    createdAt: value.createdAt as string,
    updatedAt: value.updatedAt as string,
    deletedAt: value.deletedAt as string | null,
    syncedAt: value.syncedAt as string | null,
    schemaVersion: value.schemaVersion as number,
  };
}

/**
 * Validate one stored card set.
 *
 * @param value The candidate value.
 * @returns The parsed {@link CardSet}, or a reason it was rejected.
 */
export function parseCardSet(value: unknown): ParseResult<CardSet> {
  if (!isRecord(value)) return { ok: false, reasonKey: 'import.reason.notAnArray' };
  if (!hasValidTracked(value)) return { ok: false, reasonKey: 'storage.reason.badIdentity' };
  if (!isString(value.name)) return { ok: false, reasonKey: 'storage.reason.badSet' };
  if (!isNullableString(value.lastUsedAt)) return { ok: false, reasonKey: 'storage.reason.badSet' };
  if (!isFiniteNumber(value.order)) return { ok: false, reasonKey: 'storage.reason.badSet' };
  return {
    ok: true,
    value: {
      ...readTracked(value),
      name: value.name,
      lastUsedAt: value.lastUsedAt,
      order: value.order,
    },
  };
}

/**
 * Validate an array of non-empty strings.
 *
 * @param value The candidate value.
 * @returns True when it is an array with at least one non-empty string and no
 *          non-string entries.
 */
function isTextList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isString) &&
    value.some((entry) => entry.trim().length > 0)
  );
}

/**
 * Validate one stored card.
 *
 * A card with no gradeable answer is rejected rather than loaded: it would
 * throw inside CAP-4 the moment a session reached it.
 *
 * @param value The candidate value.
 * @returns The parsed {@link Card}, or a reason it was rejected.
 */
export function parseCard(value: unknown): ParseResult<Card> {
  if (!isRecord(value)) return { ok: false, reasonKey: 'storage.reason.badCard' };
  if (!hasValidTracked(value)) return { ok: false, reasonKey: 'storage.reason.badIdentity' };
  if (!isString(value.setId) || value.setId.length === 0) {
    return { ok: false, reasonKey: 'storage.reason.badCard' };
  }
  if (!isTextList(value.hints)) return { ok: false, reasonKey: 'storage.reason.badCard' };
  if (!isTextList(value.answers)) return { ok: false, reasonKey: 'storage.reason.badCard' };
  if (!isFiniteNumber(value.order)) return { ok: false, reasonKey: 'storage.reason.badCard' };
  return {
    ok: true,
    value: {
      ...readTracked(value),
      setId: value.setId,
      hints: value.hints,
      answers: value.answers,
      order: value.order,
    },
  };
}

/**
 * Validate the stored library document.
 *
 * A single unreadable *set* does not condemn the document: the readable sets
 * are kept and the rest reported, so one corrupt entry can never blank the
 * library.
 *
 * @param value The parsed JSON value read from storage.
 * @returns The document plus any sets that had to be dropped, or a reason the
 *          whole document was unusable.
 */
export function parseLibraryDocument(
  value: unknown,
): ParseResult<{ document: LibraryDocument; droppedSets: unknown[] }> {
  if (!isRecord(value)) return { ok: false, reasonKey: 'storage.reason.badDocument' };
  if (!isFiniteNumber(value.schemaVersion)) {
    return { ok: false, reasonKey: 'storage.reason.badDocument' };
  }
  if (value.schemaVersion > SCHEMA_VERSION) {
    // Written by a newer build. Refuse rather than half-read it — a partial
    // read here would silently drop fields we do not know about yet.
    return { ok: false, reasonKey: 'storage.reason.futureSchema' };
  }
  if (!Array.isArray(value.sets)) return { ok: false, reasonKey: 'storage.reason.badDocument' };
  if (!isNullableString(value.currentSetId)) {
    return { ok: false, reasonKey: 'storage.reason.badDocument' };
  }

  const sets: CardSet[] = [];
  const droppedSets: unknown[] = [];
  for (const candidate of value.sets) {
    const parsed = parseCardSet(candidate);
    if (parsed.ok) sets.push(parsed.value);
    else droppedSets.push(candidate);
  }

  const cardCounts: Record<string, number> = {};
  if (isRecord(value.cardCounts)) {
    for (const [setId, count] of Object.entries(value.cardCounts)) {
      if (isFiniteNumber(count) && count >= 0) cardCounts[setId] = count;
    }
  }

  // A currentSetId pointing at a set that no longer parses is not a selection.
  const currentSetId =
    value.currentSetId !== null && sets.some((set) => set.id === value.currentSetId)
      ? (value.currentSetId as string)
      : null;

  return {
    ok: true,
    value: {
      document: { schemaVersion: value.schemaVersion, sets, cardCounts, currentSetId },
      droppedSets,
    },
  };
}

/**
 * Validate a stored per-set card list.
 *
 * @param value The parsed JSON value read from storage.
 * @returns The readable cards plus any entries that had to be dropped, or a
 *          reason the whole list was unusable.
 */
export function parseCardList(
  value: unknown,
): ParseResult<{ cards: Card[]; droppedCards: unknown[] }> {
  if (!Array.isArray(value)) return { ok: false, reasonKey: 'storage.reason.badCardList' };
  const cards: Card[] = [];
  const droppedCards: unknown[] = [];
  for (const candidate of value) {
    const parsed = parseCard(candidate);
    if (parsed.ok) cards.push(parsed.value);
    else droppedCards.push(candidate);
  }
  return { ok: true, value: { cards, droppedCards } };
}

/**
 * Parse a raw stored string as JSON without throwing.
 *
 * @param raw The stored string.
 * @returns The parsed value, or a reason it could not be read.
 */
export function parseJson(raw: string): ParseResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, reasonKey: 'import.reason.notJson' };
  }
}
