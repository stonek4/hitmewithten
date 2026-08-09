/**
 * CAP-3 — pure session mechanics.
 *
 * A session state and an action in, a new state out. No React, no storage, no
 * evaluation: the screen calls CAP-4 and hands the verdict here.
 *
 * Three rules from the capability spec are encoded structurally rather than by
 * convention, because their absence causes the worst confirmed defects in the
 * live app:
 *
 * - **Validate before navigating.** {@link startSession} returns a refusal
 *   rather than a half-built session, so an empty set can never reach the
 *   drilling screen.
 * - **Unlimited retries.** There is no attempt cap, no reveal-answer and no
 *   override; a card advances only via {@link recordPass}.
 * - **Back on the first card is a no-op**, not an exit from the whole test.
 */

import type { DiffSegment } from '@/features/evaluation/types';
import type { Card } from '@/features/identity/types';

/**
 * Which cards a session draws.
 *
 * Persisted in session history, so these strings are stable identifiers and
 * only their display names are translated. `review` and `dictation` are P1.
 */
export type SessionMode = 'quick' | 'all' | 'missed';

/** Per-card progress within one session. */
export interface SessionCardState {
  cardId: string;
  /** The card's hints, as authored. */
  hints: string[];
  /** The card's accepted answers, as authored. */
  answers: string[];
  /** Wrong attempts on this card **in this session**. */
  attempts: number;
  passed: boolean;
  /**
   * The **first** diff recorded for this card, for the results screen.
   *
   * First rather than last: it is the mistake the user actually made, before
   * they started narrowing in on the answer.
   */
  firstDiff: DiffSegment[] | null;
}

