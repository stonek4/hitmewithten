/**
 * CAP-11 — React glue for starter content.
 */

import { useEffect } from 'react';

import { starterContentService } from './api';
import type { StarterContentService } from './api';

/**
 * Seed the starter sets on a genuine first run.
 *
 * Deliberately gated on the legacy migration having finished: CAP-8 runs first
 * and a returning user's own library must win over four new sets. Running both
 * concurrently would race, and the loser would be the user's real data.
 *
 * @param ready Whether the migration has finished and seeding may proceed.
 * @param onSeeded Called after sets were actually created, so the caller can
 *                 refresh a library it has already read.
 * @param service The service to use. Tests inject one over in-memory stores.
 */
export function useStarterContent(
  ready: boolean,
  onSeeded?: () => void,
  service: StarterContentService = starterContentService,
): void {
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function run(): Promise<void> {
      try {
        const result = await service.seedIfFirstRun();
        if (!cancelled && result.seeded) onSeeded?.();
      } catch {
        // Seeding is a nicety. It must never stop the app from starting, and
        // the marker is not written on this path so the next launch retries.
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // `onSeeded` is deliberately excluded: this must run once per readiness
    // change, and an inline callback would re-trigger it on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, service]);
}
