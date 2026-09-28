import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { router } from 'expo-router';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { useAppSelector } from '@/store/store';

/** Barre flottante — miroir de moxt-react BottomNavigation (dans le navigateur Tabs). */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const activeRoute = state.routes[state.index]?.name ?? 'index';

  // Mode invité : le web affiche la mise en page publique, sans barre du bas.
  if (!authenticated) return null;
  // Fil plein écran (web FeedPage) : pas de barre du bas.
  if (activeRoute === 'feed') return null;

  return (
    <BottomNavBar
      activeRoute={activeRoute}
      onTabPress={(route) => {
        // Le web ouvre « Nouveau transfert » (/transfers), pas l’historique.
        if (route === 'transfers') {
          router.push('/transfer/wizard' as never);
          return;
        }
        const routeIndex = state.routes.findIndex((r) => r.name === route);
        if (routeIndex === -1) return;
        const target = state.routes[routeIndex];
        const event = navigation.emit({
          type: 'tabPress',
          target: target.key,
          canPreventDefault: true,
        });
        if (state.index !== routeIndex && !event.defaultPrevented) {
          navigation.navigate(target.name);
        }
      }}
    />
  );
}
