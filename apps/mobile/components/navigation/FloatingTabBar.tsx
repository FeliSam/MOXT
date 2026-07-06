import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';

/** Barre flottante — miroir de moxt-react BottomNavigation (dans le Tabs navigator) */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const activeRoute = state.routes[state.index]?.name ?? 'index';

  return (
    <BottomNavBar
      activeRoute={activeRoute}
      onTabPress={(route) => {
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
