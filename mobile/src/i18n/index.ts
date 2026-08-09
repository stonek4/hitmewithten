/**
 * The i18n layer.
 *
 * The app launches English/US only, but is built i18n-ready from the first
 * commit (`design/spec.md` §8): **no hardcoded user-facing strings anywhere**,
 * every string a key in `en-US.json`, ICU plurals rather than ternaries, and
 * `Intl` for every date and number.
 *
 * Adding a locale is dropping a resource file in beside `en-US.json` and adding
 * one line to `resources` — not a rewrite.
 */

import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './en-US.json';

/** The locale used when the device's locale has no resource file. */
export const FALLBACK_LOCALE = 'en-US';

/** Every locale that ships with the app. */
export const resources = {
  'en-US': { translation: enUS },
} as const;

/**
 * Pick the best available locale for this device.
 *
 * Matches the exact tag first, then the language subtag, then falls back. Kept
 * separate from `initI18n` so it is testable without initialising i18next.
 *
 * @param deviceTags The device's preferred locale tags, most preferred first.
 * @returns A locale tag that has a resource file.
 */
export function resolveLocale(deviceTags: readonly string[]): string {
  const available = Object.keys(resources);
  for (const tag of deviceTags) {
    if (available.includes(tag)) return tag;
    const language = tag.split('-')[0];
    const byLanguage = available.find((candidate) => candidate.split('-')[0] === language);
    if (byLanguage !== undefined) return byLanguage;
  }
  return FALLBACK_LOCALE;
}

/**
 * Initialise i18next once, at app start.
 *
 * Idempotent: calling it again returns the already-initialised instance, so a
 * fast-refresh cycle or a second entry point cannot double-initialise.
 *
 * @returns The initialised i18next instance.
 */
export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n;

  const deviceTags = getLocales().map((locale) => locale.languageTag);

  // i18next's default export genuinely carries `.use`; the linter's suggested
  // named `use` export is an unrelated React hook re-export.
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources,
    lng: resolveLocale(deviceTags),
    fallbackLng: FALLBACK_LOCALE,
    // Keys are namespaced by screen with dots (`library.empty.heading`), so the
    // default `:` namespace separator must be disabled or a key containing a
    // colon would be misread as a namespace.
    nsSeparator: false,
    interpolation: {
      // React Native has no innerHTML, and nothing in this app ever interprets
      // a user string as markup — escaping would only corrupt card content.
      escapeValue: false,
    },
    returnNull: false,
    compatibilityJSON: 'v4',
  });

  return i18n;
}

export default i18n;
