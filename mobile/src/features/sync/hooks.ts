/**
 * CAP-13 — React glue for accounts and sync.
 *
 * The one thing this must get right: for a signed-out user it does a single
 * storage read and nothing else. No Firebase, no network.
 */

import { useCallback, useEffect, useState } from 'react';

import { authService } from '@/features/auth/api';
import type { AuthService } from '@/features/auth/api';
import { isSyncConfigured } from '@/services/firebase';

import { syncService } from './api';
import type { SyncService } from './api';
import type { Account, AdoptionReport, SyncStatus } from './types';

/** What {@link useSync} exposes to a screen. */
export interface UseSyncResult {
  account: Account | null;
  status: SyncStatus;
  /** Whether this build has Firebase configuration at all. */
  configured: boolean;
  /** The last sync's adoption report, if any. */
  report: AdoptionReport | null;
  /** An i18n key for the last failure, if any. */
  errorKey: string | null;
  signIn(email: string, password: string): Promise<boolean>;
  signUp(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  syncNow(): Promise<void>;
  deleteAccount(): Promise<boolean>;
}

/**
 * Account state and sync operations.
 *
 * @param auth The auth service. Tests inject one over an in-memory store.
 * @param sync The sync service.
 * @returns The sync state and its operations.
 */
export function useSync(
  auth: AuthService = authService,
  sync: SyncService = syncService,
): UseSyncResult {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<SyncStatus>('signedOut');
  const [report, setReport] = useState<AdoptionReport | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      // One storage read. A user who has never signed in stops here, and
      // Firebase is never touched.
      const remembered = await auth.getRememberedAccount();
      if (cancelled) return;
      setAccount(remembered);
      setStatus(remembered === null ? 'signedOut' : 'idle');
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const runSync = useCallback(
    async (uid: string): Promise<void> => {
      setStatus('syncing');
      const outcome = await sync.sync(uid);
      if (outcome.ok) {
        setReport(outcome.report ?? null);
        setErrorKey(null);
        setStatus('idle');
      } else {
        setErrorKey(outcome.reasonKey ?? 'sync.error.unknown');
        // Local data is untouched and the app stays fully usable.
        setStatus('error');
      }
    },
    [sync],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setErrorKey(null);
      const result = await auth.signIn(email, password);
      if (!result.ok) {
        setErrorKey(result.reasonKey);
        return false;
      }
      setAccount(result.account);
      await runSync(result.account.uid);
      return true;
    },
    [auth, runSync],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setErrorKey(null);
      const result = await auth.signUp(email, password);
      if (!result.ok) {
        setErrorKey(result.reasonKey);
        return false;
      }
      setAccount(result.account);
      await runSync(result.account.uid);
      return true;
    },
    [auth, runSync],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await auth.signOut();
    setAccount(null);
    setStatus('signedOut');
    setReport(null);
    setErrorKey(null);
  }, [auth]);

  const syncNow = useCallback(async (): Promise<void> => {
    if (account === null) return;
    await runSync(account.uid);
  }, [account, runSync]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    const result = await auth.deleteAccount((uid) => sync.deleteAllCloudData(uid));
    if (!result.ok) {
      setErrorKey(result.reasonKey);
      return false;
    }
    setAccount(null);
    setStatus('signedOut');
    return true;
  }, [auth, sync]);

  return {
    account,
    status,
    configured: isSyncConfigured(),
    report,
    errorKey,
    signIn,
    signUp,
    signOut,
    syncNow,
    deleteAccount,
  };
}
