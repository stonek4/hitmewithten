/**
 * Legacy-equivalence rendering — **characterization tests only.**
 *
 * `documentation/spelling-diff-spec.md` §7.4. This reproduces the v0.2.0 app's
 * HTML byte-for-byte so the 15 ground-truth vectors captured from production
 * can be asserted against the structured output. **It is not the production
 * renderer** — production renders elements, never an HTML string, and uses `#`
 * for a missing space per §7.1.
 *
 * Do not "modernise" this mapping. Its `_` and its collapsing of
 * `wrong`/`missing`/`transposed` into one `<em>` treatment are deliberate:
 * that is precisely what v0.2.0 emitted, and reproducing it byte-for-byte is
 * the entire point.
 */

import type { DiffSegment } from './types';

/**
 * Render a diff the way the legacy v0.2.0 app rendered it.
 *
 * @param diff The structured diff to render.
 * @returns The legacy HTML string, byte-identical to what v0.2.0 produced.
 */
export function renderLegacyHtml(diff: readonly DiffSegment[]): string {
  return diff
    .map((segment) => {
      if (segment.status === 'ok') return segment.char;
      if (segment.status === 'extra') return '<em>-</em>';
      if (segment.char === ' ') return '<em>&nbsp;_&nbsp;</em>';
      return `<em>${segment.char}</em>`;
    })
    .join('');
}
