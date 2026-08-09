/**
 * CAP-1 — Card Set Library & Local Storage.
 *
 * This feature is **the single module through which all card data is read and
 * written**; nothing else touches storage directly (cross-cutting constraint
 * C9). Screens call `hooks.ts`, which calls `api.ts`; pure decisions live in
 * `logic.ts`.
 */

import type { Card, CardSet } from '@/features/identity/types';

/**
 * A library-list row.
 *
 * The library renders from these and **never** by loading every card — which is
 * what keeps the list responsive at 1 000 sets × 1 000 cards.
 */
export interface CardSetSummary {
  id: string;
  name: string;
  cardCount: number;
  lastUsedAt: string | null;
  updatedAt: string;
  isCurrent: boolean;
}

/** How the library list is ordered. */
export type LibrarySort = 'name' | 'recent' | 'size';

/**
 * The persisted library document: set metadata, the summary counts, and the
 * current-set selection.
 *
 * Cards live in their own per-set documents so this one stays small enough to
 * read on every app open.
 */
export interface LibraryDocument {
  schemaVersion: number;
  /** Every set, **including tombstones** — deletes are soft. */
  sets: CardSet[];
  /** Live card count per set id. The summary index CAP-1 requires. */
  cardCounts: Record<string, number>;
  /**
   * The selected set's id, or a **real null**. Never the string `"null"` —
   * the legacy app writes that literal and only works by accident.
   */
  currentSetId: string | null;
}

/**
 * A duplicate-name collision, surfaced to the caller rather than silently
 * resolved.
 *
 * The legacy app's set name *is* its storage key, so creating a set with an
 * existing name silently destroyed it. Here identity is the id and a name
 * collision is only a UX affordance — but it is still surfaced, because
 * quietly ending up with two identically-named sets is confusing.
 */
export interface NameConflict {
  existingSetId: string;
  existingName: string;
  /** Named in the warning so the user knows what "Replace" would destroy. */
  existingCardCount: number;
  /** An auto-suffixed name that is free, e.g. `SAT Words (2)`. */
  suggestedName: string;
}

/** How the caller chose to resolve a {@link NameConflict}. */
export type ConflictResolution =
  /** Tombstone the existing set and create the new one under the wanted name. */
  | { kind: 'replace' }
  /** Create the new set under a different name. */
  | { kind: 'rename'; name: string };

/** The outcome of attempting to create or import a set. */
export type CreateSetResult =
  | { status: 'created'; set: CardSet }
  | { status: 'conflict'; conflict: NameConflict };

/** Why a set name was rejected. */
export type SetNameError = 'empty' | 'tooLong';

/** The result of validating a set name. */
export type SetNameValidation = { valid: true; name: string } | { valid: false; error: SetNameError };

/**
 * A stored value that could not be parsed.
 *
 * Quarantined and surfaced, **never discarded and never fatal** — corrupt
 * storage must not be able to blank the UI, which is exactly what it does in
 * the legacy app (no error handling on any `JSON.parse` of a stored value).
 */
export interface QuarantineRecord {
  /** The storage key the unreadable value came from. */
  storageKey: string;
  /** An i18n key describing the failure. Never a raw exception message. */
  reasonKey: string;
  /** When it was quarantined, ISO-8601. */
  quarantinedAt: string;
  /** The raw value, retained so nothing is ever actually lost. */
  raw: string;
}

/** Everything a screen needs to render the library. */
export interface LibrarySnapshot {
  summaries: CardSetSummary[];
  currentSetId: string | null;
  /** Non-empty when something in storage could not be read. */
  quarantined: QuarantineRecord[];
}

/** A set together with its cards, as export and import move them. */
export interface SetWithCards {
  set: CardSet;
  cards: Card[];
}
