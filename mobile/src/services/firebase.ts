/**
 * The single initialisation point for Firebase — and, more importantly, the
 * thing that guarantees Firebase is **never initialised at all** unless the
 * user has opted into sync.
 *
 * ## Why this file is written the way it is
 *
 * CAP-13 §13.1 is P0 and it is absolute: *"Local-only mode makes no
 * authentication calls of any kind — no anonymous auth session, no silent
 * account creation, no device registration. 'No account' means no account,
 * **verifiable by watching the network**."*
 *
 * A top-level `import { initializeApp } from 'firebase/app'` anywhere in the
 * app's import graph would break that, because the SDK installs listeners and
 * begins auth-state resolution as soon as it is evaluated. So the SDK is loaded
 * through a **guarded `require()` inside a function**, never at module scope.
 * Nothing here executes until {@link getFirebase} is called, and nothing calls
 * it until the user signs in.
 *
 * `require()` rather than dynamic `import()` deliberately: this project's
 * Jest/Babel configuration does not support dynamic import
 * (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG`), so a dynamic import here
 * would make the whole auth path untestable. A guarded `require` is
 * conditional, deferred and unit-testable, and behaves identically.
 *
 * **Bundle cost, stated honestly:** the SDK is still *bundled* — deferring
 * evaluation does not remove it from the download. What it removes is
 * execution, listeners and network traffic for the users who never sign in,
 * which is what the constraint is about.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/** The client configuration for the `vocards-62df8` project. */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * The project's public client config.
 *
 * These are **publishable identifiers, not secrets** — the web `apiKey`
 * identifies the project to Google's endpoints and is visible in any client
 * bundle. What actually protects the data is `firestore.rules` plus an HTTP
 * referrer restriction on the key. Read from `EXPO_PUBLIC_*` env vars so a
 * different project can be pointed at without a code change, with the known
 * project as the default.
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'vocards-62df8.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'vocards-62df8',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'vocards-62df8.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** The initialised SDK handles, once the user has opted in. */
export interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/** Cached handles, so initialisation happens exactly once per process. */
let handles: FirebaseHandles | null = null;

/**
 * Whether Firebase has been initialised in this process.
 *
 * Exposed so the zero-network guarantee can be asserted by a test rather than
 * merely intended.
 *
 * @returns True once {@link getFirebase} has run.
 */
export function isFirebaseInitialized(): boolean {
  return handles !== null;
}

/**
 * Whether the build is configured to talk to Firebase at all.
 *
 * A build with no API key cannot sync, and must say so rather than failing
 * inside a sign-in attempt.
 *
 * @returns True when the client config is complete enough to initialise.
 */
export function isSyncConfigured(): boolean {
  return firebaseConfig.apiKey.length > 0 && firebaseConfig.appId.length > 0;
}

/**
 * Initialise Firebase, or return the already-initialised handles.
 *
 * **Call this only from a path the user has explicitly opted into.** It is the
 * first moment the app touches the network.
 *
 * @returns The shared app, auth and Firestore handles.
 * @throws {Error} If the build has no Firebase configuration, so a
 *         misconfigured build fails loudly at the one place that can explain
 *         itself rather than somewhere deep in a sync pass.
 */
export function getFirebase(): FirebaseHandles {
  if (handles !== null) return handles;
  if (!isSyncConfigured()) {
    throw new Error('Sync is not configured in this build (missing Firebase client config).');
  }

  /* eslint-disable @typescript-eslint/no-require-imports -- see the file header:
     a guarded require is what keeps the SDK from evaluating for signed-out
     users, and dynamic import is unsupported by this project's Jest config. */
  const { initializeApp, getApps, getApp } = require('firebase/app') as typeof import('firebase/app');
  const { getAuth } = require('firebase/auth') as typeof import('firebase/auth');
  const { getFirestore } = require('firebase/firestore') as typeof import('firebase/firestore');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  handles = { app, auth: getAuth(app), db: getFirestore(app) };
  return handles;
}

/**
 * Forget the cached handles.
 *
 * For tests only — the app itself never tears Firebase down, because signing
 * out does not un-initialise the SDK.
 */
export function resetFirebaseForTests(): void {
  handles = null;
}
