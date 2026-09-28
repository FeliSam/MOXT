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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="transfer" options={{ headerShown: false }} />
            <Stack.Screen name="exchangers/index" options={{ headerShown: false }} />
            <Stack.Screen name="parcel/[id]" options={{ title: 'Détail colis', headerShown: true }} />
            <Stack.Screen name="listing/[id]" options={{ title: 'Détail annonce', headerShown: true }} />
            <Stack.Screen name="listing/create" options={{ title: 'Publier une annonce', headerShown: true }} />
            <Stack.Screen name="parcel/reserve" options={{ title: 'Réserver un colis', headerShown: true }} />
            <Stack.Screen name="jobs/index" options={{ title: 'Emplois', headerShown: true }} />
            <Stack.Screen name="jobs/[id]" options={{ title: 'Offre d\'emploi', headerShown: true }} />
            <Stack.Screen name="badges" options={{ title: 'Mes badges', headerShown: true }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: true }} />
            <Stack.Screen name="messages/index" options={{ title: 'Messages', headerShown: true }} />
            <Stack.Screen name="messages/[id]" options={{ title: 'Conversation', headerShown: true }} />
            <Stack.Screen name="profile/edit" options={{ title: 'Mon profil', headerShown: true }} />
            <Stack.Screen name="admin" options={{ title: 'Admin', headerShown: true }} />
            <Stack.Screen name="admin/stats" options={{ title: 'Statistiques', headerShown: true }} />
            <Stack.Screen name="ratings" options={{ title: 'Avis', headerShown: true }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="favorites" options={{ title: 'Favoris', headerShown: true }} />
            <Stack.Screen name="search" options={{ title: 'Recherche', headerShown: true }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="design-system" options={{ headerShown: false }} />
            <Stack.Screen name="kyc" options={{ title: 'Vérification KYC', headerShown: true }} />
            <Stack.Screen name="referral" options={{ title: 'Parrainage', headerShown: true }} />
            <Stack.Screen name="wallet" options={{ title: 'Portefeuille', headerShown: true }} />
            <Stack.Screen name="trust" options={{ title: 'Score de confiance', headerShown: true }} />
            <Stack.Screen name="export" options={{ title: 'Exporter', headerShown: true }} />
            <Stack.Screen name="payment" options={{ title: 'Paiement', headerShown: true }} />
            <Stack.Screen name="organization/index" options={{ title: 'Organisations', headerShown: true }} />
            <Stack.Screen name="organization/[id]" options={{ title: 'Organisation', headerShown: true }} />
            <Stack.Screen name="disputes/index" options={{ title: 'Mes litiges', headerShown: true }} />
            <Stack.Screen name="disputes/create" options={{ title: 'Nouveau litige', headerShown: true }} />
            <Stack.Screen name="disputes/[id]" options={{ title: 'Détail litige', headerShown: true }} />
            <Stack.Screen name="admin/analytics" options={{ title: 'Analytics', headerShown: true }} />
            <Stack.Screen name="support/index" options={{ title: 'Support', headerShown: true }} />
            <Stack.Screen name="support/create" options={{ title: 'Nouveau ticket', headerShown: true }} />
            <Stack.Screen name="support/[id]" options={{ title: 'Ticket', headerShown: true }} />
          </Stack>
          </OfflineSync>
        </DataSync>
      </AuthGate>
      </ThemeRoot>
    </NavigationThemeProvider>
  );
}
