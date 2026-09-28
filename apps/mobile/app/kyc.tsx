import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import {
  buildPersonalDocument,
  buildPersonalDocumentPath,
  savePersonalDocument,
  submitVerificationRequest,
} from '@moxt/shared/services/accountWrites.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { pickLibraryFile, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { loadVerification } from '@/store/account';
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

/**
 * Même parcours que VerificationPage : pièces dans le bucket privé `documents`,
 * lignes `personal_documents`, puis `verification_requests`.
 */
export default function KycScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const verification = useAppSelector((state) => state.account.verification);

  const [level, setLevel] = useState<Level>('identity');
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState('passport');
  const [residenceType, setResidenceType] = useState('visa');
  const [docs, setDocs] = useState<Partial<Record<DocKey, UploadFile>>>({});
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.id) dispatch(loadVerification(user.id));
  }, [dispatch, user?.id]);

  const steps = useMemo(() => {
    const list = [
      { key: 'level', label: 'Niveau' },
      { key: 'identity', label: 'Identité' },
      { key: 'selfie', label: 'Selfie' },
      { key: 'residence', label: 'Statut' },
    ];
    if (level === 'enhanced') list.push({ key: 'address', label: 'Domicile' });
    list.push({ key: 'review', label: 'Confirmation' });
    return list;
  }, [level]);

  const current = steps[Math.min(step, steps.length - 1)];
  const ready = Boolean(docs.identity && docs.selfie && docs.residence && (level !== 'enhanced' || docs.address));
  const canContinue =
    current.key === 'level' ||
    (current.key === 'identity' && Boolean(docs.identity)) ||
    (current.key === 'selfie' && Boolean(docs.selfie)) ||
    (current.key === 'residence' && Boolean(docs.residence)) ||
    (current.key === 'address' && Boolean(docs.address)) ||
    (current.key === 'review' && ready && consent);

  async function pick(key: DocKey) {
    try {
      const file = await pickLibraryFile('images');
      if (file) setDocs((prev) => ({ ...prev, [key]: file }));
    } catch (error: any) {
      Alert.alert('Fichier', error?.message || 'Impossible d’ouvrir la galerie.');
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

  const statusLabel =
    verification.verified || user?.verified
      ? 'Identité vérifiée'
      : verification.status === 'rejected'
        ? 'Dossier refusé'
        : verification.status
          ? 'En cours de vérification'
          : 'Non vérifié';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerClassName="p-5 gap-4 pb-12">
      <BackHeader inline title="Vérification" />
      <PageHeader
        eyebrow="Compte"
        title="Vérification"
        description="Identité MOXT (entreprise et transferts) ou renforcée (plafonds élevés)."
        className="px-0"
      />

      <Card>
        <Text className="text-sm font-black text-app-text">{statusLabel}</Text>
        {verification.requestedAt ? (
          <Text className="mt-1 text-xs text-app-text-muted">
            Demande du {new Date(verification.requestedAt).toLocaleDateString('fr-FR')}
          </Text>
        ) : null}
      </Card>

      <Text className="text-xs font-black uppercase text-app-text-muted">
        Étape {step + 1}/{steps.length} · {current.label}
      </Text>

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

      {current.key === 'identity' ? (
        <Card>
          <Text className="text-base font-black text-app-text mb-1">Pièce d’identité</Text>
          <Text className="text-sm text-app-text-muted mb-3">
            Au nom de {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'votre compte'}.
          </Text>
          <ChoiceRow options={ID_TYPES} value={idType} onChange={setIdType} />
          <Button className="mt-3" variant="secondary" onPress={() => void pick('identity')}>
            {docs.identity ? docs.identity.name : 'Photo de la pièce d’identité'}
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
          <Text className="text-sm text-app-text-muted mb-3">Document de séjour en Russie, dates visibles.</Text>
          <ChoiceRow options={RESIDENCE_TYPES} value={residenceType} onChange={setResidenceType} />
          <Button className="mt-3" variant="secondary" onPress={() => void pick('residence')}>
            {docs.residence ? docs.residence.name : 'Photo du document'}
          </Button>
        </Card>
      ) : null}

      {current.key === 'address' ? (
        <Card>
          <Text className="text-base font-black text-app-text mb-1">Justificatif de domicile</Text>
          <Text className="text-sm text-app-text-muted mb-3">Enregistrement, bail ou facture de moins de 3 mois.</Text>
          <Button variant="secondary" onPress={() => void pick('address')}>
            {docs.address ? docs.address.name : 'Ajouter un justificatif'}
          </Button>
        </Card>
      ) : null}

      {current.key === 'review' ? (
        <Card>
          <Text className="text-base font-black text-app-text mb-2">Confirmation</Text>
          <Text className="text-sm text-app-text-muted">Niveau : {level === 'enhanced' ? 'Renforcée' : 'Identité'}</Text>
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
  );
}
