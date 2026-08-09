/**
 * CAP-18 tests.
 *
 * The version test exists specifically to fail the build when someone bumps the
 * version and forgets the release note — the drift that left the legacy app
 * claiming four different versions at once.
 */

import { appVersion, CHANGELOG, changelogMatchesVersion } from './logic';

describe('CAP-18 — one source of truth for the version', () => {
  it('reads a real version from the build manifest', () => {
    expect(appVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(appVersion()).not.toBe('0.0.0');
  });

  it('matches package.json, which mirrors it for the toolchain', () => {
    const pkg = require('../../../package.json') as { version: string };
    expect(pkg.version).toBe(appVersion());
  });

  it('has a changelog entry for the running version', () => {
    expect(changelogMatchesVersion()).toBe(true);
  });
});

describe('CAP-18 — the changelog is data', () => {
  it('is newest first and every entry is well formed', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    for (const entry of CHANGELOG) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
    const dates = CHANGELOG.map((entry) => entry.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('uses only stable, language-independent kinds', () => {
    for (const entry of CHANGELOG) {
      for (const change of entry.changes) {
        expect(['added', 'changed', 'fixed']).toContain(change.kind);
        expect(change.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('carries no markup — it must render as plain text anywhere', () => {
    for (const entry of CHANGELOG) {
      for (const change of entry.changes) {
        expect(change.text).not.toMatch(/[<>]/);
        expect(change.text).not.toMatch(/\*\*|__|\[.*\]\(/);
      }
    }
  });
});
