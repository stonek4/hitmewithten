/**
 * The app shell: fonts, theme, i18n and the navigator.
 *
 * The theme follows the system colour scheme (CAP-10's Appearance setting
 * defaults to `system` and is device-local; the setting screen itself is not
 * built yet, so this reads the system value directly).
 */

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '@/i18n';
import { themeForScheme } from '@/theme';

initI18n();

/**
 * The root layout.
 *
 * Fonts are loaded but **never block first paint** — the system fallback
 * renders immediately and the type scale applies either way; only the metrics
 * differ. Blocking here would put a blank frame in front of the one metric that
 * matters most, time to first card typed.
 *
 * @returns The app shell.
 */
export default function RootLayout(): React.JSX.Element {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const scheme = useColorScheme();
  const theme = themeForScheme(scheme);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          {/* A full-screen modal on native, so an accidental back-swipe cannot
              silently end a test (design/spec.md §1.5 A4).

              **Web divergence:** react-navigation's modal presentation makes
              the document taller than the viewport on web (the root is offset
              by the sheet's travel), which pushed the app bar and the diff
              strip off-screen — confirmed by driving it. There is no
              back-swipe to defend against on web, so web gets a plain card. */}
          <Stack.Screen
            name="session"
            options={{
              presentation: Platform.OS === 'web' ? 'card' : 'modal',
              gestureEnabled: false,
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
