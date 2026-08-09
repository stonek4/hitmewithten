/**
 * CAP-7 trophy tests.
 *
 * The legacy migration is the highest-stakes function here: getting it wrong
 * silently erases years of a returning user's progress.
 */

import {
  applyCounters,
  emptyTrophyState,
  markNotified,
  mergeTrophyState,
  migrateLegacyTrophies,
  pendingNotifications,
  trophyId,
  trophyProgress,
  TROPHY_DEFS,
} from './logic';
import type { LegacyTrophy } from './logic';

const NOW = '2026-08-09T00:00:00.000Z';

/**
 * Build a legacy trophy row as v0.2.0 serialised it.
 *
 * @param type The legacy class name.
 * @param goal The threshold.
 * @param cards The per-trophy counter, frozen at the goal once obtained.
 * @param newObtained The one-shot notification latch.
 * @returns The legacy row.
 */
function legacy(type: string, goal: number, cards: number, newObtained = true): LegacyTrophy {
  return { type, goal, cards, newObtained };
}

describe('CAP-7 — the frozen roster', () => {
  it('has exactly 24 trophies in the documented split', () => {
    expect(TROPHY_DEFS).toHaveLength(24);
    expect(TROPHY_DEFS.filter((d) => d.type === 'tested')).toHaveLength(9);
    expect(TROPHY_DEFS.filter((d) => d.type === 'passed')).toHaveLength(8);
    expect(TROPHY_DEFS.filter((d) => d.type === 'failed')).toHaveLength(7);
  });

  it('uses the exact legacy thresholds, unchanged', () => {
    const goals = (type: string): number[] =>
      TROPHY_DEFS.filter((d) => d.type === type).map((d) => d.goal);
    expect(goals('tested')).toEqual([10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]);
    expect(goals('passed')).toEqual([50, 100, 500, 1000, 5000, 10000, 50000, 100000]);
    expect(goals('failed')).toEqual([10, 50, 100, 500, 1000, 5000, 10000]);
  });

  it('uses stable, language-independent ids', () => {
    expect(trophyId('tested', 500)).toBe('tested-500');
    expect(new Set(TROPHY_DEFS.map((d) => d.id)).size).toBe(24);
  });
});

describe('CAP-7 — counters and unlocking', () => {
  it('unlocks a threshold exactly when it is crossed, once', () => {
    let state = emptyTrophyState(NOW);
    const first = applyCounters(state, { tested: 9 }, NOW);
    expect(first.unlocked).toEqual([]);

    const second = applyCounters(first.state, { tested: 1 }, NOW);
    expect(second.unlocked.map((d) => d.id)).toEqual(['tested-10']);

    // Crossing again must not re-unlock.
    const third = applyCounters(second.state, { tested: 1 }, NOW);
    expect(third.unlocked).toEqual([]);
    state = third.state;
    expect(state.tested).toBe(11);
  });

  it('unlocks every threshold crossed by a single large increment', () => {
    const { unlocked } = applyCounters(emptyTrophyState(NOW), { tested: 600 }, NOW);
    expect(unlocked.map((d) => d.goal)).toEqual([10, 50, 100, 500]);
  });

  it('keeps counters monotonic — a negative delta is ignored, not applied', () => {
    const start = applyCounters(emptyTrophyState(NOW), { passed: 100 }, NOW).state;
    expect(applyCounters(start, { passed: -50 }, NOW).state.passed).toBe(100);
  });

  it('tracks pending notifications and clears them once shown', () => {
    const { state } = applyCounters(emptyTrophyState(NOW), { failed: 10 }, NOW);
    expect(pendingNotifications(state).map((d) => d.id)).toEqual(['failed-10']);
    const notified = markNotified(state, ['failed-10'], NOW);
    expect(pendingNotifications(notified)).toEqual([]);
  });

  it('reports progress toward each goal for the trophies screen', () => {
    const { state } = applyCounters(emptyTrophyState(NOW), { tested: 25 }, NOW);
    const progress = trophyProgress(state);
    const ten = progress.find((p) => p.def.id === 'tested-10');
    const fifty = progress.find((p) => p.def.id === 'tested-50');
    expect(ten).toMatchObject({ unlocked: true, current: 25, fraction: 1 });
    expect(fifty).toMatchObject({ unlocked: false, current: 25, fraction: 0.5 });
  });
});

