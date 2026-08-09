/**
 * CAP-3 → CAP-6 hand-off: the just-finished session, held in memory.
 *
 * **Why this exists, and the spec tension it resolves.** CAP-6 wants the
 * results screen to show "a compact rendering of the first diff recorded" for
 * each missed card. CAP-6 *also* requires session records to be local-only and
 * to carry **no card content** — and a `DiffSegment[]` is, by construction, the
 * characters of the correct answer. The two rules cannot both hold for one
 * persisted object.
 *
 * The resolution: the **durable** history record carries counts and ids only
 * (see `SessionRecord`), and the diffs reach the results screen through this
 * in-memory hand-off instead. Nothing with card content is ever written to
 * storage, and the results screen still shows the marking.
 *
 * A session in progress is explicitly **not** required to survive a cold start
 * (CAP-3), so an in-memory hand-off is within scope. Opening results later —
 * from history, or a deep link — falls back to the persisted record plus the
 * cards re-loaded by id, and simply shows no diffs.
 */

import type { SessionState } from './logic';

/** The most recently finished session, or null. */
let lastSession: SessionState | null = null;

/**
 * Remember a finished session so the results screen can render its diffs.
 *
 * @param session The session that just ended.
 */
export function rememberFinishedSession(session: SessionState): void {
  lastSession = session;
}

/**
 * Retrieve a finished session by id.
 *
 * Matched by id rather than returned blindly, so a stale hand-off from an
 * earlier session can never be rendered under a newer session's results.
 *
 * @param sessionId The session the results screen was opened for.
 * @returns The session, or null when it is not the one held.
 */
export function takeFinishedSession(sessionId: string): SessionState | null {
  return lastSession !== null && lastSession.id === sessionId ? lastSession : null;
}

/**
 * Forget the held session.
 *
 * Called when leaving results, so a long-lived app process does not retain card
 * content indefinitely.
 */
export function clearFinishedSession(): void {
  lastSession = null;
}
