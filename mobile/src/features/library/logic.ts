/**
 * CAP-1 — pure library decisions.
 *
 * Name validation, duplicate-name detection, the auto-suffix suggestion, and
 * building/sorting/searching the summary index. No storage, no React: every
 * function takes data and returns data.
 */

import { isAlive } from '@/features/identity/logic';
import { SET_NAME_MAX_LENGTH } from '@/features/identity/types';
import type { CardSet } from '@/features/identity/types';
import { foldCase } from '@/lib/text';

import type {
  CardSetSummary,
  LibrarySort,
  NameConflict,
  SetNameValidation,
} from './types';

/**
 * Validate a proposed set name.
 *
 * Any character is permitted — names are display metadata, not filesystem keys
 * or storage keys. Sanitisation happens only when generating an export
 * filename (CAP-9).
 *
 * @param raw The name as the user typed it.
 * @returns The trimmed name when valid, or the reason it was rejected.
 */
export function validateSetName(raw: string): SetNameValidation {
  const name = raw.trim();
  if (name.length === 0) return { valid: false, error: 'empty' };
  if (name.length > SET_NAME_MAX_LENGTH) return { valid: false, error: 'tooLong' };
  return { valid: true, name };
}

/**
 * Find a live set whose name collides with the given one.
 *
 * Comparison is trimmed and case-insensitive, matching what a user would call
 * "the same name". Tombstoned sets never collide — a deleted set's name is
 * free.
 *
 * @param sets Every set in the library, including tombstones.
 * @param name The proposed name.
 * @returns The colliding set, or null when the name is free.
 */
export function findNameCollision(sets: readonly CardSet[], name: string): CardSet | null {
  const target = foldCase(name.trim());
  return sets.find((set) => isAlive(set) && foldCase(set.name.trim()) === target) ?? null;
}

/**
 * Suggest a free name by suffixing `(2)`, `(3)`, … until one is available.
 *
 * The suffix is applied to the name **as the caller typed it**, not to the
 * colliding set's stored name: someone who types `imported` when `Imported`
 * exists is offered `imported (2)`. Collision detection is case-insensitive,
 * but the user's own casing is theirs to keep. (CAP-1 specifies the `Name (2)`
 * shape without saying whose casing wins; this is the reading that never
 * silently rewrites what the user typed.)
 *
 * @param sets Every set in the library, including tombstones.
 * @param name The wanted name.
 * @returns The wanted name if free, otherwise the first free suffixed variant.
 */
export function suggestAvailableName(sets: readonly CardSet[], name: string): string {
  const base = name.trim();
  if (findNameCollision(sets, base) === null) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})`;
    if (findNameCollision(sets, candidate) === null) return candidate;
  }
}

/**
 * Build the conflict a caller must resolve, if the name is taken.
 *
 * @param sets Every set in the library, including tombstones.
 * @param name The proposed name.
 * @param cardCounts Live card counts by set id, for the "Replace" warning.
 * @returns The conflict, or null when the name is free.
 */
export function detectNameConflict(
  sets: readonly CardSet[],
  name: string,
  cardCounts: Readonly<Record<string, number>>,
): NameConflict | null {
  const existing = findNameCollision(sets, name);
  if (existing === null) return null;
  return {
    existingSetId: existing.id,
    existingName: existing.name,
    existingCardCount: cardCounts[existing.id] ?? 0,
    suggestedName: suggestAvailableName(sets, name),
  };
}

/**
 * Build the library's summary rows from the stored document's parts.
 *
 * Tombstoned sets are excluded — they are retained for sync, not for display.
 *
 * @param sets Every set in the library, including tombstones.
 * @param cardCounts Live card counts by set id.
 * @param currentSetId The selected set's id, or null.
 * @returns One summary per live set, in the sets' stored order.
 */
export function buildSummaries(
  sets: readonly CardSet[],
  cardCounts: Readonly<Record<string, number>>,
  currentSetId: string | null,
): CardSetSummary[] {
  return sets.filter(isAlive).map((set) => ({
    id: set.id,
    name: set.name,
    cardCount: cardCounts[set.id] ?? 0,
    lastUsedAt: set.lastUsedAt,
    updatedAt: set.updatedAt,
    isCurrent: set.id === currentSetId,
  }));
}

/**
 * Order the library list.
 *
 * Sorting is stable and total: every comparison falls back to the name and
 * then the id, so two sets that tie never swap places between renders.
 * `Intl.Collator` is used rather than `<` so that names sort the way the
 * user's locale expects.
 *
 * @param summaries The rows to sort.
 * @param sort The chosen ordering.
 * @param locale The locale to collate names in.
 * @returns A new sorted array.
 */
export function sortSummaries(
  summaries: readonly CardSetSummary[],
  sort: LibrarySort,
  locale: string = 'en-US',
): CardSetSummary[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  const byName = (a: CardSetSummary, b: CardSetSummary): number =>
    collator.compare(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  return [...summaries].sort((a, b) => {
    if (sort === 'name') return byName(a, b);
    if (sort === 'size') return b.cardCount - a.cardCount || byName(a, b);
    // 'recent': most recently used first; never-used sets sort last.
    const aUsed = a.lastUsedAt ?? '';
    const bUsed = b.lastUsedAt ?? '';
    if (aUsed !== bUsed) return aUsed < bUsed ? 1 : -1;
    return byName(a, b);
  });
}

/**
 * Filter the library list by a search query.
 *
 * Matching is case-insensitive and substring-based over the set name, on
 * NFC-normalised text so an accented name is findable however it was typed.
 *
 * @param summaries The rows to filter.
 * @param query The user's search text. Blank returns everything.
 * @returns The matching rows, in their original order.
 */
export function searchSummaries(
  summaries: readonly CardSetSummary[],
  query: string,
): CardSetSummary[] {
  const needle = foldCase(query.trim().normalize('NFC'));
  if (needle.length === 0) return [...summaries];
  return summaries.filter((summary) => foldCase(summary.name.normalize('NFC')).includes(needle));
}

/**
 * Move one item within a list, by index.
 *
 * Reordering is offered as **tappable move up / move down controls**, not only
 * as a drag: no action may be available exclusively via a gesture (C3). This
 * helper is what those controls call, and it is pure so the edge cases — the
 * first item moving up, the last moving down — are testable without a UI.
 *
 * @param items The list to reorder.
 * @param from The index to move.
 * @param to The index to move it to.
 * @returns A new list. Returns the input unchanged when the move is a no-op or
 *          either index is out of range, so a control at the end of the list
 *          can be pressed harmlessly rather than needing to be disabled.
 */
export function moveInList<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to) return [...items];
  if (from < 0 || from >= items.length) return [...items];
  if (to < 0 || to >= items.length) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Decide what the current-set selection becomes after a set is deleted.
 *
 * Deleting the current set clears the selection to a **real null**, not the
 * string `"null"`.
 *
 * @param currentSetId The selection before the delete.
 * @param deletedSetId The set being deleted.
 * @returns The selection after the delete.
 */
export function selectionAfterDelete(
  currentSetId: string | null,
  deletedSetId: string,
): string | null {
  return currentSetId === deletedSetId ? null : currentSetId;
}
