/**
 * The library screen — CAP-1's UI.
 *
 * The home screen **is** the library (`design/spec.md` §1.5 A1). Rows are
 * served from the summary index, so opening this screen never reads a card
 * document.
 */

import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Banner,
  Button,
  Dialog,
  Divider,
  FAB,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportService } from '@/features/export/api';
import { useLegacyMigration } from '@/features/import/hooks';
import { useLibrary } from '@/features/library/hooks';
import { validateSetName } from '@/features/library/logic';
import type { CardSetSummary, NameConflict } from '@/features/library/types';
import { SET_NAME_MAX_LENGTH } from '@/features/identity/types';
import { saveExport } from '@/services/fileShare';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';

/**
 * The library / home screen.
 *
 * @returns The rendered screen.
 */
export default function LibraryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const library = useLibrary();
  // Adopt a returning web user's vocabcards.com library on first launch, with
  // no user action. Refreshes the list we have already read once it lands.
  const migration = useLegacyMigration(() => void library.refresh());

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<NameConflict | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /**
   * Export the whole library as one native, multi-set file.
   */
  const exportAll = useCallback(async (): Promise<void> => {
    const payload = await exportService.exportNative(null);
    if (payload === null) {
      setToast(t('export.nothingToExport'));
      return;
    }
    const saved = await saveExport(payload.filename, payload.contents, payload.mimeType);
    setToast(saved ? t('export.done', { filename: payload.filename }) : t('export.failed'));
  }, [t]);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    empty: { padding: theme.spacing[6], alignItems: 'center', gap: theme.spacing[3] },
    list: { paddingBottom: theme.spacing[20] },
    fab: {
      position: 'absolute',
      end: theme.spacing[4],
      bottom: theme.spacing[4],
    },
    row: { minHeight: MIN_TOUCH_TARGET },
  });

  const submitName = useCallback(async () => {
    const validation = validateSetName(name);
    if (!validation.valid) {
      setNameError(
        validation.error === 'empty'
          ? t('library.errors.nameEmpty')
          : t('library.errors.nameTooLong', { max: SET_NAME_MAX_LENGTH }),
      );
      return;
    }
    setNameError(null);
    const found = await library.createSet(validation.name);
    setCreating(false);
    if (found !== null) setConflict(found);
    else setName('');
  }, [library, name, t]);

  /**
   * Open a set's detail screen.
   *
   * Validate first, navigate second — never animate-then-navigate, and never
   * `history.back()`. Navigation is explicit and named.
   *
   * @param summary The row that was tapped.
   */
  const openSet = useCallback((summary: CardSetSummary): void => {
    router.push({ pathname: '/set/[id]', params: { id: summary.id } });
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.Content title={t('library.title')} />
        <Appbar.Action
          icon="cog-outline"
          accessibilityLabel={t('settings.open')}
          onPress={() => router.push('/settings')}
          testID="open-settings"
        />
        <Appbar.Action
          icon="export-variant"
          accessibilityLabel={t('export.nativeAll')}
          onPress={() => void exportAll()}
          testID="export-all"
        />
        <Appbar.Action
          icon="trophy-outline"
          accessibilityLabel={t('trophies.open')}
          onPress={() => router.push('/trophies')}
          testID="open-trophies"
        />
        <Appbar.Action
          icon="file-import-outline"
          accessibilityLabel={t('import.openImport')}
          onPress={() => router.push('/import')}
          testID="open-import"
        />
      </Appbar.Header>

      {migration.record !== null ? (
        <Banner
          visible
          icon="tray-arrow-down"
          testID="migration-banner"
          actions={[{ label: t('import.legacyFound.dismiss'), onPress: migration.dismiss }]}
        >
          {/* Separate messages rather than one concatenated sentence: each
              number pluralises independently, and a sentence built from
              fragments cannot be translated. */}
          <View>
            <Text variant="bodyMedium">
              {t('import.legacyFound.body', { count: migration.record.sets })}
            </Text>
            <Text variant="bodyMedium">
              {t('import.legacyFound.cards', { count: migration.record.cards })}
            </Text>
            {migration.record.trophiesMigrated ? (
              <Text variant="bodyMedium">{t('import.legacyFound.trophies')}</Text>
            ) : null}
            <Text variant="bodyMedium">{t('import.legacyFound.kept')}</Text>
          </View>
        </Banner>
      ) : null}

      {library.quarantined.length > 0 ? (
        <Banner
          visible
          icon="alert-circle-outline"
          actions={[]}
          testID="quarantine-banner"
        >
          {t('storage.quarantine.body', { count: library.quarantined.length })}
        </Banner>
      ) : null}

      {library.loading ? null : library.summaries.length === 0 ? (
        <View style={styles.empty} testID="library-empty">
          <Text variant="headlineSmall">{t('library.empty.heading')}</Text>
          <Text variant="bodyMedium">{t('library.empty.body')}</Text>
          <Button mode="contained" onPress={() => setCreating(true)}>
            {t('library.empty.action')}
          </Button>
        </View>
      ) : (
        <FlatList
          testID="library-list"
          data={library.summaries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Divider}
          renderItem={({ item }) => (
            <List.Item
              style={styles.row}
              title={item.name}
              description={t('common.cardCount', { count: item.cardCount })}
              // The accessible name a screen reader announces — and what a
              // test's getByRole(...).name matches — is this label, not the
              // visible text.
              accessibilityLabel={t('library.rowAccessibility', {
                name: item.name,
                count: item.cardCount,
              })}
              accessibilityRole="button"
              left={(props) =>
                item.isCurrent ? <List.Icon {...props} icon="bookmark-check" /> : null
              }
              onPress={() => openSet(item)}
              testID={`set-row-${item.id}`}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        accessibilityLabel={t('library.createSet')}
        onPress={() => setCreating(true)}
        testID="create-set-fab"
      />

      <Portal>
        <Dialog visible={creating} onDismiss={() => setCreating(false)}>
          <Dialog.Title>{t('library.createSet')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label={t('library.setName')}
              placeholder={t('library.setNamePlaceholder')}
              value={name}
              onChangeText={setName}
              onSubmitEditing={submitName}
              autoFocus
              error={nameError !== null}
              testID="set-name-input"
            />
            {nameError !== null ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {nameError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreating(false)}>{t('common.cancel')}</Button>
            <Button onPress={submitName} testID="set-name-save">
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Duplicate names are SURFACED, never silently resolved — the legacy
            app's set name was its storage key, so this path destroyed data. */}
        <Dialog visible={conflict !== null} onDismiss={() => setConflict(null)}>
          <Dialog.Title>{t('library.conflict.title', { name: conflict?.existingName ?? '' })}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('library.conflict.body', { count: conflict?.existingCardCount ?? 0 })}
            </Text>
            <Text variant="bodyMedium">
              {t('library.conflict.renameSuggestion', { name: conflict?.suggestedName ?? '' })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConflict(null)}>{t('library.conflict.cancel')}</Button>
            <Button
              testID="conflict-replace"
              onPress={async () => {
                await library.resolveConflict(name, 'replace');
                setConflict(null);
                setName('');
              }}
            >
              {t('library.conflict.replace')}
            </Button>
            <Button
              testID="conflict-rename"
              onPress={async () => {
                if (conflict === null) return;
                await library.resolveConflict(name, { rename: conflict.suggestedName });
                setConflict(null);
                setName('');
              }}
            >
              {t('library.conflict.rename')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={toast !== null} onDismiss={() => setToast(null)} testID="library-toast">
        {toast ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}
