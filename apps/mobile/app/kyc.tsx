import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { isEmailVerified, isPhoneVerified, verificationRequestIsStale } from '@moxt/shared/auth/userSecurity.js';
import { router } from 'expo-router';
import {
  buildPersonalDocument,
  buildPersonalDocumentPath,
  savePersonalDocument,
  submitVerificationRequest,
} from '@moxt/shared/services/accountWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';
import { pickImageOrPdf, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { loadVerification } from '@/store/account';
import { authService, setUser } from '@/store/auth';
import type { AuthUser } from '@/store/types';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';

type Level = 'identity' | 'enhanced';
type DocKey = 'identity' | 'selfie' | 'residence' | 'address';

const ID_TYPES = [
  { value: 'passport', label: 'Passeport' },
  { value: 'residence', label: 'Carte de séjour russe (ВНЖ / РВП)' },
  { value: 'migration', label: 'Carte de migration / patente' },
  { value: 'consular', label: 'Carte consulaire' },
];

const RESIDENCE_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'vnj', label: 'ВНЖ (VNJ)' },
  { value: 'rvp', label: 'РВП (RVP)' },
  { value: 'rvpo', label: 'РВПО (RVPO)' },
];

const LEVEL_LABEL: Record<Level, string> = {
  identity: 'Identité',
  enhanced: 'Renforcée',
};

function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              'rounded-2xl border px-3 py-3',
              active ? 'border-brand-700 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30' : 'border-app-border',
            )}>
            <Text className={cn('text-sm font-bold', active ? 'text-brand-700 dark:text-brand-300' : 'text-app-text')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OtpField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useThemeColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="number-pad"
      placeholder="Code reçu"
      placeholderTextColor={colors.textFaint}
      style={{
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        color: colors.text,
      }}
    />
  );
}

/**
 * Même parcours que VerificationPage : téléphone, e-mail, pièce (PDF ou photo),
 * selfie, séjour, domicile si renforcée, puis confirmation.
 */