/** A drilling session in progress. */
export interface SessionState {
  id: string;
  setId: string;
  mode: SessionMode;
  /**
   * When true, hints become the accepted answers and answers become the
   * prompt. Every CAP-4 rule applies unchanged to the swapped values.
   */
  flipped: boolean;
  cardStates: SessionCardState[];
  /** Position in `cardStates`. */
  index: number;
  startedAt: string;
  endedAt: string | null;
  /** True when the user ended the test with cards remaining. */
  endedEarly: boolean;
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
 * The persisted record of a finished session.
 *
 * **Carries no card content** — only ids, counts and timings — so history stays
 * compact and CAP-19's no-content analytics rule is structurally easy to
 * honour.
 */
export interface SessionRecord {
  id: string;
  setId: string;
  mode: SessionMode;
  flipped: boolean;
  startedAt: string;
  endedAt: string;
  endedEarly: boolean;
  cardsCompleted: number;
  /** Cards passed without a single wrong attempt. */
  firstTryPasses: number;
  /** Total wrong attempts across the session. */
  wrongAttempts: number;
  elapsedMs: number;
  /** Cards missed at least once, **by id** so a later edit cannot break them. */
  missedCardIds: string[];
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
 * @param options.id The session's id.
 * @param options.setId The set being drilled, or null when none is selected.
 * @param options.cards The set's live cards.
 * @param options.mode `quick` draws `quickSize` cards at random; `all` and
 *                     `missed` use every card given.
 * @param options.flipped Whether to start with the sides swapped.
 * @param options.quickSize How many cards a quick test draws. If the set holds
 *                          fewer, what exists is used.
 * @param options.startedAt The start instant, ISO-8601.
 * @param options.random Randomness source, injected for deterministic tests.
 * @returns The session, or the reason it cannot start.
 */
export function startSession(options: {
  id: string;
  setId: string | null;
  cards: readonly Card[];
  mode: SessionMode;
  flipped?: boolean;
  quickSize?: number;
  startedAt: string;
  random?: () => number;
}): SessionStartResult {
  const { id, setId, cards, mode, flipped = false, quickSize = 10, startedAt, random = Math.random } = options;
  if (setId === null) return { ok: false, error: 'noSet' };
  if (cards.length === 0) return { ok: false, error: 'emptySet' };

  const shuffled = shuffle(cards, random);
  const selected = mode === 'quick' ? shuffled.slice(0, quickSize) : shuffled;

  return {
    ok: true,
    session: {
      id,
      setId,
      mode,
      flipped,
      index: 0,
      startedAt,
      endedAt: null,
      endedEarly: false,
      counters: { tested: 0, passed: 0, failed: 0 },
      cardStates: selected.map((card) => ({
        cardId: card.id,
        hints: [...card.hints],
        answers: [...card.answers],
        attempts: 0,
        passed: false,
        firstDiff: null,
      })),
    },
  };
}

/**
 * The prompt shown for a card, honouring the flip.
 *
 * @param card The card's session state.
 * @param flipped Whether the sides are swapped.
 * @returns The text to show as the prompt.
 */
export function promptFor(card: SessionCardState, flipped: boolean): string {
  return flipped ? card.answers[0] : card.hints[0];
}

/**
 * The answers accepted for a card, honouring the flip.
 *
 * Flipping swaps the roles wholesale: the hints become the accepted answers.
 * Every CAP-4 rule — case folding, internal whitespace, the diff — applies
 * unchanged to the swapped values.
 *
 * @param card The card's session state.
 * @param flipped Whether the sides are swapped.
 * @returns Every accepted answer, in the author's declared order.
 */
export function answersFor(card: SessionCardState, flipped: boolean): string[] {
  return flipped ? card.hints : card.answers;
}

/**
 * Swap the prompt and answer sides mid-session.
 *
 * Progress is deliberately **kept**: the user is drilling the same cards, and
 * discarding their progress for changing how they want to be asked would be a
 * punishment for using the feature.
 *
 * @param session The session to flip.
 * @returns A new session with the sides swapped.
 */
export function flip(session: SessionState): SessionState {
  return { ...session, flipped: !session.flipped };
}

/**
 * Record a wrong attempt.
 *
 * `failed` increments on **every** wrong attempt, and neither the card nor the
 * progress moves — a card advances only by being answered correctly.
 *
 * @param session The session to advance.
 * @param diff The diff produced for this attempt, kept only if it is the first
 *             one recorded for this card.
 * @returns A new session state.
 */
export function recordWrongAttempt(
  session: SessionState,
  diff: readonly DiffSegment[] = [],
): SessionState {
  const cardStates = [...session.cardStates];
  const current = cardStates[session.index];
  cardStates[session.index] = {
    ...current,
    attempts: current.attempts + 1,
    firstDiff: current.firstDiff ?? [...diff],
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

/**
 * End a session, whether it finished or was abandoned.
 *
 * @param session The session to end.
 * @param endedAt The end instant, ISO-8601.
 * @returns A new, closed session. `endedEarly` is set when cards remained.
 */
export function endSession(session: SessionState, endedAt: string): SessionState {
  return { ...session, endedAt, endedEarly: !isFinished(session) };
}

/**
 * The cards missed at least once, in session order.
 *
 * Referenced **by id**, so a "practice missed" session still works if the card
 * was edited between sessions and degrades gracefully if it was deleted.
 *
 * @param session The session to read.
 * @returns The missed cards' states.
 */
export function missedCards(session: SessionState): SessionCardState[] {
  return session.cardStates.filter((card) => card.attempts > 0);
}

/**
 * Build the persisted record of a session.
 *
 * A results view is produced for **every** session, including those ended
 * early; an abandoned session reports only what was completed.
 *
 * @param session The session to summarise. Should already be ended.
 * @param endedAt The end instant, used when the session was not explicitly
 *                ended.
 * @returns The record, carrying no card content.
 */
export function buildSessionRecord(session: SessionState, endedAt: string): SessionRecord {
  const ended = session.endedAt ?? endedAt;
  const completed = session.cardStates.filter((card) => card.passed);
  return {
    id: session.id,
    setId: session.setId,
    mode: session.mode,
    flipped: session.flipped,
    startedAt: session.startedAt,
    endedAt: ended,
    endedEarly: session.endedEarly,
    cardsCompleted: completed.length,
    firstTryPasses: completed.filter((card) => card.attempts === 0).length,
    wrongAttempts: session.cardStates.reduce((total, card) => total + card.attempts, 0),
    elapsedMs: Math.max(0, Date.parse(ended) - Date.parse(session.startedAt)),
    missedCardIds: missedCards(session).map((card) => card.cardId),
  };
}
