/**
 * Session results — CAP-6.
 *
 * Closes the loop on a session: what happened, exactly which words were missed,
 * and an immediate way to re-drill them.
 *
 * A results view is produced for **every** session, including one ended early;
 * an abandoned session reports only what was completed.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Button, Divider, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiffStrip } from '@/components/DiffStrip';
import type { DiffSegment } from '@/features/evaluation/types';
import { libraryRepository } from '@/features/library/api';
import { sessionHistoryRepository } from '@/features/session/api';
import { clearFinishedSession, takeFinishedSession } from '@/features/session/handoff';
import type { SessionRecord } from '@/features/session/logic';
import { useTrophyUnlocks } from '@/features/trophies/hooks';
import { formatDuration } from '@/lib/format';
import { useAppTheme } from '@/theme';

/** One row of the missed-word list. */
interface MissedRow {
  cardId: string;
  /** The card's current answer, re-read by id — or null if it was deleted. */
  answer: string | null;
  /** The first diff recorded for it, when the session is still in memory. */
  firstDiff: DiffSegment[] | null;
}

/**
 * The results screen.
 *
 * @returns The rendered screen.
 */
export default function ResultsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [missed, setMissed] = useState<MissedRow[]>([]);
  const [loading, setLoading] = useState(true);
  // A threshold crossed on the LAST card of a session unlocks just as the
  // drilling screen navigates away, so its toast would never be seen there.
  // Results is where that unlock actually lands.
  const unlocks = useTrophyUnlocks();

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (typeof sessionId !== 'string') {
        if (!cancelled) setLoading(false);
        return;
      }
      const stored = await sessionHistoryRepository.get(sessionId);
      // Diffs live only in the in-memory hand-off: the persisted record carries
      // no card content by design (see features/session/handoff.ts).
      const inMemory = takeFinishedSession(sessionId);

      // Missed cards are referenced BY ID, so a card edited between sessions
      // still resolves and a deleted one degrades gracefully instead of
      // breaking the screen.
      const rows: MissedRow[] = [];
      if (stored !== null) {
        const { cards } = await libraryRepository.listCards(stored.setId);
        const byId = new Map(cards.map((card) => [card.id, card]));
        for (const cardId of stored.missedCardIds) {
          rows.push({
            cardId,
            answer: byId.get(cardId)?.answers[0] ?? null,
            firstDiff:
              inMemory?.cardStates.find((state) => state.cardId === cardId)?.firstDiff ?? null,
          });
        }
      }

      if (cancelled) return;
      setRecord(stored);
      setMissed(rows);
      setLoading(false);
      await unlocks.check();
    }
    void load();
    return () => {
      cancelled = true;
    };
    // `unlocks` is intentionally excluded: this must run once per session id,
    // and its `check` identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing[4], gap: theme.spacing[2] },
    stats: { gap: theme.spacing[1] },
    actions: { padding: theme.spacing[4], gap: theme.spacing[3] },
    row: { paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], gap: theme.spacing[1] },
    answer: { color: theme.colors.onSurface },
    gone: { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' },
  });

  /**
   * Leave results by explicit, named navigation.
   *
   * Never `history.back()`: the legacy app called browser-back — sometimes
   * twice — on an assumption about the entry path.
   */
  const done = useCallback((): void => {
    clearFinishedSession();
    router.dismissTo('/');
  }, []);

  /**
   * Re-drill only the missed cards.
   *
   * Cards deleted since the session are silently skipped, which is why the
   * button is disabled when nothing resolvable remains.
   */
  const practiceMissed = useCallback((): void => {
    if (record === null) return;
    const ids = missed.filter((row) => row.answer !== null).map((row) => row.cardId);
    if (ids.length === 0) return;
    clearFinishedSession();
    router.replace({
      pathname: '/session',
      params: { setId: record.setId, mode: 'missed', cardIds: ids.join(',') },
    });
  }, [missed, record]);

  const practiceable = missed.filter((row) => row.answer !== null).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Text testID="results-loading">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (record === null) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Appbar.Header elevated>
          <Appbar.Content title={t('results.title')} />
        </Appbar.Header>
        <View style={styles.body}>
          <Text testID="results-unavailable">{t('results.unavailable')}</Text>
          <Button mode="contained" onPress={done}>
            {t('results.done')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.Content title={t('results.title')} />
      </Appbar.Header>

      <View style={styles.body}>
        <View style={styles.stats}>
          <Text variant="headlineSmall" testID="results-completed">
            {t('results.completed', { count: record.cardsCompleted })}
          </Text>
          <Text variant="bodyLarge" testID="results-first-try">
            {t('results.firstTry', { count: record.firstTryPasses })}
          </Text>
          <Text variant="bodyLarge" testID="results-wrong">
            {t('results.wrongAttempts', { count: record.wrongAttempts })}
          </Text>
          <Text variant="bodyMedium" testID="results-elapsed">
            {t('results.elapsed', { time: formatDuration(record.elapsedMs) })}
          </Text>
          {record.endedEarly ? (
            <Text variant="bodyMedium" testID="results-ended-early">
              {t('results.endedEarly')}
            </Text>
          ) : null}
        </View>

        <Text variant="titleMedium">
          {missed.length === 0 ? t('results.noneMissed') : t('results.missedHeading')}
        </Text>
      </View>

      <FlatList
        testID="missed-list"
        data={missed}
        keyExtractor={(item) => item.cardId}
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => (
          <View style={styles.row} testID={`missed-row-${item.cardId}`}>
            {item.answer === null ? (
              // Degrades gracefully: a card deleted since the session is
              // reported, not silently dropped and not an error.
              <Text variant="bodyMedium" style={styles.gone}>
                {t('results.missedGone')}
              </Text>
            ) : (
              <Text variant="titleMedium" style={styles.answer}>
                {item.answer}
              </Text>
            )}
            {item.firstDiff !== null && item.firstDiff.length > 0 ? (
              <DiffStrip
                diff={item.firstDiff}
                typedRaw=""
                size="compact"
                testID={`missed-diff-${item.cardId}`}
              />
            ) : null}
          </View>
        )}
      />

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={practiceMissed}
          disabled={practiceable === 0}
          testID="practice-missed"
        >
          {t('results.practiceMissedCount', { count: practiceable })}
        </Button>
        <Button mode="outlined" onPress={done} testID="results-done">
          {t('results.done')}
        </Button>
      </View>

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
    </SafeAreaView>
  );
}
