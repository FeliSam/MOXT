import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js';
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js';

import { AppText } from '@/components/ui/AppText';
import { authService } from '@/store/auth';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Mode = 'email' | 'phone';

/** Mot de passe oublié : e-mail ou OTP téléphone (ForgotPasswordPage). */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<Mode>(params.mode === 'phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+7');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const field = {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  };

  async function sendEmail() {
    setBusy(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      showNotice('Mot de passe', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function sendPhone() {
    if (!isValidRussianPhone(phone)) {
      showNotice('Téléphone', 'Numéro russe invalide (+7 et 10 chiffres).');
      return;
    }
    setBusy(true);
    try {
      const result = await authService.requestPhonePasswordReset(phone);
      setPhone(result.phone);
      setSent(true);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      showNotice('Téléphone', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmPhone() {
    setBusy(true);
    try {
      await authService.confirmPhonePasswordReset({ phone, token: otp.trim(), password });
      showNotice('Mot de passe', 'Mot de passe mis à jour. Connectez-vous.');
      router.replace('/login' as never);
    } catch (error) {
      showNotice('Mot de passe', error instanceof Error ? error.message : 'Confirmation impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48 }}>
      <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
      <AppText className="text-2xl font-black text-app-text">Mot de passe oublié</AppText>
      <AppText className="text-sm text-app-text-muted">
        Recevez un lien par e-mail, ou un code SMS pour un numéro russe.
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['email', 'phone'] as Mode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setMode(item);
              setSent(false);
            }}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === item ? colors.accent : colors.surfaceMuted,
            }}>
            <AppText className="text-sm font-bold" style={{ color: mode === item ? (isDark ? '#020617' : '#fff') : colors.text }}>
              {item === 'email' ? 'E-mail' : 'Téléphone'}
            </AppText>
          </Pressable>
        ))}
      </View>
      {mode === 'email' ? (
        <>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nom@example.com" placeholderTextColor={colors.textFaint} style={field} />
          {sent ? (
            <AppText className="text-sm text-app-text">Si un compte existe, un lien de réinitialisation a été envoyé.</AppText>
          ) : null}
          <Pressable disabled={busy || cooldown > 0} onPress={() => void sendEmail()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy || cooldown > 0 ? 0.6 : 1 }}>
            <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Envoyer le lien'}
            </AppText>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+7" placeholderTextColor={colors.textFaint} style={field} />
          {sent ? (
            <>
              <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="Code à 6 chiffres" placeholderTextColor={colors.textFaint} style={field} />
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Nouveau mot de passe" placeholderTextColor={colors.textFaint} style={field} />
              <Pressable disabled={busy} onPress={() => void confirmPhone()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Définir le mot de passe</AppText>
              </Pressable>
            </>
          ) : (
            <Pressable disabled={busy} onPress={() => void sendPhone()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
              <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Recevoir le code</AppText>
            </Pressable>
          )}
        </>
      )}
      <Pressable onPress={() => router.replace('/login' as never)}>
        <AppText className="text-center text-sm font-bold text-app-accent">Retour à la connexion</AppText>
      </Pressable>
    </ScrollView>
  );
}
