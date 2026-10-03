import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { restoreSession } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

export function AuthBootstrap({ children, fontsLoaded }: { children: ReactNode; fontsLoaded: boolean }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (fontsLoaded && status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === 'loading') {
    return (
      // Écran de chargement aux couleurs du web (fond --app-bg, indicateur teal / accent).
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={isDark ? colors.teal : colors.accent} />
      </View>
    );
  }

  return children;
}
