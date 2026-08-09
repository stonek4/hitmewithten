/**
 * Picking files and reading their text, isolated from the importer.
 *
 * CAP-8's logic and orchestration are platform-free and take
 * `{ name, text }[]`; this module is the only place that knows how a file gets
 * onto the device in the first place. That split is what lets the importer —
 * including the multi-file behaviour the legacy app got wrong — be tested
 * exhaustively with no picker at all.
 */

import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type { ImportFile } from '@/features/import/types';

/**
 * MIME types offered to the picker.
 *
 * `.cards` has no registered MIME type, so the filter has to stay wide or the
 * picker greys out the very files this feature exists to read. Anything the
 * user picks is validated as untrusted input regardless.
 */
const ACCEPTED_TYPES = ['application/json', 'text/plain', 'application/octet-stream', '*/*'];

/**
 * Ask the user for one or more `.cards` files and read their contents.
 *
 * **Multi-select is on.** The legacy picker also advertised `multiple` but
 * imported only the first file, silently; here every picked file is read and
 * returned.
 *
 * A file that cannot be read is skipped rather than aborting the batch, for the
 * same reason: one unreadable file must not cost the user the other eleven.
 *
 * @returns The picked files with their decoded text, or an empty array if the
 *          user cancelled.
 * @throws Nothing — a picker error resolves to an empty selection, because a
 *         thrown error here would surface as a crash on a purely optional flow.
 */
export async function pickCardsFiles(): Promise<ImportFile[]> {
  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ACCEPTED_TYPES,
    });
  } catch {
    return [];
  }

  if (result.canceled) return [];

  const files: ImportFile[] = [];
  for (const asset of result.assets) {
    const text = await readAssetText(asset);
    if (text !== null) files.push({ name: asset.name, text });
  }
  return files;
}

/**
 * Read one picked asset's text on whichever platform we are on.
 *
 * @param asset The picked document.
 * @returns The decoded text, or null when it could not be read.
 */
async function readAssetText(asset: DocumentPicker.DocumentPickerAsset): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // On web the picker hands back the real `File` object; its own `text()`
      // decodes as UTF-8 without a round-trip through the filesystem shim.
      const webFile = (asset as DocumentPicker.DocumentPickerAsset & { file?: Blob }).file;
      if (webFile !== undefined) return await webFile.text();
      const response = await fetch(asset.uri);
      return await response.text();
    }
    return new File(asset.uri).text();
  } catch {
    return null;
  }
}
