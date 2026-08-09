/**
 * Unicode text primitives shared by the whole app.
 *
 * Pure: no React, no storage, no platform APIs. See
 * `documentation/spelling-diff-spec.md` §5 (Unicode handling) — the diff must
 * operate on user-perceived characters, never on UTF-16 code units, or an
 * astral character or combining sequence gets split in half.
 */

/**
 * A lazily-created grapheme segmenter, or null when the runtime has no
 * `Intl.Segmenter`.
 *
 * Cached because constructing a `Segmenter` is not free and the diff runs on
 * every submitted answer. `undefined` means "not yet probed".
 */
let cachedSegmenter: Intl.Segmenter | null | undefined;

/**
 * Return the shared grapheme segmenter, probing the runtime once.
 *
 * React Native's Hermes engine ships an incomplete `Intl`, so `Intl.Segmenter`
 * may genuinely be absent on device while present on web. This is detected at
 * runtime rather than assumed.
 *
 * @returns The shared `Intl.Segmenter`, or null when the runtime lacks one.
 */
function getSegmenter(): Intl.Segmenter | null {
  if (cachedSegmenter === undefined) {
    const ctor = (globalThis as { Intl?: typeof Intl }).Intl?.Segmenter;
    cachedSegmenter = typeof ctor === 'function' ? new ctor(undefined, { granularity: 'grapheme' }) : null;
  }
  return cachedSegmenter;
}

/**
 * Whether the runtime can segment true grapheme clusters.
 *
 * When false, {@link toGraphemes} falls back to code-point iteration, which
 * handles astral characters correctly but splits combining sequences (`e` +
 * U+0301 becomes two clusters). This shortfall is documented rather than
 * silently accepted — see spelling-diff-spec.md §5 rule 3.
 *
 * @returns True when `Intl.Segmenter` is available on this runtime.
 */
export function hasGraphemeSupport(): boolean {
  return getSegmenter() !== null;
}

/**
 * Split a string into user-perceived characters (grapheme clusters).
 *
 * Uses `Intl.Segmenter` where available and falls back to code-point iteration
 * otherwise. The result is what every character-level algorithm in the app
 * indexes over; never index a JavaScript string with `[i]` for that purpose.
 *
 * @param value The string to split. Should already be NFC-normalised.
 * @returns One entry per user-perceived character, in content order.
 */
export function toGraphemes(value: string): string[] {
  if (value === '') return [];
  const segmenter = getSegmenter();
  if (segmenter === null) {
    // Code-point iteration: correct for astral characters, not for combining
    // sequences. See hasGraphemeSupport().
    return Array.from(value);
  }
  const out: string[] = [];
  for (const { segment } of segmenter.segment(value)) out.push(segment);
  return out;
}

/**
 * Normalise a string to Unicode NFC.
 *
 * So that `é` (U+00E9) and `e` + U+0301 compare equal — the same character in
 * two encodings is not a spelling error (spelling-diff-spec.md §4.1).
 *
 * @param value The string to normalise.
 * @returns The NFC-normalised string.
 */
export function normalizeText(value: string): string {
  return value.normalize('NFC');
}

/**
 * Locale-independent lowercasing.
 *
 * Deliberately `toLowerCase`, **not** `toLocaleLowerCase` — grading must not
 * vary by device locale (a Turkish device must not grade `I` differently).
 * The v0.2.0 app mixed the two.
 *
 * @param value The string to case-fold.
 * @returns The case-folded string.
 */
export function foldCase(value: string): string {
  return value.toLowerCase();
}
