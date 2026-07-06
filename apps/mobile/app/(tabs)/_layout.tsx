import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { useLanguage } from '@/providers/LanguageProvider';
import { bottomNavigationItems } from '@moxt/shared';

export default function TabLayout() {
  const { translateLabel } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      {bottomNavigationItems.map((item) => (
        <Tabs.Screen
          key={item.mobileRoute}
          name={item.mobileRoute}
          options={{
            title: translateLabel(item.label),
          }}
        />
      ))}

      {/* Onglets accessibles via header / drawer Plus */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
