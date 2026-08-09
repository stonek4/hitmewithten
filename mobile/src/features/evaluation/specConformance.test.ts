/**
 * Wires `documentation/spelling-diff-spec.md` §1.2's three-step verification
 * recipe into the test suite, and differentially compares the app's
 * implementation against the spec's own reference listing.
 *
 * Why this exists: the app's `computeSpellingDiff` is a *generalisation* of the
 * spec's listing (it operates on grapheme clusters and NFC-normalises rather
 * than indexing UTF-16 code units, per spec §5 phase 2). A generalisation that
 * quietly changed behaviour on the ASCII inputs everyone actually types would
 * pass all 29 vectors and still be wrong. Exhaustively comparing the two over a
 * small alphabet is what rules that out.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { computeSpellingDiff } from './logic';
import type { DiffSegment } from './types';

const MOBILE_ROOT = resolve(__dirname, '../../..');

/** The shape the extracted spec module exposes. */
interface SpecModule {
  computeSpellingDiff(typed: string, correct: string): DiffSegment[];
}

/**
 * Enumerate every string over an alphabet up to a maximum length.
 *
 * @param alphabet The characters to draw from.
 * @param maxLength The longest string to generate.
 * @returns Every string of length 0..maxLength.
 */
function enumerateStrings(alphabet: readonly string[], maxLength: number): string[] {
  let level: string[] = [''];
  const all: string[] = [''];
  for (let n = 0; n < maxLength; n++) {
    const next: string[] = [];
    for (const prefix of level) for (const c of alphabet) next.push(prefix + c);
    all.push(...next);
    level = next;
  }
  return all;
}

describe('CAP-4 — spelling-diff-spec.md §1.2 verification recipe', () => {
  let specModule: SpecModule;

  beforeAll(() => {
    // Steps 1-3: extract the spec's ```ts blocks, type-check them under
    // `tsc --strict`, and run all 29 vectors against them. Throws on a non-zero
    // exit, which fails this test with the harness's own output attached.
    const output = execFileSync(process.execPath, ['scripts/verify-diff-spec.mjs'], {
      cwd: MOBILE_ROOT,
      encoding: 'utf8',
    });
    expect(output).toContain('tsc --noEmit --strict: clean');
    expect(output).toContain('PASS — 29/29 vectors green');

    // The harness leaves the extracted listing behind; load it for the
    // differential comparison below.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    specModule = require('../../../.spec-extract/spec.ts') as SpecModule;
  }, 180_000);

  it('runs the spec’s own three-step recipe green (extract, tsc --strict, 29 vectors)', () => {
    expect(typeof specModule.computeSpellingDiff).toBe('function');
  });

  it('agrees with the spec’s reference implementation on every string over {a,b,c} up to length 4', () => {
    const corpus = enumerateStrings(['a', 'b', 'c'], 4);
    const divergences: string[] = [];
    for (const correct of corpus) {
      if (correct === '') continue;
      for (const typed of corpus) {
        const ours = JSON.stringify(computeSpellingDiff(typed, correct));
        const theirs = JSON.stringify(specModule.computeSpellingDiff(typed, correct));
        if (ours !== theirs) {
          divergences.push(`${JSON.stringify(correct)} <- ${JSON.stringify(typed)}\n  ours   ${ours}\n  spec   ${theirs}`);
        }
      }
    }
    expect(divergences).toEqual([]);
  });

  it('agrees with the spec on the mixed-case and whitespace inputs real users type', () => {
    const cases: [string, string][] = [
      ['RaVeNoUs', 'ravenous'],
      ['RAVANOUS', 'ravenous'],
      ['Ice Cream', 'ice cream'],
      ['icecream', 'ice cream'],
      ['ice  cream', 'ice cream'],
      ['recieve', 'receive'],
      ['THIER', 'their'],
      ['', 'ravenous'],
      ['ravenous', ''],
    ];
    for (const [typed, correct] of cases) {
      expect({ typed, correct, diff: computeSpellingDiff(typed, correct) }).toEqual({
        typed,
        correct,
        diff: specModule.computeSpellingDiff(typed, correct),
      });
    }
  });
});
