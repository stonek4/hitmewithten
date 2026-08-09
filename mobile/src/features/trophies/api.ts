/**
 * CAP-7 — trophy persistence.
 *
 * The only module that reads or writes trophy state. Like the library
 * repository, every read validates and a corrupt value is replaced with a fresh
 * empty state rather than throwing — losing trophy progress is bad, but a
 * screen that will not render at all is worse.
 */

import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import type { IdentityContext } from '@/features/identity/types';
import { deviceStore, TROPHIES_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { applyCounters, emptyTrophyState, markNotified, mergeTrophyState } from './logic';
import type { TrophyDef, TrophyId, TrophyState, TrophyType } from './types';

/**
 * Whether a parsed value is a usable {@link TrophyState}.
 *
 * @param value The parsed stored value.
 * @returns True when every field is present and well-typed.
 */
function isTrophyState(value: unknown): value is TrophyState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tested === 'number' &&
    typeof v.passed === 'number' &&
    typeof v.failed === 'number' &&
    Number.isFinite(v.tested) &&
    Number.isFinite(v.passed) &&
    Number.isFinite(v.failed) &&
    typeof v.unlockedAt === 'object' &&
    v.unlockedAt !== null &&
    Array.isArray(v.notifiedTrophyIds)
  );
}

/** Reads and writes the user's trophy progress. */
export class TrophyRepository {
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param store The key/value store to persist to.
   * @param context The clock to stamp with.
   */
  constructor(store: KeyValueStore = deviceStore, context: IdentityContext = defaultIdentityContext) {
    this.store = store;
    this.context = context;
  }

  /**
   * Read the current trophy state.
   *
   * @returns The stored state, or a fresh empty one when absent or unreadable.
   */
  async load(): Promise<TrophyState> {
    const raw = await this.store.getItem(TROPHIES_KEY);
    if (raw === null) return emptyTrophyState(this.context.now());
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isTrophyState(parsed)) return emptyTrophyState(this.context.now());
      return parsed;
    } catch {
      return emptyTrophyState(this.context.now());
    }
  }

  /**
   * Persist a trophy state.
   *
   * @param state The state to store.
   */
  async save(state: TrophyState): Promise<void> {
    await this.store.setItem(TROPHIES_KEY, JSON.stringify(state));
  }

  /**
   * Add to the counters, unlocking any thresholds crossed.
   *
   * @param delta How much to add to each counter.
   * @returns The new state and the trophies this increment unlocked.
   */
  async increment(
    delta: Partial<Record<TrophyType, number>>,
  ): Promise<{ state: TrophyState; unlocked: TrophyDef[] }> {
    const result = applyCounters(await this.load(), delta, this.context.now());
    await this.save(result.state);
    return result;
  }

  /**
   * Record that a set of unlock toasts has been shown.
   *
   * @param ids The trophies that were notified.
   */
  async markNotified(ids: readonly TrophyId[]): Promise<void> {
    if (ids.length === 0) return;
    await this.save(markNotified(await this.load(), ids, this.context.now()));
  }

  /**
   * Merge externally-sourced progress (legacy migration, or a future sync) into
   * what is already stored.
   *
   * `max()` per counter and a union of ids, so adopting legacy progress can
   * never *reduce* progress the user has already made in the rebuild.
   *
   * @param incoming The state to merge in.
   * @returns The merged state.
   */
  async merge(incoming: TrophyState): Promise<TrophyState> {
    const merged = mergeTrophyState(await this.load(), incoming);
    await this.save(merged);
    return merged;
  }
}

/** The repository the running app uses. */
export const trophyRepository = new TrophyRepository();
