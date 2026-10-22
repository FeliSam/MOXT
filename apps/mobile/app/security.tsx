import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldAlert,
  Smartphone,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isEmailVerified, isPhoneVerified } from '@moxt/shared/auth/userSecurity.js';
import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';

import { PhoneVerificationCard } from '@/components/security/PhoneVerificationCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { supabase } from '@/services/supabase';
import { authService } from '@/store/auth';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();
  const { isDark } = useTheme();

  const user = useAppSelector((state) => state.auth.user);
  const [alerts, setAlerts] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closingSessions, setClosingSessions] = useState(false);

  const emailOk = isEmailVerified(user);
  const phoneOk = isPhoneVerified(user);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    void supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
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
      showNotice('Sécurité', 'Un code à 6 chiffres a été envoyé à votre adresse e-mail.');
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (!otp.trim()) {
      showNotice('Sécurité', 'Veuillez saisir le code reçu par e-mail.');
      return;
    }
    if (password.length < 6) {
      showNotice('Sécurité', 'Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    setBusy(true);
    try {
      await authService.updatePassword(password, { nonce: otp.trim() });
      setOpen(false);
      setPassword('');
      setOtp('');
      showNotice('Sécurité', 'Votre mot de passe a été mis à jour avec succès.');
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Modification impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseOtherSessions() {
    setClosingSessions(true);
    try {
      await authService.signOutOtherSessions();
      showNotice('Sécurité', 'Toutes les autres sessions ont été déconnectées.');
    } catch (error) {
      showNotice('Sécurité', error instanceof Error ? error.message : 'Action impossible.');
    } finally {
      setClosingSessions(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile' as never))}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              Sécurité du compte
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Identifiants, mot de passe et sessions
            </AppText>
          </View>
        </View>

        {/* E-mail verification status card */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {emailOk ? (
              <CheckCircle size={20} color="#059669" />
            ) : (
              <AlertTriangle size={20} color="#d97706" />
            )}
            <View style={{ flex: 1 }}>
              <AppText className="text-sm font-black text-app-text">
                {emailOk ? 'Adresse e-mail confirmée' : 'E-mail en attente de confirmation'}
              </AppText>
              <AppText className="text-xs text-app-text-muted mt-0.5" numberOfLines={1}>
                {user?.email || 'Aucune adresse enregistrée'}
              </AppText>
            </View>
          </View>
          {!emailOk ? (
            <View style={{ marginTop: 12 }}>
              <Button variant="secondary" size="sm" onPress={() => router.push('/kyc' as never)}>
                Confirmer avec un code
              </Button>
            </View>
          ) : null}
        </Card>

        {/* Phone verification card */}
        <PhoneVerificationCard />

        {/* Mot de passe */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <KeyRound size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Mot de passe</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            La modification du mot de passe requiert la validation d’un code temporaire envoyé à votre e-mail certifié.
          </AppText>
          <Button
            variant="primary"
            onPress={() => {
              setOpen(true);
              void sendOtp();
            }}>
            Modifier le mot de passe
          </Button>
        </Card>

        {/* Alertes de sécurité */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ShieldAlert size={17} color={colors.accent} strokeWidth={2.2} />
                <AppText className="text-sm font-black text-app-text">Alertes de sécurité</AppText>
              </View>
              <AppText className="text-xs leading-5 text-app-text-muted">
                Avertissements lors de nouvelles connexions ou d’opérations sensibles.
              </AppText>
            </View>
            <Switch
              value={alerts}
              onValueChange={(value) => void toggleAlerts(value)}
              trackColor={{ true: colors.accent }}
            />
          </View>
        </Card>

        {/* Déconnexion des autres sessions */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Smartphone size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Gestion des sessions</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            Déconnectez immédiatement tous les autres navigateurs ou appareils connectés à votre compte.
          </AppText>
          <Button
            variant="secondary"
            loading={closingSessions}
            onPress={() => void handleCloseOtherSessions()}
            style={{ alignSelf: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} color={colors.text} />
              <AppText className="text-xs font-bold text-app-text">Fermer les autres sessions</AppText>
            </View>
          </Button>
        </Card>

        {/* Information sécurité */}
        <View
          style={[
            {
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            },
          ]}>
          <Shield size={16} color={colors.textMuted} />
          <AppText className="text-[11px] leading-4 text-app-text-muted flex-1">
            MOXT protège vos données conformément aux normes de sécurité bancaire et de chiffrement de bout en bout.
          </AppText>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: Math.max(insets.bottom + 16, 24),
                gap: 16,
              },
              shadows.card,
            ]}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lock size={18} color={colors.accent} strokeWidth={2.2} />
                <AppText className="text-base font-black text-app-text">Nouveau mot de passe</AppText>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceMuted,
                }}>
                <X size={16} color={colors.text} />
              </Pressable>
            </View>

            <AppText className="text-xs leading-5 text-app-text-muted">
              Un code de sécurité à 6 chiffres a été envoyé à {user?.email || 'votre adresse e-mail'}.
            </AppText>

            {/* OTP Code Input */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText className="text-xs font-bold text-app-text">Code de sécurité reçu</AppText>
                <Pressable disabled={busy} onPress={() => void sendOtp()}>
                  <AppText className="text-xs font-bold text-app-accent">Renvoyer le code</AppText>
                </Pressable>
              </View>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="Ex. 123456"
                placeholderTextColor={colors.textFaint}
                style={{
                  fontSize: 16,
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  color: colors.text,
                  paddingHorizontal: 14,
                }}
              />
            </View>

            {/* New Password Input */}
            <View style={{ gap: 6 }}>
              <AppText className="text-xs font-bold text-app-text">Nouveau mot de passe</AppText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: 14,
                }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Minimum 6 caractères"
                  placeholderTextColor={colors.textFaint}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    paddingVertical: 10,
                  }}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} style={{ padding: 4 }}>
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit Action */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Button
                variant="primary"
                loading={busy}
                disabled={!otp.trim() || password.length < 6}
                onPress={() => void changePassword()}>
                Confirmer le mot de passe
              </Button>
              <Button variant="ghost" onPress={() => setOpen(false)}>
                Annuler
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
