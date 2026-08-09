/**
 * Motion primitives.
 *
 * **The three motion laws for this app** (`design/design-tokens.md` §10.1),
 * which exist because the live app's most serious confirmed defect is an
 * animation-driven soft-lock:
 *
 * 1. **Motion is decorative-only. It never carries state.** No animation may
 *    set `visibility`, mount or unmount a node, gate navigation, or leave
 *    `opacity: 0` as a **resting** value. Every animated property starts and
 *    ends at identity. If an animation is skipped, interrupted, throws, or is
 *    disabled, the UI is already in its correct final state.
 * 2. **Validate, then navigate, then animate.** Never animate-then-navigate.
 * 3. **Reduce-motion removes the animation, never the feedback.**
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

import { motion } from '@/theme/tokens';

/** The reduce-motion preference, and whether it has been determined yet. */
export interface ReduceMotionState {
  reduceMotion: boolean;
  /**
   * False until the platform has answered.
   *
   * `AccessibilityInfo.isReduceMotionEnabled()` is **asynchronous**, so a
   * component that renders immediately — the diff strip appears the instant an
   * answer is submitted — can otherwise run its animation before the answer
   * arrives, moving the screen for a user who asked for no movement. Callers
   * must not animate until this is true. Found by driving the app with
   * `prefers-reduced-motion: reduce`.
   */
  resolved: boolean;
}

/**
 * Whether the user has asked for reduced motion.
 *
 * Read once and then kept in step with the OS setting, so toggling it takes
 * effect without a restart.
 *
 * @returns The preference and whether it has been determined.
 */
export function useReduceMotion(): ReduceMotionState {
  const [reduce, setReduce] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function read(): Promise<void> {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (!cancelled) setReduce(enabled);
      } catch {
        // A platform that cannot answer is treated as "no preference"; the
        // animations are all safe either way.
      } finally {
        if (!cancelled) setResolved(true);
      }
    }
    void read();
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduce(enabled);
      setResolved(true);
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return { reduceMotion: reduce, resolved };
}

/**
 * A one-shot fade-in whose **resting value is always 1**.
 *
 * The value is created at 1 — identity — and the animation drops it to 0 and
 * brings it straight back. The cleanup forces it to 1, so an interrupted,
 * unmounted or disabled animation can never leave the element invisible. That
 * is the structural guarantee law 1 demands: the fade is decoration on top of
 * an element that is already in its final state.
 *
 * @param key Changing this restarts the fade. Pass the thing being revealed.
 * @param reduceMotion When true, no animation runs at all and the value stays 1.
 * @returns An opacity value to spread into an `Animated.View` style.
 */
export function useFadeIn(key: unknown, reduceMotion: boolean): Animated.Value {
  // Lazy useState rather than useRef: reading `ref.current` during render is
  // what react-hooks/refs forbids, and this keeps one stable value per mount.
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: motion.named.diffAppear,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      // Identity, unconditionally. Nothing may be left faded out.
      opacity.setValue(1);
    };
  }, [key, opacity, reduceMotion]);

  return opacity;
}

/**
 * The attention nudge for a wrong answer — the descendant of the legacy shake,
 * at a quarter of its amplitude.
 *
 * ±4 dp horizontal, 150 ms, **starting and ending at `translateX: 0`**, so an
 * interrupted or disabled nudge leaves the strip exactly where it belongs.
 * Under reduce-motion the movement is dropped entirely; the caller still shows
 * the diff, so the feedback is never removed — only the motion.
 *
 * @param reduceMotion When true, `nudge()` does nothing.
 * @returns The translate value to apply, and a function to trigger the nudge.
 */
export function useNudge(reduceMotion: boolean): {
  translateX: Animated.Value;
  nudge: () => void;
} {
  const [translateX] = useState(() => new Animated.Value(0));

  useEffect(
    () => () => {
      // Whatever happens, the resting position is 0.
      translateX.setValue(0);
    },
    [translateX],
  );

  const nudge = (): void => {
    if (reduceMotion) return;
    const step = (toValue: number, duration: number): Animated.CompositeAnimation =>
      Animated.timing(translateX, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const quarter = motion.named.diffNudge / 4;
    Animated.sequence([step(-4, quarter), step(4, quarter * 2), step(0, quarter)]).start(() => {
      // Belt and braces: the sequence ends at 0 by construction, and this makes
      // it true even if a frame is dropped or the animation is cancelled.
      translateX.setValue(0);
    });
  };

  return { translateX, nudge };
}
