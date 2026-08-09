/**
 * CAP-1 — the card-set repository.
 *
 * **The only module in the app that reads or writes card data.** Screens call
 * `hooks.ts`; `hooks.ts` calls this; this calls `services/storage.ts`. Nothing
 * else touches storage (cross-cutting constraint C9).
 *
 * Invariants this file is responsible for:
 * - Every read validates (`schema.ts`); unparseable values are **quarantined
 *   and surfaced**, never discarded and never fatal.
 * - Writes are atomic per entity — one `setItem` per document, so an
 *   interrupted write never leaves an entity half-saved.
 * - Deletes are soft (CAP-12 tombstones).
 * - The library list is served from the summary index, never by loading cards.
 * - Duplicate names are surfaced, never silently resolved.
 */

import {
  createCard,
  createCardSet,
  isAlive,
  reorder,
  tombstone,
  touch,
} from '@/features/identity/logic';
import { SCHEMA_VERSION } from '@/features/identity/types';
import type { Card, CardSet, IdentityContext } from '@/features/identity/types';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import {
  cardsKey,
  deviceStore,
  LIBRARY_KEY,
  QUARANTINE_KEY,
} from '@/services/storage';
import type { KeyValueStore } from '@/services/storage';

import { buildSummaries, detectNameConflict, selectionAfterDelete, validateSetName } from './logic';
import { parseCardList, parseJson, parseLibraryDocument } from './schema';
import type {
  CardSetSummary,
  ConflictResolution,
  CreateSetResult,
  LibraryDocument,
  LibrarySnapshot,
  NameConflict,
  QuarantineRecord,
  SetWithCards,
} from './types';

/** An empty library, used on first run and after an unreadable document. */
const EMPTY_DOCUMENT: LibraryDocument = {
  schemaVersion: SCHEMA_VERSION,
  sets: [],
  cardCounts: {},
  currentSetId: null,
};

/**
 * The card-set repository.
 *
 * Constructed with its dependencies rather than importing them, so tests drive
 * a real repository over an in-memory store with a deterministic clock — no
 * module mocking, and the same code path the app runs.
 */
export class LibraryRepository {
  private readonly store: KeyValueStore;
  private readonly context: IdentityContext;

