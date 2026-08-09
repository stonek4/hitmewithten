/**
 * The import screen — CAP-8's `.cards` file path.
 *
 * `.cards` import is supported **indefinitely**: it is the only route existing
 * users' archives have.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { importService } from '@/features/import/api';
import type { ImportItemResult, ImportReport } from '@/features/import/types';
import { pickCardsFiles } from '@/services/filePicker';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';
import { goBackOrHome } from '@/lib/navigation';

/**
 * Pick `.cards` files and report what happened to each of them.
 *
 * @returns The rendered screen.
 */
export default function ImportScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing[4], gap: theme.spacing[3] },
    row: { minHeight: MIN_TOUCH_TARGET },
    summary: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2] },
  });

  const runImport = useCallback(async () => {
    setBusy(true);
    try {
      const files = await pickCardsFiles();
      if (files.length === 0) {
        // Cancelling is not a failure and must not look like one.
        setReport(null);
        return;
      }
      setReport(await importService.importFiles(files));
    } finally {
      // Always clears, so the button can never be left permanently disabled by
      // a picker that resolved in an unexpected way.
      setBusy(false);
    }
  }, []);

  /**
   * The translated outcome line for one imported item.
   *
   * @param item The item to describe.
   * @returns The sentence to show under the item's name.
   */
  const describe = useCallback(
    (item: ImportItemResult): string => {
      const outcome = t(`import.outcome.${item.outcome}`, item.reasonParams ?? {});
      if (item.reasonKey === null) {
        return item.cardCount > 0
          ? `${outcome} · ${t('import.cardsImported', { count: item.cardCount })}`
          : outcome;
      }
      return `${outcome} · ${t(item.reasonKey)}`;
    },
    [t],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => goBackOrHome()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={t('import.title')} />
      </Appbar.Header>

      <View style={styles.body}>
        <Text variant="bodyMedium">{t('import.intro')}</Text>
        <Button
          mode="contained"
          onPress={() => void runImport()}
          disabled={busy}
          icon="file-import-outline"
          testID="pick-files"
        >
          {busy ? t('import.working') : t('import.pickFiles')}
        </Button>
        {busy ? <ActivityIndicator accessibilityLabel={t('import.working')} /> : null}
      </View>

      {report !== null ? (
        <>
          <View style={styles.summary}>
            {/* Two messages, not one: i18next pluralises on a single `count`,
                so a sentence carrying two independently-varying numbers cannot
                be one key without becoming untranslatable. */}
            <Text variant="titleMedium" testID="import-summary">
              {t('import.summaryImported', { count: report.imported })}
            </Text>
            {report.failed > 0 ? (
              <Text variant="bodyMedium" testID="import-skipped">
                {t('import.summarySkipped', { count: report.failed })}
              </Text>
            ) : null}
          </View>
          <FlatList
            testID="import-report"
            data={report.items}
            keyExtractor={(item, index) => `${item.sourceName}-${index}`}
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <List.Item
                style={styles.row}
                title={item.sourceName}
                description={describe(item)}
                accessibilityLabel={`${item.sourceName}. ${describe(item)}`}
                left={(props) => (
                  <List.Icon
                    {...props}
                    // Never colour alone: the icon shape differs too.
                    icon={item.setId !== null ? 'check-circle-outline' : 'alert-circle-outline'}
                    color={item.setId !== null ? theme.colors.diff.correct : theme.colors.error}
                  />
                )}
                testID={`import-item-${item.outcome}`}
              />
            )}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}
