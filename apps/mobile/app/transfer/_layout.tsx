import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

import { AppHeader } from '@/components/chrome/AppHeader';
import { AppBottomTabBar } from '@/components/navigation/BottomNavBar';
import { useTheme } from '@/theme/ThemeContext';

/** Toutes les pages transfer affichent la barre de navigation basse (Transferts actif). */
export default function TransferLayout() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const headerPath = /\/wizard|\/create/.test(pathname) ? '/transfers' : '/transfers/detail';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader pathname={headerPath} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="wizard" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="create" />
        <Stack.Screen name="receipt" />
      </Stack>
      <AppBottomTabBar activeRoute="transfers" />
    </View>
  );
}