export default function KycScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
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
      }
      else Alert.alert('Code envoyé', 'Saisissez le code reçu par SMS.');
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
      }
      else Alert.alert('Code envoyé', 'Saisissez le code reçu par e-mail.');
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
  const isDark = colors.background === '#0c0c0e';
  const requestStale = verificationRequestIsStale({ status: verification.status, createdAt: verification.requestedAt });
  const statusTone =
    verification.status === 'rejected'
      ? { label: 'Refusé', bg: isDark ? 'rgba(127,29,29,0.5)' : '#fee2e2', fg: isDark ? '#fca5a5' : '#b91c1c' }
      : verification.status === 'approved' || verification.status === 'verified'
        ? { label: 'Vérifié', bg: isDark ? 'rgba(6,78,59,0.5)' : '#d1fae5', fg: isDark ? '#6ee7b7' : '#047857' }
        : { label: 'En vérification', bg: isDark ? 'rgba(120,53,15,0.5)' : '#fef3c7', fg: isDark ? '#fcd34d' : '#b45309' };

  return (
    <AppChrome pathname="/verification">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerClassName="p-5 gap-4 pb-32">
        <PageHeader
          eyebrow="Compte"
          title="Vérification"
          description="Identité MOXT (entreprise et transferts) ou renforcée (plafonds élevés)."
          className="px-0"
        />

        {requestStale ? (
          <View style={{ borderRadius: 16, borderWidth: 1, padding: 14, borderColor: isDark ? 'rgba(245,158,11,0.4)' : '#fcd34d', backgroundColor: isDark ? 'rgba(120,53,15,0.35)' : '#fffbeb' }}>
            <Text style={{ fontWeight: '900', color: isDark ? '#fcd34d' : '#92400e' }}>{t('verification.overdue.title')}</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: isDark ? '#fde68a' : '#78350f' }}>
              {t('verification.overdue.before')}{' '}
              <Text onPress={() => router.push('/support' as never)} style={{ fontWeight: '800', color: colors.accent }}>
                {t('verification.overdue.link')}
              </Text>
              .
            </Text>
          </View>
        ) : null}

        {requestHeading ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-base font-black text-app-text">{requestHeading}</Text>
                <Text className="mt-1 text-sm text-app-text-muted">
                  {t('verification.request.docs', { count: verification.documentCount ?? 0 })}
                </Text>
              </View>
              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: statusTone.bg }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: statusTone.fg }}>{statusTone.label}</Text>
              </View>
            </View>
            {verification.status === 'rejected' ? (
              <View style={{ marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 12, borderColor: isDark ? 'rgba(239,68,68,0.4)' : '#fca5a5', backgroundColor: isDark ? 'rgba(127,29,29,0.35)' : '#fef2f2' }}>
                <Text style={{ fontWeight: '900', color: isDark ? '#fca5a5' : '#991b1b' }}>{t('verification.rejected.title')}</Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: isDark ? '#fecaca' : '#7f1d1d' }}>
                  {verification.reviewNote
                    ? t('verification.rejected.reason', { note: verification.reviewNote })
                    : t('verification.rejected.fallback')}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 13, color: isDark ? '#fecaca' : '#7f1d1d' }}>{t('verification.rejected.hint')}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <Text className="text-xs font-black uppercase text-brand-700">
            Étape {step + 1}/{steps.length} · {current.label}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="mt-3 flex-row items-center gap-2">
            {steps.map((item, index) => {
              const done = step > index;
              const active = step === index;
              return (
                <View key={item.key} className="flex-row items-center gap-2">
                  <View
                    className={cn(
                      'h-8 w-8 items-center justify-center rounded-full',
                      done ? 'bg-emerald-500' : active ? 'bg-brand-700' : 'bg-app-surface-muted',
                    )}>
                    <Text className={cn('text-xs font-black', done || active ? 'text-white' : 'text-app-text-muted')}>
                      {done ? '✓' : index + 1}
                    </Text>
                  </View>
                  {index < steps.length - 1 ? <View className="h-px w-4 bg-app-border" /> : null}
                </View>
              );
            })}
          </ScrollView>
        </Card>

        {current.key === 'level' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-3">Choisissez votre niveau</Text>
            <ChoiceRow
              value={level}
              onChange={(value) => setLevel(value as Level)}
              options={[
                { value: 'identity', label: 'Identité — pièce, selfie et visa / ВНЖ / РВП / РВПО' },
                { value: 'enhanced', label: 'Renforcée — identité et justificatif de domicile' },
              ]}
            />
          </Card>
        ) : null}

        {current.key === 'phone' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">Téléphone</Text>
            <Text className="text-sm text-app-text-muted mb-3">Numéro russe au format +7, confirmé par code.</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, marginBottom: 8 }}
            />
            <Button variant="secondary" loading={otpBusy} onPress={() => void sendPhone()}>
              Envoyer le code
            </Button>
            <View className="mt-3">
              <OtpField value={phoneCode} onChange={setPhoneCode} />
            </View>
            <Button className="mt-3" loading={otpBusy} onPress={() => void confirmPhone()}>
              Confirmer le téléphone
            </Button>
          </Card>
        ) : null}

        {current.key === 'email' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">E-mail</Text>
            <Text className="text-sm text-app-text-muted mb-3">Confirmez l’adresse du compte avec le code reçu.</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, marginBottom: 8 }}
            />
            <Button variant="secondary" loading={otpBusy} onPress={() => void sendEmail()}>
              Envoyer le code
            </Button>
            <View className="mt-3">
              <OtpField value={emailCode} onChange={setEmailCode} />
            </View>
            <Button className="mt-3" loading={otpBusy} onPress={() => void confirmEmail()}>
              Confirmer l’e-mail
            </Button>
          </Card>
        ) : null}

        {current.key === 'identity' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">Demande d’identité</Text>
            <Text className="text-sm text-app-text-muted mb-3">
              Pièce au nom de {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'votre compte'}. Photo ou PDF.
            </Text>
            <ChoiceRow options={ID_TYPES} value={idType} onChange={setIdType} />
            <Button className="mt-3" variant="secondary" onPress={() => void pick('identity')}>
              {docs.identity ? docs.identity.name : 'Photo ou PDF de la pièce'}
            </Button>
          </Card>
        ) : null}

        {current.key === 'selfie' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">Selfie de vérification</Text>
            <Text className="text-sm text-app-text-muted mb-3">Une photo de vous tenant votre pièce.</Text>
            <Button variant="secondary" onPress={() => void pick('selfie')}>
              {docs.selfie ? docs.selfie.name : 'Ajouter un selfie'}
            </Button>
          </Card>
        ) : null}

        {current.key === 'residence' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">Visa, ВНЖ, РВП ou РВПО</Text>
            <Text className="text-sm text-app-text-muted mb-3">Document de séjour en Russie, dates visibles. Photo ou PDF.</Text>
            <ChoiceRow options={RESIDENCE_TYPES} value={residenceType} onChange={setResidenceType} />
            <Button className="mt-3" variant="secondary" onPress={() => void pick('residence')}>
              {docs.residence ? docs.residence.name : 'Photo ou PDF du document'}
            </Button>
          </Card>
        ) : null}

        {current.key === 'address' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-1">Justificatif de domicile</Text>
            <Text className="text-sm text-app-text-muted mb-3">Enregistrement, bail ou facture de moins de 3 mois. Photo ou PDF.</Text>
            <Button variant="secondary" onPress={() => void pick('address')}>
              {docs.address ? docs.address.name : 'Ajouter un justificatif'}
            </Button>
          </Card>
        ) : null}

        {current.key === 'review' ? (
          <Card>
            <Text className="text-base font-black text-app-text mb-2">Confirmation</Text>
            <Text className="text-sm text-app-text-muted">Niveau : {LEVEL_LABEL[level]}</Text>
            <Text className="text-sm text-app-text-muted">Téléphone : {phoneOk ? 'confirmé' : 'à confirmer'}</Text>
            <Text className="text-sm text-app-text-muted">E-mail : {emailOk ? 'confirmé' : 'à confirmer'}</Text>
            <Text className="text-sm text-app-text-muted">Pièce : {docs.identity?.name || '—'}</Text>
            <Text className="text-sm text-app-text-muted">Selfie : {docs.selfie?.name || '—'}</Text>
            <Text className="text-sm text-app-text-muted">Séjour : {docs.residence?.name || '—'}</Text>
            {level === 'enhanced' ? <Text className="text-sm text-app-text-muted">Domicile : {docs.address?.name || '—'}</Text> : null}
            <View className="mt-4 flex-row items-center gap-3">
              <Switch value={consent} onValueChange={setConsent} trackColor={{ true: '#0b8975' }} />
              <Text className="flex-1 text-sm text-app-text">J’accepte le traitement de ces pièces pour la vérification MOXT.</Text>
            </View>
          </Card>
        ) : null}

        <View className="flex-row gap-2">
          {step > 0 ? (
            <Button variant="secondary" className="flex-1" onPress={() => setStep((value) => Math.max(0, value - 1))}>
              Retour
            </Button>
          ) : null}
          {current.key === 'review' ? (
            <Button className="flex-1" loading={sending} disabled={!canContinue} onPress={() => void submit()}>
              Envoyer le dossier
            </Button>
          ) : (
            <Button className="flex-1" disabled={!canContinue} onPress={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              Continuer
            </Button>
          )}
        </View>
      </ScrollView>
    </AppChrome>
  );
}
