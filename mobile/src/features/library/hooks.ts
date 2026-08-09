/**
 * CAP-1 — React glue over the repository.
 *
 * Screens use these; they never call `api.ts` directly and never touch storage.
 * Every mutation re-reads the library, so the UI always reflects what is
 * actually persisted rather than an optimistic guess that can drift.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Card } from '@/features/identity/types';

import { libraryRepository } from './api';
import type { LibraryRepository } from './api';
import { searchSummaries, sortSummaries } from './logic';
import type {
  CardSetSummary,
  LibrarySort,
  NameConflict,
  QuarantineRecord,
} from './types';

/** What {@link useLibrary} exposes to a screen. */
export interface UseLibraryResult {
  /** The rows to render, already sorted and filtered. */
  summaries: CardSetSummary[];
  currentSetId: string | null;
  /** Non-empty when something in storage could not be read. */
  quarantined: QuarantineRecord[];
  /** True until the first load completes. */
  loading: boolean;
  sort: LibrarySort;
  setSort(sort: LibrarySort): void;
  query: string;
  setQuery(query: string): void;
  /** Re-read from storage. */
  refresh(): Promise<void>;
  /**
   * Create a set.
   *
   * @param name The name as typed.
   * @returns The conflict to resolve, or null when the set was created.
   */
  createSet(name: string): Promise<NameConflict | null>;
  /**
   * Create a set after the user resolved a conflict.
   *
   * @param name The originally wanted name.
   * @param resolution `replace` destroys the existing set; `rename` keeps both.
   */
  resolveConflict(name: string, resolution: 'replace' | { rename: string }): Promise<void>;
  deleteSet(setId: string): Promise<void>;
  selectSet(setId: string | null): Promise<void>;
}

/**
 * Load and manage the card-set library.
 *
 * @param repository The repository to use. Defaults to the app's; tests inject
 *                   one over an in-memory store.
 * @returns The library state and its operations.
 */
export function useLibrary(repository: LibraryRepository = libraryRepository): UseLibraryResult {
  const [summaries, setSummaries] = useState<CardSetSummary[]>([]);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [quarantined, setQuarantined] = useState<QuarantineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<LibrarySort>('recent');
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    const snapshot = await repository.loadLibrary();
    setSummaries(snapshot.summaries);
    setCurrentSetId(snapshot.currentSetId);
    setQuarantined(snapshot.quarantined);
    setLoading(false);
  }, [repository]);

  // Load once on mount. The state lands *after* the await and behind a
  // cancellation flag, so an unmount mid-read cannot set state on a dead
  // component and the effect never sets state synchronously.
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const snapshot = await repository.loadLibrary();
      if (cancelled) return;
      setSummaries(snapshot.summaries);
      setCurrentSetId(snapshot.currentSetId);
      setQuarantined(snapshot.quarantined);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const visible = useMemo(
    () => sortSummaries(searchSummaries(summaries, query), sort),
    [summaries, query, sort],
  );

  const createSet = useCallback(
    async (name: string): Promise<NameConflict | null> => {
      const result = await repository.createSet(name);
      await refresh();
      return result.status === 'conflict' ? result.conflict : null;
    },
    [repository, refresh],
  );

  const resolveConflict = useCallback(
    async (name: string, resolution: 'replace' | { rename: string }): Promise<void> => {
      await repository.createSetResolving(
        name,
        resolution === 'replace' ? { kind: 'replace' } : { kind: 'rename', name: resolution.rename },
      );
      await refresh();
    },
    [repository, refresh],
  );

  const deleteSet = useCallback(
    async (setId: string): Promise<void> => {
      await repository.deleteSet(setId);
      await refresh();
    },
    [repository, refresh],
  );

  const selectSet = useCallback(
    async (setId: string | null): Promise<void> => {
      await repository.setCurrentSet(setId);
      await refresh();
    },
    [repository, refresh],
  );

  return {
    summaries: visible,
    currentSetId,
    quarantined,
    loading,
    sort,
    setSort,
    query,
    setQuery,
    refresh,
    createSet,
    resolveConflict,
    deleteSet,
    selectSet,
  };
}

/** What {@link useCards} exposes to a screen. */
export interface UseCardsResult {
  cards: Card[];
  loading: boolean;
  refresh(): Promise<void>;
  /**
   * Add a card.
   *
   * @param hint The prompt.
   * @param answer The accepted answer.
   * @throws {RangeError} If either is blank after trimming.
   */
  addCard(hint: string, answer: string): Promise<void>;
  deleteCard(cardId: string): Promise<void>;
}

/**
 * Load and manage one set's cards.
 *
 * @param setId The set to load, or null to load nothing.
 * @param repository The repository to use.
 * @returns The cards and their operations.
 */
export function useCards(
  setId: string | null,
  repository: LibraryRepository = libraryRepository,
): UseCardsResult {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (setId === null) {
      setCards([]);
      setLoading(false);
      return;
    }
    const result = await repository.listCards(setId);
    setCards(result.cards);
    setLoading(false);
  }, [repository, setId]);

  // See useLibrary: state lands after the await, behind a cancellation flag.
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const result = setId === null ? { cards: [] } : await repository.listCards(setId);
      if (cancelled) return;
      setCards(result.cards);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository, setId]);

  const addCard = useCallback(
    async (hint: string, answer: string): Promise<void> => {
      if (setId === null) throw new RangeError('No set selected');
      await repository.addCard(setId, [hint], [answer]);
      await refresh();
    },
    [repository, setId, refresh],
  );

  const deleteCard = useCallback(
    async (cardId: string): Promise<void> => {
      if (setId === null) return;
      await repository.deleteCard(setId, cardId);
      await refresh();
    },
    [repository, setId, refresh],
  );

  return { cards, loading, refresh, addCard, deleteCard };
}
