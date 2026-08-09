/**
 * Set detail: the cards in a set, rapid entry, and the drill entry points.
 *
 * Rapid entry preserves the legacy editor's flow, which is genuinely fast:
 * hint → answer → submit → a blank card with focus returned to the hint field.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  HelperText,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportService } from '@/features/export/api';
import { CARD_TEXT_MAX_LENGTH } from '@/features/identity/types';
import { saveExport } from '@/services/fileShare';
import { libraryRepository } from '@/features/library/api';
import { useCards } from '@/features/library/hooks';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';

/**
 * The set-detail screen.
 *
 * @returns The rendered screen.
 */
export default function SetDetailScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const setId = typeof id === 'string' ? id : null;

  const { cards, addCard, deleteCard } = useCards(setId);
  const [setName, setSetName] = useState('');
  const [hint, setHint] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lossyPending, setLossyPending] = useState(false);
  const hintRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (setId === null) return;
    void libraryRepository.getSet(setId).then((set) => setSetName(set?.name ?? ''));
  }, [setId]);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    editor: { padding: theme.spacing[4], gap: theme.spacing[3] },
    actions: { flexDirection: 'row', gap: theme.spacing[3], paddingHorizontal: theme.spacing[4] },
    row: { minHeight: MIN_TOUCH_TARGET },
    empty: { padding: theme.spacing[6], alignItems: 'center', gap: theme.spacing[2] },
  });

  const submit = useCallback(async () => {
    if (hint.trim().length === 0) {
      setError(t('cards.errors.hintEmpty'));
      return;
    }
    if (answer.trim().length === 0) {
      setError(t('cards.errors.answerEmpty'));
      return;
    }
    setError(null);
    await addCard(hint, answer);
    setHint('');
    setAnswer('');
    hintRef.current?.focus();
  }, [addCard, answer, hint, t]);

  /**
   * Start a drilling session over this set.
   *
   * **Validate before navigating.** An empty set never reaches the session
   * route — that ordering is the fix for the confirmed production soft-lock.
   *
   * @param mode Which cards the session draws.
   */
  const startTest = useCallback(
    async (mode: 'quick' | 'all'): Promise<void> => {
      if (setId === null || cards.length === 0) return;
      await libraryRepository.setCurrentSet(setId);
      await libraryRepository.markSetUsed(setId);
      router.push({ pathname: '/session', params: { setId, mode } });
    },
    [cards.length, setId],
  );

  /**
   * Export this set in the native, lossless format.
   */
  const exportNative = useCallback(async (): Promise<void> => {
    if (setId === null) return;
    const payload = await exportService.exportNative([setId]);
    if (payload === null) {
      setToast(t('export.nothingToExport'));
      return;
    }
    const saved = await saveExport(payload.filename, payload.contents, payload.mimeType);
    setToast(saved ? t('export.done', { filename: payload.filename }) : t('export.failed'));
  }, [setId, t]);

  /**
   * Export this set in the legacy `.cards` format.
   *
   * Legacy export is lossy by definition, so a set that would actually lose
   * something warns first — the warning is skipped when nothing would be lost,
   * because a confirmation nobody needs is just friction.
   *
   * @param confirmed True when the user has already accepted the loss.
   */
  const exportLegacy = useCallback(
    async (confirmed: boolean): Promise<void> => {
      if (setId === null) return;
      const payload = await exportService.exportLegacy(setId);
      if (payload === null) {
        setToast(t('export.nothingToExport'));
        return;
      }
      if (payload.lossy && !confirmed) {
        setLossyPending(true);
        return;
      }
      setLossyPending(false);
      const saved = await saveExport(payload.filename, payload.contents, payload.mimeType);
      setToast(saved ? t('export.done', { filename: payload.filename }) : t('export.failed'));
    },
    [setId, t],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={setName} />
        <Appbar.Action
          icon="export-variant"
          accessibilityLabel={t('export.native')}
          onPress={() => void exportNative()}
          testID="export-native"
        />
        <Appbar.Action
          icon="file-export-outline"
          accessibilityLabel={t('export.legacy')}
          onPress={() => void exportLegacy(false)}
          testID="export-legacy"
        />
      </Appbar.Header>

      <View style={styles.editor}>
        <TextInput
          ref={hintRef}
          mode="outlined"
          label={t('cards.hint')}
          value={hint}
          onChangeText={setHint}
          maxLength={CARD_TEXT_MAX_LENGTH}
          returnKeyType="next"
          testID="hint-input"
        />
        <TextInput
          mode="outlined"
          label={t('cards.answer')}
          value={answer}
          onChangeText={setAnswer}
          onSubmitEditing={submit}
          maxLength={CARD_TEXT_MAX_LENGTH}
          returnKeyType="done"
          // The answer field defeats every spelling aid: an autocorrected
          // answer destroys the product's entire purpose (CAP-2).
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          testID="answer-input"
        />
        {error !== null ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
        <Button mode="contained" onPress={submit} testID="add-card">
          {t('cards.addCard')}
        </Button>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained-tonal"
          disabled={cards.length === 0}
          onPress={() => void startTest('quick')}
          testID="start-quick"
        >
          {t('session.title')}
        </Button>
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty} testID="cards-empty">
          <Text variant="titleMedium">{t('cards.empty.heading')}</Text>
          <Text variant="bodyMedium">{t('cards.empty.body')}</Text>
        </View>
      ) : (
        <FlatList
          testID="card-list"
          data={cards}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          renderItem={({ item }) => (
            <List.Item
              style={styles.row}
              title={item.answers[0]}
              description={item.hints[0]}
              accessibilityLabel={`${item.hints[0]}, ${item.answers[0]}`}
              right={(props) => (
                <List.Icon {...props} icon="delete-outline" />
              )}
              onPress={() => void deleteCard(item.id)}
              testID={`card-row-${item.id}`}
            />
          )}
        />
      )}
      <Portal>
        <Dialog visible={lossyPending} onDismiss={() => setLossyPending(false)}>
          <Dialog.Title>{t('export.lossyTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('export.lossyBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLossyPending(false)}>{t('common.cancel')}</Button>
            <Button onPress={() => void exportLegacy(true)} testID="export-lossy-confirm">
              {t('export.lossyConfirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={toast !== null} onDismiss={() => setToast(null)} testID="export-toast">
        {toast ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}
