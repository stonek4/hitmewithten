/**
 * The one place the app talks to device key/value storage.
 *
 * Every read and write of card data goes through `features/library/api.ts`,
 * which goes through here. No screen and no other feature imports
 * `@react-native-async-storage/async-storage` directly (cross-cutting
 * constraint C9) — the legacy app had four components hand-building storage key
 * strings, and that is how its data-loss defect happened.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Prefix for every key this app owns.
 *
 * On web the app runs on the `vocabcards.com` origin alongside the legacy app's
 * unprefixed `localStorage` keys, so the prefix is what keeps the two libraries
 * from colliding — and what lets CAP-8 read the legacy keys untouched.
 */
export const KEY_PREFIX = 'vc:';

/** The library document: set metadata, card counts, current selection. */
export const LIBRARY_KEY = `${KEY_PREFIX}library`;

/** Quarantined values that could not be parsed. */
export const QUARANTINE_KEY = `${KEY_PREFIX}quarantine`;

/** The user's lifetime trophy progress (CAP-7). */
export const TROPHIES_KEY = `${KEY_PREFIX}trophies`;

/** Local-only session history, carrying no card content (CAP-6). */
export const SESSION_HISTORY_KEY = `${KEY_PREFIX}sessions`;

/** User preferences (CAP-10). */
export const PREFERENCES_KEY = `${KEY_PREFIX}preferences`;

/**
 * The record of the one-time legacy `localStorage` migration (CAP-8).
 *
 * Its presence is what stops the migration re-running. Legacy data is **read,
 * never deleted** — this marker lives in *our* namespace precisely so that
 * adopting a returning user's library never writes to, or removes, the data the
 * old app still owns.
 */
export const LEGACY_MIGRATION_KEY = `${KEY_PREFIX}legacyMigration`;

/**
 * The storage key holding one set's cards.
 *
 * @param setId The set's UUID. **Not its name** — that is the legacy design
 *              whose collision destroyed data.
 * @returns The storage key.
 */
export function cardsKey(setId: string): string {
  return `${KEY_PREFIX}cards:${setId}`;
}

/**
 * The minimal async key/value surface the repository needs.
 *
 * Declared as an interface so tests can supply an in-memory double without
 * mocking a module, and so a future migration off AsyncStorage is one file.
 */
export interface KeyValueStore {
  /**
   * @param key The key to read.
   * @returns The stored string, or null when absent.
   */
  getItem(key: string): Promise<string | null>;
  /**
   * @param key The key to write.
   * @param value The value to store.
   */
  setItem(key: string, value: string): Promise<void>;
  /**
   * @param key The key to remove.
   */
  removeItem(key: string): Promise<void>;
  /**
   * @returns Every key currently present.
   */
  getAllKeys(): Promise<readonly string[]>;
}

/** The device-backed store used in the running app. */
export const deviceStore: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
  getAllKeys: () => AsyncStorage.getAllKeys(),
};

/**
 * An in-memory {@link KeyValueStore}, for tests and for the rare surface with
 * no persistent storage.
 *
 * @returns A fresh, empty store.
 */
export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
    getAllKeys: async () => [...map.keys()],
  };
}
