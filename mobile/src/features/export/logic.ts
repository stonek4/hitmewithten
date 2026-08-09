/**
 * CAP-9 — pure export/import serialisation.
 *
 * **A user can always get everything out, in a format they can read, for free,
 * offline, with no account** (cross-cutting constraint C5). Two formats:
 *
 * - `.vocabcards` — the native format. Versioned, self-describing, multi-set,
 *   carries ids and timestamps, and **round-trips losslessly**.
 * - `.cards` — the legacy format, so a file still opens in the old app. Lossy
 *   by definition, and the user is warned before it costs them anything.
 */

import { SET_NAME_MAX_LENGTH } from '@/features/identity/types';
import type { Card, CardSet } from '@/features/identity/types';
import type { SetWithCards } from '@/features/library/types';

/** The native format's magic string. Every reader checks it. */
export const NATIVE_FORMAT = 'vocabcards';

/**
 * The native format version this build writes.
 *
 * Present from v1 and **every importer branches on it**, so a future model
 * change is a migration rather than a break.
 */
export const NATIVE_FORMAT_VERSION = 1;

/** The native format's file extension. */
export const NATIVE_EXTENSION = '.vocabcards';

/**
 * The legacy format's file extension.
 *
 * Re-exported from the importer so both extensions are reachable from one
 * place; `.cards` import and export are supported **indefinitely**, because it
 * is the only route existing users' archives have.
 */
export { LEGACY_FILE_EXTENSION as LEGACY_EXTENSION } from '@/features/import/logic';

/** MIME type for both export formats: they are both UTF-8 JSON. */
export const EXPORT_MIME_TYPE = 'application/json';

/** One card as the native format stores it. */
export interface NativeCard {
  id: string;
  hints: string[];
  answers: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** One set as the native format stores it. */
export interface NativeSet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  cards: NativeCard[];
}

/** The native export envelope. */
export interface NativeExport {
  format: typeof NATIVE_FORMAT;
  formatVersion: number;
  exportedAt: string;
  app: { name: string; version: string };
  sets: NativeSet[];
}

/**
 * Build a native `.vocabcards` payload.
 *
 * Ids and timestamps travel, so re-importing an already-known set is
 * recognised as the same set rather than duplicated.
 *
 * @param sets The sets and their cards to export.
 * @param options.exportedAt The export instant, ISO-8601.
 * @param options.appVersion The app version to record.
 * @returns The envelope, ready to serialise.
 */
export function buildNativeExport(
  sets: readonly SetWithCards[],
  options: { exportedAt: string; appVersion: string },
): NativeExport {
  return {
    format: NATIVE_FORMAT,
    formatVersion: NATIVE_FORMAT_VERSION,
    exportedAt: options.exportedAt,
    app: { name: 'Vocab Cards', version: options.appVersion },
    sets: sets.map(({ set, cards }) => ({
      id: set.id,
      name: set.name,
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
      cards: cards.map((card) => ({
        id: card.id,
        hints: [...card.hints],
        answers: [...card.answers],
        order: card.order,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      })),
    })),
  };
}

/**
 * Serialise a native export.
 *
 * A real serialiser and a real MIME type — the legacy app built a
 * `data:charset=utf-8,…` URL with no MIME type at all.
 *
 * @param payload The envelope to serialise.
 * @returns Pretty-printed UTF-8 JSON, so the file is genuinely readable by a
 *          human, which is the point of the portability promise.
 */
export function serializeNativeExport(payload: NativeExport): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Build the legacy `.cards` payload for one set.
 *
 * @param cards The set's cards, in order.
 * @returns The exact legacy shape: `Array<{ definitions, answers }>`.
 */
export function buildLegacyExport(cards: readonly Card[]): { definitions: string[]; answers: string[] }[] {
  // Legacy export is LOSSY by definition: the old app only ever reads index
  // [0], so multiple hints/answers collapse and ids and timestamps are dropped.
  // `wouldLoseDataInLegacyExport` tells the UI when to warn.
  return cards.map((card) => ({ definitions: [card.hints[0]], answers: [card.answers[0]] }));
}

/**
 * Whether exporting this set as `.cards` would silently discard content.
 *
 * @param cards The set's cards.
 * @returns True when any card carries more than one hint or answer.
 */
export function wouldLoseDataInLegacyExport(cards: readonly Card[]): boolean {
  return cards.some((card) => card.hints.length > 1 || card.answers.length > 1);
}

/**
 * Sanitise a set name into a safe filename.
 *
 * The legacy app used the raw set name, so a name containing `/` produced an
 * invalid download. Path separators and control characters are removed, the
 * length is capped, and a name that sanitises to nothing gets a stable
 * fallback.
 *
 * @param name The set name.
 * @param extension The extension to append, including the dot.
 * @returns A filename safe on every platform.
 */
