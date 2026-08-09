/**
 * CAP-13 sync-merge tests.
 *
 * These are the functions that can silently lose a user's work, so the cases
 * are enumerated rather than sampled.
 */

import type { CardSet } from '@/features/identity/types';

import { decide, needsUpload, planSync, stripServerFields, summarizeAdoption } from './logic';
import type { Remote } from './types';

/**
 * Build a local card set.
 *
 * @param id The set id.
 * @param overrides Fields to override.
 * @returns A {@link CardSet}.
 */
function local(id: string, overrides: Partial<CardSet> = {}): CardSet {
  return {
    id,
    name: id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    // Clean by default: updatedAt === syncedAt means the server has seen it.
    syncedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    lastUsedAt: null,
    order: 0,
    ...overrides,
  };
}

/**
 * Build a remote card set.
 *
 * @param id The set id.
 * @param serverUpdatedAt The server's ordering timestamp.
 * @param overrides Fields to override.
 * @returns A {@link Remote} card set.
 */
function remote(
  id: string,
  serverUpdatedAt: string | null,
  overrides: Partial<CardSet> = {},
): Remote<CardSet> {
  return { ...local(id, overrides), serverUpdatedAt };
}

describe('CAP-13 — union by id, so sign-in ADOPTS local data', () => {
  it('uploads an entity that exists only locally', () => {
    expect(decide(local('a'), undefined).action).toBe('upload');
  });

  it('downloads an entity that exists only remotely', () => {
    expect(decide(undefined, remote('a', '2026-02-01T00:00:00.000Z')).action).toBe('download');
  });

  it('never drops either side — the plan covers the union of ids', () => {
    const plan = planSync(
      [local('only-local'), local('both')],
      [remote('both', '2026-01-01T00:00:00.000Z'), remote('only-remote', '2026-02-01T00:00:00.000Z')],
    );
    expect(plan.decisions.map((d) => d.id).sort()).toEqual(['both', 'only-local', 'only-remote']);
  });

  it('refuses a decision with nothing on either side', () => {
    expect(() => decide(undefined, undefined)).toThrow(RangeError);
  });
});

describe('CAP-13 — change detection uses the syncedAt watermark', () => {
  it('does nothing when neither side has moved', () => {
    expect(decide(local('a'), remote('a', '2026-01-01T00:00:00.000Z')).action).toBe('noop');
  });

  it('uploads a locally-edited entity the server has not seen', () => {
    const edited = local('a', { updatedAt: '2026-03-01T00:00:00.000Z' });
    expect(needsUpload(edited)).toBe(true);
    expect(decide(edited, remote('a', '2026-01-01T00:00:00.000Z')).action).toBe('upload');
  });

  it('downloads a remotely-edited entity we have not changed', () => {
    expect(decide(local('a'), remote('a', '2026-06-01T00:00:00.000Z')).action).toBe('download');
  });

  it('treats a never-synced local entity as needing upload', () => {
    expect(needsUpload(local('a', { syncedAt: null }))).toBe(true);
  });

  it('treats a remote entity we have never reconciled as newer', () => {
    const never = local('a', { syncedAt: null, updatedAt: '2026-01-01T00:00:00.000Z' });
    // Local is dirty too (never synced), so this is the conflict path.
    expect(decide(never, remote('a', '2026-06-01T00:00:00.000Z')).action).toBe(
      'conflictLocalWins',
    );
  });

  it('ignores a remote entity the server has not committed yet', () => {
    expect(decide(local('a'), remote('a', null)).action).toBe('noop');
  });
});

