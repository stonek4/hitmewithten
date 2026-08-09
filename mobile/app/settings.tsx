/**
 * The settings screen — CAP-10.
 *
 * **Ships with real settings or it does not ship.** The legacy app's has said
 * "Currently there are no settings available to change" since 2017.
 *
 * Every change applies immediately, with no restart, and every setting reads
 * correctly with no account and no network.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  HelperText,
  List,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePreferences } from '@/features/preferences/hooks';
import { useSync } from '@/features/sync/hooks';
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
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
        <Divider />

        {/* CAP-13 §13.1: sign-in is DISCOVERABLE here and nowhere else. There
            is no wall, no interstitial and no signed-out empty state — the app
            is complete without an account, and this section says so. */}
        <List.Subheader>{t('sync.section')}</List.Subheader>
        {!sync.configured ? (
          <View style={styles.group}>
            <Text variant="bodyMedium" testID="sync-unavailable">
              {t('sync.notConfigured')}
            </Text>
          </View>
        ) : sync.account === null ? (
          <View style={styles.group}>
            <Text variant="titleSmall">{t('sync.signedOutTitle')}</Text>
            <Text variant="bodySmall" style={styles.description}>
              {t('sync.signedOutBody')}
            </Text>
            <Text variant="bodySmall" style={styles.description} testID="sync-status">
              {t('sync.status.signedOut')}
            </Text>
            <Button mode="outlined" onPress={() => setShowSignIn(true)} testID="open-sign-in">
              {t('sync.signIn')}
            </Button>
          </View>
        ) : (
          <View style={styles.group}>
            <Text variant="titleSmall" testID="signed-in-as">
              {t('sync.signedInAs', { email: sync.account.email ?? '' })}
            </Text>
            <Text variant="bodySmall" style={styles.description} testID="sync-status">
              {t(`sync.status.${sync.status}`)}
            </Text>
            {/* The conflict rule, surfaced in plain language rather than left
                as a surprise (US-I7). */}
            <Text variant="bodySmall" style={styles.description}>
              {t('sync.conflictNote')}
            </Text>
            {sync.errorKey !== null ? (
              <HelperText type="error" visible>
                {t(sync.errorKey)}
              </HelperText>
            ) : null}
            <Button mode="outlined" onPress={() => void sync.syncNow()} testID="sync-now">
              {t('sync.syncNow')}
            </Button>
            <Button mode="text" onPress={() => setConfirmingSignOut(true)} testID="sign-out">
              {t('sync.signOut')}
            </Button>
            {/* Required in-app by both stores for any app offering accounts. */}
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={() => setConfirmingDelete(true)}
              testID="delete-account"
            >
              {t('sync.deleteAccount.label')}
            </Button>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showSignIn} onDismiss={() => setShowSignIn(false)}>
          <Dialog.Title>{t('sync.signIn')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label={t('sync.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="sync-email"
            />
            <TextInput
              mode="outlined"
              label={t('sync.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              testID="sync-password"
            />
            {sync.errorKey !== null ? (
              <HelperText type="error" visible testID="sync-error">
                {t(sync.errorKey)}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignIn(false)}>{t('common.cancel')}</Button>
            <Button
              onPress={async () => {
                if (await sync.signUp(email, password)) setShowSignIn(false);
              }}
              testID="do-sign-up"
            >
              {t('sync.signUp')}
            </Button>
            <Button
              onPress={async () => {
                if (await sync.signIn(email, password)) setShowSignIn(false);
              }}
              testID="do-sign-in"
            >
              {t('sync.signIn')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Signing out must never be an accidental deletion (US-I4): keeping
            local data is the default and removing it is a separate, warned
            choice. */}
        <Dialog visible={confirmingSignOut} onDismiss={() => setConfirmingSignOut(false)}>
          <Dialog.Title>{t('sync.signOutDialog.title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('sync.signOutDialog.body')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmingSignOut(false)}>{t('common.cancel')}</Button>
            <Button
              onPress={async () => {
                setConfirmingSignOut(false);
                await sync.signOut();
              }}
              testID="confirm-sign-out"
            >
              {t('sync.signOutDialog.keep')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={confirmingDelete} onDismiss={() => setConfirmingDelete(false)}>
          <Dialog.Title>{t('sync.deleteAccount.title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('sync.deleteAccount.body')}</Text>
            <Text variant="bodyMedium">{t('sync.deleteAccount.exportFirst')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmingDelete(false)}>{t('common.cancel')}</Button>
            <Button
              textColor={theme.colors.error}
              onPress={async () => {
                setConfirmingDelete(false);
                await sync.deleteAccount();
              }}
              testID="confirm-delete-account"
            >
              {t('sync.deleteAccount.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}
