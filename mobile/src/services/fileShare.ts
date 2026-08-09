/**
 * Handing an export file to the platform.
 *
 * The only module that knows how a file leaves the app. CAP-9's formats and
 * filenames are decided in `features/export/`, which is testable without any of
 * this.
 *
 * **Works fully offline and requires no account** — nothing here touches the
 * network.
 */

import { Directory, File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Save or share an exported file.
 *
 * On web this triggers a real download with a correct MIME type — the legacy
 * app built a `data:charset=utf-8,…` URL with **no MIME type at all**. On
 * native the file is written to the cache and handed to the share sheet.
 *
 * @param filename The sanitised filename, including its extension.
 * @param contents The UTF-8 file contents.
 * @param mimeType The file's MIME type.
 * @returns True when the file was handed off, false when it could not be.
 */
export async function saveExport(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return saveOnWeb(filename, contents, mimeType);
    }

    const directory = new Directory(Paths.cache, 'exports');
    if (!directory.exists) directory.create({ intermediates: true });
    const file = new File(directory, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(contents);

    if (!(await isAvailableAsync())) return false;
    await shareAsync(file.uri, { mimeType, dialogTitle: filename, UTI: 'public.json' });
    return true;
  } catch {
    // Export is a user action with an obvious success signal; a thrown error
    // here would surface as a crash on an otherwise recoverable path.
    return false;
  }
}

/**
 * Trigger a browser download.
 *
 * @param filename The download's filename.
 * @param contents The file contents.
 * @param mimeType The MIME type, so the browser labels it correctly.
 * @returns True when the download was triggered.
 */
function saveOnWeb(filename: string, contents: string, mimeType: string): boolean {
  const doc = (globalThis as { document?: Document }).document;
  const url = (globalThis as { URL?: typeof URL }).URL;
  if (doc === undefined || url === undefined) return false;

  // A Blob with a real MIME type and an explicit UTF-8 charset, rather than a
  // data: URL — data: URLs are length-limited and lose the filename.
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const href = url.createObjectURL(blob);
  const anchor = doc.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  doc.body.appendChild(anchor);
  anchor.click();
  doc.body.removeChild(anchor);
  // Revoked on the next tick: revoking synchronously can cancel the download
  // in some browsers before it has started reading the blob.
  setTimeout(() => url.revokeObjectURL(href), 0);
  return true;
}
