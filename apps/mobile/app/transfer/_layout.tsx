import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

import { AppHeader } from '@/components/chrome/AppHeader';
import { AppBottomTabBar } from '@/components/navigation/BottomNavBar';

/** Toutes les pages transfer affichent la barre de navigation basse (Transferts actif). */
export default function TransferLayout() {
  const pathname = usePathname();
  const headerPath = /\/wizard|\/create/.test(pathname) ? '/transfers' : '/transfers/detail';
  return (
    <View className="flex-1 bg-app-bg dark:bg-[#0c0c0e]">
      <AppHeader pathname={headerPath} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="wizard" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="create" />
        <Stack.Screen name="receipt" />
      </Stack>
      <AppBottomTabBar activeRoute="transfers" />
    </View>
  );
}
