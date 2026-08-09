/**
 * The settings screen — CAP-10.
 *
 * **Ships with real settings or it does not ship.** The legacy app's has said
 * "Currently there are no settings available to change" since 2017.
 *
 * Every change applies immediately, with no restart, and every setting reads
 * correctly with no account and no network.
 */

import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Divider, List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePreferences } from '@/features/preferences/hooks';
import { QUICK_TEST_SIZES } from '@/features/preferences/types';
import type { Appearance, PromptSide, QuickTestSize } from '@/features/preferences/types';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';
import { goBackOrHome } from '@/lib/navigation';

/**
 * The settings screen.
 *
 * @returns The rendered screen.
 */
export default function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { preferences, update } = usePreferences();

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    group: { paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], gap: theme.spacing[2] },
    row: { minHeight: MIN_TOUCH_TARGET },
    description: { color: theme.colors.onSurfaceVariant },
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => goBackOrHome()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView>
        <List.Subheader>{t('settings.sectionDrilling')}</List.Subheader>

        <List.Item
          style={styles.row}
          title={t('settings.caseSensitive.label')}
          description={t('settings.caseSensitive.description')}
          accessibilityLabel={t('settings.caseSensitive.label')}
          accessibilityRole="switch"
          accessibilityState={{ checked: preferences.caseSensitive }}
          onPress={() => void update({ caseSensitive: !preferences.caseSensitive })}
          right={() => (
            <Switch
              value={preferences.caseSensitive}
              onValueChange={(value) => void update({ caseSensitive: value })}
              testID="setting-case-sensitive"
            />
          )}
        />
        <Divider />

        <View style={styles.group}>
          <Text variant="titleSmall">{t('settings.quickTestSize.label')}</Text>
          <Text variant="bodySmall" style={styles.description}>
            {t('settings.quickTestSize.description')}
          </Text>
          <SegmentedButtons
            value={String(preferences.quickTestSize)}
            onValueChange={(value) =>
              void update({ quickTestSize: Number(value) as QuickTestSize })
            }
            buttons={QUICK_TEST_SIZES.map((size) => ({
              value: String(size),
              label: String(size),
              accessibilityLabel: t('settings.quickTestSize.option', { count: size }),
              testID: `quick-size-${size}`,
            }))}
          />
        </View>
        <Divider />

        <View style={styles.group}>
          <Text variant="titleSmall">{t('settings.promptSide.label')}</Text>
          <SegmentedButtons
            value={preferences.defaultPromptSide}
            onValueChange={(value) => void update({ defaultPromptSide: value as PromptSide })}
            buttons={[
              { value: 'hint', label: t('settings.promptSide.hint'), testID: 'prompt-hint' },
              { value: 'answer', label: t('settings.promptSide.answer'), testID: 'prompt-answer' },
            ]}
          />
        </View>
        <Divider />

        <List.Subheader>{t('settings.sectionApp')}</List.Subheader>

        <View style={styles.group}>
          <Text variant="titleSmall">{t('settings.appearance.label')}</Text>
          <Text variant="bodySmall" style={styles.description}>
            {t('settings.appearance.description')}
          </Text>
          <SegmentedButtons
            value={preferences.appearance}
            onValueChange={(value) => void update({ appearance: value as Appearance })}
            buttons={[
              { value: 'system', label: t('settings.appearance.system'), testID: 'appearance-system' },
              { value: 'light', label: t('settings.appearance.light'), testID: 'appearance-light' },
              { value: 'dark', label: t('settings.appearance.dark'), testID: 'appearance-dark' },
            ]}
          />
        </View>
        <Divider />

        {/* Web has no haptic engine, so the control would be a lie there. */}
        {Platform.OS === 'web' ? null : (
          <>
            <List.Item
              style={styles.row}
              title={t('settings.haptics.label')}
              description={t('settings.haptics.description')}
              accessibilityLabel={t('settings.haptics.label')}
              accessibilityRole="switch"
              accessibilityState={{ checked: preferences.haptics }}
              onPress={() => void update({ haptics: !preferences.haptics })}
              right={() => (
                <Switch
                  value={preferences.haptics}
                  onValueChange={(value) => void update({ haptics: value })}
                  testID="setting-haptics"
                />
              )}
            />
            <Divider />
          </>
        )}

        <List.Item
          style={styles.row}
          title={t('settings.analytics.label')}
          description={t('settings.analytics.description')}
          accessibilityLabel={t('settings.analytics.label')}
          accessibilityRole="switch"
          accessibilityState={{ checked: preferences.analytics }}
          onPress={() => void update({ analytics: !preferences.analytics })}
          right={() => (
            <Switch
              value={preferences.analytics}
              onValueChange={(value) => void update({ analytics: value })}
              testID="setting-analytics"
            />
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
