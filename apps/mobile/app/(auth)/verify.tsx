import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { useLanguage } from '@/providers/LanguageProvider';
import { clearAuthError, verifyEmailRegistration, verifyPhoneRegistration } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing } from '@/theme/colors';

export default function VerifyScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { translateLabel } = useLanguage();
  const { method, email, phone } = useLocalSearchParams<{
    method?: string;
    email?: string;
    phone?: string;
  }>();
  const { error, status } = useAppSelector((state) => state.auth);
  const [code, setCode] = useState('');

  const isLoading = status === 'loading';
  const isEmail = method === 'email';
  const identifier = isEmail ? email : phone;

  const handleVerify = () => {
    dispatch(clearAuthError());
    if (isEmail) {
      dispatch(verifyEmailRegistration({ email: email || '', token: code } as any));
    } else {
      dispatch(verifyPhoneRegistration({ phone: phone || '', token: code, email: email || '' } as any));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Logo */}
        <Text style={[styles.logo, { color: brand[800] }]}>MOXT</Text>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Left accent */}
          <View style={styles.cardAccent} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.dot, { backgroundColor: brand[700] }]} />
            <Text style={[styles.eyebrow, { color: brand[700] }]}>VÉRIFICATION</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Confirmez votre identité</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Entrez le code à 6 chiffres reçu par {isEmail ? 'e-mail' : 'SMS'} à{' '}
            <Text style={{ fontWeight: '700', color: colors.text }}>{identifier}</Text>
            {isEmail
              ? '. Vérifiez que l’adresse e-mail est correctement saisie et consultez vos courriers indésirables (spam) si vous ne le recevez pas.'
              : '.'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Method indicator */}
          <View style={[styles.methodBadge, { backgroundColor: brand[50], borderColor: brand[200] }]}>
            <Text style={styles.methodIcon}>{isEmail ? '✉️' : '💬'}</Text>
            <Text style={[styles.methodText, { color: brand[800] }]}>
              {isEmail ? 'Par e-mail' : 'Par SMS'}
            </Text>
          </View>

          {/* Code input */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>CODE DE VÉRIFICATION</Text>
          <TextInput
            autoCapitalize="none"
            autoFocus
            keyboardType="number-pad"
            maxLength={6}
            placeholder="0 0 0 0 0 0"
            placeholderTextColor={colors.textFaint}
            style={[styles.codeInput, { borderColor: brand[700], color: colors.text }]}
            value={code}
            onChangeText={setCode}
          />

          {/* Buttons */}
          <Pressable
            disabled={isLoading || code.length < 6}
            style={[
              styles.button,
              { backgroundColor: brand[800] },
              (isLoading || code.length < 6) && styles.buttonDisabled,
            ]}
            onPress={handleVerify}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✓ Valider</Text>
            )}
          </Pressable>

          <Pressable style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.text }]}>← Retour</Text>
          </Pressable>

          {/* Resend */}
          <Pressable style={styles.resendRow}>
            <Text style={[styles.resendText, { color: colors.textMuted }]}>
              Pas reçu ?{' '}
            </Text>
            <Text style={[styles.resendAction, { color: brand[700] }]}>
              Renvoyer le code
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: radii['2xl'],
    padding: spacing['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: brand[200],
    borderTopLeftRadius: radii['2xl'],
    borderBottomLeftRadius: radii['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: spacing.xs },
  description: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  methodIcon: { fontSize: 16 },
  methodText: { fontSize: 13, fontWeight: '700' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: spacing['2xl'],
  },
  button: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backButton: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButtonText: { fontWeight: '600', fontSize: 15 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: { fontSize: 13 },
  resendAction: { fontSize: 13, fontWeight: '700' },
});
