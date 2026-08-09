/**
 * CAP-13 auth tests.
 *
 * The first describe block is the important one: §13.1's zero-network
 * guarantee is P0, it gates the launch build, and this whole capability is the
 * thing most likely to break it.
 */

import { createMemoryStore, ACCOUNT_KEY } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';
import { isFirebaseInitialized, resetFirebaseForTests } from '@/services/firebase';

import { AuthService, toAuthErrorKey } from './api';

/**
 * Build an auth service over a fresh in-memory store.
 *
 * @returns The service and its store.
 */
function makeAuth(): { auth: AuthService; store: KeyValueStore } {
  const store = createMemoryStore();
  return { auth: new AuthService(store), store };
}

describe('CAP-13 §13.1 — a signed-out user touches Firebase not at all', () => {
  beforeEach(() => {
    resetFirebaseForTests();
  });

  it('does not initialise Firebase merely by importing the auth service', () => {
    // A top-level `import { initializeApp }` anywhere in the app's import graph
    // would begin auth-state resolution the moment the module evaluated. The
    // guarded require in services/firebase.ts is what prevents that, and this
    // asserts it rather than trusting it.
    expect(isFirebaseInitialized()).toBe(false);
  });

  it('reads the remembered account with storage alone, initialising nothing', async () => {
    const { auth } = makeAuth();
    expect(await auth.getRememberedAccount()).toBeNull();
    // This is the call the app makes on EVERY launch.
    expect(isFirebaseInitialized()).toBe(false);
  });

  it('still initialises nothing when a marker exists but nothing is asked of it', async () => {
    const { auth, store } = makeAuth();
    await store.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ uid: 'u1', email: 'a@b.c', displayName: null, provider: 'password' }),
    );
    expect((await auth.getRememberedAccount())?.uid).toBe('u1');
    expect(isFirebaseInitialized()).toBe(false);
  });

  it('survives a corrupt marker by reporting no account, not by throwing', async () => {
    const { auth, store } = makeAuth();
    await store.setItem(ACCOUNT_KEY, 'not json');
    expect(await auth.getRememberedAccount()).toBeNull();
    await store.setItem(ACCOUNT_KEY, JSON.stringify({ uid: '' }));
    expect(await auth.getRememberedAccount()).toBeNull();
    expect(isFirebaseInitialized()).toBe(false);
  });
});

describe('CAP-13 — a build with no Firebase config fails cleanly', () => {
  it('refuses sign-in with a nameable reason rather than throwing', async () => {
    // The test environment has no EXPO_PUBLIC_FIREBASE_* values, so this is
    // also the real behaviour of a misconfigured build.
    const { auth } = makeAuth();
    expect(await auth.signIn('a@b.c', 'pw')).toEqual({
      ok: false,
      reasonKey: 'sync.error.notConfigured',
    });
    expect(await auth.signUp('a@b.c', 'pw')).toEqual({
      ok: false,
      reasonKey: 'sync.error.notConfigured',
    });
  });

  it('signing out still clears the local marker, so a user is never stuck', async () => {
    const { auth, store } = makeAuth();
    await store.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ uid: 'u1', email: null, displayName: null, provider: 'password' }),
    );
    await auth.signOut();
    expect(await auth.getRememberedAccount()).toBeNull();
  });
});

describe('CAP-13 — auth errors become i18n keys, never raw messages', () => {
  it('maps the codes a user can actually cause', () => {
    expect(toAuthErrorKey({ code: 'auth/invalid-email' })).toBe('sync.error.invalidEmail');
    expect(toAuthErrorKey({ code: 'auth/email-already-in-use' })).toBe('sync.error.emailInUse');
    expect(toAuthErrorKey({ code: 'auth/weak-password' })).toBe('sync.error.weakPassword');
    expect(toAuthErrorKey({ code: 'auth/network-request-failed' })).toBe('sync.error.network');
    expect(toAuthErrorKey({ code: 'auth/requires-recent-login' })).toBe(
      'sync.error.recentLoginRequired',
    );
  });

  it('does not leak whether an email is registered', () => {
    // Distinguishing "wrong password" from "no such user" is an account
    // enumeration leak, so all three collapse to one message.
    const same = 'sync.error.wrongPassword';
    expect(toAuthErrorKey({ code: 'auth/wrong-password' })).toBe(same);
    expect(toAuthErrorKey({ code: 'auth/user-not-found' })).toBe(same);
    expect(toAuthErrorKey({ code: 'auth/invalid-credential' })).toBe(same);
  });

  it('falls back for anything unrecognised, including non-errors', () => {
    for (const value of [null, undefined, 'nope', {}, { code: 'auth/whatever' }]) {
      expect(toAuthErrorKey(value)).toBe('sync.error.unknown');
    }
  });
});
