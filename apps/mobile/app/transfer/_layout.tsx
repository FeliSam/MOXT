import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppBottomTabBar } from '@/components/navigation/BottomNavBar';

/** Toutes les pages transfer affichent la barre de navigation basse (Transferts actif). */
export default function TransferLayout() {
  return (
    <View className="flex-1 bg-app-bg dark:bg-[#0c0c0e]">
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
