import '../global.css';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import Feather from '@expo/vector-icons/Feather';
import { useFonts } from 'expo-font';
import { ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';

import { AuthGate } from '@/components/AuthGate';
import { BackHeader } from '@/components/chrome/BackHeader';
import { PublishMenuProvider } from '@/components/chrome/PublishMenuSheet';
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary';
import { AuthBootstrap } from '@/providers/AuthBootstrap';
import { DataSync } from '@/providers/DataSync';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { OfflineSync } from '@/providers/OfflineSync';
import { useNotificationNavigation } from '@/services/deepLinking';
import { initMonitoring } from '@/services/monitoring';
import { store } from '@/store/store';
import { AppThemeProvider, ThemeRoot, useTheme } from '@/theme/ThemeContext';
import { getNavigationTheme } from '@/theme/navigationTheme';

initMonitoring();

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Polices du web : Inter 400 / 600 (texte), Manrope 700 (titres) + police d'icônes Feather.
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Manrope_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <SentryErrorBoundary>
      <Provider store={store}>
        <AppThemeProvider>
          <LanguageProvider>
            <AuthBootstrap fontsLoaded={loaded}>
              <RootLayoutNav />
            </AuthBootstrap>
          </LanguageProvider>
        </AppThemeProvider>
      </Provider>
    </SentryErrorBoundary>
  );
}

/**
 * Écrans de pile sans en-tête intégré : en-tête de retour au style web
 * (pastille + bouton rond sans bordure). Les autres écrans affichent leur
 * propre BackHeader (plus de doublon « ← Retour » / en-tête natif).
 */
const STACK_HEADER_TITLES: Record<string, string> = {
  'parcel/[id]': 'Détail colis',
  'listing/[id]': 'Détail annonce',
  'jobs/index': 'Emplois',
  'jobs/[id]': "Offre d'emploi",
  'profile/edit': 'Mon profil',
  admin: 'Admin',
  'admin/stats': 'Statistiques',
};

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const navigationTheme = useMemo(() => getNavigationTheme(isDark, colors), [isDark, colors]);
  useNotificationNavigation();

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeRoot>
        <AuthGate>
          <DataSync>
            <OfflineSync>
              <PublishMenuProvider>
              <Stack
                screenOptions={({ route }) => {
                  const title = STACK_HEADER_TITLES[route.name];
                  return {
                    headerShown: Boolean(title),
                    header: title ? () => <BackHeader title={title} /> : undefined,
                    contentStyle: { backgroundColor: colors.background },
                  };
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="transfer" />
                <Stack.Screen name="design-system" />
                <Stack.Screen name="status/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              </Stack>
              </PublishMenuProvider>
            </OfflineSync>
          </DataSync>
        </AuthGate>
      </ThemeRoot>
    </NavigationThemeProvider>
  );
}
