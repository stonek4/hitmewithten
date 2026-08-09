/**
 * CAP-8 — Legacy Import & Migration.
 *
 * **Guarantee that no existing user loses anything** — from either in-browser
 * storage on the same origin, or `.cards` files on disk. The failure mode being
 * defended against is a returning user losing years of sets, so the caution
 * here is deliberately asymmetric: legacy data is read, never written, never
 * deleted.
 */

/** What happened to one imported item. */
export type ImportOutcome = 'imported' | 'renamed' | 'replaced' | 'failed' | 'quarantined';

/** The result of importing one file or one legacy storage key. */
export interface ImportItemResult {
  /** The filename, or the legacy storage key it came from. */
  sourceName: string;
  outcome: ImportOutcome;
  /** The created set's id, or null when nothing was created. */
  setId: string | null;
  cardCount: number;
  /** An i18n key describing the failure. **Never a raw exception message.** */
  reasonKey: string | null;
  /** Parameters for the i18n message, if it takes any. */
  reasonParams?: Record<string, string | number>;
}

/** A file handed to the importer: its name and its full text. */
export interface ImportFile {
  /** The filename as chosen by the user, e.g. `SAT Words.cards`. */
  name: string;
  /** The file's decoded UTF-8 contents. */
  text: string;
}

/**
 * One card in the legacy format.
 *
 * `definitions` and `answers` are arrays that **only ever hold index `[0]` in
 * practice**, but the importer must accept any length and map them onto the
 * rebuild's real multi-value hints and answers.
 */
export interface LegacyCard {
  definitions: string[];
  answers: string[];
}

/** A complete import run's outcome. */
export interface ImportReport {
  items: ImportItemResult[];
  /** Sets successfully created. */
  imported: number;
  /** Files or keys that produced nothing. */
  failed: number;
  /** Cards created across every item. */
  cards: number;
}

/** What the one-time legacy migration recorded, so it never runs twice. */
export interface LegacyMigrationRecord {
  migratedAt: string;
  /** Sets adopted from legacy `localStorage`. */
  sets: number;
  cards: number;
  /** True when legacy trophy progress was adopted. */
  trophiesMigrated: boolean;
  items: ImportItemResult[];
}
