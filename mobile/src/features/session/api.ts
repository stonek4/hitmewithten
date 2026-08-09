/**
 * CAP-3 / CAP-6 — session history persistence.
 *
 * Session records are **local-only and carry no card content** (see
 * {@link SessionRecord}), so history stays compact and CAP-19's no-content rule
 * is structurally easy to honour.
 */

import type { IdentityContext } from '@/features/identity/types';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import { deviceStore, SESSION_HISTORY_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import type { SessionRecord } from './logic';

/**
 * How many sessions are retained per set, pruned oldest-first.
 *
 * capability-spec open question 4. CAP-16 needs enough history to detect a
 * pattern at a support threshold of 3, which 50 comfortably exceeds.
 */
export const SESSION_HISTORY_LIMIT = 50;

/**
 * Whether a parsed value is a usable {@link SessionRecord}.
 *
 * @param value The parsed stored value.
 * @returns True when the fields the UI reads are present and well-typed.
 */
function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.setId === 'string' &&
    typeof v.startedAt === 'string' &&
    typeof v.endedAt === 'string' &&
    typeof v.cardsCompleted === 'number' &&
    typeof v.firstTryPasses === 'number' &&
    typeof v.wrongAttempts === 'number' &&
    Array.isArray(v.missedCardIds)
  );
}

/** Reads and writes the local session history. */
export class SessionHistoryRepository {
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param store The key/value store to persist to.
   * @param context The clock (unused today; kept so the shape matches its peers).
   */
  constructor(store: KeyValueStore = deviceStore, context: IdentityContext = defaultIdentityContext) {
    this.store = store;
    this.context = context;
  }

  /**
   * Read every stored session record.
   *
   * @returns The records, newest first. An unreadable store yields an empty
   *          history rather than throwing — losing history is regrettable, a
   *          results screen that will not render is worse.
   */
  async list(): Promise<SessionRecord[]> {
    const raw = await this.store.getItem(SESSION_HISTORY_KEY);
    if (raw === null) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isSessionRecord);
    } catch {
      return [];
    }
  }

  /**
   * Read one set's history, newest first.
   *
   * @param setId The set to read.
   * @returns That set's records.
   */
  async listForSet(setId: string): Promise<SessionRecord[]> {
    return (await this.list()).filter((record) => record.setId === setId);
  }

  /**
   * Read one record by id.
   *
   * @param sessionId The record to read.
   * @returns The record, or null when it is not in history.
   */
  async get(sessionId: string): Promise<SessionRecord | null> {
    return (await this.list()).find((record) => record.id === sessionId) ?? null;
  }

  /**
   * Append a record, pruning the oldest sessions for that set past the limit.
   *
   * Pruning is **per set**, not global: a user drilling one set heavily must not
   * evict the history of another.
   *
   * @param record The record to store.
   */
  async append(record: SessionRecord): Promise<void> {
    const existing = (await this.list()).filter((item) => item.id !== record.id);
    const all = [record, ...existing];

    const keptPerSet = new Map<string, number>();
    const kept: SessionRecord[] = [];
    // `all` is newest-first, so counting as we walk keeps the newest N per set.
    for (const item of all) {
      const seen = keptPerSet.get(item.setId) ?? 0;
      if (seen >= SESSION_HISTORY_LIMIT) continue;
      keptPerSet.set(item.setId, seen + 1);
      kept.push(item);
    }

    await this.store.setItem(SESSION_HISTORY_KEY, JSON.stringify(kept));
  }

  /**
   * Drop a set's history, for when the set itself is deleted.
   *
   * @param setId The set whose history to remove.
   */
  async clearForSet(setId: string): Promise<void> {
    const kept = (await this.list()).filter((record) => record.setId !== setId);
    await this.store.setItem(SESSION_HISTORY_KEY, JSON.stringify(kept));
  }

  /**
   * The clock this repository was built with.
   *
   * @returns The injected identity context.
   */
  get clock(): IdentityContext {
    return this.context;
  }
}

/** The repository the running app uses. */
export const sessionHistoryRepository = new SessionHistoryRepository();