describe('CAP-7 — legacy migration (max() across per-trophy counters)', () => {
  it('recovers the true counter from frozen and unfrozen rows', () => {
    // The worked example from the capability spec: a user who tested 14 cards.
    const raw = [
      legacy('CardsTestedTrophy', 10, 10, false), // frozen at its goal, already notified
      legacy('CardsTestedTrophy', 50, 14),
      legacy('CardsTestedTrophy', 100, 14),
    ];
    const { state, skipped } = migrateLegacyTrophies(raw, NOW);
    expect(skipped).toBe(0);
    expect(state.tested).toBe(14);
    expect(state.unlockedAt['tested-10']).toBe(NOW);
    expect(state.unlockedAt['tested-50']).toBeUndefined();
    // newObtained === false means the legacy app already showed the toast.
    expect(state.notifiedTrophyIds).toEqual(['tested-10']);
  });

  it('migrates all three counter types independently', () => {
    const raw = [
      legacy('CardsTestedTrophy', 10, 10, false),
      legacy('CardsTestedTrophy', 50, 37),
      legacy('CardsPassedTrophy', 50, 21),
      legacy('CardsFailedTrophy', 10, 10, false),
      legacy('CardsFailedTrophy', 50, 16),
    ];
    const { state } = migrateLegacyTrophies(raw, NOW);
    expect({ tested: state.tested, passed: state.passed, failed: state.failed }).toEqual({
      tested: 37,
      passed: 21,
      failed: 16,
    });
    expect(Object.keys(state.unlockedAt).sort()).toEqual(['failed-10', 'tested-10']);
  });

  it('does not lose a trophy the legacy app considered obtained', () => {
    const { state } = migrateLegacyTrophies([legacy('CardsPassedTrophy', 50, 50, false)], NOW);
    expect(state.unlockedAt['passed-50']).toBe(NOW);
    expect(state.passed).toBe(50);
  });

  it('documents the accepted cap: all-obtained counters recover only to the largest goal', () => {
    // Every tested trophy obtained means every counter is frozen at its own
    // goal, so max() reads 100000 even if the user really tested more. All
    // trophies of the type are already unlocked, so nothing visible is lost.
    const raw = TROPHY_DEFS.filter((d) => d.type === 'tested').map((d) =>
      legacy('CardsTestedTrophy', d.goal, d.goal, false),
    );
    const { state } = migrateLegacyTrophies(raw, NOW);
    expect(state.tested).toBe(100000);
    expect(Object.keys(state.unlockedAt)).toHaveLength(9);
  });

  it('ignores an unknown legacy trophy type rather than guessing', () => {
    const { state, skipped } = migrateLegacyTrophies(
      [legacy('CardsSomethingElseTrophy', 10, 99), legacy('CardsTestedTrophy', 10, 5)],
      NOW,
    );
    expect(skipped).toBe(1);
    expect(state.tested).toBe(5);
  });

  it('ignores a goal that is not in our frozen roster', () => {
    const { state } = migrateLegacyTrophies([legacy('CardsTestedTrophy', 42, 99)], NOW);
    // The counter still counts — that data is real — but no invented trophy.
    expect(state.tested).toBe(99);
    expect(state.unlockedAt['tested-42']).toBeUndefined();
    // 99 legitimately crosses the real 10 and 50 thresholds.
    expect(Object.keys(state.unlockedAt).sort()).toEqual(['tested-10', 'tested-50']);
  });

  it('survives every malformed shape without throwing', () => {
    for (const raw of [null, undefined, 42, 'nope', {}, [null], [{}], [{ type: 5 }]]) {
      expect(() => migrateLegacyTrophies(raw, NOW)).not.toThrow();
    }
    const { state } = migrateLegacyTrophies([null, { type: 'CardsTestedTrophy' }], NOW);
    expect(state.tested).toBe(0);
  });

  it('does not read Trophy.name, which the legacy app never assigned', () => {
    const { state } = migrateLegacyTrophies(
      [{ ...legacy('CardsTestedTrophy', 10, 10, false), name: 'garbage' }],
      NOW,
    );
    expect(state.unlockedAt['tested-10']).toBe(NOW);
  });
});

describe('CAP-7 — merge is order-independent', () => {
  it('takes max() per counter, unions ids and keeps the earlier unlock', () => {
    const a = {
      ...emptyTrophyState('2026-01-01T00:00:00.000Z'),
      tested: 100,
      unlockedAt: { 'tested-10': '2026-01-01T00:00:00.000Z' },
      notifiedTrophyIds: ['tested-10'],
    };
    const b = {
      ...emptyTrophyState('2026-02-01T00:00:00.000Z'),
      tested: 40,
      passed: 60,
      unlockedAt: { 'tested-10': '2025-06-01T00:00:00.000Z', 'passed-50': NOW },
      notifiedTrophyIds: ['passed-50'],
    };
    const merged = mergeTrophyState(a, b);
    expect(merged.tested).toBe(100);
    expect(merged.passed).toBe(60);
    expect(merged.unlockedAt['tested-10']).toBe('2025-06-01T00:00:00.000Z');
    expect(merged.notifiedTrophyIds.sort()).toEqual(['passed-50', 'tested-10']);
    expect(mergeTrophyState(b, a)).toEqual(merged);
  });
});
