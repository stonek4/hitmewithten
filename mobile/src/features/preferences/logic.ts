/**
 * CAP-10 — pure preference validation.
 *
 * Stored preferences are untrusted like everything else in storage: a value
 * written by a newer build, or corrupted, must never make a setting screen
 * unrenderable or silently change how answers are graded.
 */

import { DEFAULT_PREFERENCES, QUICK_TEST_SIZES } from './types';
import type { Appearance, Preferences, PromptSide, QuickTestSize } from './types';

/**
 * Coerce an unknown stored value into a usable {@link Preferences}.
 *
 * Each field falls back to its default **independently**, so one bad value
 * cannot reset the rest of the user's choices.
 *
 * @param value The parsed stored value.
 * @returns A complete, valid preferences object.
 */
export function coercePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ...DEFAULT_PREFERENCES };
  }
  const raw = value as Record<string, unknown>;

  return {
    caseSensitive:
      typeof raw.caseSensitive === 'boolean'
        ? raw.caseSensitive
        : DEFAULT_PREFERENCES.caseSensitive,
    quickTestSize: isQuickTestSize(raw.quickTestSize)
      ? raw.quickTestSize
      : DEFAULT_PREFERENCES.quickTestSize,
    defaultPromptSide: isPromptSide(raw.defaultPromptSide)
      ? raw.defaultPromptSide
      : DEFAULT_PREFERENCES.defaultPromptSide,
    appearance: isAppearance(raw.appearance) ? raw.appearance : DEFAULT_PREFERENCES.appearance,
    haptics: typeof raw.haptics === 'boolean' ? raw.haptics : DEFAULT_PREFERENCES.haptics,
    analytics: typeof raw.analytics === 'boolean' ? raw.analytics : DEFAULT_PREFERENCES.analytics,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : DEFAULT_PREFERENCES.updatedAt,
  };
}

/**
 * Whether a value is one of the offered quick-test sizes.
 *
 * @param value The candidate.
 * @returns True when it is an offered size.
 */
export function isQuickTestSize(value: unknown): value is QuickTestSize {
  return typeof value === 'number' && QUICK_TEST_SIZES.includes(value as QuickTestSize);
}

/**
 * Whether a value is a valid prompt side.
 *
 * @param value The candidate.
 * @returns True when it is `hint` or `answer`.
 */
export function isPromptSide(value: unknown): value is PromptSide {
  return value === 'hint' || value === 'answer';
}

/**
 * Whether a value is a valid appearance choice.
 *
 * @param value The candidate.
 * @returns True when it is `system`, `light` or `dark`.
 */
export function isAppearance(value: unknown): value is Appearance {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Resolve the colour scheme to actually render.
 *
 * @param appearance The user's choice.
 * @param systemScheme What the OS reports, which may be null or unspecified.
 * @returns The scheme to use.
 */
export function resolveScheme(
  appearance: Appearance,
  systemScheme: string | null | undefined,
): 'light' | 'dark' {
  if (appearance === 'light') return 'light';
  if (appearance === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
