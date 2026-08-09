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
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  ProgressBar,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiffStrip } from '@/components/DiffStrip';
import { Page } from '@/components/Page';
import { evaluateAnswer } from '@/features/evaluation/logic';
import type { AnswerEvaluation } from '@/features/evaluation/types';
import { libraryRepository } from '@/features/library/api';
import { usePreferences } from '@/features/preferences/hooks';
import { sessionHistoryRepository } from '@/features/session/api';
import { rememberFinishedSession } from '@/features/session/handoff';
import {
  answersFor,
  buildSessionRecord,
  currentCard,
  endSession,
  flip,
  isFinished,
  progress,
  promptFor,
  recordPass,
  recordWrongAttempt,
  startSession,
} from '@/features/session/logic';
import type { SessionState } from '@/features/session/logic';
import { cardStatsRepository } from '@/features/stats/api';
import { trophyRepository } from '@/features/trophies/api';
import { useTrophyUnlocks } from '@/features/trophies/hooks';
import { fireHaptic } from '@/services/haptics';
import { identityContext } from '@/services/identityContext';
import { typeStyle, useAppTheme, usePageGrid } from '@/theme';
import { goBackOrHome } from '@/lib/navigation';

/**
 * The drilling session screen.
 *
 * @returns The rendered screen.
 */
