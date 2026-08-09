/**
 * Read-only access to the **legacy app's** `localStorage` on the same origin.
 *
 * This exists for exactly one reason: the web build must deploy to
 * `vocabcards.com`, where a returning user's entire library is already sitting
 * in unprefixed `localStorage` keys written by the 2017 app. That is what makes
 * the automatic migration possible.
 *
 * **Deliberately read-only.** There is no `setItem` and no `removeItem` on this
 * interface, so no code path can ever modify or delete a returning user's
 * original data — the migration marker lives in *our* namespace instead
 * (`services/storage.ts`'s `LEGACY_MIGRATION_KEY`). The failure mode being
 * defended against is a returning user losing years of sets; asymmetric caution
 * is correct.
 */

import { Platform } from 'react-native';

/** Read-only view of the legacy origin's storage. */
export interface LegacyStore {
  /**
   * @param key The legacy key, e.g. `keys` or `SAT Words.cards`.
   * @returns The stored string, or null when absent.
   */
  getItem(key: string): string | null;
  /**
   * @returns Every key present in the legacy store.
   */
  getAllKeys(): string[];
}

/**
 * The browser's `localStorage`, or null where there is none.
 *
 * Native builds have no same-origin legacy data by definition — the old app was
 * a website. Guarded on both `Platform.OS` and the actual presence of the API,
 * because a browser can throw on `localStorage` access in private mode or under
 * a blocking cookie policy.
 *
 * @returns The legacy store, or null when this platform has no legacy data.
 */
export function getLegacyStore(): LegacyStore | null {
  if (Platform.OS !== 'web') return null;
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (storage === undefined) return null;
    // Touch it once: some browsers only throw on first access.
    void storage.length;
    return {
      getItem: (key) => {
        try {
          return storage.getItem(key);
        } catch {
          return null;
        }
      },
      getAllKeys: () => {
        try {
          return Object.keys(storage);
        } catch {
          return [];
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * An in-memory {@link LegacyStore}, for tests.
 *
 * @param entries The legacy keys and values to expose.
 * @returns A read-only store over those entries.
 */
export function createMemoryLegacyStore(entries: Record<string, string>): LegacyStore {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (key) => map.get(key) ?? null,
    getAllKeys: () => [...map.keys()],
  };
}
