/**
 * CAP-12 tests.
 *
 * These pin the properties in capability-spec.md §12.2's data-shape pressure
 * test — the walk of one real card set through every operation it must survive.
 */

import { identityContext } from '@/services/identityContext';

import {
  createCard,
  createCardSet,
  createTracked,
  isAlive,
  isDirty,
  isPurgeableTombstone,
  markSynced,
  normalizeTextList,
  pruneTombstones,
  reorder,
  restore,
  tombstone,
  touch,
} from './logic';
import { SCHEMA_VERSION, TOMBSTONE_RETENTION_DAYS } from './types';
import type { IdentityContext, Tracked } from './types';

/** A UUID v4 as RFC 4122 defines it, including the version and variant nibbles. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Build a deterministic identity context for tests.
 *
 * Ids are sequential and the clock only moves when a test moves it, so
 * assertions about *which* mutations stamped `updatedAt` are exact rather than
 * timing-dependent.
 *
 * @param startIso The initial instant the clock reports.
 * @returns A context plus controls for advancing the clock.
 */
function fakeContext(startIso = '2026-01-01T00:00:00.000Z'): IdentityContext & {
  set(iso: string): void;
  advanceDays(days: number): void;
} {
  let current = startIso;
  let counter = 0;
  return {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    now: () => current,
    set: (iso: string) => {
      current = iso;
    },
    advanceDays: (days: number) => {
      current = new Date(Date.parse(current) + days * 86_400_000).toISOString();
    },
  };
}

describe('CAP-12 — createTracked', () => {
  it('stamps a fresh, live, never-synced entity at the current schema version', () => {
    const ctx = fakeContext();
    const tracked = createTracked(ctx);
    expect(tracked).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
      syncedAt: null,
      schemaVersion: SCHEMA_VERSION,
    });
    expect(isAlive(tracked)).toBe(true);
    expect(isDirty(tracked)).toBe(true);
  });

  it('produces distinct ids', () => {
    const ctx = fakeContext();
    expect(createTracked(ctx).id).not.toBe(createTracked(ctx).id);
  });
});

