/**
 * CAP-7 — pure trophy logic: the frozen roster, unlocking, and the legacy
 * migration rule.
 *
 * No React, no storage. `api.ts` persists; this decides.
 */

import type { TrophyDef, TrophyId, TrophyProgress, TrophyState, TrophyType } from './types';

/**
 * The 24 trophy thresholds, **frozen**.
 *
 * Changing or removing an existing trophy rewrites users' history and is
 * forbidden; new categories may only be added. These exact numbers are what
 * returning users have already partially earned.
 */
const GOALS: Record<TrophyType, readonly number[]> = {
  tested: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  passed: [50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  failed: [10, 50, 100, 500, 1000, 5000, 10000],
};

/**
 * Build a trophy's stable id from its type and goal.
 *
 * @param type The counter it measures.
 * @param goal The threshold.
 * @returns The persisted identifier, e.g. `tested-500`.
 */
export function trophyId(type: TrophyType, goal: number): TrophyId {
  return `${type}-${goal}`;
}

/** Every trophy, in type order then ascending goal. 24 total. */
export const TROPHY_DEFS: readonly TrophyDef[] = (
  ['tested', 'passed', 'failed'] as const
).flatMap((type) => GOALS[type].map((goal) => ({ id: trophyId(type, goal), type, goal })));

/**
 * A fresh, empty trophy state.
 *
 * @param now The current instant, ISO-8601.
 * @returns Zeroed counters with nothing unlocked.
 */
export function emptyTrophyState(now: string): TrophyState {
  return { tested: 0, passed: 0, failed: 0, unlockedAt: {}, notifiedTrophyIds: [], updatedAt: now };
}

/**
 * Add to the counters and unlock any newly crossed thresholds.
 *
 * Counters are monotonic: negative deltas are ignored rather than applied,
 * because a counter that can go down breaks both the trophy semantics and the
 * `max()` sync merge.
 *
 * @param state The current state.
 * @param delta How much to add to each counter. Omitted counters add nothing.
 * @param now The current instant, ISO-8601.
 * @returns The new state and the trophies unlocked by this increment.
 */
export function applyCounters(
  state: TrophyState,
  delta: Partial<Record<TrophyType, number>>,
  now: string,
): { state: TrophyState; unlocked: TrophyDef[] } {
  const next: TrophyState = {
    ...state,
    tested: state.tested + Math.max(0, delta.tested ?? 0),
    passed: state.passed + Math.max(0, delta.passed ?? 0),
    failed: state.failed + Math.max(0, delta.failed ?? 0),
    unlockedAt: { ...state.unlockedAt },
    updatedAt: now,
  };

  const unlocked: TrophyDef[] = [];
  for (const def of TROPHY_DEFS) {
    if (next.unlockedAt[def.id] !== undefined) continue;
    if (next[def.type] >= def.goal) {
      next.unlockedAt[def.id] = now;
      unlocked.push(def);
    }
  }
  return { state: next, unlocked };
}

/**
 * Trophies that are unlocked but whose toast has not been shown.
 *
 * A missed toast is not a lost event — the trophies screen is the durable
 * record, and this is only about the transient notification.
 *
 * @param state The current state.
 * @returns The trophies still awaiting a notification, in roster order.
 */
export function pendingNotifications(state: TrophyState): TrophyDef[] {
  return TROPHY_DEFS.filter(
    (def) => state.unlockedAt[def.id] !== undefined && !state.notifiedTrophyIds.includes(def.id),
  );
}

/**
 * Mark trophies as notified.
 *
 * @param state The current state.
 * @param ids The trophies whose toast has now been shown.
 * @param now The current instant, ISO-8601.
 * @returns The new state.
 */
export function markNotified(state: TrophyState, ids: readonly TrophyId[], now: string): TrophyState {
  const merged = new Set([...state.notifiedTrophyIds, ...ids]);
  return { ...state, notifiedTrophyIds: [...merged], updatedAt: now };
}

/**
 * Resolve every trophy against the current counters, for the trophies screen.
 *
 * @param state The current state.
 * @returns One {@link TrophyProgress} per trophy, in roster order.
 */
export function trophyProgress(state: TrophyState): TrophyProgress[] {
  return TROPHY_DEFS.map((def) => {
    const current = state[def.type];
    return {
      def,
      current,
      unlocked: state.unlockedAt[def.id] !== undefined,
      fraction: Math.min(1, def.goal === 0 ? 1 : current / def.goal),
      unlockedAt: state.unlockedAt[def.id] ?? null,
    };
  });
}

/** One serialized legacy trophy, as v0.2.0 wrote it to `localStorage.trophies`. */
export interface LegacyTrophy {
  type?: unknown;
  cards?: unknown;
  goal?: unknown;
  newObtained?: unknown;
}

/** Legacy class name → our counter type. */
const LEGACY_TYPES: Record<string, TrophyType> = {
  CardsTestedTrophy: 'tested',
  CardsPassedTrophy: 'passed',
  CardsFailedTrophy: 'failed',
};

/**
 * Recover real trophy progress from the legacy per-trophy counters.
 *
 * **Get this exactly right or you silently erase years of a user's progress.**
 * The legacy app stored a counter *per trophy* and `updateTrophyType` skipped
 * already-obtained trophies, so each trophy's counter **freezes at its own
 * goal** while un-obtained ones keep counting. The true global counter is
 * therefore:
 *
 * - `counter = max(storedCounter)` across all trophies of that type
 * - `unlocked = { t : t.storedCounter >= t.goal }`
 * - `alreadyNotified = { t : t.newObtained === false }` — `newObtained` is a
 *   one-shot latch the legacy app flipped when it showed the toast, so `false`
 *   means "already told them".
 *
 * Worked example: a user who has tested 14 cards has `tested(goal 10) = 10`
 * (frozen) and `tested(goal 50…100000) = 14`; `max = 14`.
 *
 * **Known, accepted limitation:** once *every* trophy of a type is obtained all
 * its counters are frozen at their goals, so the recovered counter caps at the
 * largest goal (e.g. 100 000 tested). At that point every trophy of that type
 * is already unlocked, so nothing user-visible is lost. Documented, not fixed.
 *
 * Legacy `Trophy.name` is declared but never assigned and serialises as absent
 * — it is deliberately not read here.
 *
 * @param raw The parsed `localStorage.trophies` value. Untrusted: any shape.
 * @param now The instant to stamp recovered unlocks with.
 * @returns The recovered state, plus how many entries were unreadable.
 */
export function migrateLegacyTrophies(
  raw: unknown,
  now: string,
): { state: TrophyState; skipped: number } {
  const state = emptyTrophyState(now);
  if (!Array.isArray(raw)) return { state, skipped: 0 };

  let skipped = 0;
  const counters: Record<TrophyType, number> = { tested: 0, passed: 0, failed: 0 };

  for (const entry of raw as LegacyTrophy[]) {
    const type =
      typeof entry?.type === 'string' ? LEGACY_TYPES[entry.type as string] : undefined;
    const cards = entry?.cards;
    const goal = entry?.goal;
    if (type === undefined || typeof cards !== 'number' || typeof goal !== 'number') {
      skipped++;
      continue;
    }
    if (!Number.isFinite(cards) || !Number.isFinite(goal) || cards < 0) {
      skipped++;
      continue;
    }

    counters[type] = Math.max(counters[type], cards);

    // Unlock from the STORED comparison, not from the recovered counter: a
    // trophy the legacy app considered obtained stays obtained even if our
    // recovered maximum somehow disagrees.
    if (cards >= goal) {
      const id = trophyId(type, goal);
      // Only ids in our frozen roster; a goal we don't ship is not ours to invent.
      if (TROPHY_DEFS.some((def) => def.id === id)) {
        state.unlockedAt[id] = now;
        if (entry.newObtained === false) state.notifiedTrophyIds.push(id);
      }
    }
  }

  state.tested = counters.tested;
  state.passed = counters.passed;
  state.failed = counters.failed;

  // Anything the recovered counters imply but the legacy rows did not record
  // (e.g. a roster the old app never created) is unlocked here for consistency.
  const reconciled = applyCounters(state, {}, now);
  return { state: reconciled.state, skipped };
}

/**
 * Merge two trophy states.
 *
 * `max()` per counter and a union of ids — correct and order-independent
 * because the counters are monotonic. Used by CAP-13 sync, and by CAP-8 when
 * legacy progress is adopted on top of progress already made in the rebuild.
 *
 * @param a One state.
 * @param b The other state.
 * @returns The merged state.
 */
export function mergeTrophyState(a: TrophyState, b: TrophyState): TrophyState {
  const unlockedAt: Record<TrophyId, string> = { ...a.unlockedAt };
  for (const [id, at] of Object.entries(b.unlockedAt)) {
    // Keep the EARLIER unlock — that is when the user actually earned it.
    if (unlockedAt[id] === undefined || at < unlockedAt[id]) unlockedAt[id] = at;
  }
  return {
    tested: Math.max(a.tested, b.tested),
    passed: Math.max(a.passed, b.passed),
    failed: Math.max(a.failed, b.failed),
    unlockedAt,
    notifiedTrophyIds: [...new Set([...a.notifiedTrophyIds, ...b.notifiedTrophyIds])],
    updatedAt: a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt,
  };
}
