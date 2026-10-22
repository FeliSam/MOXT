import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle,
  ChevronRight,
  FileCheck,
  FileText,
  Home,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isEmailVerified, isPhoneVerified, verificationRequestIsStale } from '@moxt/shared/auth/userSecurity.js';
import {
  buildPersonalDocument,
  buildPersonalDocumentPath,
  savePersonalDocument,
  submitVerificationRequest,
} from '@moxt/shared/services/accountWrites.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { pickImageOrPdf, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { loadVerification } from '@/store/account';
import { authService, setUser } from '@/store/auth';
import type { AuthUser } from '@/store/types';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';

type Level = 'identity' | 'enhanced';
type DocKey = 'identity' | 'selfie' | 'residence' | 'address';

const ID_TYPES = [
  { value: 'passport', label: 'Passeport' },
  { value: 'residence', label: 'Carte de séjour russe (ВНЖ / РВП)' },
  { value: 'migration', label: 'Carte de migration / patente' },
  { value: 'consular', label: 'Carte consulaire' },
];

const RESIDENCE_TYPES = [
  { value: 'visa', label: 'Visa de séjour' },
  { value: 'vnj', label: 'ВНЖ (Permis de séjour permanent)' },
  { value: 'rvp', label: 'РВП (Séjour temporaire)' },
  { value: 'rvpo', label: 'РВПО (Séjour pour étudiants)' },
];

const LEVEL_LABEL: Record<Level, string> = {
  identity: 'Identité standard',
  enhanced: 'Renforcée',
};

