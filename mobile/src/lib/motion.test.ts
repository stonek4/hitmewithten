/**
 * Motion law tests.
 *
 * These exist because the live app's most serious confirmed defect is an
 * animation-driven soft-lock: an aborted navigation left the menu animated to
 * `visibility: hidden` and the app unusable. The property that matters is not
 * "the animation looks right" — it is **"an interrupted animation cannot leave
 * anything invisible or displaced."**
 */

import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import type { Animated } from 'react-native';

import { useFadeIn, useNudge, useReduceMotion } from './motion';

/**
 * Read an `Animated.Value`'s current number.
 *
 * `__getValue()` is a **private React Native internal**. It exists at runtime
 * but is deliberately absent from the public type surface, because production
 * code has no business reading an animated value synchronously — and this file
 * contains the only use of it in the project.
 *
 * A test does have that business: the whole property under test is *"what value
 * does this rest at?"*, and the public API offers no synchronous read
 * (`addListener` fires only on change, so it cannot observe a value that never
 * moved — which is exactly the reduce-motion case). The cast is isolated here
 * so one line depends on the internal, and the guard test below fails loudly if
 * a future React Native removes it, rather than the suite silently going green
 * against `undefined`.
 *
 * @param value The animated value to read.
 * @returns Its current numeric value.
 */
function read(value: Animated.Value): number {
  return (value as unknown as { __getValue(): number }).__getValue();
}

describe('the private accessor these tests depend on', () => {
  it('still exists — if React Native removes it, fail here rather than silently', () => {
    const { result } = renderHook(() => useNudge(true));
    const internal = result.current.translateX as unknown as Record<string, unknown>;
    expect(typeof internal.__getValue).toBe('function');
    expect(read(result.current.translateX)).toBe(0);
  });
});

describe('law 1 — an animated property always rests at identity', () => {
  it('fade-in returns to opacity 1 the moment reduce-motion turns on mid-animation', () => {
    // The animation itself runs on the native driver, so its progress is not
    // observable from JS under Jest — which is precisely why the safety net is
    // what gets tested here, and why the strip's real opacity is asserted
    // against a running browser too (see the runtime verification).
    const { result, rerender } = renderHook(
      ({ reduce }: { reduce: boolean }) => useFadeIn('a', reduce),
      { initialProps: { reduce: false } },
    );
    act(() => {
      result.current.setValue(0);
    });
    rerender({ reduce: true });
    expect(read(result.current)).toBe(1);
  });

  it('fade-in returns to opacity 1 when interrupted by unmount', () => {
    const { result, unmount } = renderHook(() => useFadeIn('a', false));
    // Mid-animation the value is below 1...
    act(() => {
      result.current.setValue(0);
    });
    expect(read(result.current)).toBe(0);
    unmount();
    // ...and the cleanup restores identity unconditionally.
    expect(read(result.current)).toBe(1);
  });

  it('nudge rests at translateX 0 and returns there on unmount', () => {
    const { result, unmount } = renderHook(() => useNudge(false));
    expect(read(result.current.translateX)).toBe(0);
    act(() => {
      result.current.translateX.setValue(-4);
    });
    unmount();
    expect(read(result.current.translateX)).toBe(0);
  });
});

describe('law 3 — reduce-motion removes the animation, never the feedback', () => {
  it('fade-in does not animate at all, and stays fully visible', () => {
    const { result } = renderHook(() => useFadeIn('a', true));
    expect(read(result.current)).toBe(1);
  });

  it('nudge is a no-op that leaves the element in place', () => {
    const { result } = renderHook(() => useNudge(true));
    act(() => {
      result.current.nudge();
    });
    expect(read(result.current.translateX)).toBe(0);
  });
});

describe('useReduceMotion', () => {
  it('reports unresolved on the first render, so callers can suppress motion', () => {
    // The platform read is async; a component that renders immediately must not
    // animate before the answer arrives.
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current.resolved).toBe(false);
  });

  it('defaults to false and does not throw when the platform cannot answer', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValueOnce(new Error('unsupported'));
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current.reduceMotion).toBe(false);
  });

  it('reads the platform setting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
    const { result } = renderHook(() => useReduceMotion());
    await act(async () => undefined);
    expect(result.current).toEqual({ reduceMotion: true, resolved: true });
  });
});
