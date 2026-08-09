/**
 * CAP-9 — building export payloads.
 *
 * Reads through the CAP-1 repository and produces a filename plus its contents.
 * Handing the file to the platform is `services/fileShare.ts`; keeping that
 * separate is what lets the whole format be tested without a share sheet.
 */

import { libraryRepository } from '@/features/library/api';
import type { LibraryRepository } from '@/features/library/api';
import type { SetWithCards } from '@/features/library/types';
import { identityContext as defaultIdentityContext } from '@/services/identityContext';
import type { IdentityContext } from '@/features/identity/types';

import {
  buildLegacyExport,
  buildNativeExport,
  EXPORT_MIME_TYPE,
  exportFilename,
  LEGACY_EXTENSION,
  NATIVE_EXTENSION,
  serializeNativeExport,
  wouldLoseDataInLegacyExport,
} from './logic';

/** A file ready to be handed to the platform's share/save mechanism. */
export interface ExportPayload {
  filename: string;
  contents: string;
  mimeType: string;
  /** Sets included, for the confirmation message. */
  setCount: number;
  cardCount: number;
  /** True when a legacy export would silently drop hints or answers. */
  lossy: boolean;
}

/** Builds export payloads. */
export class ExportService {
  private readonly library: LibraryRepository;
  private readonly context: IdentityContext;
  private readonly appVersion: string;

  /**
   * @param library The repository to read sets and cards from.
   * @param context The clock, for `exportedAt`.
   * @param appVersion The app version recorded in the envelope.
   */
  constructor(
    library: LibraryRepository = libraryRepository,
    context: IdentityContext = defaultIdentityContext,
    appVersion = '1.0.0',
  ) {
    this.library = library;
    this.context = context;
    this.appVersion = appVersion;
  }

  /**
   * Load sets and their cards.
   *
   * @param setIds The sets to load, or null for the whole library.
   * @returns Each live set with its cards, in library order.
   */
  private async collect(setIds: readonly string[] | null): Promise<SetWithCards[]> {
    const summaries = await this.library.listSummaries();
    const wanted = setIds === null ? summaries.map((s) => s.id) : setIds;
    const out: SetWithCards[] = [];
    for (const id of wanted) {
      const set = await this.library.getSet(id);
      if (set === null) continue; // deleted between selection and export
      const { cards } = await this.library.listCards(id);
      out.push({ set, cards });
    }
    return out;
  }

  /**
   * Build a native `.vocabcards` export.
   *
   * One set, a selection, or the whole library — the format is multi-set, so
   * all three are the same call.
   *
   * @param setIds The sets to export, or null for everything.
   * @returns The payload, or null when there is nothing to export.
   */
  async exportNative(setIds: readonly string[] | null): Promise<ExportPayload | null> {
    const sets = await this.collect(setIds);
    if (sets.length === 0) return null;

    const payload = buildNativeExport(sets, {
      exportedAt: this.context.now(),
      appVersion: this.appVersion,
    });
    const name = sets.length === 1 ? sets[0].set.name : 'Vocab Cards Library';
    return {
      filename: exportFilename(name, NATIVE_EXTENSION),
      contents: serializeNativeExport(payload),
      mimeType: EXPORT_MIME_TYPE,
      setCount: sets.length,
      cardCount: sets.reduce((total, entry) => total + entry.cards.length, 0),
      lossy: false,
    };
  }

  /**
   * Build a legacy `.cards` export for one set.
   *
   * Produces the exact legacy shape so the file still opens in the old app.
   * **Lossy by definition** — `lossy` tells the caller to warn first.
   *
   * @param setId The set to export.
   * @returns The payload, or null when the set does not exist.
   */
  async exportLegacy(setId: string): Promise<ExportPayload | null> {
    const set = await this.library.getSet(setId);
    if (set === null) return null;
    const { cards } = await this.library.listCards(setId);

    return {
      filename: exportFilename(set.name, LEGACY_EXTENSION),
      // No pretty-printing: this must be byte-compatible with what the legacy
      // app writes and reads.
      contents: JSON.stringify(buildLegacyExport(cards)),
      mimeType: EXPORT_MIME_TYPE,
      setCount: 1,
      cardCount: cards.length,
      lossy: wouldLoseDataInLegacyExport(cards),
    };
  }
}

/** The export service the running app uses. */
export const exportService = new ExportService();