describe('CAP-13 — last-writer-wins, and its documented limitation', () => {
  it('resolves a two-sided edit in favour of the local write', () => {
    // The local write has not reached the server, so the server will stamp it
    // after the remote edit it overwrites — LWW by SERVER timestamp.
    const edited = local('a', { updatedAt: '2026-03-01T00:00:00.000Z', name: 'mine' });
    const decision = decide(edited, remote('a', '2026-06-01T00:00:00.000Z', { name: 'theirs' }));
    expect(decision.action).toBe('conflictLocalWins');
    expect(decision.entity.name).toBe('mine');
  });

  it('ACCEPTED LIMITATION: a long-offline device overwrites a newer remote edit', () => {
    // US-I7, documented not hidden. Single-user multi-device sync, not
    // collaboration: the blast radius is one person's own edit. Pinned so a
    // future change to this behaviour is a deliberate decision, not a drift.
    const staleButDirty = local('a', {
      updatedAt: '2026-01-02T00:00:00.000Z',
      syncedAt: '2026-01-01T00:00:00.000Z',
      name: 'edited offline in January',
    });
    const fresherRemote = remote('a', '2026-07-01T00:00:00.000Z', { name: 'edited in July' });
    expect(decide(staleButDirty, fresherRemote).entity.name).toBe('edited offline in January');
  });

  it('routes conflicts into the upload list, not the download list', () => {
    const plan = planSync(
      [local('a', { updatedAt: '2026-03-01T00:00:00.000Z' })],
      [remote('a', '2026-06-01T00:00:00.000Z')],
    );
    expect(plan.toUpload.map((e) => e.id)).toEqual(['a']);
    expect(plan.toApplyLocally).toEqual([]);
  });
});

describe('CAP-13 — tombstones sync, or deletions resurrect', () => {
  it('uploads a local deletion so it propagates', () => {
    const deleted = local('a', {
      deletedAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
    const decision = decide(deleted, remote('a', '2026-01-01T00:00:00.000Z'));
    expect(decision.action).toBe('upload');
    expect(decision.entity.deletedAt).not.toBeNull();
  });

  it('downloads a remote deletion rather than re-uploading the live copy', () => {
    const decision = decide(
      local('a'),
      remote('a', '2026-06-01T00:00:00.000Z', { deletedAt: '2026-06-01T00:00:00.000Z' }),
    );
    expect(decision.action).toBe('download');
    expect(decision.entity.deletedAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('does not resurrect an entity deleted locally and absent remotely', () => {
    const deleted = local('a', { deletedAt: '2026-03-01T00:00:00.000Z', syncedAt: null });
    expect(decide(deleted, undefined).entity.deletedAt).not.toBeNull();
  });
});

describe('CAP-13 — the transport timestamp never leaks into the domain model', () => {
  it('strips serverUpdatedAt from anything applied locally', () => {
    const applied = decide(undefined, remote('a', '2026-06-01T00:00:00.000Z')).entity;
    expect('serverUpdatedAt' in applied).toBe(false);
    expect(applied.id).toBe('a');
  });

  it('stripServerFields leaves every domain field intact', () => {
    const stripped = stripServerFields(remote('a', '2026-06-01T00:00:00.000Z', { name: 'X' }));
    expect(stripped).toEqual(local('a', { name: 'X' }));
  });
});

describe('CAP-13 — the adoption report', () => {
  it('counts what first sign-in did to the user’s library', () => {
    const setPlan = planSync(
      [local('mine-1'), local('mine-2'), local('shared')],
      [remote('shared', '2026-01-01T00:00:00.000Z'), remote('theirs', '2026-02-01T00:00:00.000Z')],
    );
    const cardPlan = planSync([local('c1'), local('c2')], []);

    expect(summarizeAdoption(setPlan, cardPlan, 1)).toEqual({
      uploaded: 2,
      downloaded: 1,
      merged: 1,
      renamed: 1,
      cards: 2,
    });
  });

  it('reports nothing for an empty library on both sides', () => {
    expect(summarizeAdoption(planSync([], []), planSync([], []), 0)).toEqual({
      uploaded: 0,
      downloaded: 0,
      merged: 0,
      renamed: 0,
      cards: 0,
    });
  });
});

describe('CAP-13 — per-card granularity', () => {
  it('merges two devices’ edits to different cards in the same set', () => {
    // Whole-set granularity would discard one device's edits wholesale; this is
    // why cards are their own documents.
    const plan = planSync(
      [
        local('card-1', { updatedAt: '2026-03-01T00:00:00.000Z' }),
        local('card-2'),
      ],
      [
        remote('card-1', '2026-01-01T00:00:00.000Z'),
        remote('card-2', '2026-06-01T00:00:00.000Z'),
      ],
    );
    expect(plan.toUpload.map((e) => e.id)).toEqual(['card-1']);
    expect(plan.toApplyLocally.map((e) => e.id)).toEqual(['card-2']);
  });
});
