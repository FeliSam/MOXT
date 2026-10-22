import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';

import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js';

import { AppText } from '@/components/ui/AppText';
import { PENDING_INVITE_KEY } from '@/services/inviteCode';
import { applyReferralCode } from '@/store/referral';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Conserve le code d’invitation puis envoie vers l’inscription ou le profil. */
export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    const value = String(code || '').trim();
    if (!value || status === 'loading') return;
    let alive = true;
    void (async () => {
      await AsyncStorage.setItem(PENDING_INVITE_KEY, value);
      if (!alive) return;
      if (user && isProfileComplete(user)) {
        try {
          await dispatch(applyReferralCode({ userId: user.id, code: value })).unwrap();
        } catch {
          // Le code reste stocké ; le profil affiche l’état du parrainage.
        }
        await AsyncStorage.removeItem(PENDING_INVITE_KEY);
        router.replace('/profile' as never);
        return;
      }
      router.replace(`/register?invite=${encodeURIComponent(value)}` as never);
    })();
    return () => {
      alive = false;
    };
  }, [code, dispatch, status, user]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 }}>
      <ActivityIndicator color={colors.accent} />
      <AppText className="text-sm text-app-text-muted">Invitation en cours…</AppText>
    </View>
  );
}
