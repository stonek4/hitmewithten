/**
 * CAP-13 §13.1 — the optionality constraint, guarded structurally.
 *
 * This is **P0 and it gates the launch build**: *"Local-only mode makes no
 * authentication calls of any kind — no anonymous auth session, no silent
 * account creation, no device registration. 'No account' means no account,
 * verifiable by watching the network."*
 *
 * Driving the app proves it holds *today*. This file proves it cannot be
 * broken *tomorrow* by a one-line import, which is the realistic way it would
 * regress: the Firebase SDK begins auth-state resolution the moment
 * `firebase/app` is evaluated, so a single top-level value import anywhere in
 * the app's import graph is enough to start network traffic for every user,
 * including everyone who never signs in.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const MOBILE_ROOT = resolve(__dirname, '../../..');

/**
 * The only modules allowed to load the Firebase SDK.
 *
 * Each uses a guarded `require()` **inside a function**, so nothing evaluates
 * until a signed-in code path runs. Type-only imports are erased at build time
 * and are always fine.
 *
 * Note the sync *engine* is deliberately absent: it talks to the `SyncBackend`
 * port, and `backend.ts` is the only adapter that knows Firestore exists. Keep
 * this list as short as it can be — every entry is a place the guarantee has
 * to be re-checked by hand.
 */
const ALLOWED = [
  'src/services/firebase.ts',
  'src/features/auth/api.ts',
  'src/features/sync/backend.ts',
];

/**
 * Every TypeScript source file under a directory.
 *
 * @param dir The directory to walk.
 * @returns Absolute paths of every `.ts`/`.tsx` file found.
 */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe('CAP-13 §13.1 — Firebase must never evaluate for a signed-out user', () => {
  const files = [...sourceFiles(join(MOBILE_ROOT, 'src')), ...sourceFiles(join(MOBILE_ROOT, 'app'))];

  it('finds the app source to scan', () => {
    // Guards the guard: a broken walk would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(30);
  });

  it('has NO top-level value import of the Firebase SDK outside the allow-list', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const relativePath = relative(MOBILE_ROOT, file).replace(/\\/g, '/');
      if (ALLOWED.includes(relativePath)) continue;
      const source = readFileSync(file, 'utf8');
      for (const line of source.split('\n')) {
        // `import type { … } from 'firebase/…'` is erased at build time and is
        // harmless; a value import is not.
        if (/^\s*import\s+type\s/.test(line)) continue;
        if (/^\s*import\s[^;]*from\s+['"]firebase\//.test(line)) {
          offenders.push(`${relativePath}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('loads the SDK only from inside a function, even in the allow-listed files', () => {
    const offenders: string[] = [];
    for (const relativePath of ALLOWED) {
      const source = readFileSync(join(MOBILE_ROOT, relativePath), 'utf8');
      for (const line of source.split('\n')) {
        if (/^\s*import\s+type\s/.test(line)) continue;
        if (/^\s*import\s[^;]*from\s+['"]firebase\//.test(line)) {
          offenders.push(`${relativePath}: ${line.trim()}`);
        }
      }
      // The guarded require is the sanctioned form.
      expect(source).toMatch(/require\(['"]firebase\//);
    }
    expect(offenders).toEqual([]);
  });

  it('never creates an anonymous session — signInAnonymously appears nowhere', () => {
    // A silent anonymous account is explicitly forbidden: it is an account the
    // user never asked for, and it makes auth calls on first launch.
    const offenders = files.filter((file) =>
      /signInAnonymously|getRedirectResult|initializeAuth\s*\(/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders.map((f) => relative(MOBILE_ROOT, f))).toEqual([]);
  });
});
