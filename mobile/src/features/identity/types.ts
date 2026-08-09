/**
 * CAP-12 — Entity Identity & Change Tracking.
 *
 * **This is the one-way door of the entire project.** Retrofitting identity
 * onto data that thousands of card sets already exist in is the single most
 * expensive mistake available here, so every persisted entity carries this
 * shape from the first commit — whether or not sync (CAP-13) is built yet.
 *
 * It also independently fixes the confirmed data-loss defect in the live app,
 * where a set's *name* is its storage key, so creating a set with an existing
 * name silently destroyed it.
 */

/**
 * The current schema version written by this build.
 *
 * Present from v1 so a future model change is a migration rather than a break.
 * **Every read branches on the stored value** — see
 * `features/library/schema.ts`.
 */
export const SCHEMA_VERSION = 1;

/**
 * How long a tombstone is retained before it may be purged.
 *
 * capability-spec.md CAP-12 / open question 3. A tombstone that has never
 * synced is never purged while an account exists, regardless of age — deleting
 * it would resurrect the entity on the next sync.
 */
export const TOMBSTONE_RETENTION_DAYS = 90;

/**
 * Identity and change tracking, present on **every** persisted entity.
 *
 * @see capability-spec.md §12.1 and cross-cutting constraint C2.
 */
export interface Tracked {
  /**
   * UUID v4, generated on the client, **never derived from content or name**.
   * Assignable with no network and no account, and globally unique — which is
   * what makes a future sign-in a union by id rather than a merge by guesswork.
   */
  id: string;
  /** ISO-8601 UTC instant the entity was created. */
  createdAt: string;
  /** ISO-8601 UTC instant of the last mutation. Stamped on EVERY mutation. */
  updatedAt: string;
  /**
   * Soft-delete tombstone: the ISO-8601 instant of deletion, or null when
   * alive. Deletes are never destructive — without a tombstone, a deletion on
   * one device could never propagate to another, and a re-sync would silently
   * resurrect the entity.
   */
  deletedAt: string | null;
  /**
   * The instant this entity's current state was last reconciled with a server,
   * or null if it never has been.
   *
   * **The per-entity change record CAP-12 is required to expose.** An entity is
   * dirty when `syncedAt === null || updatedAt > syncedAt`. CAP-13 is P1 and
   * nothing writes anything but `null` here yet; the field exists now because
   * CAP-12's own rule — "purging a tombstone that has never synced is forbidden
   * while an account exists" — is unimplementable without it.
   *
   * (Addition beyond `design/spec.md` §2's `Tracked` listing, which names the
   * other five fields only.)
   */
  syncedAt: string | null;
  /** The schema version this entity was written under. */
  schemaVersion: number;
}

/** A named collection of cards. Addressed by `id`, never by `name`. */
export interface CardSet extends Tracked {
  /** Trimmed, non-empty, ≤ {@link SET_NAME_MAX_LENGTH}. Any character allowed. */
  name: string;
  /** The instant a session last drew from this set, or null if never. */
  lastUsedAt: string | null;
  /** Manual ordering position within the library. */
  order: number;
}

/** One card: a prompt and the answers accepted for it. */
export interface Card extends Tracked {
  /** The owning {@link CardSet}'s id. */
  setId: string;
  /**
   * At least one non-empty hint after trimming, each
   * ≤ {@link CARD_TEXT_MAX_LENGTH}.
   */
  hints: string[];
  /**
   * At least one non-empty answer after trimming, each
   * ≤ {@link CARD_TEXT_MAX_LENGTH}. **Internal whitespace is preserved
   * byte-exactly** — it is spelling-significant and the missing-space marker
   * depends on it.
   */
  answers: string[];
  /** Ordering position within the set. Reordering rewrites order, never identity. */
  order: number;
}

/**
 * Per-card performance, keyed by card id so it survives editing a card's text
 * and is discarded with the card.
 *
 * The scheduling fields are **reserved for CAP-15 (P1)** and written `null` at
 * v1; they exist from day one so enabling scheduling later is a feature rather
 * than a migration.
 */
export interface CardStats {
  cardId: string;
  attempts: number;
  firstTryPasses: number;
  failures: number;
  lastSeenAt: string | null;
  /** Reserved — CAP-15 SM-2 interval in days. */
  interval: number | null;
  /** Reserved — CAP-15 SM-2 ease factor. */
  ease: number | null;
  /** Reserved — CAP-15 next-due instant. */
  dueAt: string | null;
}

/** Maximum length of a set name (CAP-1). */
export const SET_NAME_MAX_LENGTH = 100;

/**
 * Maximum length of one hint or one answer (CAP-2), so CAP-4's O(n·m) bound is
 * never approached in normal use.
 */
export const CARD_TEXT_MAX_LENGTH = 256;

/**
 * The ambient values entity mutations need, injected rather than imported.
 *
 * This is what keeps `features/identity/logic.ts` pure: a UUID generator and a
 * clock are both platform I/O, and a test that cannot control them cannot
 * assert on timestamps. `services/identityContext.ts` provides the real one.
 */
export interface IdentityContext {
  /** @returns A fresh UUID v4. */
  newId(): string;
  /** @returns The current instant as an ISO-8601 UTC string. */
  now(): string;
}