export function exportFilename(name: string, extension: string): string {
  const cleaned = name
    // Path separators, and the characters Windows forbids outright.
    .replace(/[/\\:*?"<>|]/g, ' ')
    // Control characters, including NUL — never legal in a filename.
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    // Leading dots would make the file hidden, or read as an extension.
    .replace(/^\.+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SET_NAME_MAX_LENGTH);
  return `${cleaned.length === 0 ? 'Vocab Cards' : cleaned}${extension}`;
}

/**
 * Give a batch of filenames unique names by suffixing collisions.
 *
 * @param names The wanted filenames, in order.
 * @returns The same list with duplicates suffixed ` (2)`, ` (3)`, ….
 */
export function deduplicateFilenames(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
    const dot = name.lastIndexOf('.');
    const stem = dot === -1 ? name : name.slice(0, dot);
    const extension = dot === -1 ? '' : name.slice(dot);
    for (let n = 2; ; n++) {
      const candidate = `${stem} (${n})${extension}`;
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
  });
}

/** A parsed native import, or an i18n key naming why it failed. */
export type NativeParseOutcome =
  | { ok: true; value: NativeExport }
  | { ok: false; reasonKey: string; reasonParams?: Record<string, string | number> };

/**
 * Whether a value is an array of non-empty strings.
 *
 * @param value The candidate.
 * @returns True when it holds at least one non-blank string and nothing else.
 */
function isTextList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string') &&
    value.some((entry) => entry.trim().length > 0)
  );
}

/**
 * Parse a `.vocabcards` file.
 *
 * **Untrusted input**, validated before anything is written. An unknown future
 * `formatVersion` fails with a clear message rather than a partial import —
 * half-reading a file written by a newer build silently drops fields we do not
 * know about.
 *
 * @param text The file's decoded contents.
 * @returns The parsed envelope, or the reason it was rejected.
 */
export function parseNativeExport(text: string): NativeParseOutcome {
  if (text.trim().length === 0) return { ok: false, reasonKey: 'import.reason.empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reasonKey: 'import.reason.notJson' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reasonKey: 'import.reason.notNative' };
  }

  const envelope = parsed as Record<string, unknown>;
  if (envelope.format !== NATIVE_FORMAT) return { ok: false, reasonKey: 'import.reason.notNative' };
  if (typeof envelope.formatVersion !== 'number' || !Number.isFinite(envelope.formatVersion)) {
    return { ok: false, reasonKey: 'import.reason.notNative' };
  }
  if (envelope.formatVersion > NATIVE_FORMAT_VERSION) {
    return {
      ok: false,
      reasonKey: 'import.reason.futureFormat',
      reasonParams: { version: envelope.formatVersion },
    };
  }
  if (!Array.isArray(envelope.sets)) return { ok: false, reasonKey: 'import.reason.notNative' };

  const sets: NativeSet[] = [];
  for (const candidate of envelope.sets) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const set = candidate as Record<string, unknown>;
    if (typeof set.name !== 'string' || !Array.isArray(set.cards)) continue;

    const cards: NativeCard[] = [];
    for (const cardCandidate of set.cards) {
      if (typeof cardCandidate !== 'object' || cardCandidate === null) continue;
      const card = cardCandidate as Record<string, unknown>;
      if (!isTextList(card.hints) || !isTextList(card.answers)) continue;
      cards.push({
        id: typeof card.id === 'string' ? card.id : '',
        hints: card.hints,
        answers: card.answers,
        order: typeof card.order === 'number' ? card.order : cards.length,
        createdAt: typeof card.createdAt === 'string' ? card.createdAt : '',
        updatedAt: typeof card.updatedAt === 'string' ? card.updatedAt : '',
      });
    }
    if (cards.length === 0) continue;

    sets.push({
      id: typeof set.id === 'string' ? set.id : '',
      name: set.name,
      createdAt: typeof set.createdAt === 'string' ? set.createdAt : '',
      updatedAt: typeof set.updatedAt === 'string' ? set.updatedAt : '',
      cards: cards.sort((a, b) => a.order - b.order),
    });
  }

  if (sets.length === 0) return { ok: false, reasonKey: 'import.reason.noUsableCards' };

  return {
    ok: true,
    value: {
      format: NATIVE_FORMAT,
      formatVersion: envelope.formatVersion,
      exportedAt: typeof envelope.exportedAt === 'string' ? envelope.exportedAt : '',
      app:
        typeof envelope.app === 'object' && envelope.app !== null
          ? (envelope.app as NativeExport['app'])
          : { name: '', version: '' },
      sets,
    },
  };
}

/**
 * Whether a filename looks like a native export.
 *
 * @param filename The picked file's name.
 * @returns True when it carries the `.vocabcards` extension.
 */
export function isNativeFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith(NATIVE_EXTENSION);
}

/**
 * Convert a parsed native set into the shape the library repository imports.
 *
 * @param set The parsed set.
 * @returns Its cards as hint/answer pairs, in order.
 */
export function nativeSetToCards(set: NativeSet): { hints: string[]; answers: string[] }[] {
  return set.cards.map((card) => ({ hints: card.hints, answers: card.answers }));
}

/**
 * A set and its cards, as {@link buildNativeExport} consumes them.
 *
 * Re-exported so callers do not have to reach into the library feature for a
 * type that is really part of this contract.
 */
export type ExportableSet = { set: CardSet; cards: Card[] };
