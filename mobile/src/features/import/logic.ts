/**
 * CAP-8 — pure parsing of untrusted legacy data.
 *
 * **Everything reaching these functions is untrusted input**: a nine-year-old
 * file on disk, or a `localStorage` value on a domain that has been serving a
 * stored-XSS. Structure and types are validated *before* anything is written,
 * and a file containing markup or script is inert data — nothing here ever
 * produces a value that is later interpreted as markup.
 *
 * No storage, no React: text in, verdicts out.
 */

import { CARD_TEXT_MAX_LENGTH, SET_NAME_MAX_LENGTH } from '@/features/identity/types';

import type { LegacyCard } from './types';

/** The extension the legacy app exports, and the only one it ever wrote. */
export const LEGACY_FILE_EXTENSION = '.cards';

/** A successful parse, or an i18n key naming why it failed. */
export type ParseOutcome<T> = { ok: true; value: T } | { ok: false; reasonKey: string };

/**
 * Derive a set name from a legacy filename.
 *
 * The legacy format's set name **is the filename minus the trailing `.cards`**
 * — there is no name inside the file. Any other extension (or none) is
 * accepted: users rename downloads, and refusing `SAT Words.cards.txt` would
 * lose data for no benefit.
 *
 * Path separators are stripped so a picker that hands back a full path or a
 * `content://` URI cannot smuggle directories into a set name.
 *
 * @param filename The name the file was picked with.
 * @returns The derived set name, trimmed and length-capped. May be empty, which
 *          the caller must reject.
 */
export function setNameFromFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? '';
  const withoutExtension = base.toLowerCase().endsWith(LEGACY_FILE_EXTENSION)
    ? base.slice(0, -LEGACY_FILE_EXTENSION.length)
    : base;
  return withoutExtension.trim().slice(0, SET_NAME_MAX_LENGTH);
}

/**
 * Whether a value is an array of strings.
 *
 * @param value The candidate.
 * @returns True when every entry is a string.
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

/**
 * Normalise one legacy card's text list onto the rebuild's shape.
 *
 * Ends are trimmed and blanks dropped; **internal whitespace is preserved
 * byte-exactly**, because it is spelling-significant and the missing-space
 * marker depends on it. Entries are capped at the authoring limit so an
 * imported card can never exceed what the editor would allow.
 *
 * @param values The legacy `definitions` or `answers` array.
 * @returns The usable values, in order.
 */
function normalizeLegacyList(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim().slice(0, CARD_TEXT_MAX_LENGTH))
    .filter((value) => value.length > 0);
}

/**
 * Parse the body of a legacy `.cards` file or `<setName>.cards` storage value.
 *
 * The legacy format is the raw JSON of `Array<{ definitions: string[];
 * answers: string[] }>`, byte-identical between the file and the storage value.
 *
 * Cards that are individually unusable (no hint, or no answer) are **dropped
 * rather than failing the whole file** — a returning user is far better served
 * by 49 of their 50 cards than by an error. The count of dropped cards is
 * reported so the loss is never silent.
 *
 * @param text The file's decoded contents.
 * @returns The usable cards and how many were dropped, or the reason the file
 *          could not be read at all.
 */
export function parseLegacyCards(
  text: string,
): ParseOutcome<{ cards: LegacyCard[]; dropped: number }> {
  if (text.trim().length === 0) return { ok: false, reasonKey: 'import.reason.empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reasonKey: 'import.reason.notJson' };
  }

  if (!Array.isArray(parsed)) return { ok: false, reasonKey: 'import.reason.notAnArray' };

  const cards: LegacyCard[] = [];
  let dropped = 0;
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      dropped++;
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (!isStringArray(record.definitions) || !isStringArray(record.answers)) {
      dropped++;
      continue;
    }
    const definitions = normalizeLegacyList(record.definitions);
    const answers = normalizeLegacyList(record.answers);
    // A card needs at least one hint and one answer to be gradeable at all.
    if (definitions.length === 0 || answers.length === 0) {
      dropped++;
      continue;
    }
    cards.push({ definitions, answers });
  }

  if (cards.length === 0) return { ok: false, reasonKey: 'import.reason.noUsableCards' };
  return { ok: true, value: { cards, dropped } };
}

/**
 * Parse the legacy `keys` value: the names of every card set.
 *
 * @param raw The raw stored string, or null when absent.
 * @returns The set names, de-duplicated, in stored order. Unreadable values
 *          yield an empty list rather than throwing — a broken `keys` must not
 *          stop the rest of the migration.
 */
export function parseLegacyKeys(raw: string | null): string[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!isStringArray(parsed)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of parsed) {
    if (name.trim().length === 0 || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * Interpret the legacy `current` value.
 *
 * **It may be the literal string `"null"`** — the legacy app calls
 * `setItem('current', null)`, which stores the four characters `n u l l`, and
 * the rest of that app only works because a later guard happens to catch it.
 * Treat it as no selection.
 *
 * @param raw The raw stored string, or null when absent.
 * @returns The selected set's name, or null for no selection.
 */
export function parseLegacyCurrent(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed === 'null' || trimmed === 'undefined') return null;
  return raw;
}

/**
 * The legacy storage key holding one set's cards.
 *
 * @param setName The set's name, used verbatim by the legacy app.
 * @returns The legacy storage key.
 */
export function legacyCardsKey(setName: string): string {
  return `${setName}${LEGACY_FILE_EXTENSION}`;
}

/**
 * Parse the legacy `trophies` value into something
 * `features/trophies/logic.migrateLegacyTrophies` can consume.
 *
 * @param raw The raw stored string, or null when absent.
 * @returns The parsed value, or null when absent or unreadable.
 */
export function parseLegacyTrophiesJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
