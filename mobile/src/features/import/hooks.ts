/**
 * CAP-8 — React glue for the automatic same-origin migration.
 */

import { useCallback, useEffect, useState } from 'react';

import { importService } from './api';
import type { ImportService } from './api';
import type { LegacyMigrationRecord } from './types';

/** What {@link useLegacyMigration} exposes to a screen. */
export interface UseLegacyMigrationResult {
  /** The result of the one-time migration, or null if there was nothing to report. */
  record: LegacyMigrationRecord | null;
  /** True while the migration is running. */
  running: boolean;
  /** Hide the report banner. */
  dismiss(): void;
}

/**
 * Run the one-time legacy migration on first launch and report the outcome.
 *
 * Runs **with no user action**, because a returning user should find their
 * library already there rather than being asked to go and fetch it. It is
 * idempotent: after a successful run this resolves to null forever.
 *
 * @param onComplete Called after a migration that actually adopted something,
 *                   so the caller can refresh the library it has already read.
 * @param service The import service to use. Tests inject one over in-memory
 *                stores.
 * @returns The migration state.
 */
export function useLegacyMigration(
  onComplete?: () => void,
  service: ImportService = importService,
): UseLegacyMigrationResult {
  const [record, setRecord] = useState<LegacyMigrationRecord | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run(): Promise<void> {
      let result: LegacyMigrationRecord | null = null;
      try {
        result = await service.migrateLegacyStorage();
      } catch {
        // A migration that throws must never stop the app from starting. The
        // marker is not written on this path, so the next launch retries — and
        // legacy data is read-only, so a retry is always safe.
        result = null;
      }
      if (cancelled) return;
      setRecord(result);
      setRunning(false);
      if (result !== null) onComplete?.();
    }
    void run();
    return () => {
      cancelled = true;
    };
    // `onComplete` is deliberately not a dependency: this must run exactly once
    // per mount, and a caller passing an inline callback would otherwise
    // re-trigger it on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const dismiss = useCallback(() => setRecord(null), []);

  return { record, running, dismiss };
}
