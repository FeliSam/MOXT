import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { applySession, restoreSession } from '@/store/auth';
import { statusUpserted } from '@/store/feed';
import { receiveRemoteConversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setTransfers } from '@/store/transfers';
import { useTheme } from '@/theme/ThemeContext';
import { isE2eHarnessActive, readE2eFixtures, readE2eSession } from '@/utils/e2eHarness';

export function AuthBootstrap({ children, fontsLoaded }: { children: ReactNode; fontsLoaded: boolean }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (isE2eHarnessActive()) {
      const session = readE2eSession();
      if (session) {
        dispatch(applySession(session as never));
        const fixtures = readE2eFixtures();
        if (fixtures?.transfers?.length) {
          dispatch(setTransfers({ items: fixtures.transfers as never }));
        }
        if (fixtures?.conversation) {
          dispatch(receiveRemoteConversation(fixtures.conversation as never));
        }
        for (const status of fixtures?.statuses || []) {
          dispatch(statusUpserted({
            ...status,
            images: status.images || [],
            viewedBy: status.viewedBy || [],
          }));
        }
        return;
      }
    }
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
