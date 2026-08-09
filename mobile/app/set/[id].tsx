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
import { Appbar, Button, Divider, HelperText, List, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CARD_TEXT_MAX_LENGTH } from '@/features/identity/types';
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={setName} />
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
    </SafeAreaView>
  );
}
