/**
 * CAP-10 — preference storage and the context every screen reads.
 *
 * Preferences must be **readable synchronously by every other capability**, so
 * they are loaded once at app start and held in context; nothing awaits storage
 * mid-drill. Changes apply immediately, with no restart.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { identityContext } from '@/services/identityContext';
import { deviceStore, PREFERENCES_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { coercePreferences } from './logic';
import { DEFAULT_PREFERENCES } from './types';
import type { Preferences } from './types';

/**
 * Read preferences from storage.
 *
 * @param store The store to read from.
 * @returns The stored preferences, or the defaults when absent or unreadable.
 */
export async function loadPreferences(store: KeyValueStore = deviceStore): Promise<Preferences> {
  const raw = await store.getItem(PREFERENCES_KEY);
  if (raw === null) return { ...DEFAULT_PREFERENCES };
  try {
    return coercePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Persist preferences.
 *
 * @param preferences The values to store.
 * @param store The store to write to.
 */
export async function savePreferences(
  preferences: Preferences,
  store: KeyValueStore = deviceStore,
): Promise<void> {
  await store.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

/** What {@link usePreferences} exposes. */
export interface PreferencesContextValue {
  preferences: Preferences;
  /** True until the first load completes; the defaults are in effect meanwhile. */
  loading: boolean;
  /**
   * Change one or more preferences and persist them.
   *
   * @param changes The fields to set.
   */
  update(changes: Partial<Omit<Preferences, 'updatedAt'>>): Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  loading: true,
  update: async () => undefined,
});

/** Props for {@link PreferencesProvider}. */
export interface PreferencesProviderProps {
  children: ReactNode;
  /** The store to persist to. Tests inject an in-memory one. */
  store?: KeyValueStore;
}

/**
 * Load preferences once and provide them to the whole app.
 *
 * The defaults are in effect while loading, so **no screen ever blocks on
 * storage** — and the defaults are exactly the legacy behaviour, so even the
 * first frame grades answers the way a returning user expects.
 *
 * @param props See {@link PreferencesProviderProps}.
 * @returns The provider.
 */
export function PreferencesProvider({
  children,
  store = deviceStore,
}: PreferencesProviderProps): React.JSX.Element {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const loaded = await loadPreferences(store);
      if (cancelled) return;
      setPreferences(loaded);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const update = useCallback(
    async (changes: Partial<Omit<Preferences, 'updatedAt'>>): Promise<void> => {
      const next: Preferences = {
        ...preferences,
        ...changes,
        updatedAt: identityContext.now(),
      };
      // Applied to the UI first, then persisted: a setting must take effect the
      // instant it is tapped, never after a storage round-trip.
      setPreferences(next);
      await savePreferences(next, store);
    },
    [preferences, store],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, loading, update }),
    [preferences, loading, update],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/**
 * Read the current preferences.
 *
 * @returns The preferences and their updater.
 */
export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
