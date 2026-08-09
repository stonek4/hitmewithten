/**
 * CAP-7 — React glue for trophies.
 */

import { useCallback, useEffect, useState } from 'react';

import { trophyRepository } from './api';
import type { TrophyRepository } from './api';
import { emptyTrophyState, pendingNotifications, trophyProgress } from './logic';
import type { TrophyDef, TrophyProgress, TrophyState } from './types';

/** What {@link useTrophies} exposes to a screen. */
export interface UseTrophiesResult {
  state: TrophyState;
  /** Every trophy resolved against the current counters, in roster order. */
  progress: TrophyProgress[];
  loading: boolean;
  refresh(): Promise<void>;
}

/**
 * Load the user's trophy progress.
 *
 * @param repository The repository to read. Tests inject one over an in-memory
 *                   store.
 * @returns The trophy state and its resolved progress.
 */
export function useTrophies(repository: TrophyRepository = trophyRepository): UseTrophiesResult {
  const [state, setState] = useState<TrophyState>(() => emptyTrophyState(''));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = await repository.load();
    setState(loaded);
    setLoading(false);
  }, [repository]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const loaded = await repository.load();
      if (cancelled) return;
      setState(loaded);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository]);

  return { state, progress: trophyProgress(state), loading, refresh };
}

/** What {@link useTrophyUnlocks} exposes to a screen. */
export interface UseTrophyUnlocksResult {
  /** The trophy to show a toast for, or null. */
  pending: TrophyDef | null;
  /** Dismiss the current toast and mark it notified. */
  dismiss(): void;
  /** Re-check for unlocked-but-unnotified trophies. */
  check(): Promise<void>;
}

/**
 * Surface unlock toasts, one at a time.
 *
 * **A missed toast is not a lost event** — the trophies screen is the durable
 * record. This only drives the transient notification, and marks each trophy
 * notified so it is never announced twice.
 *
 * @param repository The repository to read and update.
 * @returns The pending unlock and its controls.
 */
export function useTrophyUnlocks(
  repository: TrophyRepository = trophyRepository,
): UseTrophyUnlocksResult {
  const [queue, setQueue] = useState<TrophyDef[]>([]);

  const check = useCallback(async () => {
    const pending = pendingNotifications(await repository.load());
    if (pending.length === 0) return;
    // Marked notified on PRESENTATION, not on dismissal — the same one-shot
    // latch the legacy app used (`isNewlyObtained()` flipped the flag on read).
    // Waiting for a dismissal means a toast that times out, or a screen the
    // user navigates away from, re-announces the same trophy forever. The
    // trophies screen is the durable record, so a missed toast costs nothing.
    await repository.markNotified(pending.map((def) => def.id));
    setQueue(pending);
  }, [repository]);

  const dismiss = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return { pending: queue[0] ?? null, dismiss, check };
}
