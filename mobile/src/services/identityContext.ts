/**
 * The one place the app reaches for a UUID generator and a wall clock.
 *
 * CAP-12's logic is pure and takes both as an injected
 * {@link IdentityContext}; this module supplies the real, platform-backed one.
 * Centralised so that "where do ids come from?" has exactly one answer, and so
 * tests can substitute a deterministic context without mocking a module.
 */

import { randomUUID } from 'expo-crypto';

import type { IdentityContext } from '@/features/identity/types';

/**
 * The production identity context: cryptographically random UUID v4s and the
 * device clock, in UTC.
 *
 * `expo-crypto`'s `randomUUID()` delegates to the platform CSPRNG on every
 * target (including `crypto.randomUUID()` on web), so ids are assignable with
 * no network and no account — which is what makes a later sign-in a union by
 * id.
 */
export const identityContext: IdentityContext = {
  /**
   * @returns A fresh RFC-4122 version 4 UUID.
   */
  newId(): string {
    return randomUUID();
  },
  /**
   * @returns The current instant as an ISO-8601 UTC string.
   */
  now(): string {
    return new Date().toISOString();
  },
};
