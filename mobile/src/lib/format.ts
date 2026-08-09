/**
 * Locale-aware formatting helpers.
 *
 * Pure, and deliberately built on `Intl` rather than hand-rolled arithmetic —
 * see `design/spec.md` §8. **Hermes ships an incomplete `Intl`**, so anything
 * added here must be verified on a device, not only on web.
 */

/**
 * Format a duration for display.
 *
 * Uses `Intl.NumberFormat` for the digits so the numerals follow the user's
 * locale, and pads with the locale's own zero digit rather than an ASCII `0`.
 * The `m:ss` shape itself is a near-universal convention for short durations;
 * `Intl.DurationFormat` would be the fully-correct tool but is absent on Hermes
 * and on many browsers, so it is deliberately not used here.
 *
 * @param milliseconds The elapsed time. Negative values are clamped to zero.
 * @param locale The locale to format the numerals in.
 * @returns A string like `2:05`, or `1:02:05` past an hour.
 */
export function formatDuration(milliseconds: number, locale: string = 'en-US'): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const plain = new Intl.NumberFormat(locale, { useGrouping: false });
  const padded = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });

  return hours > 0
    ? `${plain.format(hours)}:${padded.format(minutes)}:${padded.format(seconds)}`
    : `${plain.format(minutes)}:${padded.format(seconds)}`;
}

/**
 * Format an integer for display in the user's locale.
 *
 * @param value The number to format.
 * @param locale The locale to format in.
 * @returns The formatted number, e.g. `100,000`.
 */
export function formatCount(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format an instant as a short date and time in the user's locale.
 *
 * @param iso An ISO-8601 instant.
 * @param locale The locale to format in.
 * @returns The formatted date, or an empty string when the input is unparseable.
 */
export function formatDateTime(iso: string, locale: string = 'en-US'): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(parsed),
  );
}
