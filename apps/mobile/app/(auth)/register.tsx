import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLanguage } from '@/providers/LanguageProvider';
import { clearAuthError, loginWithGoogle, register } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing } from '@/theme/colors';

const STEPS = ['Identité', 'Langue & pays', 'Résidence', 'Vérification'];

const LANGUAGES = [
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'GB', label: 'English', flag: '🇬🇧' },
  { code: 'RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'BR', label: 'Português', flag: '🇧🇷' },
];

const COUNTRIES = [
  { code: 'BJ', label: 'Bénin', flag: '🇧🇯' },
  { code: 'TG', label: 'Togo', flag: '🇹🇬' },
  { code: 'CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'SN', label: 'Sénégal', flag: '🇸🇳' },
  { code: 'CM', label: 'Cameroun', flag: '🇨🇲' },
  { code: 'ML', label: 'Mali', flag: '🇲🇱' },
  { code: 'GN', label: 'Guinée', flag: '🇬🇳' },
];

const CITIES = [
  'Moscou', 'Saint-Pétersbourg', 'Kazan', 'Novossibirsk',
  'Ekaterinbourg', 'Krasnodar', 'Rostov-sur-le-Don',
];

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { translateLabel } = useLanguage();
  const { error, status } = useAppSelector((state) => state.auth);
  const registrationEmail = useAppSelector((state) => state.auth.registrationEmail);

  const [step, setStep] = useState(0);

  // Step 1 - Identity
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 - Language & Country
  const [language, setLanguage] = useState('FR');
  const [originCountry, setOriginCountry] = useState('BJ');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Step 3 - Residence
  const [city, setCity] = useState('Moscou');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [russianPhone, setRussianPhone] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 4 - Verification
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('email');

  const isLoading = status === 'loading';

  useEffect(() => {
    if (registrationEmail) {
      router.push(`/verify?method=${verificationMethod}&email=${encodeURIComponent(registrationEmail)}&phone=${encodeURIComponent(russianPhone)}` as any);
    }
  }, [registrationEmail]);

  const handleSubmit = () => {
    dispatch(clearAuthError());
    dispatch(
      register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        russianPhone: russianPhone.trim(),
        password,
        originCountry,
        verificationMethod,
        language,
        city,
      } as any),
    );
  };

  const canGoNext = () => {
    switch (step) {
      case 0: return firstName.trim().length > 0 && email.trim().length > 0;
      case 1: return language && originCountry;
      case 2: return password.length >= 6 && password === passwordConfirm && acceptTerms;
      case 3: return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const renderStepper = () => (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const completed = i < step;
        const active = i === step;
        return (
          <View key={i} style={styles.stepItem}>
            <View style={styles.stepRow}>
              {i > 0 && (
                <View style={[styles.stepLine, { backgroundColor: completed ? brand[700] : colors.border }]} />
              )}
              <View
                style={[
                  styles.stepCircle,
                  completed && { backgroundColor: brand[700], borderColor: brand[700] },
                  active && { borderColor: brand[700], backgroundColor: colors.surface },
                  !completed && !active && { borderColor: colors.border, backgroundColor: colors.surface },
                ]}>
                {completed ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : (
                  <Text style={[styles.stepIcon, active && { color: brand[700] }]}>
                    {i === 0 ? '👤' : i === 1 ? '🌐' : i === 2 ? '📍' : '✓'}
                  </Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: completed ? brand[700] : colors.border }]} />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: active ? brand[700] : completed ? brand[700] : colors.textFaint },
                active && { fontWeight: '700' },
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderStep1 = () => (
    <>
      {/* Google button */}
      <Pressable
        style={[styles.googleBtn, { borderColor: colors.border }]}
        onPress={() => dispatch(loginWithGoogle())}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={[styles.googleBtnText, { color: colors.text }]}>
          S'inscrire avec Google
        </Text>
      </Pressable>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textFaint }]}>
          OU AVEC VOTRE EMAIL
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Prénom */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>PRÉNOM</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <TextInput
          autoCapitalize="words"
          placeholder="Votre prénom"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      {/* Nom */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>NOM</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <TextInput
          autoCapitalize="words"
          placeholder="Votre nom"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      {/* Email */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>ADRESSE E-MAIL</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="nom@example.com"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          value={email}
          onChangeText={setEmail}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Language grid */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>LANGUE DE L'INTERFACE</Text>
      <View style={styles.langGrid}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            style={[
              styles.langCard,
              { borderColor: language === lang.code ? brand[700] : colors.border, backgroundColor: colors.surface },
              language === lang.code && { borderWidth: 2 },
            ]}
            onPress={() => setLanguage(lang.code)}>
            <Text style={styles.langFlag}>{lang.code}</Text>
            <Text style={[styles.langLabel, { color: colors.text }]}>{lang.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Country of origin */}
      <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>
        PAYS DE PROVENANCE
      </Text>
      <Pressable
        style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
        onPress={() => setShowCountryPicker(!showCountryPicker)}>
        <Text style={[styles.input, { color: colors.text, paddingVertical: 14 }]}>
          {COUNTRIES.find(c => c.code === originCountry)?.flag}{' '}
          {COUNTRIES.find(c => c.code === originCountry)?.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>▼</Text>
      </Pressable>
      {showCountryPicker && (
        <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              style={[styles.pickerItem, originCountry === c.code && { backgroundColor: brand[50] }]}
              onPress={() => { setOriginCountry(c.code); setShowCountryPicker(false); }}>
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {c.flag} {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      {/* City */}
      <Text style={[styles.sectionNote, { color: colors.textMuted }]}>
        Ville de résidence en Russie
      </Text>
      <Pressable
        style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
        onPress={() => setShowCityPicker(!showCityPicker)}>
        <Text style={styles.inputIcon}>📍</Text>
        <Text style={[styles.input, { color: colors.text, paddingVertical: 14 }]}>
          {city}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>▼</Text>
      </Pressable>
      {showCityPicker && (
        <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.pickerItem, city === c && { backgroundColor: brand[50] }]}
              onPress={() => { setCity(c); setShowCityPicker(false); }}>
              <Text style={[styles.pickerText, { color: colors.text }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Russian phone */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>NUMÉRO RUSSE OBLIGATOIRE</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <Text style={[styles.prefix, { color: colors.textMuted }]}>RU +7</Text>
        <TextInput
          keyboardType="phone-pad"
          placeholder="9XXXXXXXXX"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          value={russianPhone}
          onChangeText={setRussianPhone}
        />
      </View>

      {/* Local phone */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>NUMÉRO LOCAL (OPTIONNEL)</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <Text style={[styles.prefix, { color: colors.textMuted }]}>BJ +229</Text>
        <TextInput
          keyboardType="phone-pad"
          placeholder="XXXXXXXX"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          value={localPhone}
          onChangeText={setLocalPhone}
        />
      </View>

      {/* Password */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>MOT DE PASSE</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <Text style={styles.inputIcon}>🔒</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="••••••••"
          placeholderTextColor={colors.textFaint}
          secureTextEntry={!showPassword}
          style={[styles.input, { color: colors.text, flex: 1 }]}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </Pressable>
      </View>

      {/* Confirm */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIRMATION</Text>
      <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <Text style={styles.inputIcon}>🔒</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="••••••••"
          placeholderTextColor={colors.textFaint}
          secureTextEntry={!showConfirm}
          style={[styles.input, { color: colors.text, flex: 1 }]}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
        />
        <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
          <Text style={{ fontSize: 16 }}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
        </Pressable>
      </View>

      {/* Terms */}
      <Pressable style={styles.termsRow} onPress={() => setAcceptTerms(!acceptTerms)}>
        <View style={[styles.checkbox, { borderColor: acceptTerms ? brand[700] : colors.border, backgroundColor: acceptTerms ? brand[700] : 'transparent' }]}>
          {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          J'accepte les conditions d'utilisation et la politique de confidentialité.
        </Text>
      </Pressable>

      {/* Route indicator */}
      <View style={[styles.routeRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.routeText, { color: colors.textSecondary }]}>
          🇧🇯 {COUNTRIES.find(c => c.code === originCountry)?.label} → 🇷🇺 {city}
        </Text>
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={[styles.sectionNote, { color: colors.textSecondary }]}>
        Comment souhaitez-vous confirmer votre compte ?
      </Text>
      <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
        Le téléphone russe est recommandé. L'autre identifiant pourra être confirmé ensuite dans Sécurité.
      </Text>

      {/* SMS option */}
      <Pressable
        style={[
          styles.verifyOption,
          { borderColor: verificationMethod === 'sms' ? brand[700] : colors.border, backgroundColor: verificationMethod === 'sms' ? brand[50] : colors.surface },
          verificationMethod === 'sms' && { borderWidth: 2 },
        ]}
        onPress={() => setVerificationMethod('sms')}>
        <Text style={styles.verifyIcon}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.verifyTitle, { color: colors.text }]}>Par SMS</Text>
          <Text style={[styles.verifySub, { color: colors.textMuted }]}>
            +7{russianPhone || '9800692924'}
          </Text>
        </View>
      </Pressable>

      {/* Email option */}
      <Pressable
        style={[
          styles.verifyOption,
          { borderColor: verificationMethod === 'email' ? brand[700] : colors.border, backgroundColor: verificationMethod === 'email' ? brand[50] : colors.surface },
          verificationMethod === 'email' && { borderWidth: 2 },
        ]}
        onPress={() => setVerificationMethod('email')}>
        <Text style={styles.verifyIcon}>✉️</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.verifyTitle, { color: colors.text }]}>Par e-mail</Text>
          <Text style={[styles.verifySub, { color: colors.textMuted }]}>
            {email || 'votre@email.com'}
          </Text>
        </View>
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Text style={[styles.logo, { color: brand[800] }]}>MOXT</Text>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Left accent */}
            <View style={styles.cardAccent} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={[styles.dot, { backgroundColor: brand[700] }]} />
              <Text style={[styles.eyebrow, { color: brand[700] }]}>INSCRIPTION</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Créer votre compte MOXT</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              Résidence en Russie : un numéro russe valide est obligatoire.
            </Text>

            {/* Stepper */}
            {renderStepper()}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Step content */}
            {step === 0 && renderStep1()}
            {step === 1 && renderStep2()}
            {step === 2 && renderStep3()}
            {step === 3 && renderStep4()}

            {/* Navigation buttons */}
            <View style={styles.navButtons}>
              {step > 0 && (
                <Pressable
                  style={[styles.backButton, { borderColor: colors.border }]}
                  onPress={goBack}>
                  <Text style={[styles.backButtonText, { color: colors.text }]}>← Retour</Text>
                </Pressable>
              )}
              <Pressable
                disabled={isLoading || !canGoNext()}
                style={[
                  styles.nextButton,
                  { backgroundColor: brand[800] },
                  (isLoading || !canGoNext()) && styles.buttonDisabled,
                ]}
                onPress={goNext}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {step === 3 ? '✓ Créer et confirmer' : '→ Continuer'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Login link */}
            <View style={styles.linkRow}>
              <Text style={[styles.linkLabel, { color: colors.textMuted }]}>
                Vous avez déjà un compte ?{' '}
              </Text>
              <Pressable onPress={() => router.replace('/login' as any)}>
                <Text style={[styles.linkAction, { color: brand[700] }]}>Se connecter</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingBottom: 40 },
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
  description: { fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    fontSize: 13,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepIcon: { fontSize: 14 },
  stepLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  googleIcon: { fontSize: 20, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontWeight: '600', fontSize: 15 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: spacing.sm, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  // Inputs
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  inputIcon: { fontSize: 16, marginRight: spacing.sm },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  prefix: { fontSize: 14, fontWeight: '600', marginRight: spacing.sm },
  eyeBtn: { padding: spacing.xs },
  sectionNote: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionSub: { fontSize: 12, lineHeight: 18, marginBottom: spacing.md },

  // Language grid
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  langCard: {
    width: '47%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  langFlag: { fontSize: 22, fontWeight: '800', marginBottom: spacing.xs },
  langLabel: { fontSize: 13, fontWeight: '600' },

  // Picker
  picker: {
    borderWidth: 1,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  pickerItem: { paddingVertical: 12, paddingHorizontal: spacing.lg },
  pickerText: { fontSize: 14 },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Route indicator
  routeRow: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  routeText: { fontSize: 13, fontWeight: '600' },

  // Verification
  verifyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  verifyIcon: { fontSize: 24 },
  verifyTitle: { fontSize: 15, fontWeight: '700' },
  verifySub: { fontSize: 13, marginTop: 2 },

  // Nav buttons
  navButtons: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: { fontWeight: '600', fontSize: 15 },
  nextButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Link
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkLabel: { fontSize: 14 },
  linkAction: { fontSize: 14, fontWeight: '700' },
});
