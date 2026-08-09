/**
 * The trophies screen — CAP-7.
 *
 * **This screen has never existed.** The legacy app has had 24 trophies since
 * 2017 and the only way to ever see one is a two-second toast you might miss,
 * so every trophy is shown here — locked and unlocked, its requirement, its
 * unlock date, and progress toward the next in each category.
 */

import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';
import { Appbar, Divider, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTrophies } from '@/features/trophies/hooks';
import type { TrophyProgress, TrophyType } from '@/features/trophies/types';
import { formatCount, formatDateTime } from '@/lib/format';
import { goBackOrHome } from '@/lib/navigation';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';

/** The three categories, in the order the legacy roster declared them. */
const TYPES: readonly TrophyType[] = ['tested', 'passed', 'failed'];

/**
 * The trophies screen.
 *
 * @returns The rendered screen.
 */
export default function TrophiesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { state, progress, loading } = useTrophies();

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: theme.spacing[4],
      paddingTop: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      backgroundColor: theme.colors.background,
    },
    counter: { color: theme.colors.onSurfaceVariant },
    summary: { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[2] },
  });

  const unlockedCount = progress.filter((entry) => entry.unlocked).length;

  const sections = TYPES.map((type) => ({
    type,
    title: t(`trophies.counters.${type}`),
    count: state[type],
    data: progress.filter((entry) => entry.def.type === type),
  }));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => goBackOrHome()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={t('trophies.title')} />
      </Appbar.Header>

      {loading ? null : (
        <>
          <View style={styles.summary}>
            <Text variant="titleMedium" testID="trophy-summary">
              {t('trophies.summary', { count: unlockedCount, total: progress.length })}
            </Text>
          </View>

          <SectionList
            testID="trophy-list"
            sections={sections}
            keyExtractor={(item) => item.def.id}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={Divider}
            renderSectionHeader={({ section }) => (
              <View style={styles.header}>
                <Text variant="titleMedium">{section.title}</Text>
                <Text variant="bodyMedium" style={styles.counter}>
                  {formatCount(section.count)}
                </Text>
              </View>
            )}
            renderItem={({ item }) => <TrophyRow entry={item} />}
          />
        </>
      )}
    </SafeAreaView>
  );
}

/** Props for {@link TrophyRow}. */
interface TrophyRowProps {
  entry: TrophyProgress;
}

/**
 * One trophy row: its requirement, its state, and progress toward it.
 *
 * Locked and unlocked differ by **word and icon**, never by colour alone.
 *
 * @param props See {@link TrophyRowProps}.
 * @returns The rendered row.
 */
function TrophyRow({ entry }: TrophyRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();

  // Owned here rather than passed down: a shared StyleSheet object widens to
  // `TextStyle | ViewStyle | ImageStyle` at the call site and stops type-checking
  // against the element it is applied to.
  const styles = StyleSheet.create({
    row: {
      minHeight: MIN_TOUCH_TARGET,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[3],
      gap: theme.spacing[1],
    },
    rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    unlockedLabel: { color: theme.colors.diff.correct },
    lockedLabel: { color: theme.colors.onSurfaceVariant },
    track: { height: 4, borderRadius: theme.radii.extraSmall, overflow: 'hidden' },
  });

  const name = t(`trophies.goal.${entry.def.type}`, { goal: entry.def.goal });
  const status = t(entry.unlocked ? 'trophies.unlocked' : 'trophies.locked');
  const progressLabel = entry.unlocked
    ? t('trophies.unlockedOn', { date: formatDateTime(entry.unlockedAt ?? '') })
    : t('trophies.progressTo', { current: entry.current, goal: entry.def.goal });

  return (
    <View
      style={styles.row}
      // One accessible node per trophy: a screen reader gets the name, the
      // state and the progress in one announcement rather than three.
      accessible
      accessibilityLabel={t('trophies.rowAccessibility', { name, status, progress: progressLabel })}
      testID={`trophy-${entry.def.id}`}
    >
      <View style={styles.rowHead}>
        <Text variant="titleSmall">{name}</Text>
        <Text
          variant="labelMedium"
          style={entry.unlocked ? styles.unlockedLabel : styles.lockedLabel}
        >
          {entry.unlocked ? `✓ ${status}` : status}
        </Text>
      </View>
      <Text variant="bodySmall">{progressLabel}</Text>
      <View style={styles.track}>
        <ProgressBar
          progress={entry.fraction}
          color={entry.unlocked ? theme.colors.diff.correct : theme.colors.primary}
        />
      </View>
    </View>
  );
}
