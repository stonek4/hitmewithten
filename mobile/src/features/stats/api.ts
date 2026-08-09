/**
 * Per-card performance recording.
 *
 * **This is the P0 half of CAP-15.** The scheduling itself is P1, but the
 * capability is explicit that *"the recording is effectively P0 — the fields
 * exist and are written in v1 so that enabling scheduling later is a feature,
 * not a migration."* Without it, a user who turns scheduling on in a later
 * release starts from zero history no matter how much they have drilled, and
 * CAP-16's trouble-word aggregation has nothing to aggregate.
 *
 * The scheduling fields (`interval`, `ease`, `dueAt`) are reserved and written
 * `null` at v1 — present from day one so the model never has to change.
 *
 * Stats are keyed by card **id**, so they survive editing a card's text and are
 * discarded with the card.
 */

import type { CardStats, IdentityContext } from '@/features/identity/types';
import type { SessionCardState } from '@/features/session/logic';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import { CARD_STATS_KEY, deviceStore } from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

/** Stored stats, keyed by card id. */
export type CardStatsMap = Record<string, CardStats>;

/**
 * Whether a parsed value is a usable {@link CardStats}.
 *
 * @param value The parsed stored value.
 * @returns True when every counter is present and finite.
 */
function isCardStats(value: unknown): value is CardStats {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.cardId === 'string' &&
    typeof v.attempts === 'number' &&
    Number.isFinite(v.attempts) &&
    typeof v.firstTryPasses === 'number' &&
    Number.isFinite(v.firstTryPasses) &&
    typeof v.failures === 'number' &&
    Number.isFinite(v.failures)
  );
}

/**
 * A zeroed stats record for a card.
 *
 * @param cardId The card's id.
 * @returns Fresh stats with the scheduling fields reserved as null.
 */
export function emptyCardStats(cardId: string): CardStats {
  return {
    cardId,
    attempts: 0,
    firstTryPasses: 0,
    failures: 0,
    lastSeenAt: null,
    interval: null,
    ease: null,
    dueAt: null,
  };
}

/**
 * Fold one session's per-card outcomes into existing stats.
 *
 * Pure, so the counter semantics are testable without storage. Counters are
 * **monotonic**, matching CAP-7's trophies, which is what makes them safely
 * mergeable under a future sync.
 *
 * @param existing The stats before this session.
 * @param cardStates The session's per-card states.
 * @param seenAt The instant the session ended, ISO-8601.
 * @returns The updated map. Cards not in the session are untouched.
 */
export function applySessionToStats(
  existing: Readonly<CardStatsMap>,
  cardStates: readonly SessionCardState[],
  seenAt: string,
): CardStatsMap {
  const next: CardStatsMap = { ...existing };
  for (const state of cardStates) {
    const current = next[state.cardId] ?? emptyCardStats(state.cardId);
    next[state.cardId] = {
      ...current,
      // One attempt per card the session presented, not per submission — this
      // is "how many times has this card been drilled".
      attempts: current.attempts + 1,
      firstTryPasses: current.firstTryPasses + (state.passed && state.attempts === 0 ? 1 : 0),
      // Every wrong submission, matching CAP-3's `failed` counter semantics.
      failures: current.failures + state.attempts,
      lastSeenAt: seenAt,
    };
  }
  return next;
}

/** Reads and writes per-card stats. */
export class CardStatsRepository {
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param store The key/value store to persist to.
   * @param context The clock, for `lastSeenAt`.
   */
  constructor(store: KeyValueStore = deviceStore, context: IdentityContext = defaultIdentityContext) {
    this.store = store;
    this.context = context;
  }

  /**
   * Read every stored card's stats.
   *
   * @returns The stats map. An unreadable store yields an empty map rather than
   *          throwing — losing derived stats is regrettable, a screen that will
   *          not render is worse.
   */
  async load(): Promise<CardStatsMap> {
    const raw = await this.store.getItem(CARD_STATS_KEY);
    if (raw === null) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
      const out: CardStatsMap = {};
      for (const [cardId, value] of Object.entries(parsed)) {
        if (isCardStats(value)) out[cardId] = value;
      }
      return out;
    } catch {
      return {};
    }
  }

  /**
   * Read one card's stats.
   *
   * @param cardId The card to read.
   * @returns Its stats, or null when it has never been drilled.
   */
  async get(cardId: string): Promise<CardStats | null> {
    return (await this.load())[cardId] ?? null;
  }

  /**
   * Record a finished session's outcomes.
   *
   * @param cardStates The session's per-card states.
   * @returns The updated stats map.
   */
  async recordSession(cardStates: readonly SessionCardState[]): Promise<CardStatsMap> {
    const next = applySessionToStats(await this.load(), cardStates, this.context.now());
    await this.store.setItem(CARD_STATS_KEY, JSON.stringify(next));
    return next;
  }

  /**
   * Discard stats for cards that no longer exist.
   *
   * Stats are keyed by card id and are meaningless once the card is gone, so
   * they are pruned rather than accumulating forever.
   *
   * @param liveCardIds Every card id still in the library.
   */
  async pruneTo(liveCardIds: readonly string[]): Promise<void> {
    const live = new Set(liveCardIds);
    const existing = await this.load();
    const kept: CardStatsMap = {};
    for (const [cardId, stats] of Object.entries(existing)) {
      if (live.has(cardId)) kept[cardId] = stats;
    }
    await this.store.setItem(CARD_STATS_KEY, JSON.stringify(kept));
  }
}

/** The repository the running app uses. */
export const cardStatsRepository = new CardStatsRepository();
