import { Tabs } from 'expo-router';

import { AppHeader } from '@/components/chrome/AppHeader';
import { PublishMenuProvider } from '@/components/chrome/PublishMenuSheet';
import { GuestHeader } from '@/components/chrome/GuestHeader';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { TAB_ROUTE_PATHS } from '@/constants/routeTitles';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { bottomNavigationItems } from '@moxt/shared';

function TabHeader({ routeName }: { routeName: string }) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  if (!authenticated) return <GuestHeader />;
  return <AppHeader pathname={TAB_ROUTE_PATHS[routeName] ?? '/dashboard'} />;
}

/**
 * Onglets : Transfert · Moxt (index) · Market · Fil + « Plus » (page Moxt).
 * En-tête web (AppHeader) au-dessus de chaque onglet, barre du bas flottante.
 */
export default function TabLayout() {
  const { t } = useLanguage();
  const items = bottomNavigationItems as unknown as { id: string; label: string; labelKey: string | null; mobileRoute: string }[];
  const labelFor = (route: string) => {
    const item = items.find((entry) => entry.mobileRoute === route);
    return item ? (item.labelKey ? t(item.labelKey) : item.label) : route;
  };

  return (
    <PublishMenuProvider>
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <TabHeader routeName={route.name} />,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: { display: 'none' },
      })}>
      <Tabs.Screen name="index" options={{ title: labelFor('index') }} />
      <Tabs.Screen name="transfers" options={{ title: labelFor('transfers') }} />
      <Tabs.Screen name="marketplace" options={{ title: labelFor('marketplace') }} />
      {/* Fil plein écran comme le web : ni en-tête ni barre du bas. */}
      <Tabs.Screen name="feed" options={{ title: labelFor('feed'), headerShown: false }} />
      <Tabs.Screen name="moxt" options={{ title: t('nav.more') }} />

      {/* Accessibles via l'en-tête (colis, cloche, messagerie) */}
      <Tabs.Screen name="parcels" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null, headerShown: false }} />
    </Tabs>
    </PublishMenuProvider>
  );
}
