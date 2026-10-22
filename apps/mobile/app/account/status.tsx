import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { authService, logout } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

function countdown(target?: string | null) {
  if (!target) return '';
  const ms = new Date(target).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'Échéance atteinte';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${days} j ${hours} h ${minutes} min`;
}

/** Compte suspendu ou en suppression : délai, réouverture, purge (AccountStatusPage). */
export default function AccountStatusScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    void supabase
      .from('profiles')
      .select('status, suspension_source, purge_at, reopen_requested_at')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data || null) as Record<string, unknown> | null));
  }, [user?.id]);

  const status = String(profile?.status || user?.status || 'active');
  const suspended = status === 'suspended' || status === 'pending_deletion';
  const purgeAt = String(profile?.purge_at || '');
  const reopen = profile?.reopen_requested_at;

  async function reopenAccount() {
    setBusy(true);
    try {
      await authService.requestAccountReopening(note);
      showNotice('Compte', 'Demande de réouverture envoyée.');
      setProfile((current) => ({ ...(current || {}), reopen_requested_at: new Date().toISOString() }));
    } catch (error) {
      showNotice('Compte', error instanceof Error ? error.message : 'Demande impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function purge() {
    setBusy(true);
    try {
      await authService.confirmPermanentDeletion();
      dispatch(logout());
    } catch (error) {
      showNotice('Compte', error instanceof Error ? error.message : 'Suppression impossible.');
      setBusy(false);
    }
  }

  return (
    <AppChrome pathname="/account/status">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">{suspended ? 'Compte suspendu' : 'Compte actif'}</AppText>
        {!suspended ? (
          <>
            <AppText className="text-sm text-app-text-muted">Aucune restriction n’est appliquée à ce compte.</AppText>
            <Pressable onPress={() => router.replace('/' as never)}><AppText className="font-bold text-app-accent">Aller au tableau de bord</AppText></Pressable>
          </>
        ) : (
          <>
            <AppText className="text-sm text-app-text-muted">
              {String(profile?.suspension_source || 'moderation') === 'deletion'
                ? 'Une suppression a été demandée. Le compte sera purgé à l’échéance.'
                : 'Le compte est suspendu par la modération. Vous pouvez demander une réouverture.'}
            </AppText>
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
              <AppText className="text-xs font-black uppercase text-app-text-muted">Échéance</AppText>
              <AppText className="text-lg font-black text-app-text">{countdown(purgeAt) || 'Non communiquée'}</AppText>
            </View>
            <AppText className="text-sm text-app-text-muted">1. Suspension · 2. Délai de grâce · 3. Purge des données</AppText>
            {reopen ? (
              <AppText className="text-sm font-bold text-app-text">Demande de réouverture déjà envoyée.</AppText>
            ) : (
              <>
                <TextInput value={note} onChangeText={setNote} placeholder="Message pour l’équipe" placeholderTextColor={colors.textFaint} style={{ minHeight: 88, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 12 }} multiline />
                <Pressable disabled={busy} onPress={() => void reopenAccount()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                  <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Demander la réouverture</AppText>
                </Pressable>
              </>
            )}
            <Pressable disabled={busy} onPress={() => void purge()}><AppText className="text-center font-bold text-red-600">Confirmer la suppression définitive</AppText></Pressable>
            <Pressable onPress={() => router.push('/support' as never)}><AppText className="text-center font-bold text-app-accent">Contacter le support</AppText></Pressable>
            <Pressable onPress={() => dispatch(logout())}><AppText className="text-center font-bold text-app-text-muted">Se déconnecter</AppText></Pressable>
          </>
        )}
      </ScrollView>
    </AppChrome>
  );
}
