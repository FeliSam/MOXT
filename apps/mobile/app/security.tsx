import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';

import { isEmailVerified, isPhoneVerified } from '@moxt/shared/auth/userSecurity.js';
import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { PhoneVerificationCard } from '@/components/security/PhoneVerificationCard';
import { AppText } from '@/components/ui/AppText';
import { authService } from '@/store/auth';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** Sécurité du compte : téléphone, e-mail, mot de passe, alertes, autres sessions. */
export default function SecurityScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [alerts, setAlerts] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const emailOk = isEmailVerified(user);
  const phoneOk = isPhoneVerified(user);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    void supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle().then(({ data }) => {
      const next = (data?.preferences || {}) as Record<string, unknown>;
      setPrefs(next);
      setAlerts(next.securityAlerts !== false);
    });
  }, [user?.id]);

  async function toggleAlerts(value: boolean) {
    if (!user?.id || !supabase) return;
    setAlerts(value);
    try {
      const next = await updateAccountPreferences(supabase, user.id, { securityAlerts: value }, prefs);
      setPrefs(next);
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Préférence non enregistrée.');
    }
  }

  async function sendOtp() {
    if (!user) return;
    setBusy(true);
    try {
      await authService.requestPasswordChangeOtp(user);
      showNotice('Sécurité', 'Code envoyé à votre e-mail.');
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    setBusy(true);
    try {
      await authService.updatePassword(password, { nonce: otp.trim() });
      setOpen(false);
      setPassword('');
      setOtp('');
      showNotice('Sécurité', 'Mot de passe mis à jour.');
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Modification impossible.');
    } finally {
      setBusy(false);
    }
  }

  const field = { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 };

  return (
    <AppChrome pathname="/security">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Sécurité</AppText>
        <AppText className="text-sm" style={{ color: emailOk ? '#059669' : colors.warning }}>
          {emailOk ? 'E-mail confirmé.' : 'E-mail non confirmé. Confirmez-le avant de changer le mot de passe.'}
        </AppText>
        {!phoneOk ? <AppText className="text-sm text-app-text-muted">Le téléphone n’est pas encore confirmé.</AppText> : null}
        <PhoneVerificationCard />
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 10 }}>
          <AppText className="font-black text-app-text">Mot de passe</AppText>
          <AppText className="text-sm text-app-text-muted">Un code à 6 chiffres est envoyé à l’e-mail confirmé.</AppText>
          <Pressable onPress={() => setOpen(true)} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Changer le mot de passe</AppText>
          </Pressable>
        </View>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText className="font-bold text-app-text">Alertes de sécurité</AppText>
            <AppText className="text-xs text-app-text-muted">Connexions et changements sensibles.</AppText>
          </View>
          <Switch value={alerts} onValueChange={(value) => void toggleAlerts(value)} />
        </View>
        <Pressable
          onPress={() => {
            void authService.signOutOtherSessions().then(
              () => showNotice('Sécurité', 'Les autres sessions ont été fermées.'),
              (error: unknown) => showNotice('Sécurité', error instanceof Error ? error.message : 'Action impossible.'),
            );
          }}
          style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
          <AppText className="font-bold text-app-text">Fermer les autres sessions</AppText>
        </Pressable>
        <AppText className="text-xs text-app-text-faint">L’authentification à deux facteurs n’est pas encore disponible.</AppText>
      </ScrollView>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-xl font-black text-app-text">Changer le mot de passe</AppText>
          <Pressable disabled={busy} onPress={() => void sendOtp()}><AppText className="font-bold text-app-accent">Envoyer le code</AppText></Pressable>
          <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="Code à 6 chiffres" placeholderTextColor={colors.textFaint} style={field} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Nouveau mot de passe" placeholderTextColor={colors.textFaint} style={field} />
          <Pressable disabled={busy} onPress={() => void changePassword()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Enregistrer</AppText>
          </Pressable>
          <Pressable onPress={() => setOpen(false)}><AppText className="text-center font-bold text-app-text-muted">Fermer</AppText></Pressable>
        </View>
      </Modal>
    </AppChrome>
  );
}
