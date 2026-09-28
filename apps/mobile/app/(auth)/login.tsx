import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatherIcon, type FeatherName } from '@/components/chrome/icons';
import { DsAlert } from '@/components/ds/Alert';
import { DsButton } from '@/components/ds/Button';
import { DsInput } from '@/components/ds/Input';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { clearAuthError, login } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

type LoginMode = 'phone-password' | 'email';

const LOGIN_MODES: { id: LoginMode; labelKey: string; icon: FeatherName }[] = [
  { id: 'phone-password', labelKey: 'auth.login.modePhonePassword', icon: 'phone' },
  { id: 'email', labelKey: 'auth.login.modeEmail', icon: 'mail' },
];

/** constrainPhone(value, '+7', 10) du web : préfixe +7 et 10 chiffres max. */
function constrainPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^7/, '').slice(0, 10);
  return `+7${digits}`;
}

function PasswordEye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      onPress={onToggle}
      style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
      <FeatherIcon name={visible ? 'eye-off' : 'eye'} size={16} color={colors.textFaint} />
    </Pressable>
  );
}

/** Connexion — miroir de moxt-react/src/pages/LoginPage.jsx (AuthCard, onglets, champs). */
export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const { error, status } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<LoginMode>('phone-password');
  const [phone, setPhone] = useState('+7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(
    () => () => {
      dispatch(clearAuthError());
    },
    [dispatch],
  );

  const identifier = mode === 'phone-password' ? phone : email.trim();
  const isLoading = status === 'loading';
  const canSubmit = Boolean(identifier && password) && !isLoading && (mode === 'email' || phone.length === 12);

  const submit = () => {
    if (!canSubmit) return;
    dispatch(login({ identifier, password } as never));
  };

  const switchMode = (next: LoginMode) => {
    setMode(next);
    dispatch(clearAuthError());
  };

  const showHelp = () =>
    Alert.alert(
      t('auth.login.helpTitle'),
      [t('auth.login.helpTipPhone'), t('auth.login.helpTipPassword'), t('auth.login.helpTipEmail')].join('\n\n'),
    );

  const eyebrowColor = isDark ? brand[300] : brand[700];
  const accentGradient = [colors.accent, colors.teal, colors.accent] as const;

  return (
    <KeyboardAvoidingView className="flex-1 bg-app-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
          paddingTop: Math.max(20, insets.top + 20),
          paddingBottom: Math.max(20, insets.bottom + 20),
        }}>
        <View
          style={[
            {
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 24,
              overflow: 'hidden',
            },
            shadows.card,
          ]}>
          {/* Card variant="featured" : voile brand-50/60 → cobalt-soft/20 */}
          <LinearGradient
            pointerEvents="none"
            colors={
              isDark
                ? [withAlphaColor(brand[900], 0.2), withAlphaColor(colors.cobaltSoft, 0.1)]
                : [withAlphaColor(brand[50], 0.6), withAlphaColor(colors.cobaltSoft, 0.2)]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* .auth-card-shell::before : liseré 3px accent → teal → accent */}
          <LinearGradient
            pointerEvents="none"
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? brand[300] : brand[600] }} />
            <AppText className="text-xs font-black uppercase" style={{ color: eyebrowColor, letterSpacing: 1.68 }}>
              {t('auth.login.eyebrow')}
            </AppText>
          </View>

          <View style={{ gap: 8, marginTop: 12 }}>
            {LOGIN_MODES.map((item) => {
              const active = mode === item.id;
              const content = (
                <>
                  <FeatherIcon name={item.icon} size={14} color={active ? '#ffffff' : colors.textMuted} />
                  <AppText
                    style={{ fontSize: 11, lineHeight: 13.2, fontWeight: '800', color: active ? '#ffffff' : colors.textMuted }}>
                    {t(item.labelKey)}
                  </AppText>
                </>
              );
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => switchMode(item.id)}
                  style={[
                    {
                      minHeight: 44,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accent : colors.surface,
                      overflow: 'hidden',
                    },
                    active && { boxShadow: '0 10px 24px rgba(8,112,95,0.22)' },
                  ]}>
                  {active ? (
                    <LinearGradient
                      colors={[colors.accent, isDark ? '#2eaa92' : '#076051']}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                  ) : null}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7.2, paddingHorizontal: 12, paddingVertical: 8 }}>
                    {content}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View style={{ marginTop: 16 }}>
              <DsAlert variant="error" title={t('auth.login.errorTitle')}>
                {error}
              </DsAlert>
            </View>
          ) : null}

          {/* .auth-form-panel : panneau bordé autour des champs (comme le web) */}
          <View
            style={{
              marginTop: 16,
              gap: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withAlphaColor(colors.accent, isDark ? 0.35 : 0.28),
              backgroundColor: colors.surface,
              padding: 16,
            }}>
            {mode === 'phone-password' ? (
              <DsInput
                testID="login-phone"
                label={t('auth.login.phoneLabel')}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                placeholder="+7XXXXXXXXXX"
                value={phone}
                onChangeText={(value) => setPhone(constrainPhone(value))}
                iconLeft={<AppText style={{ fontSize: 16, lineHeight: 18 }}>🇷🇺</AppText>}
              />
            ) : (
              <DsInput
                testID="login-email"
                label={t('auth.login.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                placeholder="nom@example.com"
                value={email}
                onChangeText={setEmail}
                iconLeft={<FeatherIcon name="mail" size={16} color={colors.textFaint} />}
              />
            )}

            <DsInput
              testID="login-password"
              label={t('auth.login.password')}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              iconLeft={<FeatherIcon name="lock" size={16} color={colors.textFaint} />}
              iconRight={<PasswordEye visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            />

            <View style={{ alignItems: 'flex-start', gap: 8 }}>
              <Pressable accessibilityRole="button" onPress={showHelp} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <FeatherIcon name="help-circle" size={15} color={colors.accent} />
                <AppText className="text-sm font-extrabold text-app-accent">{t('auth.login.needHelp')}</AppText>
              </Pressable>
              <Pressable accessibilityRole="link">
                <AppText className="text-sm font-extrabold text-app-accent">{t('auth.login.forgot')}</AppText>
              </Pressable>
            </View>

            {mode === 'phone-password' ? (
              <View style={{ borderLeftWidth: 3, borderLeftColor: withAlphaColor(colors.accent, 0.55), paddingLeft: 10.4 }}>
                <AppText className="text-xs text-app-text-muted">{t('auth.login.phoneHint')}</AppText>
              </View>
            ) : null}

            <DsButton size="lg" loading={isLoading} onPress={submit} style={{ width: '100%' }}>
              {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            </DsButton>
          </View>

          <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <AppText className="text-sm text-app-text-muted">{t('auth.login.newToMoxt')} </AppText>
            <Pressable accessibilityRole="link" onPress={() => router.push('/register' as never)}>
              <AppText className="text-sm font-extrabold text-app-accent">{t('auth.login.createAccount')}</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