describe('CAP-12 — the real identity context', () => {
  // Under Jest, `expo-crypto` is backed by Node's `crypto.randomUUID` (see
  // jest/setup.js) because the native module does not exist in this
  // environment. These tests therefore prove the wrapper's contract — v4 shape,
  // uniqueness, ISO-8601 UTC clock — not the native CSPRNG itself, which is
  // covered by driving the real app.
  it('generates unique, RFC-4122 v4-shaped ids with no network and no account', () => {
    const ids = new Set(Array.from({ length: 200 }, () => identityContext.newId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });

  it('reports the clock as an ISO-8601 UTC string', () => {
    expect(identityContext.now()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('CAP-12 — every mutation stamps updatedAt', () => {
  it('touch() stamps and never mutates the original', () => {
    const ctx = fakeContext();
    const set = createCardSet({ name: 'SAT Words' }, ctx);
    ctx.advanceDays(1);
    const renamed = touch(set, { name: 'GRE Words' }, ctx);

    expect(renamed.name).toBe('GRE Words');
    expect(renamed.updatedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(renamed.createdAt).toBe(set.createdAt);
    // Identity survives a rename: this is the fix for the legacy data-loss bug.
    expect(renamed.id).toBe(set.id);
    expect(set.name).toBe('SAT Words');
    expect(set.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('tombstone() stamps both deletedAt and updatedAt', () => {
    const ctx = fakeContext();
    const set = createCardSet({ name: 'SAT Words' }, ctx);
    ctx.advanceDays(3);
    const deleted = tombstone(set, ctx);
    expect(deleted.deletedAt).toBe('2026-01-04T00:00:00.000Z');
    expect(deleted.updatedAt).toBe('2026-01-04T00:00:00.000Z');
    expect(isAlive(deleted)).toBe(false);
  });

  it('deleting twice does not move the tombstone forward', () => {
    const ctx = fakeContext();
    const deleted = tombstone(createCardSet({ name: 'x' }, ctx), ctx);
    ctx.advanceDays(10);
    expect(tombstone(deleted, ctx)).toBe(deleted);
  });

  it('restore() brings a set back when the user regrets deleting it', () => {
    const ctx = fakeContext();
    const set = createCardSet({ name: 'SAT Words' }, ctx);
    const deleted = tombstone(set, ctx);
    ctx.advanceDays(2);
    const restored = restore(deleted, ctx);
    expect(restored.deletedAt).toBeNull();
    expect(restored.updatedAt).toBe('2026-01-03T00:00:00.000Z');
    expect(restored.id).toBe(set.id);
  });

  it('restoring a live entity is a no-op', () => {
    const ctx = fakeContext();
    const set = createCardSet({ name: 'x' }, ctx);
    expect(restore(set, ctx)).toBe(set);
  });

  it('markSynced() does NOT stamp updatedAt, or the entity would never be clean', () => {
    const ctx = fakeContext();
    const set = createCardSet({ name: 'x' }, ctx);
    ctx.advanceDays(1);
    const synced = markSynced(set, ctx);
    expect(synced.syncedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(synced.updatedAt).toBe(set.updatedAt);
    expect(isDirty(synced)).toBe(false);

    ctx.advanceDays(1);
    expect(isDirty(touch(synced, { name: 'y' }, ctx))).toBe(true);
  });
});

describe('CAP-12 — tombstone retention', () => {
  /**
   * Build a tombstoned entity deleted at a known instant.
   *
   * @param deletedAt When the entity was deleted.
   * @param syncedAt When it last synced, or null.
   * @returns A tombstoned {@link Tracked}.
   */
  function deletedAt(deletedIso: string, syncedIso: string | null): Tracked {
    return {
      id: 'id',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: deletedIso,
      deletedAt: deletedIso,
      syncedAt: syncedIso,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  const deleted = '2026-01-01T00:00:00.000Z';
  const justBefore = '2026-03-31T00:00:00.000Z'; // 89 days
  const atWindow = '2026-04-01T00:00:00.000Z'; // exactly 90 days

  it('never purges a live entity', () => {
    const ctx = fakeContext();
    const live = createCardSet({ name: 'x' }, ctx);
    expect(isPurgeableTombstone(live, { now: atWindow, hasAccount: false })).toBe(false);
  });

  it('retains a tombstone inside the window', () => {
    expect(isPurgeableTombstone(deletedAt(deleted, null), { now: justBefore, hasAccount: false })).toBe(
      false,
    );
  });

  it(`purges after exactly ${TOMBSTONE_RETENTION_DAYS} days when there is no account`, () => {
    expect(isPurgeableTombstone(deletedAt(deleted, null), { now: atWindow, hasAccount: false })).toBe(
      true,
    );
  });

  it('NEVER purges an unsynced tombstone while an account exists — it would resurrect the entity', () => {
    const veryLate = '2030-01-01T00:00:00.000Z';
    expect(isPurgeableTombstone(deletedAt(deleted, null), { now: veryLate, hasAccount: true })).toBe(
      false,
    );
  });

  it('purges a synced tombstone past the window while signed in', () => {
    expect(
      isPurgeableTombstone(deletedAt(deleted, '2026-01-02T00:00:00.000Z'), {
        now: atWindow,
        hasAccount: true,
      }),
    ).toBe(true);
  });

  it('does not count a sync that predates the deletion as having synced it', () => {
    expect(
      isPurgeableTombstone(deletedAt(deleted, '2025-12-31T00:00:00.000Z'), {
        now: atWindow,
        hasAccount: true,
      }),
    ).toBe(false);
  });

  it('pruneTombstones keeps everything it must and preserves order', () => {
    const live = { ...deletedAt(deleted, null), id: 'live', deletedAt: null };
    const old = { ...deletedAt(deleted, '2026-01-02T00:00:00.000Z'), id: 'old' };
    const recent = { ...deletedAt('2026-03-30T00:00:00.000Z', null), id: 'recent' };
    const kept = pruneTombstones([live, old, recent], { now: atWindow, hasAccount: false });
    expect(kept.map((e) => e.id)).toEqual(['live', 'recent']);
  });
});

describe('CAP-12 — createCardSet', () => {
  it('trims the name but keeps it as metadata, not identity', () => {
    const ctx = fakeContext();
    const a = createCardSet({ name: '  SAT Words  ' }, ctx);
    const b = createCardSet({ name: 'SAT Words' }, ctx);
    expect(a.name).toBe('SAT Words');
    // Two sets may deliberately share a name — identity is the id.
    expect(a.id).not.toBe(b.id);
  });

  it('accepts any character in a name — names are not filesystem keys', () => {
    const ctx = fakeContext();
    expect(createCardSet({ name: 'a/b\\c:😀 <em>x</em>' }, ctx).name).toBe('a/b\\c:😀 <em>x</em>');
  });
});

describe('CAP-12 — createCard', () => {
  const ctx = fakeContext();

  it('trims the ends of hints and answers', () => {
    const card = createCard({ setId: 's', hints: ['  Extremely hungry '], answers: [' ravenous '] }, ctx);
    expect(card.hints).toEqual(['Extremely hungry']);
    expect(card.answers).toEqual(['ravenous']);
  });

  it('preserves internal whitespace byte-exactly — the missing-space marker depends on it', () => {
    const card = createCard({ setId: 's', hints: ['a  b'], answers: ['  ice cream  '] }, ctx);
    expect(card.answers).toEqual(['ice cream']);
    expect(card.hints).toEqual(['a  b']);
  });

  it('drops blank entries but keeps the rest', () => {
    const card = createCard({ setId: 's', hints: ['a', '   ', 'b'], answers: ['x', ''] }, ctx);
    expect(card.hints).toEqual(['a', 'b']);
    expect(card.answers).toEqual(['x']);
  });

  it('refuses a card with no gradeable answer', () => {
    expect(() => createCard({ setId: 's', hints: ['a'], answers: ['   '] }, ctx)).toThrow(RangeError);
    expect(() => createCard({ setId: 's', hints: [], answers: ['a'] }, ctx)).toThrow(RangeError);
  });

  it('links to its set by id, so a set rename cannot break the link', () => {
    const set = createCardSet({ name: 'SAT Words' }, ctx);
    const card = createCard({ setId: set.id, hints: ['h'], answers: ['a'] }, ctx);
    const renamed = touch(set, { name: 'Other' }, ctx);
    expect(card.setId).toBe(renamed.id);
  });
});

describe('CAP-12 — reorder', () => {
  it('renumbers moved entities and leaves unmoved ones clean', () => {
    const ctx = fakeContext();
    const a = createCard({ setId: 's', hints: ['a'], answers: ['a'], order: 0 }, ctx);
    const b = createCard({ setId: 's', hints: ['b'], answers: ['b'], order: 1 }, ctx);
    const c = createCard({ setId: 's', hints: ['c'], answers: ['c'], order: 2 }, ctx);

    ctx.advanceDays(1);
    const reordered = reorder([a, c, b], ctx);

    expect(reordered.map((e) => e.order)).toEqual([0, 1, 2]);
    // `a` did not move, so it must not become dirty.
    expect(reordered[0]).toBe(a);
    expect(reordered[1].updatedAt).toBe('2026-01-02T00:00:00.000Z');
    // Reordering rewrites order and nothing else — identity is untouched.
    expect(reordered.map((e) => e.id)).toEqual([a.id, c.id, b.id]);
  });
});

describe('CAP-12 — normalizeTextList', () => {
  it('is the shared trim-and-drop-empties rule', () => {
    expect(normalizeTextList([' a ', '', '  ', 'b'])).toEqual(['a', 'b']);
    expect(normalizeTextList([])).toEqual([]);
  });
});