function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 8 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 14,
              borderWidth: 1,
              padding: 12,
              backgroundColor: active ? colors.accentSoft : colors.surface,
              borderColor: active ? colors.accent : colors.border,
            }}>
            <AppText
              className={cn(
                'text-sm font-bold flex-1 pr-3',
                active ? 'text-app-accent' : 'text-app-text',
              )}>
              {option.label}
            </AppText>
            <View
              style={{
                height: 18,
                width: 18,
                borderRadius: 9,
                borderWidth: active ? 5 : 2,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: colors.surface,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function DocUploader({
  label,
  description,
  file,
  onPick,
  icon: Icon = FileText,
}: {
  label: string;
  description: string;
  file?: UploadFile;
  onPick: () => void;
  icon?: any;
}) {
  const colors = useThemeColors();
  const shadows = useShadows();

  return (
    <View style={{ gap: 8 }}>
      <AppText className="text-xs text-app-text-muted">{description}</AppText>
      {file ? (
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.accent,
              backgroundColor: colors.accentSoft,
              padding: 12,
              gap: 10,
            },
            shadows.card,
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <FileCheck size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                {file.name}
              </AppText>
              <AppText className="text-[10px] text-app-accent">Fichier sélectionné et prêt</AppText>
            </View>
          </View>
          <Button variant="ghost" size="sm" onPress={onPick}>
            Changer
          </Button>
        </View>
      ) : (
        <Pressable
          onPress={onPick}
          style={[
            {
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
              paddingVertical: 18,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            },
          ]}>
          <Icon size={22} color={colors.accent} />
          <AppText className="text-xs font-bold text-app-accent">{label}</AppText>
          <AppText className="text-[10px] text-app-text-muted">Formats acceptés : JPG, PNG, PDF</AppText>
        </Pressable>
      )}
    </View>
  );
}

export default function KycScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const verification = useAppSelector((state) => state.account.verification);
  const { t } = useLanguage();

  const [level, setLevel] = useState<Level>('identity');
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState('passport');
  const [residenceType, setResidenceType] = useState('visa');
  const [docs, setDocs] = useState<Partial<Record<DocKey, UploadFile>>>({});
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '+7');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneOtpType, setPhoneOtpType] = useState('phone_change');
  const [email, setEmail] = useState(user?.email || '');
  const [emailCode, setEmailCode] = useState('');
  const [emailOtpType, setEmailOtpType] = useState('email_change');
  const [otpBusy, setOtpBusy] = useState(false);

  const phoneOk = isPhoneVerified(user);
  const emailOk = isEmailVerified(user);

  useEffect(() => {
    if (user?.id) dispatch(loadVerification(user.id));
  }, [dispatch, user?.id]);

  const steps = useMemo(() => {
    const list = [{ key: 'level', label: 'Niveau' }];
    if (!phoneOk) list.push({ key: 'phone', label: 'Téléphone' });
    if (!emailOk) list.push({ key: 'email', label: 'E-mail' });
    list.push({ key: 'identity', label: 'Identité' }, { key: 'selfie', label: 'Selfie' }, { key: 'residence', label: 'Statut' });
    if (level === 'enhanced') list.push({ key: 'address', label: 'Domicile' });
    list.push({ key: 'review', label: 'Confirmation' });
    return list;
  }, [level, phoneOk, emailOk]);

  const current = steps[Math.min(step, steps.length - 1)];
  const ready = Boolean(
    docs.identity && docs.selfie && docs.residence && phoneOk && emailOk && (level !== 'enhanced' || docs.address),
  );
  const canContinue =
    current.key === 'level' ||
    (current.key === 'phone' && phoneOk) ||
    (current.key === 'email' && emailOk) ||
    (current.key === 'identity' && Boolean(docs.identity)) ||
    (current.key === 'selfie' && Boolean(docs.selfie)) ||
    (current.key === 'residence' && Boolean(docs.residence)) ||
    (current.key === 'address' && Boolean(docs.address)) ||
    (current.key === 'review' && ready && consent);

  async function pick(key: DocKey) {
    try {
      const file = await pickImageOrPdf();
      if (file) setDocs((prev) => ({ ...prev, [key]: file }));
    } catch (error: any) {
      Alert.alert('Fichier', error?.message || 'Impossible d’ouvrir le document.');
    }
  }

  async function sendPhone() {
    setOtpBusy(true);
    try {
      const sent = await authService.requestPhoneVerificationOtp(user, phone, { otpChannel: 'sms' });
      if (sent?.otpType) setPhoneOtpType(sent.otpType);
      if (sent?.user) {
        dispatch(setUser(sent.user as AuthUser));
        Alert.alert('Téléphone', 'Ce numéro est déjà confirmé.');
      } else {
        Alert.alert('Code envoyé', 'Saisissez le code reçu par SMS.');
      }
    } catch (error: any) {
      Alert.alert('Téléphone', error?.message || String(error) || 'Envoi impossible.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function confirmPhone() {
    setOtpBusy(true);
    try {
      const confirmed = await authService.confirmPhoneVerification(user, { phone, token: phoneCode, otpType: phoneOtpType });
      dispatch(setUser(confirmed as AuthUser));
      Alert.alert('Téléphone', 'Numéro confirmé.');
    } catch (error: any) {
      Alert.alert('Téléphone', error?.message || String(error) || 'Code refusé.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function sendEmail() {
    setOtpBusy(true);
    try {
      const sent = await authService.requestEmailVerificationOtp(user, email);
      if ('otpType' in sent && sent.otpType) setEmailOtpType(sent.otpType);
      if ('user' in sent && sent.user) {
        dispatch(setUser(sent.user as AuthUser));
        Alert.alert('E-mail', 'Cette adresse est déjà confirmée.');
      } else {
        Alert.alert('Code envoyé', 'Saisissez le code reçu par e-mail.');
      }
    } catch (error: any) {
      Alert.alert('E-mail', error?.message || String(error) || 'Envoi impossible.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function confirmEmail() {
    setOtpBusy(true);
    try {
      const confirmed = await authService.confirmEmailVerification(user, { email, token: emailCode, otpType: emailOtpType });
      dispatch(setUser(confirmed as AuthUser));
      Alert.alert('E-mail', 'Adresse confirmée.');
    } catch (error: any) {
      Alert.alert('E-mail', error?.message || String(error) || 'Code refusé.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function persist(file: UploadFile | undefined, category: string, ids: string[]) {
    if (!file || !user || !supabase) return;
    const path = buildPersonalDocumentPath(user.id, category, file.name);
    const uploaded = await uploadLikeWeb('documents', path, file, 'private');
    const doc = buildPersonalDocument({
      userId: user.id,
      category,
      name: file.name,
      size: file.size || 0,
      type: file.type,
      url: uploaded.url,
      storagePath: uploaded.path,
    });
    await savePersonalDocument(supabase, doc);
    ids.push(doc.id);
  }

  async function submit() {
    if (!user || !supabase || !consent || !ready) return;
    setSending(true);
    try {
      const ids: string[] = [];
      await persist(docs.identity, `identity_${idType || 'passport'}`, ids);
      await persist(docs.selfie, 'selfie', ids);
      await persist(docs.residence, `residence_${residenceType || 'visa'}`, ids);
      if (level === 'enhanced') await persist(docs.address, 'address', ids);
      await submitVerificationRequest(supabase, { userId: user.id, level, documentIds: ids });
      dispatch(loadVerification(user.id));
      Alert.alert('Dossier envoyé', 'Votre dossier a été transmis. Notre équipe le traite sous 24 à 48 h.');
      setConsent(false);
      setStep(0);
    } catch (error: any) {
      Alert.alert('Envoi impossible', error?.message || 'Réessayez dans un instant.');
    } finally {
      setSending(false);
    }
  }

  const requestLevel = (verification.level === 'enhanced' ? 'enhanced' : 'identity') as Level;
  const requestHeading = verification.status ? `Demande ${LEVEL_LABEL[requestLevel] || LEVEL_LABEL[level]}` : null;
  const requestStale = verificationRequestIsStale({ status: verification.status, createdAt: verification.requestedAt });
  const statusTone =
    verification.status === 'rejected'
      ? { label: 'Refusé', bg: isDark ? 'rgba(127,29,29,0.5)' : '#fee2e2', fg: isDark ? '#fca5a5' : '#b91c1c' }
      : verification.status === 'approved' || verification.status === 'verified'
        ? { label: 'Vérifié', bg: isDark ? 'rgba(6,78,59,0.5)' : '#d1fae5', fg: isDark ? '#6ee7b7' : '#047857' }
        : { label: 'En vérification', bg: isDark ? 'rgba(120,53,15,0.5)' : '#fef3c7', fg: isDark ? '#fcd34d' : '#b45309' };

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
              Vérification d’identité
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Niveau KYC et documents officiels
            </AppText>
          </View>
        </View>

        {/* Existing Status Banner */}
        {requestHeading ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText className="text-sm font-black text-app-text">{requestHeading}</AppText>
                <AppText className="text-xs text-app-text-muted mt-0.5">
                  {t('verification.request.docs', { count: verification.documentCount ?? 0 })}
                </AppText>
              </View>
              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: statusTone.bg }}>
                <AppText style={{ fontSize: 11, fontWeight: '900', color: statusTone.fg }}>{statusTone.label}</AppText>
              </View>
            </View>
            {verification.status === 'rejected' ? (
              <View
                style={{
                  marginTop: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  padding: 12,
                  borderColor: isDark ? 'rgba(239,68,68,0.4)' : '#fca5a5',
                  backgroundColor: isDark ? 'rgba(127,29,29,0.35)' : '#fef2f2',
                }}>
                <AppText style={{ fontWeight: '900', color: isDark ? '#fca5a5' : '#991b1b', fontSize: 13 }}>
                  {t('verification.rejected.title')}
                </AppText>
                <AppText style={{ marginTop: 4, fontSize: 12, color: isDark ? '#fecaca' : '#7f1d1d' }}>
                  {verification.reviewNote
                    ? t('verification.rejected.reason', { note: verification.reviewNote })
                    : t('verification.rejected.fallback')}
                </AppText>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* Phone Verification Status Banner */}
        {phoneOk ? (
          <View
            style={[
              {
                borderRadius: 14,
                borderWidth: 1,
                padding: 12,
                borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#a7f3d0',
                backgroundColor: isDark ? 'rgba(6,78,59,0.25)' : '#ecfdf5',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              },
              shadows.card,
            ]}>
            <CheckCircle size={18} color="#059669" />
            <View style={{ flex: 1 }}>
              <AppText className="text-xs font-black" style={{ color: isDark ? '#6ee7b7' : '#065f46' }}>
                Téléphone certifié : {user?.phone || ''}
              </AppText>
              <AppText className="text-[11px]" style={{ color: isDark ? '#a7f3d0' : '#047857' }}>
                Numéro confirmé par SMS pour les transferts
              </AppText>
            </View>
          </View>
        ) : null}

        {/* Stale request notice */}
        {requestStale ? (
          <View
            style={[
              {
                borderRadius: 14,
                borderWidth: 1,
                padding: 12,
                borderColor: isDark ? 'rgba(245,158,11,0.4)' : '#fcd34d',
                backgroundColor: isDark ? 'rgba(120,53,15,0.25)' : '#fffbeb',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              },
              shadows.card,
            ]}>
            <AlertCircle size={18} color="#d97706" />
            <View style={{ flex: 1 }}>
              <AppText className="text-xs font-black" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>
                {t('verification.overdue.title')}
              </AppText>
              <AppText className="text-[11px] mt-0.5" style={{ color: isDark ? '#fde68a' : '#78350f' }}>
                Votre demande prend plus de temps que prévu.{' '}
                <AppText onPress={() => router.push('/support' as never)} style={{ fontWeight: '800', color: colors.accent }}>
                  Contacter le support
                </AppText>
              </AppText>
            </View>
          </View>
        ) : null}

        {/* ── Stepper Indicator ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <AppText className="text-xs font-black uppercase text-app-accent">
              Étape {step + 1} sur {steps.length}
            </AppText>
            <AppText className="text-xs font-bold text-app-text">{current.label}</AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {steps.map((item, index) => {
              const done = step > index;
              const active = step === index;
              return (
                <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    onPress={() => done && setStep(index)}
                    style={{
                      height: 28,
                      minWidth: 28,
                      borderRadius: 14,
                      paddingHorizontal: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: done ? '#059669' : active ? colors.accent : colors.surfaceMuted,
                    }}>
                    <AppText style={{ fontSize: 11, fontWeight: '900', color: done || active ? '#ffffff' : colors.textMuted }}>
                      {done ? '✓' : index + 1}
                    </AppText>
                  </Pressable>
                  {index < steps.length - 1 ? (
                    <View style={{ height: 2, width: 14, backgroundColor: done ? '#059669' : colors.border }} />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </Card>

        {/* ── Step 0: Choisir le niveau ── */}
        {current.key === 'level' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Shield size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Sélectionnez le niveau KYC</AppText>
            </View>
            <AppText className="text-xs leading-5 text-app-text-muted mb-3">
              Le niveau détermine le plafond de vos transferts et la visibilité de votre profil.
            </AppText>

            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => setLevel('identity')}
                style={{
                  borderRadius: 14,
                  borderWidth: 1.5,
                  padding: 14,
                  backgroundColor: level === 'identity' ? colors.accentSoft : colors.surface,
                  borderColor: level === 'identity' ? colors.accent : colors.border,
                  gap: 4,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText className={cn('text-sm font-black', level === 'identity' ? 'text-app-accent' : 'text-app-text')}>
                    Niveau 1 — Identité standard
                  </AppText>
                  <View
                    style={{
                      height: 18,
                      width: 18,
                      borderRadius: 9,
                      borderWidth: level === 'identity' ? 5 : 2,
                      borderColor: level === 'identity' ? colors.accent : colors.border,
                      backgroundColor: colors.surface,
                    }}
                  />
                </View>
                <AppText className="text-xs text-app-text-muted mt-1 leading-5">
                  Pièce d’identité officielle, selfie et statut de séjour en Russie (visa, ВНЖ, РВП, РВПО).
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => setLevel('enhanced')}
                style={{
                  borderRadius: 14,
                  borderWidth: 1.5,
                  padding: 14,
                  backgroundColor: level === 'enhanced' ? colors.accentSoft : colors.surface,
                  borderColor: level === 'enhanced' ? colors.accent : colors.border,
                  gap: 4,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText className={cn('text-sm font-black', level === 'enhanced' ? 'text-app-accent' : 'text-app-text')}>
                    Niveau 2 — Vérification renforcée
                  </AppText>
                  <View
                    style={{
                      height: 18,
                      width: 18,
                      borderRadius: 9,
                      borderWidth: level === 'enhanced' ? 5 : 2,
                      borderColor: level === 'enhanced' ? colors.accent : colors.border,
                      backgroundColor: colors.surface,
                    }}
                  />
                </View>
                <AppText className="text-xs text-app-text-muted mt-1 leading-5">
                  Tout le niveau 1 + un justificatif de domicile récent (enregistrement, bail, quittance). Plafonds de transfert débloqués.
                </AppText>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {/* ── Step: Téléphone ── */}
        {current.key === 'phone' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Phone size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Confirmation du téléphone</AppText>
            </View>
            <AppText className="text-xs text-app-text-muted mb-3">
              Indiquez votre numéro en Russie (+7...). Vous recevrez un code SMS à 6 chiffres.
            </AppText>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+7XXXXXXXXXX"
              placeholderTextColor={colors.textFaint}
              style={{
                fontSize: 16,
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.surface,
                paddingHorizontal: 14,
                marginBottom: 8,
              }}
            />
            <Button variant="secondary" loading={otpBusy} onPress={() => void sendPhone()}>
              Recevoir un code SMS
            </Button>
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText className="text-xs font-bold text-app-text">Code de confirmation</AppText>
              <TextInput
                value={phoneCode}
                onChangeText={setPhoneCode}
                keyboardType="number-pad"
                placeholder="Code à 6 chiffres"
                placeholderTextColor={colors.textFaint}
                style={{
                  fontSize: 16,
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 14,
                  color: colors.text,
                }}
              />
              <Button loading={otpBusy} onPress={() => void confirmPhone()} disabled={!phoneCode.trim()}>
                Valider le numéro
              </Button>
            </View>
          </Card>
        ) : null}

        {/* ── Step: E-mail ── */}
        {current.key === 'email' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Mail size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Confirmation de l'e-mail</AppText>
            </View>
            <AppText className="text-xs text-app-text-muted mb-3">
              Confirmez l’adresse e-mail associée à votre compte MOXT.
            </AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="votre@email.com"
              placeholderTextColor={colors.textFaint}
              style={{
                fontSize: 16,
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.surface,
                paddingHorizontal: 14,
                marginBottom: 8,
              }}
            />
            <Button variant="secondary" loading={otpBusy} onPress={() => void sendEmail()}>
              Recevoir le code par e-mail
            </Button>
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText className="text-xs font-bold text-app-text">Code de confirmation</AppText>
              <TextInput
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="number-pad"
                placeholder="Code à 6 chiffres"
                placeholderTextColor={colors.textFaint}
                style={{
                  fontSize: 16,
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 14,
                  color: colors.text,
                }}
              />
              <Button loading={otpBusy} onPress={() => void confirmEmail()} disabled={!emailCode.trim()}>
                Valider l'e-mail
              </Button>
            </View>
          </Card>
        ) : null}

        {/* ── Step: Identité ── */}
        {current.key === 'identity' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <UserCheck size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Pièce d'identité</AppText>
            </View>
            <AppText className="text-xs text-app-text-muted mb-3">
              La pièce doit être au nom de {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'votre profil'}.
            </AppText>
            <ChoiceList options={ID_TYPES} value={idType} onChange={setIdType} />
            <View style={{ marginTop: 14 }}>
              <DocUploader
                label={docs.identity ? 'Changer la pièce' : 'Importer la pièce d’identité'}
                description="Assurez-vous que les 4 coins et le numéro sont parfaitement lisibles."
                file={docs.identity}
                onPick={() => void pick('identity')}
              />
            </View>
          </Card>
        ) : null}

        {/* ── Step: Selfie ── */}
        {current.key === 'selfie' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Camera size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Selfie de contrôle</AppText>
            </View>
            <DocUploader
              label={docs.selfie ? 'Changer le selfie' : 'Prendre ou importer un selfie'}
              description="Tenez votre pièce d’identité à côté de votre visage, bien éclairé et sans lunettes de soleil."
              file={docs.selfie}
              icon={Camera}
              onPick={() => void pick('selfie')}
            />
          </Card>
        ) : null}

        {/* ── Step: Statut de séjour ── */}
        {current.key === 'residence' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Titre de séjour en Russie</AppText>
            </View>
            <AppText className="text-xs text-app-text-muted mb-3">
              Document officiel valide avec dates de validité visibles.
            </AppText>
            <ChoiceList options={RESIDENCE_TYPES} value={residenceType} onChange={setResidenceType} />
            <View style={{ marginTop: 14 }}>
              <DocUploader
                label={docs.residence ? 'Changer le document de séjour' : 'Importer le justificatif de séjour'}
                description="Photo ou PDF de votre visa, carte de séjour ou titre étudiant."
                file={docs.residence}
                onPick={() => void pick('residence')}
              />
            </View>
          </Card>
        ) : null}

        {/* ── Step: Justificatif de domicile (renforcé) ── */}
        {current.key === 'address' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Home size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Justificatif de domicile</AppText>
            </View>
            <DocUploader
              label={docs.address ? 'Changer le justificatif' : 'Importer un justificatif de domicile'}
              description="Enregistrement officiel (регистрация), contrat de bail ou facture de services de moins de 3 mois."
              file={docs.address}
              icon={Home}
              onPick={() => void pick('address')}
            />
          </Card>
        ) : null}

        {/* ── Step: Récapitulatif et validation ── */}
        {current.key === 'review' ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileCheck size={17} color={colors.accent} strokeWidth={2.2} />
              <AppText className="text-sm font-black text-app-text">Récapitulatif de votre dossier</AppText>
            </View>

            <View style={{ gap: 8, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">Niveau demandé :</AppText>
                <AppText className="text-xs font-bold text-app-accent">{LEVEL_LABEL[level]}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">Téléphone :</AppText>
                <AppText className="text-xs font-bold" style={{ color: phoneOk ? '#059669' : colors.warning }}>
                  {phoneOk ? 'Certifié ✓' : 'À confirmer'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">E-mail :</AppText>
                <AppText className="text-xs font-bold" style={{ color: emailOk ? '#059669' : colors.warning }}>
                  {emailOk ? 'Certifié ✓' : 'À confirmer'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">Pièce d'identité :</AppText>
                <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                  {docs.identity?.name || '—'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">Selfie :</AppText>
                <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                  {docs.selfie?.name || '—'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText className="text-xs text-app-text-muted">Séjour en Russie :</AppText>
                <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                  {docs.residence?.name || '—'}
                </AppText>
              </View>
              {level === 'enhanced' ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText className="text-xs text-app-text-muted">Domicile :</AppText>
                  <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                    {docs.address?.name || '—'}
                  </AppText>
                </View>
              ) : null}
            </View>

            <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Switch value={consent} onValueChange={setConsent} trackColor={{ true: colors.accent }} />
              <AppText className="flex-1 text-xs leading-4 text-app-text">
                J’atteste sur l’honneur l’authenticité des pièces et consens à leur traitement pour la vérification de mon compte MOXT.
              </AppText>
            </View>
          </Card>
        ) : null}

        {/* ── Wizard Navigation Buttons ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {step > 0 ? (
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => setStep((value) => Math.max(0, value - 1))}>
              Précédent
            </Button>
          ) : null}
          {current.key === 'review' ? (
            <Button
              style={{ flex: 1 }}
              loading={sending}
              disabled={!canContinue}
              onPress={() => void submit()}>
              Transmettre le dossier
            </Button>
          ) : (
            <Button
              style={{ flex: 1 }}
              disabled={!canContinue}
              onPress={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              Continuer
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
