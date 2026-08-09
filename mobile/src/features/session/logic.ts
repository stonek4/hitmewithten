/**
 * CAP-3 — pure session mechanics. **Partial**: the drilling loop and its
 * counter semantics only. Modes beyond `quick`/`all`, flip, the session record
 * and the results hand-off are not built yet.
 *
 * No React, no storage: a session state and an action in, a new state out.
 */

import type { Card } from '@/features/identity/types';

/** Which cards a session draws. */
export type SessionMode = 'quick' | 'all';

/** Per-card progress within one session. */
export interface SessionCardState {
  cardId: string;
  /** Wrong attempts on this card **in this session**. */
  attempts: number;
  passed: boolean;
  /** The prompt shown, resolved at session start. */
  promptShown: string;
  /** Every accepted answer for this card. */
  answersExpected: string[];
}

/** A drilling session in progress. */
export interface SessionState {
  setId: string;
  mode: SessionMode;
  cardStates: SessionCardState[];
  /** Position in `cardStates`. */
  index: number;
  /**
   * Lifetime counters, with **exactly** the legacy semantics, because they feed
   * trophy thresholds users have already partially earned (CAP-3, CAP-7):
   * `tested` once per card advanced past, `passed` once per correct submission,
   * `failed` once per **wrong attempt** — three wrong tries on one card
   * increments it three times.
   */
  counters: { tested: number; passed: number; failed: number };
}

/**
 * Shuffle a list with **Fisher–Yates, on a copy**.
 *
 * The legacy app uses `sort(() => 0.5 - Math.random())`, which is not a valid
 * shuffle, is engine-dependent, and mutates the caller's array in place.
 *
 * @param items The items to shuffle. Not modified.
 * @param random A source of uniform randomness in [0, 1). Injected so tests are
 *               deterministic.
 * @returns A new shuffled array.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Why a session could not be started.
 *
 * **Validate before navigating, never after.** The legacy app's most serious
 * defect is that an empty set passes the guard, the menu is animated to
 * `visibility: hidden`, navigation throws, and the user is left on a blank,
 * unusable screen recoverable only by reloading.
 */
export type SessionStartError = 'noSet' | 'emptySet';

/** The outcome of trying to start a session. */
export type SessionStartResult =
  | { ok: true; session: SessionState }
  | { ok: false; error: SessionStartError };

/**
 * Build a session from a set's cards.
 *
 * @param options.setId The set being drilled, or null when none is selected.
 * @param options.cards The set's live cards.
 * @param options.mode `quick` draws `quickSize` cards at random; `all` uses
 *                     every card.
 * @param options.quickSize How many cards a quick test draws. If the set holds
 *                          fewer, what exists is used.
 * @param options.random Randomness source, injected for deterministic tests.
 * @returns The session, or the reason it cannot start.
 */
export function startSession(options: {
  setId: string | null;
  cards: readonly Card[];
  mode: SessionMode;
  quickSize?: number;
  random?: () => number;
}): SessionStartResult {
  const { setId, cards, mode, quickSize = 10, random = Math.random } = options;
  if (setId === null) return { ok: false, error: 'noSet' };
  if (cards.length === 0) return { ok: false, error: 'emptySet' };

  const shuffled = shuffle(cards, random);
  const selected = mode === 'quick' ? shuffled.slice(0, quickSize) : shuffled;

  return {
    ok: true,
    session: {
      setId,
      mode,
      index: 0,
      counters: { tested: 0, passed: 0, failed: 0 },
      cardStates: selected.map((card) => ({
        cardId: card.id,
        attempts: 0,
        passed: false,
        promptShown: card.hints[0],
        answersExpected: [...card.answers],
      })),
    },
  };
}

/**
 * Record a wrong attempt.
 *
 * `failed` increments on **every** wrong attempt, and neither the card nor the
 * progress moves — a card advances only by being answered correctly. There is
 * no attempt cap, no reveal-answer and no override.
 *
 * @param session The session to advance.
 * @returns A new session state.
 */
export function recordWrongAttempt(session: SessionState): SessionState {
  const cardStates = [...session.cardStates];
  cardStates[session.index] = {
    ...cardStates[session.index],
    attempts: cardStates[session.index].attempts + 1,
  };
  return {
    ...session,
    cardStates,
    counters: { ...session.counters, failed: session.counters.failed + 1 },
  };
}

/**
 * Record a correct submission and advance past the card.
 *
 * `passed` increments once per correct submission and `tested` once per card
 * advanced past, so both move together here.
 *
 * @param session The session to advance.
 * @returns A new session state, with `index` past the end when finished.
 */
export function recordPass(session: SessionState): SessionState {
  const cardStates = [...session.cardStates];
  cardStates[session.index] = { ...cardStates[session.index], passed: true };
  return {
    ...session,
    cardStates,
    index: session.index + 1,
    counters: {
      ...session.counters,
      passed: session.counters.passed + 1,
      tested: session.counters.tested + 1,
    },
  };
}

/**
 * Move to the previous card.
 *
 * **On the first card this is a no-op.** The legacy app silently exits the
 * whole test instead.
 *
 * @param session The session to move.
 * @returns A new session state, or the original when already at the first card.
 */
export function goBack(session: SessionState): SessionState {
  if (session.index === 0) return session;
  return { ...session, index: session.index - 1 };
}

/**
 * Whether every card has been passed.
 *
 * @param session The session to test.
 * @returns True when the session has run past its last card.
 */
export function isFinished(session: SessionState): boolean {
  return session.index >= session.cardStates.length;
}

/**
 * Progress through the session, as a fraction.
 *
 * `cardsPassed / sessionLength`, advancing only on a pass.
 *
 * @param session The session to measure.
 * @returns A value in [0, 1]. An empty session reads as complete.
 */
export function progress(session: SessionState): number {
  if (session.cardStates.length === 0) return 1;
  return session.cardStates.filter((card) => card.passed).length / session.cardStates.length;
}

/**
 * The card currently being drilled.
 *
 * @param session The session to read.
 * @returns The current card's state, or null when the session is finished.
 */
export function currentCard(session: SessionState): SessionCardState | null {
  return isFinished(session) ? null : session.cardStates[session.index];
}
