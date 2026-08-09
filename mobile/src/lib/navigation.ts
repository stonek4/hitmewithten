/**
 * Navigation helpers.
 *
 * **Navigation is explicit and named, never `history.back()`.** The legacy app
 * called browser-back — sometimes twice — on a hard-coded assumption about the
 * entry path (REBUILD_SPEC §7, defect #12).
 */

import { router } from 'expo-router';

/**
 * Go back, or to the library when there is nowhere to go back to.
 *
 * On web every screen has a real URL, so a user can arrive at `/set/{id}` by
 * deep link, bookmark or reload with an **empty history stack**. A bare
 * `router.back()` there does nothing at all — the navigator logs
 * "The action 'GO_BACK' was not handled by any navigator" and the user is
 * stranded on a screen whose back button appears broken. Found by driving the
 * app after a reload.
 *
 * @param fallback Where to go when there is no history. Defaults to the library.
 */
export function goBackOrHome(fallback: '/' = '/'): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
