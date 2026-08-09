/**
 * CAP-7 — Trophies & Counters (domain model).
 *
 * Implemented as **data, not a class hierarchy**: three integer counters, a
 * declarative threshold table, and a set of already-notified ids. The legacy
 * app used an abstract class with three subclasses differing only in a type
 * string and display text, each storing its own counter — which is exactly what
 * makes its stored data awkward to migrate (see `migrateLegacyTrophies`).
 */

/**
 * Which counter a trophy is measured against.
 *
 * These strings are **persisted and must stay constant forever** — only their
 * display names are translated.
 */
export type TrophyType = 'tested' | 'passed' | 'failed';

/**
 * A trophy's stable identifier, e.g. `tested-500`.
 *
 * Derived from type and goal so it is stable across releases and independent of
 * ordering, wording or locale. Never persist a user-facing string as a key.
 */
export type TrophyId = string;

/** One trophy's definition. */
export interface TrophyDef {
  id: TrophyId;
  type: TrophyType;
  goal: number;
}

/**
 * The user's lifetime trophy progress.
 *
 * The three counters are **monotonic**, which is what makes them safely
 * mergeable under sync: `max()` per counter and a union of `notifiedTrophyIds`
 * is a correct, order-independent merge.
 */
export interface TrophyState {
  tested: number;
  passed: number;
  failed: number;
  /** Unlock instant (ISO-8601) per trophy id. */
  unlockedAt: Record<TrophyId, string>;
  /** Trophies whose unlock toast has already been shown. */
  notifiedTrophyIds: TrophyId[];
  updatedAt: string;
}

/** A trophy resolved against the current counters, for display. */
export interface TrophyProgress {
  def: TrophyDef;
  unlocked: boolean;
  /** The counter's current value for this trophy's type. */
  current: number;
  /** Progress toward the goal, clamped to [0, 1]. */
  fraction: number;
  /** When it was unlocked, or null. */
  unlockedAt: string | null;
}