export default function SessionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const grid = usePageGrid();
  const { preferences } = usePreferences();
  const { setId, mode, cardIds } = useLocalSearchParams<{
    setId: string;
    mode: string;
    cardIds?: string;
  }>();

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
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const unlocks = useTrophyUnlocks();
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

      const sessionMode = mode === 'all' ? 'all' : mode === 'missed' ? 'missed' : 'quick';
      // Missed-word practice is seeded BY ID. Cards deleted since the session
      // simply do not resolve, which is the specified graceful degradation —
      // never an error, never a blank screen.
      const selected =
        sessionMode === 'missed' && typeof cardIds === 'string'
          ? cardIds
              .split(',')
              .map((id) => cards.find((card) => card.id === id))
              .filter((card): card is (typeof cards)[number] => card !== undefined)
          : cards;

      const result = startSession({
        id: identityContext.newId(),
        setId,
        cards: selected,
        mode: sessionMode,
        // CAP-10: both of these were hard-coded until the settings screen
        // existed. Defaults still match the legacy app exactly.
        quickSize: preferences.quickTestSize,
        flipped: preferences.defaultPromptSide === 'answer',
        startedAt: identityContext.now(),
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
  }, [setId, mode, cardIds, t, preferences.quickTestSize, preferences.defaultPromptSide]);

  const card = session === null ? null : currentCard(session);

  /**
   * Close a session and persist its record.
   *
   * A results record is produced for **every** session, including one ended
   * early — an abandoned session reports only what was completed.
   *
   * @param state The session to close.
   */
  const finish = useCallback(async (state: SessionState): Promise<void> => {
    const now = identityContext.now();
    const ended = endSession(state, now);
    const record = buildSessionRecord(ended, now);
    await sessionHistoryRepository.append(record);
    // CAP-15's recording half is effectively P0: written from v1 so enabling
    // scheduling later is a feature, not a migration with no history behind it.
    await cardStatsRepository.recordSession(ended.cardStates);
    // The diffs travel in memory, never to storage — the persisted record must
    // carry no card content (features/session/handoff.ts).
    rememberFinishedSession(ended);
    // `replace`, not `push`: the finished session must not be reachable again
    // by going back, which would resume a session that has already been closed.
    router.replace({ pathname: '/results', params: { sessionId: record.id } });
  }, []);

  /**
   * End the test early, from the back action.
   *
   * Always available, and it still produces a results record for the portion
   * completed. **Validate, then navigate** — the record is written before the
   * screen is torn down, so an abandoned session can never lose what happened.
   */
  const endEarly = useCallback(async (): Promise<void> => {
    if (session !== null && !isFinished(session)) await finish(session);
    setConfirmingEnd(false);
    goBackOrHome();
  }, [session, finish]);

  /**
   * Handle the end-test action, confirming first when cards remain.
   *
   * Ending a test is always available, but it is destructive of the user's
   * momentum, so it asks — and only when there is actually something to lose.
   */
  const requestEnd = useCallback((): void => {
    if (session === null || isFinished(session)) {
      goBackOrHome();
      return;
    }
    setConfirmingEnd(true);
  }, [session]);

  const submit = useCallback(() => {
    if (session === null || card === null) return;
    const result = evaluateAnswer(typed, answersFor(card, session.flipped), {
      caseSensitive: preferences.caseSensitive,
    });
    if (result.correct) {
      setEvaluation(null);
      setTyped('');
      setSelection(undefined);
      const advanced = recordPass(session);
      setSession(advanced);
      fireHaptic('answerCorrect', preferences.haptics);
      if (isFinished(advanced)) fireHaptic('sessionComplete', preferences.haptics);
      // Counters feed the trophy thresholds users have already partially
      // earned, so they are recorded per submission, not at the end — an
      // abandoned session must still count what actually happened.
      void trophyRepository.increment({ passed: 1, tested: 1 }).then(() => void unlocks.check());
      if (isFinished(advanced)) void finish(advanced);
      // Focus stays on the input so the next card can be typed immediately.
      inputRef.current?.focus();
      return;
    }
    setEvaluation(result);
    setSession(recordWrongAttempt(session, result.diff));
    fireHaptic('answerWrong', preferences.haptics);
    void trophyRepository.increment({ failed: 1 }).then(() => void unlocks.check());
    // Keep the text and select it entirely, so a retry replaces it in one
    // keystroke rather than needing it cleared first.
    setSelection({ start: 0, end: typed.length });
    inputRef.current?.focus();
  }, [card, session, typed, finish, unlocks, preferences.caseSensitive, preferences.haptics]);

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
          <Appbar.BackAction onPress={() => goBackOrHome()} accessibilityLabel={t('common.back')} />
          <Appbar.Content title={t('session.title')} />
        </Appbar.Header>
        <View style={styles.body}>
          <Text variant="bodyLarge" testID="session-cannot-start">
            {startError}
          </Text>
          <Button mode="contained" onPress={() => goBackOrHome()}>
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
          <Button mode="contained" onPress={() => router.dismissTo('/')} testID="session-done">
            {t('common.done')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={requestEnd} accessibilityLabel={t('session.endTest')} />
        <Appbar.Content title={t('session.title')} />
        <Appbar.Action
          icon="swap-horizontal"
          accessibilityLabel={t('session.flip')}
          // accessibilityState so a screen reader announces WHICH way round the
          // card currently is, not merely that a toggle exists.
          accessibilityState={{ checked: session.flipped }}
          onPress={() => {
            setEvaluation(null);
            setTyped('');
            setSelection(undefined);
            setSession(flip(session));
          }}
          testID="flip-sides"
        />
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
          label={
            <Text style={styles.label}>
              {session.flipped ? t('cards.answer') : t('cards.hint')}
            </Text>
          }
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
            {card === null ? '' : promptFor(card, session.flipped)}
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

      {/* A missed toast is not a lost event — the trophies screen is the
          durable record. This is dismissible and never blocks the drill. */}
      <Snackbar
        visible={unlocks.pending !== null}
        onDismiss={unlocks.dismiss}
        duration={4000}
        testID="trophy-toast"
      >
        {unlocks.pending === null
          ? ''
          : t('trophies.toast', {
              name: t(`trophies.goal.${unlocks.pending.type}`, { goal: unlocks.pending.goal }),
            })}
      </Snackbar>

      <Portal>
        <Dialog visible={confirmingEnd} onDismiss={() => setConfirmingEnd(false)}>
          <Dialog.Title>{t('session.endConfirm.title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('session.endConfirm.body', {
                count: session.cardStates.length - session.index,
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmingEnd(false)} testID="keep-going">
              {t('session.endConfirm.keepGoing')}
            </Button>
            <Button onPress={() => void endEarly()} testID="confirm-end">
              {t('session.endConfirm.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}
