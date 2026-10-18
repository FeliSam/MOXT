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
type OtpChannel = 'sms' | 'telegram' | 'flashcall';
type PhoneStep = 'request' | 'choose_channel' | 'confirm';

/** Mot de passe oublié : e-mail ou OTP téléphone (ForgotPasswordPage). */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<Mode>(params.mode === 'phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+7');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('request');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms');
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

  function handleContinuePhone() {
    if (!isValidRussianPhone(phone)) {
      showNotice('Téléphone', 'Numéro russe invalide (+7 et 10 chiffres).');
      return;
    }
    setPhoneStep('choose_channel');
  }

  async function sendPhoneWithChannel(channelToUse: OtpChannel) {
    setBusy(true);
    try {
      const result = await authService.requestPhonePasswordReset(phone, channelToUse);
      setPhone(result.phone);
      setOtpChannel(channelToUse);
      setPhoneStep('confirm');
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      let title = 'Code envoyé';
      let message = `Code envoyé par SMS au ${result.phone}.`;
      if (channelToUse === 'telegram') {
        title = 'Telegram';
        message = `Le code a été envoyé sur Telegram au ${result.phone}.`;
      } else if (channelToUse === 'flashcall') {
        title = 'Appel vocal';
        message = `Un appel court va arriver au ${result.phone}. Notez les 4 derniers chiffres.`;
      }
      showNotice(title, message);
    } catch (error) {
      showNotice('Erreur', error instanceof Error ? error.message : 'Envoi impossible. Essayez par SMS.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmPhone() {
    setBusy(true);
    try {
      await authService.confirmPhonePasswordReset({ phone, token: otp.trim(), password, otpChannel });
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
        Recevez un lien par e-mail, ou un code de confirmation (SMS, Telegram ou appel).
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['email', 'phone'] as Mode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setMode(item);
              setSent(false);
              setPhoneStep('request');
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
          {phoneStep === 'request' ? (
            <>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+7" placeholderTextColor={colors.textFaint} style={field} />
              <Pressable disabled={busy} onPress={() => handleContinuePhone()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Continuer</AppText>
              </Pressable>
            </>
          ) : null}

          {phoneStep === 'choose_channel' ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surfaceMuted }}>
                <View>
                  <AppText className="text-xs text-app-text-muted">Numéro :</AppText>
                  <AppText className="text-sm font-bold text-app-text">{phone}</AppText>
                </View>
                <Pressable onPress={() => setPhoneStep('request')}>
                  <AppText className="text-xs font-bold text-app-accent">Modifier</AppText>
                </Pressable>
              </View>

              <AppText className="text-sm font-bold text-app-text">Comment recevoir votre code ?</AppText>

              {[
                { id: 'sms' as const, title: 'Par SMS (Recommandé)', hint: 'Code à 6 chiffres par SMS standard.' },
                { id: 'telegram' as const, title: 'Par Telegram', hint: 'Code à 6 chiffres envoyé dans l’application Telegram.' },
                { id: 'flashcall' as const, title: 'Par appel vocal', hint: 'Saisissez les 4 derniers chiffres du numéro qui appelle.' },
              ].map((ch) => (
                <Pressable
                  key={ch.id}
                  disabled={busy}
                  onPress={() => void sendPhoneWithChannel(ch.id)}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    gap: 4,
                  }}>
                  <AppText className="text-sm font-bold text-app-text">{ch.title}</AppText>
                  <AppText className="text-xs text-app-text-muted">{ch.hint}</AppText>
                </Pressable>
              ))}

              {busy ? (
                <AppText className="text-center text-xs text-app-accent font-bold">Envoi en cours...</AppText>
              ) : null}

              <Pressable onPress={() => setPhoneStep('request')} style={{ paddingVertical: 8, alignItems: 'center' }}>
                <AppText className="text-xs font-bold text-app-text-muted">← Retour</AppText>
              </Pressable>
            </View>
          ) : null}

          {phoneStep === 'confirm' ? (
            <>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceMuted }}>
                <AppText className="text-xs text-app-text">
                  {otpChannel === 'flashcall'
                    ? `Un appel court va arriver au ${phone}. Notez les 4 derniers chiffres.`
                    : otpChannel === 'telegram'
                      ? `Code envoyé sur Telegram au ${phone}. Si vous n'avez pas Telegram, changez de méthode ci-dessous.`
                      : `Code envoyé par SMS au ${phone}.`}
                </AppText>
              </View>

              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={otpChannel === 'flashcall' ? 4 : 6}
                placeholder={otpChannel === 'flashcall' ? '4 derniers chiffres de l’appelant' : 'Code à 6 chiffres'}
                placeholderTextColor={colors.textFaint}
                style={field}
              />
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Nouveau mot de passe" placeholderTextColor={colors.textFaint} style={field} />
              <Pressable disabled={busy} onPress={() => void confirmPhone()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Définir le mot de passe</AppText>
              </Pressable>

              <Pressable
                disabled={busy || cooldown > 0}
                onPress={() => void sendPhoneWithChannel(otpChannel)}
                style={{ minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <AppText className="text-xs font-bold text-app-text">
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
                </AppText>
              </Pressable>

              <Pressable onPress={() => setPhoneStep('choose_channel')} style={{ paddingVertical: 6, alignItems: 'center' }}>
                <AppText className="text-xs font-bold text-app-accent">Essayer une autre méthode (SMS, Telegram, appel)</AppText>
              </Pressable>

              <Pressable onPress={() => { setPhoneStep('request'); setOtp(''); }} style={{ paddingVertical: 4, alignItems: 'center' }}>
                <AppText className="text-xs text-app-text-muted">Modifier le numéro</AppText>
              </Pressable>
            </>
          ) : null}
        </>
      )}
      <Pressable onPress={() => router.replace('/login' as never)}>
        <AppText className="text-center text-sm font-bold text-app-accent">Retour à la connexion</AppText>
      </Pressable>
    </ScrollView>
  );
}
