import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { restoreSession } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';

export function AuthBootstrap({ children, fontsLoaded }: { children: ReactNode; fontsLoaded: boolean }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
  },
});
