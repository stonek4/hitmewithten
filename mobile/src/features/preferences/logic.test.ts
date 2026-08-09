/**
 * CAP-10 preference tests.
 */

import { createMemoryStore, PREFERENCES_KEY } from '@/services/storage';

import { loadPreferences, savePreferences } from './hooks';
import { coercePreferences, resolveScheme } from './logic';
import { DEFAULT_PREFERENCES } from './types';

describe('CAP-10 — defaults preserve legacy behaviour', () => {
  it('is case-insensitive with a 10-card quick test, hint first', () => {
    // Exactly what the live app hard-codes, so a returning user notices no
    // change on first launch.
    expect(DEFAULT_PREFERENCES).toMatchObject({
      caseSensitive: false,
      quickTestSize: 10,
      defaultPromptSide: 'hint',
      appearance: 'system',
      haptics: true,
      analytics: true,
    });
  });
});

describe('CAP-10 — stored preferences are untrusted', () => {
  it('falls back per FIELD, so one bad value cannot reset the others', () => {
    const coerced = coercePreferences({
      caseSensitive: true,
      quickTestSize: 999,
      defaultPromptSide: 'sideways',
      appearance: 'dark',
      haptics: 'yes',
      analytics: false,
    });
    expect(coerced).toMatchObject({
      caseSensitive: true, // kept
      quickTestSize: 10, // reset
      defaultPromptSide: 'hint', // reset
      appearance: 'dark', // kept
      haptics: true, // reset
      analytics: false, // kept
    });
  });

  it('returns the defaults for a value that is not an object at all', () => {
    for (const value of [null, undefined, 42, 'nope', []]) {
      expect(coercePreferences(value)).toMatchObject({ quickTestSize: 10 });
    }
  });

  it('accepts every offered quick-test size', () => {
    for (const size of [5, 10, 20, 50]) {
      expect(coercePreferences({ quickTestSize: size }).quickTestSize).toBe(size);
    }
  });
});

describe('CAP-10 — persistence', () => {
  it('round-trips through storage', async () => {
    const store = createMemoryStore();
    expect(await loadPreferences(store)).toMatchObject(DEFAULT_PREFERENCES);

    await savePreferences(
      { ...DEFAULT_PREFERENCES, caseSensitive: true, quickTestSize: 50, appearance: 'dark' },
      store,
    );
    expect(await loadPreferences(store)).toMatchObject({
      caseSensitive: true,
      quickTestSize: 50,
      appearance: 'dark',
    });
  });

  it('falls back to defaults rather than throwing on a corrupt value', async () => {
    const store = createMemoryStore();
    await store.setItem(PREFERENCES_KEY, 'not json');
    expect(await loadPreferences(store)).toMatchObject(DEFAULT_PREFERENCES);
  });

  it('reads with no account and no network — storage is the only dependency', async () => {
    const store = createMemoryStore();
    await savePreferences({ ...DEFAULT_PREFERENCES, analytics: false }, store);
    expect((await loadPreferences(store)).analytics).toBe(false);
  });
});

describe('CAP-10 — appearance resolution', () => {
  it('honours an explicit choice regardless of the system', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('follows the system when set to system', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('falls back to light for an unknown or missing system scheme', () => {
    // React Native reports 'unspecified' on some platforms before the scheme
    // is known.
    expect(resolveScheme('system', 'unspecified')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });
});
