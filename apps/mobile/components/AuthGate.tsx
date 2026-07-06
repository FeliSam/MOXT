import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/store/store';

export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === ('(auth)' as string);

    if (status === 'anonymous' && !inAuthGroup) {
      router.replace('/login' as any);
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/' as any);
    }
  }, [status, segments, router]);

  if (status === 'loading') {
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
