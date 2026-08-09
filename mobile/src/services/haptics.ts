/**
 * Haptic feedback.
 *
 * Every call is gated on **both** the Haptics preference (CAP-10, default on,
 * device-local) **and** the platform having a haptic engine — web is a no-op,
 * never a fallback vibration.
 *
 * Haptics are an enhancement on top of feedback that is already visible and
 * already announced; nothing here is the only signal for anything.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** The events that carry a haptic, per `design/design-tokens.md` §11. */
export type HapticEvent =
  | 'answerCorrect'
  | 'answerWrong'
  | 'trophyUnlocked'
  | 'sessionComplete'
  | 'destructiveConfirm';

/**
 * Whether this platform can produce haptics at all.
 *
 * Card advance and button presses deliberately carry none: the first would
 * become noise at the rate this app advances cards, and the second is the
 * platform's job.
 *
 * @returns True on iOS and Android, false on web.
 */
export function hapticsAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Fire the haptic for an event, if it is allowed.
 *
 * Never throws and never awaits anything the caller needs: a haptic that fails
 * must not interrupt the drilling loop.
 *
 * @param event Which event occurred.
 * @param enabled The user's Haptics preference.
 */
export function fireHaptic(event: HapticEvent, enabled: boolean): void {
  if (!enabled || !hapticsAvailable()) return;
  try {
    switch (event) {
      case 'answerCorrect':
      case 'trophyUnlocked':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'answerWrong':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      case 'sessionComplete':
      case 'destructiveConfirm':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
    }
  } catch {
    // A device with no working haptic engine must not break the flow.
  }
}
