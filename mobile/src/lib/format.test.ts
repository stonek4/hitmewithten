/**
 * Formatting tests. These pin the edges a results screen actually hits.
 */

import { formatCount, formatDateTime, formatDuration } from './format';

describe('formatDuration', () => {
  it('formats short durations as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5_000)).toBe('0:05');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(150_000)).toBe('2:30');
  });

  it('adds an hours field only when it is needed', () => {
    expect(formatDuration(59 * 60_000 + 59_000)).toBe('59:59');
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('clamps a negative duration rather than rendering a minus sign', () => {
    // A clock that moves backwards must not produce "-1:-30" on the results
    // screen.
    expect(formatDuration(-5_000)).toBe('0:00');
  });

  it('truncates sub-second remainders instead of rounding up', () => {
    expect(formatDuration(1_999)).toBe('0:01');
  });
});

describe('formatCount', () => {
  it('groups digits per the locale', () => {
    expect(formatCount(100000)).toBe('100,000');
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatDateTime', () => {
  it('formats a real instant', () => {
    expect(formatDateTime('2026-08-09T10:00:00.000Z')).toMatch(/2026/);
  });

  it('returns an empty string for an unparseable value rather than "Invalid Date"', () => {
    expect(formatDateTime('not a date')).toBe('');
    expect(formatDateTime('')).toBe('');
  });
});
