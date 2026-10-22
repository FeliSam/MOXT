import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { logout } from '@/store/auth';
import { useAppDispatch } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

function paramsFromUrl(url: string) {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  return new URLSearchParams(hash || query);
}

/** Nouveau mot de passe après le lien de récupération (deep link `moxt://reset-password`). */
export default function ResetPasswordScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function prepare() {
      if (!supabase) {
        setInvalid(true);
        return;
      }
      const initial = (await Linking.getInitialURL()) || '';
      const parsed = paramsFromUrl(initial);
      const access = parsed.get('access_token');
      const refresh = parsed.get('refresh_token');
      if (access && refresh) {
        await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) setReady(true);
      else setInvalid(true);
    }
    void prepare();
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    if (password.length < 8) {
      showNotice('Mot de passe', 'Au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      showNotice('Mot de passe', 'Les deux saisies ne correspondent pas.');
      return;
    }
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      dispatch(logout());
      showNotice('Mot de passe', 'Mot de passe mis à jour. Connectez-vous.');
      router.replace('/login' as never);
    } catch (error) {
      showNotice('Mot de passe', error instanceof Error ? error.message : 'Mise à jour impossible.');
    } finally {
      setBusy(false);
    }
  }

  const field = {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  };

  if (!ready && !invalid) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 14 }}>
      <AppText className="text-2xl font-black text-app-text">{invalid ? 'Lien invalide' : 'Nouveau mot de passe'}</AppText>
      {invalid ? (
        <>
          <AppText className="text-sm text-app-text-muted">Ce lien de récupération a expiré ou a déjà été utilisé.</AppText>
          <Pressable onPress={() => router.replace('/forgot-password' as never)}>
            <AppText className="font-bold text-app-accent">Demander un nouveau lien</AppText>
          </Pressable>
        </>
      ) : (
        <>
          <AppText className="text-sm text-app-text-muted">8 caractères minimum. Vous serez déconnecté ensuite.</AppText>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Nouveau mot de passe" placeholderTextColor={colors.textFaint} style={field} />
          <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Confirmer" placeholderTextColor={colors.textFaint} style={field} />
          <Pressable disabled={busy} onPress={() => void save()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
            <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Enregistrer</AppText>
          </Pressable>
        </>
      )}
      <Pressable onPress={() => router.replace('/login' as never)}>
        <AppText className="text-center text-sm font-bold text-app-text-muted">Retour à la connexion</AppText>
      </Pressable>
    </ScrollView>
  );
}
