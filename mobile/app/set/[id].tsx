/**
 * Set detail — CAP-2 (Card Authoring) plus the drill entry point and CAP-9's
 * per-set export.
 *
 * Two authoring modes, exactly as the capability requires:
 *
 * - **Rapid entry** at the top: hint → answer → submit → a blank card with
 *   focus returned to the hint field, and the keyboard action key advancing.
 *   This preserves the legacy Creator's flow (REBUILD_SPEC §8.4), which was
 *   genuinely fast and is the one thing that app got right about authoring.
 * - **A browsable list** below: every card in the set, editable, deletable and
 *   reorderable.
 *
 * Reordering is offered as tappable move up/down controls rather than a drag,
 * because no action may be available only via a gesture (C3).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  HelperText,
  IconButton,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportService } from '@/features/export/api';
import { CARD_TEXT_MAX_LENGTH } from '@/features/identity/types';
import type { Card } from '@/features/identity/types';
import { libraryRepository } from '@/features/library/api';
import { useCards } from '@/features/library/hooks';
import { usePreferences } from '@/features/preferences/hooks';
import { saveExport } from '@/services/fileShare';
import { fireHaptic } from '@/services/haptics';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';
import { goBackOrHome } from '@/lib/navigation';

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

  const { cards, addCard, updateCard, deleteCard, moveCard } = useCards(setId);
  const { preferences } = usePreferences();
  const [setName, setSetName] = useState('');
  const [hint, setHint] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lossyPending, setLossyPending] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const hintRef = useRef<RNTextInput>(null);
  const answerRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (setId === null) return;
    let cancelled = false;
    async function load(): Promise<void> {
      const set = await libraryRepository.getSet(setId as string);
      if (!cancelled) setSetName(set?.name ?? '');
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    editor: { padding: theme.spacing[4], gap: theme.spacing[3] },
    actions: { flexDirection: 'row', gap: theme.spacing[3], paddingHorizontal: theme.spacing[4] },
    empty: { padding: theme.spacing[6], alignItems: 'center', gap: theme.spacing[2] },
    row: {
      minHeight: MIN_TOUCH_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      paddingStart: theme.spacing[4],
    },
    rowText: { flex: 1, paddingVertical: theme.spacing[2] },
    hintText: { color: theme.colors.onSurfaceVariant },
    listHeader: {
      paddingHorizontal: theme.spacing[4],
      paddingTop: theme.spacing[4],
      paddingBottom: theme.spacing[2],
    },
  });

  /** Whether the rapid-entry form has work the user would lose by leaving. */
  const hasPartialCard = hint.trim().length > 0 || answer.trim().length > 0;

  /**
   * Save the in-progress card and reset for the next one.
   *
   * The legacy `next()` flow: validate hint, then answer, focusing whichever is
   * missing rather than showing a generic error at the bottom of a form.
   */
  const submit = useCallback(async (): Promise<void> => {
    if (hint.trim().length === 0) {
      setError(t('cards.errors.hintEmpty'));
      hintRef.current?.focus();
      return;
    }
    if (answer.trim().length === 0) {
      setError(t('cards.errors.answerEmpty'));
      answerRef.current?.focus();
      return;
    }
    setError(null);
    await addCard(hint, answer);
    setHint('');
    setAnswer('');
    setToast(t('cards.added'));
    // Focus returns to the hint field so the next card can be typed without
    // touching the screen — the whole point of rapid entry.
    hintRef.current?.focus();
  }, [addCard, answer, hint, t]);

  /**
   * Leave the screen, warning first if a half-finished card would be lost.
   *
   * Both fields filled would have been saved by `submit`; neither filled exits
   * silently; exactly one filled is the case worth a warning.
   */
  const leave = useCallback((): void => {
    if (hasPartialCard) {
      setConfirmingLeave(true);
      return;
    }
    goBackOrHome();
  }, [hasPartialCard]);

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
   * something warns first — and one that would not, does not.
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
        <Appbar.BackAction onPress={leave} accessibilityLabel={t('common.back')} />
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

      <FlatList
        testID="card-list"
        data={cards}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={
          <>
            <View style={styles.editor}>
              <TextInput
                ref={hintRef}
                mode="outlined"
                label={t('cards.hint')}
                placeholder={t('cards.hintPlaceholder')}
                value={hint}
                onChangeText={setHint}
                maxLength={CARD_TEXT_MAX_LENGTH}
                returnKeyType="next"
                // Enter in the hint field moves to the answer, so a whole card
                // can be entered without leaving the keyboard.
                onSubmitEditing={() => answerRef.current?.focus()}
                blurOnSubmit={false}
                testID="hint-input"
              />
              <TextInput
                ref={answerRef}
                mode="outlined"
                label={t('cards.answer')}
                placeholder={t('cards.answerPlaceholder')}
                value={answer}
                onChangeText={setAnswer}
                onSubmitEditing={() => void submit()}
                blurOnSubmit={false}
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
              <Button mode="contained" onPress={() => void submit()} testID="add-card">
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

            {cards.length > 0 ? (
              <View style={styles.listHeader}>
                <Text variant="titleMedium">
                  {t('common.cardCount', { count: cards.length })}
                </Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty} testID="cards-empty">
            <Text variant="titleMedium">{t('cards.empty.heading')}</Text>
            <Text variant="bodyMedium">{t('cards.empty.body')}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={styles.row}
            testID={`card-row-${item.id}`}
            // A plain container, not a Paper List.Item: a non-pressable
            // List.Item renders aria-disabled, and ARIA disabled state is
            // INHERITED, so the buttons inside it get announced as dimmed.
            accessible={false}
          >
            {/* Pressable, not a View with onTouchEnd: a mouse click never
                fires touch events, so the row was dead on web — and a plain
                View is not focusable, so there was no keyboard path to editing
                a card at all. Found by driving it. */}
            <Pressable
              style={styles.rowText}
              accessibilityRole="button"
              accessibilityLabel={t('cards.rowAccessibility', {
                answer: item.answers[0],
                hint: item.hints[0],
                position: index + 1,
                total: cards.length,
              })}
              onPress={() => setEditing(item)}
              testID={`card-edit-${item.id}`}
            >
              <Text variant="titleMedium">{item.answers[0]}</Text>
              <Text variant="bodyMedium" style={styles.hintText}>
                {item.hints[0]}
              </Text>
            </Pressable>
            <IconButton
              icon="arrow-up"
              accessibilityLabel={t('cards.moveUp')}
              // Disabled rather than hidden at the ends, so the control's
              // position never shifts as the list is reordered.
              disabled={index === 0}
              onPress={() => void moveCard(item.id, 'up')}
              testID={`card-up-${item.id}`}
            />
            <IconButton
              icon="arrow-down"
              accessibilityLabel={t('cards.moveDown')}
              disabled={index === cards.length - 1}
              onPress={() => void moveCard(item.id, 'down')}
              testID={`card-down-${item.id}`}
            />
            <IconButton
              icon="delete-outline"
              accessibilityLabel={t('cards.deleteCard')}
              onPress={() => {
                fireHaptic('destructiveConfirm', preferences.haptics);
                void deleteCard(item.id);
                setToast(t('cards.deleted'));
              }}
              testID={`card-delete-${item.id}`}
            />
          </View>
        )}
      />

      <Portal>
        <EditCardDialog
          card={editing}
          onDismiss={() => setEditing(null)}
          onSave={async (cardId, nextHint, nextAnswer) => {
            await updateCard(cardId, nextHint, nextAnswer);
            setEditing(null);
          }}
        />

        <Dialog visible={confirmingLeave} onDismiss={() => setConfirmingLeave(false)}>
          <Dialog.Title>{t('cards.unsaved.title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('cards.unsaved.body')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmingLeave(false)} testID="keep-editing">
              {t('cards.unsaved.keep')}
            </Button>
            <Button
              onPress={() => {
                setConfirmingLeave(false);
                goBackOrHome();
              }}
              testID="discard-card"
            >
              {t('cards.unsaved.discard')}
            </Button>
          </Dialog.Actions>
        </Dialog>

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

/** Props for {@link EditCardDialog}. */
interface EditCardDialogProps {
  /** The card being edited, or null when the dialog is closed. */
  card: Card | null;
  onDismiss(): void;
  /**
   * Persist the edit.
   *
   * @param cardId The card being edited.
   * @param hint The new hint.
   * @param answer The new answer.
   */
  onSave(cardId: string, hint: string, answer: string): Promise<void>;
}

/**
 * Inline editing for one card.
 *
 * A thin wrapper that **remounts the form per card id**. The fields are
 * initialised from props rather than synced by an effect: deriving state in an
 * effect causes a cascading render and, worse, opening a second card would show
 * the first card's text for one frame. A `key` is the idiomatic reset.
 *
 * @param props See {@link EditCardDialogProps}.
 * @returns The dialog.
 */
function EditCardDialog({ card, onDismiss, onSave }: EditCardDialogProps): React.JSX.Element | null {
  if (card === null) return null;
  return <EditCardForm key={card.id} card={card} onDismiss={onDismiss} onSave={onSave} />;
}

/** Props for {@link EditCardForm}. */
interface EditCardFormProps {
  card: Card;
  onDismiss(): void;
  /**
   * Persist the edit.
   *
   * @param cardId The card being edited.
   * @param hint The new hint.
   * @param answer The new answer.
   */
  onSave(cardId: string, hint: string, answer: string): Promise<void>;
}

/**
 * The edit form itself, with its fields seeded from the card once at mount.
 *
 * @param props See {@link EditCardFormProps}.
 * @returns The dialog.
 */
function EditCardForm({ card, onDismiss, onSave }: EditCardFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const [hint, setHint] = useState(card.hints[0]);
  const [answer, setAnswer] = useState(card.answers[0]);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (): Promise<void> => {
    if (hint.trim().length === 0) {
      setError(t('cards.errors.hintEmpty'));
      return;
    }
    if (answer.trim().length === 0) {
      setError(t('cards.errors.answerEmpty'));
      return;
    }
    await onSave(card.id, hint, answer);
  }, [answer, card.id, hint, onSave, t]);

  return (
    <Dialog visible onDismiss={onDismiss}>
      <Dialog.Title>{t('cards.editCard')}</Dialog.Title>
      <Dialog.Content>
        <TextInput
          mode="outlined"
          label={t('cards.hint')}
          value={hint}
          onChangeText={setHint}
          maxLength={CARD_TEXT_MAX_LENGTH}
          testID="edit-hint"
        />
        <TextInput
          mode="outlined"
          label={t('cards.answer')}
          value={answer}
          onChangeText={setAnswer}
          onSubmitEditing={() => void save()}
          maxLength={CARD_TEXT_MAX_LENGTH}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          testID="edit-answer"
        />
        {error !== null ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>{t('common.cancel')}</Button>
        <Button onPress={() => void save()} testID="edit-save">
          {t('cards.saveCard')}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
