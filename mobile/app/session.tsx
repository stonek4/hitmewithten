/**
 * The drilling session — CAP-3 (partial) driving CAP-4 and CAP-5.
 *
 * This is the screen the whole product exists for: submit an answer, and if it
 * is wrong, see exactly which characters were wrong.
 *
 * Three rules from the capability spec are visible in the code below and must
 * survive any edit:
 * - **Validate before navigating, never after**, and never drive visibility
 *   from an animation side-effect.
 * - **Unlimited retries.** A card advances only by being answered correctly.
 * - On a wrong answer the user's text is **kept and selected entirely**, so a
 *   retry replaces it in one keystroke.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import { Appbar, Button, ProgressBar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiffStrip } from '@/components/DiffStrip';
import { Page } from '@/components/Page';
import { evaluateAnswer } from '@/features/evaluation/logic';
import type { AnswerEvaluation } from '@/features/evaluation/types';
import { libraryRepository } from '@/features/library/api';
import {
  currentCard,
  isFinished,
  progress,
  recordPass,
  recordWrongAttempt,
  startSession,
} from '@/features/session/logic';
import type { SessionState } from '@/features/session/logic';
import { typeStyle, useAppTheme, usePageGrid } from '@/theme';

/**
 * The drilling session screen.
 *
 * @returns The rendered screen.
 */
export default function SessionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const grid = usePageGrid();
  const { setId, mode } = useLocalSearchParams<{ setId: string; mode: string }>();

  const [session, setSession] = useState<SessionState | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  /**
   * A one-shot selection range, applied after a wrong answer so the retry
   * replaces the text in a single keystroke.
   *
   * Declarative rather than an imperative `ref.setSelection(…)` call:
   * **react-native-web's TextInput has no `setSelection` method**, so the
   * imperative form throws `setSelection is not a function` on web the instant
   * a user gets an answer wrong. It is cleared on the next keystroke so the
   * cursor is never trapped at the start of the field.
   */
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (typeof setId !== 'string') {
        setStartError(t('session.cannotStart.noSet'));
        return;
      }
      const { cards } = await libraryRepository.listCards(setId);
      if (cancelled) return;
      const result = startSession({
        setId,
        cards,
        mode: mode === 'all' ? 'all' : 'quick',
        quickSize: 10,
      });
      if (result.ok) setSession(result.session);
      else {
        // A refusal is a message and a working screen — never a blank one.
        setStartError(
          result.error === 'noSet'
            ? t('session.cannotStart.noSet')
            : t('session.cannotStart.emptySet', { name: '' }),
        );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [setId, mode, t]);

  const card = session === null ? null : currentCard(session);

  const submit = useCallback(() => {
    if (session === null || card === null) return;
    const result = evaluateAnswer(typed, card.answersExpected);
    if (result.correct) {
      setEvaluation(null);
      setTyped('');
      setSelection(undefined);
      setSession(recordPass(session));
      // Focus stays on the input so the next card can be typed immediately.
      inputRef.current?.focus();
      return;
    }
    setEvaluation(result);
    setSession(recordWrongAttempt(session));
    // Keep the text and select it entirely, so a retry replaces it in one
    // keystroke rather than needing it cleared first.
    setSelection({ start: 0, end: typed.length });
    inputRef.current?.focus();
  }, [card, session, typed]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: theme.colors.page.desk },
        // Paper's ProgressBar stretches to fill a flex column on web and
        // ignores a height passed through its own `style` prop, which pushed
        // the entire session below the fold and left the ScrollView zero
        // height. It has to be pinned by a WRAPPER. Found by driving the web
        // build — the unit-test renderer performs no layout and cannot see
        // this class of bug.
        progress: { height: 4, overflow: 'hidden' },
        scroll: { flex: 1 },
        body: { padding: theme.spacing[4], gap: theme.spacing[4], maxWidth: 720, width: '100%', alignSelf: 'center' },
        label: { ...typeStyle('paperLabel'), color: theme.colors.page.inkVariant },
        prompt: {
          ...typeStyle('cardPrompt', { lineHeight: grid.rulePitch }),
          color: theme.colors.page.ink,
        },
        answer: {
          ...typeStyle('cardAnswer', { lineHeight: grid.rulePitch }),
          color: theme.colors.page.ink,
          backgroundColor: 'transparent',
        },
        correct: { ...typeStyle('cardAnswer'), color: theme.colors.diff.correct },
        message: { color: theme.colors.page.inkVariant },
        actions: { flexDirection: 'row', gap: theme.spacing[3] },
      }),
    [grid.rulePitch, theme],
  );

  if (startError !== null) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('common.back')} />
          <Appbar.Content title={t('session.title')} />
        </Appbar.Header>
        <View style={styles.body}>
          <Text variant="bodyLarge" testID="session-cannot-start">
            {startError}
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            {t('session.cannotStart.noSetAction')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (session === null) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Text testID="session-loading">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (isFinished(session)) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Appbar.Header elevated>
          <Appbar.Content title={t('session.title')} />
        </Appbar.Header>
        <View style={styles.body}>
          <Text variant="headlineSmall" testID="session-complete">
            {t('session.progress', {
              position: session.cardStates.length,
              total: session.cardStates.length,
            })}
          </Text>
          <Button mode="contained" onPress={() => router.back()} testID="session-done">
            {t('common.done')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('session.endTest')} />
        <Appbar.Content title={t('session.title')} />
      </Appbar.Header>

      <View style={styles.progress}>
        <ProgressBar
          progress={progress(session)}
          accessibilityLabel={t('session.progress', {
            position: session.index + 1,
            total: session.cardStates.length,
          })}
        />
      </View>

      {/* Scrollable so the feedback strip is always reachable and so larger
          dynamic type reflows rather than being clipped. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Page
          label={<Text style={styles.label}>{t('cards.hint')}</Text>}
          labelTrailing={
            <Text style={styles.label}>
              {t('session.progress', {
                position: session.index + 1,
                total: session.cardStates.length,
              })}
            </Text>
          }
          testID="drill-card"
        >
          <Text style={styles.prompt} testID="prompt">
            {card?.promptShown}
          </Text>

          <TextInput
            ref={inputRef}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            style={styles.answer}
            value={typed}
            selection={selection}
            onChangeText={(next) => {
              // Release the one-shot selection as soon as the user types, or
              // the caret would be pinned to the start of the field.
              setSelection(undefined);
              setTyped(next);
            }}
            onSubmitEditing={submit}
            autoFocus
            returnKeyType="done"
            accessibilityLabel={t('session.answerLabel')}
            // The answer field defeats every spelling aid — autocorrect here
            // would destroy the product's entire purpose.
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            testID="answer-field"
          />
        </Page>

        {evaluation !== null && !evaluation.correct ? (
          evaluation.diffOmitted ? (
            <Text style={styles.message} testID="diff-over-cap">
              {t('diff.overCap')}
            </Text>
          ) : (
            <View>
              <Text style={styles.message}>{t('session.notQuite')}</Text>
              <DiffStrip
                diff={evaluation.diff}
                typedRaw={typed}
                showAttempt
                testID="diff-strip"
              />
            </View>
          )
        ) : null}

        <View style={styles.actions}>
          <Button mode="contained" onPress={submit} testID="submit-answer">
            {t('session.submit')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
