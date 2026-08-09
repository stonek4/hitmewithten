/**
 * CAP-18 — About, Changelog & Legal.
 *
 * **One source of truth for the version.** The legacy app hard-coded it in four
 * separate places — `package.json`, the JSON-LD in `index.html`, the About
 * heading, and the changelog entry — and they drifted. Here it is read from the
 * build's own manifest and everything else derives from that.
 */

import Constants from 'expo-constants';

import appManifest from '../../../app.json';
import changelogData from './changelog.json';

/** One change in a release. */
export interface ChangelogChange {
  /** Stable, language-independent grouping key. */
  kind: 'added' | 'changed' | 'fixed';
  text: string;
}

/** One release. */
export interface ChangelogEntry {
  version: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  changes: ChangelogChange[];
}

/** The changelog, newest release first. */
export const CHANGELOG: readonly ChangelogEntry[] = (
  changelogData as unknown as { entries: ChangelogEntry[] }
).entries;

/**
 * The app version.
 *
 * **`app.json`'s `expo.version` is the single source of truth** — it is what
 * ships to the stores. `package.json` mirrors it for the toolchain, and a test
 * fails if the two ever drift.
 *
 * Read from the live manifest at runtime so an OTA update reports its own
 * version, falling back to the bundled `app.json` (which is the same value)
 * where no manifest is available, such as under Jest. The fallback is a real
 * version, never a placeholder — a placeholder here would let the drift this
 * function exists to prevent go unnoticed in tests.
 *
 * @returns The version string.
 */
export function appVersion(): string {
  return Constants.expoConfig?.version ?? appManifest.expo.version;
}

/**
 * Whether the changelog's newest entry matches the running build.
 *
 * Exposed so a test can fail the build when someone bumps the version and
 * forgets the release note — the exact drift that left the legacy app claiming
 * four different versions at once.
 *
 * @returns True when the newest changelog entry names the running version.
 */
export function changelogMatchesVersion(): boolean {
  return CHANGELOG.length > 0 && CHANGELOG[0].version === appVersion();
}