  /**
   * @param store The key/value store to persist to.
   * @param context The id generator and clock to stamp entities with.
   */
  constructor(store: KeyValueStore = deviceStore, context: IdentityContext = defaultIdentityContext) {
    this.store = store;
    this.context = context;
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  /**
   * Read and validate the library document.
   *
   * @returns The document, plus anything that had to be quarantined. A missing
   *          or unreadable document yields an empty library rather than an
   *          error — a blank screen is never an acceptable outcome.
   */
  private async readDocument(): Promise<{
    document: LibraryDocument;
    quarantined: QuarantineRecord[];
  }> {
    const raw = await this.store.getItem(LIBRARY_KEY);
    if (raw === null) return { document: { ...EMPTY_DOCUMENT }, quarantined: [] };

    const json = parseJson(raw);
    if (!json.ok) {
      return {
        document: { ...EMPTY_DOCUMENT },
        quarantined: [await this.quarantine(LIBRARY_KEY, json.reasonKey, raw)],
      };
    }

    const parsed = parseLibraryDocument(json.value);
    if (!parsed.ok) {
      return {
        document: { ...EMPTY_DOCUMENT },
        quarantined: [await this.quarantine(LIBRARY_KEY, parsed.reasonKey, raw)],
      };
    }

    const quarantined: QuarantineRecord[] = [];
    if (parsed.value.droppedSets.length > 0) {
      quarantined.push(
        await this.quarantine(
          LIBRARY_KEY,
          'storage.reason.badSet',
          JSON.stringify(parsed.value.droppedSets),
        ),
      );
    }
    return { document: parsed.value.document, quarantined };
  }

  /**
   * Persist the library document.
   *
   * One `setItem`, so the write is atomic: an interruption leaves the previous
   * document intact rather than a half-written one.
   *
   * @param document The document to store.
   */
  private async writeDocument(document: LibraryDocument): Promise<void> {
    await this.store.setItem(LIBRARY_KEY, JSON.stringify(document));
  }

  /**
   * Record an unreadable stored value.
   *
   * The raw value is retained, so "quarantined" never means "lost".
   *
   * @param storageKey The key the value came from.
   * @param reasonKey An i18n key describing the failure.
   * @param raw The raw stored value.
   * @returns The record that was appended.
   */
  private async quarantine(
    storageKey: string,
    reasonKey: string,
    raw: string,
  ): Promise<QuarantineRecord> {
    const record: QuarantineRecord = {
      storageKey,
      reasonKey,
      quarantinedAt: this.context.now(),
      raw,
    };
    const existingRaw = await this.store.getItem(QUARANTINE_KEY);
    const existing = existingRaw === null ? [] : ((parseJson(existingRaw).ok
      ? (JSON.parse(existingRaw) as unknown)
      : []) as unknown);
    const list = Array.isArray(existing) ? (existing as QuarantineRecord[]) : [];
    await this.store.setItem(QUARANTINE_KEY, JSON.stringify([...list, record]));
    return record;
  }

  /**
   * Read every quarantined record.
   *
   * @returns The records, oldest first. Never throws.
   */
  async listQuarantined(): Promise<QuarantineRecord[]> {
    const raw = await this.store.getItem(QUARANTINE_KEY);
    if (raw === null) return [];
    const json = parseJson(raw);
    if (!json.ok || !Array.isArray(json.value)) return [];
    return json.value as QuarantineRecord[];
  }

  /**
   * Read everything the library screen needs, in one pass.
   *
   * Served entirely from the summary index — no card document is read, which
   * is what keeps this fast at 1 000 sets × 1 000 cards.
   *
   * @returns The library snapshot.
   */
  async loadLibrary(): Promise<LibrarySnapshot> {
    const { document, quarantined } = await this.readDocument();
    return {
      summaries: buildSummaries(document.sets, document.cardCounts, document.currentSetId),
      currentSetId: document.currentSetId,
      quarantined,
    };
  }

  /**
   * Read one set's metadata.
   *
   * @param setId The set's id.
   * @returns The set, or null when it does not exist or is tombstoned.
   */
  async getSet(setId: string): Promise<CardSet | null> {
    const { document } = await this.readDocument();
    const set = document.sets.find((candidate) => candidate.id === setId);
    return set !== undefined && isAlive(set) ? set : null;
  }

  /**
   * Read one set's cards, ordered.
   *
   * Self-heals the summary index: if the stored card count disagrees with what
   * is actually on disk (the window between a card write and the index write),
   * the index is corrected here.
   *
   * @param setId The set's id.
   * @returns The set's live cards, in `order`, plus anything quarantined.
   */
  async listCards(setId: string): Promise<{ cards: Card[]; quarantined: QuarantineRecord[] }> {
    const key = cardsKey(setId);
    const raw = await this.store.getItem(key);
    if (raw === null) return { cards: [], quarantined: [] };

    const json = parseJson(raw);
    if (!json.ok) return { cards: [], quarantined: [await this.quarantine(key, json.reasonKey, raw)] };

    const parsed = parseCardList(json.value);
    if (!parsed.ok) {
      return { cards: [], quarantined: [await this.quarantine(key, parsed.reasonKey, raw)] };
    }

    const quarantined: QuarantineRecord[] = [];
    if (parsed.value.droppedCards.length > 0) {
      quarantined.push(
        await this.quarantine(
          key,
          'storage.reason.badCard',
          JSON.stringify(parsed.value.droppedCards),
        ),
      );
    }

    const cards = parsed.value.cards.filter(isAlive).sort((a, b) => a.order - b.order);
    await this.repairCardCount(setId, cards.length);
    return { cards, quarantined };
  }

  /**
   * Correct the summary index if it disagrees with the cards on disk.
   *
   * @param setId The set to correct.
   * @param actual The true live card count.
   */
  private async repairCardCount(setId: string, actual: number): Promise<void> {
    const { document } = await this.readDocument();
    if (document.cardCounts[setId] === actual) return;
    if (!document.sets.some((set) => set.id === setId)) return;
    await this.writeDocument({
      ...document,
      cardCounts: { ...document.cardCounts, [setId]: actual },
    });
  }

  // ── Sets ──────────────────────────────────────────────────────────────────

  /**
   * Create a set.
   *
   * A name collision is **returned, not resolved** — the caller decides between
   * Replace, Rename and Cancel. Identity is the id, so two sets may
   * deliberately share a name once the user has said so.
   *
   * @param rawName The name as typed.
   * @returns The created set, or the conflict to resolve.
   * @throws {RangeError} If the name is empty or too long. Callers must run
   *         `validateSetName` first and show the field error; reaching here
   *         with an invalid name is a programming error, not a user error.
   */
  async createSet(rawName: string): Promise<CreateSetResult> {
    const validation = validateSetName(rawName);
    if (!validation.valid) throw new RangeError(`Invalid set name: ${validation.error}`);

    const { document } = await this.readDocument();
    const conflict = detectNameConflict(document.sets, validation.name, document.cardCounts);
    if (conflict !== null) return { status: 'conflict', conflict };

    return { status: 'created', set: await this.insertSet(document, validation.name) };
  }

  /**
   * Create a set after the caller resolved a name conflict.
   *
   * @param rawName The originally wanted name.
   * @param resolution What the user chose.
   * @returns The created set.
   * @throws {RangeError} If the resolved name is empty or too long.
   */
  async createSetResolving(rawName: string, resolution: ConflictResolution): Promise<CardSet> {
    const wanted = resolution.kind === 'rename' ? resolution.name : rawName;
    const validation = validateSetName(wanted);
    if (!validation.valid) throw new RangeError(`Invalid set name: ${validation.error}`);

    let { document } = await this.readDocument();
    if (resolution.kind === 'replace') {
      const existing = detectNameConflict(document.sets, validation.name, document.cardCounts);
      if (existing !== null) {
        document = await this.applyDelete(document, existing.existingSetId);
      }
    }
    return this.insertSet(document, validation.name);
  }

  /**
   * Append a new set to a document and persist it.
   *
   * @param document The document to extend.
   * @param name The validated, trimmed name.
   * @returns The created set.
   */
  private async insertSet(document: LibraryDocument, name: string): Promise<CardSet> {
    const set = createCardSet({ name, order: document.sets.length }, this.context);
    await this.writeDocument({
      ...document,
      sets: [...document.sets, set],
      cardCounts: { ...document.cardCounts, [set.id]: 0 },
    });
    return set;
  }

  /**
   * Rename a set.
   *
   * Touches metadata only: the id, the cards and every reference to them are
   * untouched. This is the operation the legacy design could not express.
   *
   * @param setId The set to rename.
   * @param rawName The new name.
   * @returns The renamed set, or the conflict to resolve.
   * @throws {RangeError} If the name is invalid, or the set does not exist.
   */
  async renameSet(setId: string, rawName: string): Promise<CreateSetResult> {
    const validation = validateSetName(rawName);
    if (!validation.valid) throw new RangeError(`Invalid set name: ${validation.error}`);

    const { document } = await this.readDocument();
    const index = document.sets.findIndex((set) => set.id === setId && isAlive(set));
    if (index === -1) throw new RangeError(`No such set: ${setId}`);

    const others = document.sets.filter((set) => set.id !== setId);
    const conflict = detectNameConflict(others, validation.name, document.cardCounts);
    if (conflict !== null) return { status: 'conflict', conflict };

    const renamed = touch(document.sets[index], { name: validation.name }, this.context);
    const sets = [...document.sets];
    sets[index] = renamed;
    await this.writeDocument({ ...document, sets });
    return { status: 'created', set: renamed };
  }

  /**
   * Soft-delete a set and clear the selection if it was current.
   *
   * The cards are left on disk under their own key: a tombstoned set is
   * recoverable within the retention window, and erasing its cards would make
   * "undo" a lie.
   *
   * @param setId The set to delete.
   */
  async deleteSet(setId: string): Promise<void> {
    const { document } = await this.readDocument();
    await this.writeDocument(await this.applyDelete(document, setId));
  }

  /**
   * Apply a soft delete to a document without persisting it.
   *
   * @param document The document to change.
   * @param setId The set to delete.
   * @returns The changed document.
   */
  private async applyDelete(document: LibraryDocument, setId: string): Promise<LibraryDocument> {
    const sets = document.sets.map((set) => (set.id === setId ? tombstone(set, this.context) : set));
    return {
      ...document,
      sets,
      // Deleting the current set clears the selection to a REAL null.
      currentSetId: selectionAfterDelete(document.currentSetId, setId),
    };
  }

  /**
   * Duplicate a set and all of its cards under a fresh identity.
   *
   * Every copied card gets a **new** id: a duplicate is a different set, and
   * sharing ids would make the two merge into one another under sync.
   *
   * @param setId The set to duplicate.
   * @param newName The name for the copy. Must already be validated and free.
   * @returns The created copy.
   * @throws {RangeError} If the source set does not exist, or the name is invalid.
   */
  async duplicateSet(setId: string, newName: string): Promise<CardSet> {
    const validation = validateSetName(newName);
    if (!validation.valid) throw new RangeError(`Invalid set name: ${validation.error}`);

    const { document } = await this.readDocument();
    if (!document.sets.some((set) => set.id === setId && isAlive(set))) {
      throw new RangeError(`No such set: ${setId}`);
    }
    const { cards } = await this.listCards(setId);
    const copy = await this.insertSet(await this.reread(), validation.name);
    const copiedCards = cards.map((card, index) =>
      createCard(
        { setId: copy.id, hints: card.hints, answers: card.answers, order: index },
        this.context,
      ),
    );
    await this.writeCards(copy.id, copiedCards);
    return copy;
  }

  /**
   * Re-read the document, for operations that write more than once.
   *
   * @returns The current document.
   */
  private async reread(): Promise<LibraryDocument> {
    return (await this.readDocument()).document;
  }

  /**
   * Select a set as current, or clear the selection.
   *
   * @param setId The set to select, or null to clear.
   * @throws {RangeError} If the id names no live set.
   */
  async setCurrentSet(setId: string | null): Promise<void> {
    const { document } = await this.readDocument();
    if (setId !== null && !document.sets.some((set) => set.id === setId && isAlive(set))) {
      throw new RangeError(`No such set: ${setId}`);
    }
    await this.writeDocument({ ...document, currentSetId: setId });
  }

  /**
   * Record that a session drew from a set.
   *
   * @param setId The set that was used.
   */
  async markSetUsed(setId: string): Promise<void> {
    const { document } = await this.readDocument();
    const index = document.sets.findIndex((set) => set.id === setId);
    if (index === -1) return;
    const sets = [...document.sets];
    sets[index] = touch(sets[index], { lastUsedAt: this.context.now() }, this.context);
    await this.writeDocument({ ...document, sets });
  }

  // ── Cards ─────────────────────────────────────────────────────────────────

  /**
   * Persist a set's cards and update the summary index.
   *
   * @param setId The owning set.
   * @param cards The complete card list to store, including tombstones.
   */
  private async writeCards(setId: string, cards: readonly Card[]): Promise<void> {
    await this.store.setItem(cardsKey(setId), JSON.stringify(cards));
    const document = await this.reread();
    await this.writeDocument({
      ...document,
      cardCounts: { ...document.cardCounts, [setId]: cards.filter(isAlive).length },
    });
  }

  /**
   * Read a set's cards including tombstones, for write paths that must not
   * silently drop them.
   *
   * @param setId The set's id.
   * @returns Every stored card, tombstones included.
   */
  private async readAllCards(setId: string): Promise<Card[]> {
    const raw = await this.store.getItem(cardsKey(setId));
    if (raw === null) return [];
    const json = parseJson(raw);
    if (!json.ok) return [];
    const parsed = parseCardList(json.value);
    return parsed.ok ? parsed.value.cards : [];
  }

  /**
   * Add a card to a set.
   *
   * @param setId The owning set.
   * @param hints The prompts; at least one must be non-empty after trimming.
   * @param answers The accepted answers; at least one must be non-empty.
   * @returns The created card.
   * @throws {RangeError} If the set does not exist, or the card has no
   *         gradeable hint or answer.
   */
  async addCard(setId: string, hints: readonly string[], answers: readonly string[]): Promise<Card> {
    const set = await this.getSet(setId);
    if (set === null) throw new RangeError(`No such set: ${setId}`);

    const existing = await this.readAllCards(setId);
    const order = existing.filter(isAlive).length;
    const card = createCard({ setId, hints, answers, order }, this.context);
    await this.writeCards(setId, [...existing, card]);
    return card;
  }

  /**
   * Edit a card's hints or answers.
   *
   * @param setId The owning set.
   * @param cardId The card to edit.
   * @param changes The new hints and/or answers.
   * @returns The updated card.
   * @throws {RangeError} If the card does not exist, or the edit would leave it
   *         with no gradeable hint or answer.
   */
  async updateCard(
    setId: string,
    cardId: string,
    changes: { hints?: readonly string[]; answers?: readonly string[] },
  ): Promise<Card> {
    const cards = await this.readAllCards(setId);
    const index = cards.findIndex((card) => card.id === cardId && isAlive(card));
    if (index === -1) throw new RangeError(`No such card: ${cardId}`);

    // Round-trip through createCard's validation so an edit can never write a
    // card the session engine would later choke on.
    const validated = createCard(
      {
        setId,
        hints: changes.hints ?? cards[index].hints,
        answers: changes.answers ?? cards[index].answers,
        order: cards[index].order,
      },
      this.context,
    );
    const updated = touch(
      cards[index],
      { hints: validated.hints, answers: validated.answers },
      this.context,
    );
    const next = [...cards];
    next[index] = updated;
    await this.writeCards(setId, next);
    return updated;
  }

  /**
   * Soft-delete a card.
   *
   * @param setId The owning set.
   * @param cardId The card to delete.
   */
  async deleteCard(setId: string, cardId: string): Promise<void> {
    const cards = await this.readAllCards(setId);
    await this.writeCards(
      setId,
      cards.map((card) => (card.id === cardId ? tombstone(card, this.context) : card)),
    );
  }

  /**
   * Reorder a set's cards.
   *
   * Rewrites `order` and nothing else — identity is untouched, so a reorder can
   * never break a reference held by a session or a results screen.
   *
   * @param setId The owning set.
   * @param orderedCardIds The live card ids in their new order.
   * @throws {RangeError} If the ids do not name exactly the set's live cards.
   */
  async reorderCards(setId: string, orderedCardIds: readonly string[]): Promise<void> {
    const cards = await this.readAllCards(setId);
    const live = cards.filter(isAlive);
    const byId = new Map(live.map((card) => [card.id, card]));
    if (orderedCardIds.length !== live.length || orderedCardIds.some((id) => !byId.has(id))) {
      throw new RangeError('reorderCards requires exactly the set’s live card ids');
    }
    const reordered = reorder(
      orderedCardIds.map((id) => byId.get(id) as Card),
      this.context,
    );
    const dead = cards.filter((card) => !isAlive(card));
    await this.writeCards(setId, [...reordered, ...dead]);
  }

  // ── Bulk (import) ─────────────────────────────────────────────────────────

  /**
   * Create a set and its cards in one operation, for CAP-8/CAP-17 import.
   *
   * The set document is written **after** its cards, so an interruption leaves
   * an orphaned card document rather than a set that appears in the library
   * with no content — the failure mode a user can actually notice.
   *
   * @param name The validated, free set name.
   * @param cards The hints and answers to create, in order.
   * @returns The created set and its cards.
   * @throws {RangeError} If the name is invalid, or any card is ungradeable.
   */
  async importSet(
    name: string,
    cards: readonly { hints: readonly string[]; answers: readonly string[] }[],
  ): Promise<SetWithCards> {
    const validation = validateSetName(name);
    if (!validation.valid) throw new RangeError(`Invalid set name: ${validation.error}`);

    const setId = this.context.newId();
    const created = cards.map((card, index) =>
      createCard({ setId, hints: card.hints, answers: card.answers, order: index }, this.context),
    );
    await this.store.setItem(cardsKey(setId), JSON.stringify(created));

    const document = await this.reread();
    const now = this.context.now();
    const set: CardSet = {
      id: setId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncedAt: null,
      schemaVersion: SCHEMA_VERSION,
      name: validation.name,
      lastUsedAt: null,
      order: document.sets.length,
    };
    await this.writeDocument({
      ...document,
      sets: [...document.sets, set],
      cardCounts: { ...document.cardCounts, [setId]: created.length },
    });
    return { set, cards: created };
  }

  /**
   * Detect a name conflict without creating anything, for import previews.
   *
   * @param name The proposed name.
   * @returns The conflict, or null when the name is free.
   */
  async checkNameConflict(name: string): Promise<NameConflict | null> {
    const { document } = await this.readDocument();
    return detectNameConflict(document.sets, name.trim(), document.cardCounts);
  }

  // ── Sync support (CAP-13) ─────────────────────────────────────────────

  /**
   * Read every set and card, **including tombstones**, for a sync pass.
   *
   * Tombstones are included deliberately: they are what stop a deletion on one
   * device being resurrected by another.
   *
   * @returns Every stored set and card.
   */
  async readAllForSync(): Promise<{ sets: CardSet[]; cards: Card[] }> {
    const { document } = await this.readDocument();
    const cards: Card[] = [];
    for (const set of document.sets) cards.push(...(await this.readAllCards(set.id)));
    return { sets: document.sets, cards };
  }

  /**
   * Apply entities pulled from the server, overwriting local copies by id.
   *
   * Union by id: an entity that exists only remotely is added, one that exists
   * on both is replaced, and one that exists only locally is untouched — the
   * caller has already decided which of those the server's copy should win.
   *
   * @param sets Sets to write.
   * @param cards Cards to write.
   */
  async applyFromSync(sets: readonly CardSet[], cards: readonly Card[]): Promise<void> {
    if (sets.length === 0 && cards.length === 0) return;
    const { document } = await this.readDocument();

    const bySetId = new Map(document.sets.map((set) => [set.id, set]));
    for (const set of sets) bySetId.set(set.id, set);

    // Cards are grouped per set document, so a card whose setId changed has to
    // be removed from its old group as well as added to its new one.
    const incomingCardIds = new Set(cards.map((card) => card.id));
    const grouped = new Map<string, Card[]>();
    for (const set of bySetId.values()) {
      const existing = (await this.readAllCards(set.id)).filter(
        (card) => !incomingCardIds.has(card.id),
      );
      grouped.set(set.id, existing);
    }
    for (const card of cards) {
      if (!grouped.has(card.setId)) grouped.set(card.setId, []);
      (grouped.get(card.setId) as Card[]).push(card);
    }

    const cardCounts: Record<string, number> = { ...document.cardCounts };
    for (const [setId, group] of grouped) {
      await this.store.setItem(cardsKey(setId), JSON.stringify(group));
      cardCounts[setId] = group.filter(isAlive).length;
    }

    await this.writeDocument({ ...document, sets: [...bySetId.values()], cardCounts });
  }

  /**
   * Stamp entities as reconciled with the server.
   *
   * Does **not** touch `updatedAt` — recording that a sync happened is not a
   * change to the entity, and stamping it would make everything permanently
   * dirty and re-upload forever.
   *
   * @param syncedAt The watermark to record.
   * @param setIds The sets that were reconciled.
   * @param cardIds The cards that were reconciled.
   */
  async markSynced(
    syncedAt: string,
    setIds: readonly string[],
    cardIds: readonly string[],
  ): Promise<void> {
    const setIdSet = new Set(setIds);
    const cardIdSet = new Set(cardIds);
    const { document } = await this.readDocument();

    const sets = document.sets.map((set) => (setIdSet.has(set.id) ? { ...set, syncedAt } : set));
    await this.writeDocument({ ...document, sets });

    for (const set of sets) {
      const existing = await this.readAllCards(set.id);
      if (!existing.some((card) => cardIdSet.has(card.id))) continue;
      await this.store.setItem(
        cardsKey(set.id),
        JSON.stringify(
          existing.map((card) => (cardIdSet.has(card.id) ? { ...card, syncedAt } : card)),
        ),
      );
    }
  }

  /**
   * Read the library's summary rows without the rest of the snapshot.
   *
   * @returns One summary per live set.
   */
  async listSummaries(): Promise<CardSetSummary[]> {
    return (await this.loadLibrary()).summaries;
  }
}

/** The repository the running app uses. */
export const libraryRepository = new LibraryRepository();
