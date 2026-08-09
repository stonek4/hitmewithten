/**
 * CAP-10 — Settings & Preferences.
 *
 * **The Settings screen ships with real settings or it does not ship.** The
 * legacy app's has said "Currently there are no settings available to change"
 * since 2017.
 *
 * Every preference reads correctly with **no account and no network**.
 */

/** How many cards a quick test draws. */
export type QuickTestSize = 5 | 10 | 20 | 50;

/** Which side of a card is shown as the prompt by default. */
export type PromptSide = 'hint' | 'answer';

/** The colour scheme the user chose. */
export type Appearance = 'system' | 'light' | 'dark';

/**
 * Every user preference.
 *
 * The `Syncs` / `Device-local` split from the capability spec is deliberate and
 * is annotated per field: a phone in dark mode and a laptop in light mode is
 * the **correct** outcome, and an analytics opt-out must be honourable on one
 * device without an account.
 */
export interface Preferences {
  /** Syncs. Default false — exactly what the legacy app hard-codes. */
  caseSensitive: boolean;
  /** Syncs. Default 10 — exactly what the legacy app hard-codes. */
  quickTestSize: QuickTestSize;
  /** Syncs. Default `hint`. */
  defaultPromptSide: PromptSide;
  /** **Device-local.** Default `system`. */
  appearance: Appearance;
  /** **Device-local.** Default true; a no-op on web, which has no haptics. */
  haptics: boolean;
  /** **Device-local.** Default true. Honoured before any event is emitted. */
  analytics: boolean;
  updatedAt: string;
}

/** The preference keys that would travel with an account (CAP-13). */
export const SYNCING_PREFERENCE_KEYS = [
  'caseSensitive',
  'quickTestSize',
  'defaultPromptSide',
] as const satisfies readonly (keyof Preferences)[];

/**
 * The defaults.
 *
 * **These preserve legacy behaviour**: case-insensitive comparison and a
 * 10-card quick test are exactly what the live app hard-codes, so a returning
 * user notices no change.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  caseSensitive: false,
  quickTestSize: 10,
  defaultPromptSide: 'hint',
  appearance: 'system',
  haptics: true,
  analytics: true,
  updatedAt: '',
};

/** The quick-test sizes offered, in order. */
export const QUICK_TEST_SIZES: readonly QuickTestSize[] = [5, 10, 20, 50];
