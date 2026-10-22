import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppHeader } from '@/components/chrome/AppHeader';
import { AppBottomTabBar } from '@/components/navigation/BottomNavBar';

/**
 * En-tête + barre du bas du web (AppLayout) pour les écrans hors onglets :
 * publication, P2P, paramètres, vérification, assistant de transfert.
 */
export function AppChrome({
  pathname,
  children,
  activeRoute = 'none',
}: {
  pathname: string;
  children: ReactNode;
  activeRoute?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader pathname={pathname} />
      <View style={{ flex: 1 }}>{children}</View>
      <AppBottomTabBar activeRoute={activeRoute} />
    </View>
  );
}
