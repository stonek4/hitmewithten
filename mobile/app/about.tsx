/**
 * About, changelog and legal — CAP-18.
 *
 * The version comes from **one place** (`features/about/logic.appVersion`) and
 * the changelog is **data**, not markup, so it renders here, localises, and can
 * be reused verbatim in store release notes.
 */

import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appVersion, CHANGELOG } from '@/features/about/logic';
import { formatDateTime } from '@/lib/format';
import { goBackOrHome } from '@/lib/navigation';
import { MIN_TOUCH_TARGET, useAppTheme } from '@/theme';

/**
 * The About screen.
 *
 * @returns The rendered screen.
 */
export default function AboutScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    block: { padding: theme.spacing[4], gap: theme.spacing[2] },
    muted: { color: theme.colors.onSurfaceVariant },
    change: { flexDirection: 'row', gap: theme.spacing[2], paddingVertical: theme.spacing[1] },
    kind: { minWidth: 64, color: theme.colors.primary },
    row: { minHeight: MIN_TOUCH_TARGET },
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => goBackOrHome()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title={t('about.title')} />
      </Appbar.Header>

      <ScrollView>
        <View style={styles.block}>
          <Text variant="headlineSmall">{t('common.appName')}</Text>
          <Text variant="bodyLarge">{t('about.tagline')}</Text>
          <Text variant="bodyMedium" style={styles.muted} testID="app-version">
            {t('about.version', { version: appVersion() })}
          </Text>
          <Text variant="bodyMedium">{t('about.description')}</Text>
        </View>
        <Divider />

        <View style={styles.block}>
          <Text variant="titleMedium">{t('about.privacy.title')}</Text>
          {/* The policy must describe the BUILT behaviour. This version has no
              account and makes no network requests, and each paragraph below
              says so specifically rather than in general terms. */}
          <Text variant="bodyMedium">{t('about.privacy.localOnly')}</Text>
          <Text variant="bodyMedium">{t('about.privacy.noAccount')}</Text>
          <Text variant="bodyMedium">{t('about.privacy.analytics')}</Text>
          <Text variant="bodyMedium">{t('about.privacy.sync')}</Text>
          <Text variant="bodyMedium">{t('about.privacy.export')}</Text>
          <Text variant="bodyMedium">{t('about.privacy.contactIntro')}</Text>
          <Button
            mode="outlined"
            icon="email-outline"
            onPress={() => void Linking.openURL(`mailto:${t('about.contact.email')}`)}
            testID="contact-email"
          >
            {t('about.contact.email')}
          </Button>
        </View>
        <Divider />

        <List.Subheader>{t('about.changelog')}</List.Subheader>
        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={styles.block} testID={`changelog-${entry.version}`}>
            <Text variant="titleMedium">
              {t('about.version', { version: entry.version })}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {formatDateTime(`${entry.date}T00:00:00.000Z`).split(',')[0]}
            </Text>
            {entry.changes.map((change, index) => (
              <View key={`${entry.version}-${index}`} style={styles.change}>
                {/* The kind is a word, not only a colour — the change list must
                    read the same in monochrome. */}
                <Text variant="labelMedium" style={styles.kind}>
                  {t(`about.changeKind.${change.kind}`)}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {change.text}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <Divider />

        <View style={styles.block}>
          <Text variant="bodySmall" style={styles.muted}>
            {t('about.legal')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
