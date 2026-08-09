/**
 * CAP-13 — authentication.
 *
 * **Sign-in is opt-in and nothing here runs until the user asks for it.** The
 * only thing this module does before that point is read a local marker
 * (`vc:account`) to answer "has this user ever opted in?" — a plain storage
 * read, no network, no SDK evaluation.
 *
 * That marker is what makes the zero-network guarantee work across restarts: a
 * signed-in user's session is restored on launch (they opted in), and a
 * signed-out user's launch never touches Firebase at all.
 */

import type { Account } from '@/features/sync/types';
import { ACCOUNT_KEY, deviceStore } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';
import { getFirebase, isSyncConfigured } from '@/services/firebase';

/** Why a sign-in attempt failed, as an i18n key the UI can show. */
export type AuthErrorKey =
  | 'sync.error.invalidEmail'
  | 'sync.error.wrongPassword'
  | 'sync.error.emailInUse'
  | 'sync.error.weakPassword'
  | 'sync.error.network'
  | 'sync.error.notConfigured'
  | 'sync.error.recentLoginRequired'
  | 'sync.error.unknown';

/** The outcome of an auth operation. */
export type AuthResult = { ok: true; account: Account } | { ok: false; reasonKey: AuthErrorKey };

/**
 * Map a Firebase error code onto one of our i18n keys.
 *
 * Firebase's own messages are English, developer-facing and occasionally leak
 * implementation detail, so they are never shown to a user.
 *
 * @param error The thrown value.
 * @returns The i18n key describing it.
 */
export function toAuthErrorKey(error: unknown): AuthErrorKey {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'sync.error.invalidEmail';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      // Deliberately the same key for all three: telling an attacker which
      // emails exist is an account-enumeration leak.
      return 'sync.error.wrongPassword';
    case 'auth/email-already-in-use':
      return 'sync.error.emailInUse';
    case 'auth/weak-password':
      return 'sync.error.weakPassword';
    case 'auth/network-request-failed':
      return 'sync.error.network';
    case 'auth/requires-recent-login':
      return 'sync.error.recentLoginRequired';
    default:
      return 'sync.error.unknown';
  }
}

/** Authentication, and the local record of having opted in. */
export class AuthService {
  private readonly store: KeyValueStore;

  /**
   * @param store The key/value store holding the opt-in marker.
   */
  constructor(store: KeyValueStore = deviceStore) {
    this.store = store;
  }

  /**
   * Read the locally-remembered account, without touching Firebase.
   *
   * This is the call the app makes on every launch. For a user who has never
   * signed in it is one storage read and nothing else.
   *
   * @returns The remembered account, or null when there is none.
   */
  async getRememberedAccount(): Promise<Account | null> {
    const raw = await this.store.getItem(ACCOUNT_KEY);
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as Account;
      return typeof parsed?.uid === 'string' && parsed.uid.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Persist the opt-in marker.
   *
   * @param account The signed-in account, or null to clear it.
   */
  private async remember(account: Account | null): Promise<void> {
    if (account === null) await this.store.removeItem(ACCOUNT_KEY);
    else await this.store.setItem(ACCOUNT_KEY, JSON.stringify(account));
  }

  /**
   * Create an account with an email and password.
   *
   * @param email The user's email.
   * @param password The chosen password.
   * @returns The account, or the reason it failed.
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!isSyncConfigured()) return { ok: false, reasonKey: 'sync.error.notConfigured' };
    try {
      const { auth } = getFirebase();
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- see services/firebase.ts
      const { createUserWithEmailAndPassword } = require('firebase/auth') as typeof import('firebase/auth');
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const account = toAccount(credential.user.uid, credential.user.email, credential.user.displayName);
      await this.remember(account);
      return { ok: true, account };
    } catch (error) {
      return { ok: false, reasonKey: toAuthErrorKey(error) };
    }
  }

  /**
   * Sign in with an email and password.
   *
   * @param email The user's email.
   * @param password Their password.
   * @returns The account, or the reason it failed.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSyncConfigured()) return { ok: false, reasonKey: 'sync.error.notConfigured' };
    try {
      const { auth } = getFirebase();
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- see services/firebase.ts
      const { signInWithEmailAndPassword } = require('firebase/auth') as typeof import('firebase/auth');
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const account = toAccount(credential.user.uid, credential.user.email, credential.user.displayName);
      await this.remember(account);
      return { ok: true, account };
    } catch (error) {
      return { ok: false, reasonKey: toAuthErrorKey(error) };
    }
  }

  /**
   * Sign out.
   *
   * **Local data is kept** — the caller decides separately whether to remove
   * this device's copy, and that alternative is offered explicitly with a
   * warning. Signing out must never be an accidental deletion (US-I4).
   */
  async signOut(): Promise<void> {
    try {
      const { auth } = getFirebase();
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- see services/firebase.ts
      const { signOut } = require('firebase/auth') as typeof import('firebase/auth');
      await signOut(auth);
    } catch {
      // Even if the network call fails, the local opt-in marker must clear —
      // otherwise the user is stuck "signed in" with no way back to local-only.
    }
    await this.remember(null);
  }

  /**
   * Delete the account and all of its cloud data.
   *
   * Required in-app by **both** the App Store and Google Play for any app that
   * offers account creation, and therefore launch-blocking for any build that
   * ships accounts (US-I6). The caller is responsible for offering an export
   * first and for asking separately whether to keep the local copy.
   *
   * @param deleteCloudData Called to erase the user's Firestore documents
   *                        before the auth user goes away — after deletion the
   *                        rules would reject the writes.
   * @returns Whether it succeeded, or the reason it did not.
   */
  async deleteAccount(
    deleteCloudData: (uid: string) => Promise<void>,
  ): Promise<{ ok: true } | { ok: false; reasonKey: AuthErrorKey }> {
    try {
      const { auth } = getFirebase();
      const user = auth.currentUser;
      if (user === null) {
        await this.remember(null);
        return { ok: true };
      }
      // Data first: once the auth user is gone the rules deny every write, so
      // the documents would be orphaned beyond the user's own reach.
      await deleteCloudData(user.uid);
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- see services/firebase.ts
      const { deleteUser } = require('firebase/auth') as typeof import('firebase/auth');
      await deleteUser(user);
      await this.remember(null);
      return { ok: true };
    } catch (error) {
      return { ok: false, reasonKey: toAuthErrorKey(error) };
    }
  }
}

/**
 * Build the app's account record from Firebase's user fields.
 *
 * @param uid The Firebase uid.
 * @param email The user's email, if any.
 * @param displayName Their display name, if any.
 * @returns The account.
 */
function toAccount(uid: string, email: string | null, displayName: string | null): Account {
  return { uid, email, displayName, provider: 'password' };
}

/** The auth service the running app uses. */
export const authService = new AuthService();
