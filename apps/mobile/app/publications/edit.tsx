import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';
import { PUBLICATION_TABLE, updatePublicationFields } from '@moxt/shared/services/publicationMutations.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Field, StepBar } from '@/components/publish/PublishForm';
import { CitySelector, CurrencyChips, UploadProgressBar } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import type { PublicationType } from '@/components/profile/PublicationCard';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type FieldDef = { key: string; label: string; multiline?: boolean; numeric?: boolean };

const WIZARDS: Record<PublicationType, { steps: string[]; groups: FieldDef[][]; photos: boolean; proof: boolean }> = {
  listing: {
    steps: ['Infos', 'Photos', 'Lieu', 'Confirmation'],
    groups: [
      [
        { key: 'title', label: 'Titre' },
        { key: 'price', label: 'Prix', numeric: true },
        { key: 'currency', label: 'Devise' },
        { key: 'description', label: 'Description', multiline: true },
      ],
      [],
      [{ key: 'city', label: 'Ville' }],
      [],
    ],
    photos: true,
    proof: false,
  },
  parcel: {
    steps: ['Trajet', 'Chargement', 'Preuve', 'Confirmation'],
    groups: [
      [
        { key: 'origin', label: 'Départ' },
        { key: 'destination', label: 'Arrivée' },
        { key: 'departureDate', label: 'Date de départ' },
      ],
      [
        { key: 'capacityKg', label: 'Capacité (kg)', numeric: true },
        { key: 'pricePerKg', label: 'Prix / kg', numeric: true },
        { key: 'conditions', label: 'Conditions', multiline: true },
      ],
      [],
      [],
    ],
    photos: false,
    proof: true,
  },
  job: {
    steps: ['Offre', 'Détails', 'Lieu', 'Photos'],
    groups: [
      [
        { key: 'title', label: 'Titre' },
        { key: 'sector', label: 'Secteur' },
      ],
      [
        { key: 'description', label: 'Description', multiline: true },
        { key: 'salary', label: 'Salaire' },
      ],
      [{ key: 'location', label: 'Lieu' }],
      [],
    ],
    photos: true,
    proof: false,
  },
  event: {
    steps: ['Bases', 'Programme', 'Lieu', 'Confirmation'],
    groups: [
      [
        { key: 'title', label: 'Titre' },
        { key: 'category', label: 'Catégorie' },
        { key: 'startAt', label: 'Début' },
      ],
      [{ key: 'description', label: 'Description', multiline: true }],
      [
        { key: 'city', label: 'Ville' },
        { key: 'venue', label: 'Lieu' },
        { key: 'format', label: 'Format' },
      ],
      [],
    ],
    photos: true,
    proof: false,
  },
  video: {
    steps: ['Titre', 'Légende'],
    groups: [[{ key: 'title', label: 'Titre' }], [{ key: 'caption', label: 'Légende', multiline: true }]],
    photos: false,
    proof: false,
  },
  post: {
    steps: ['Texte', 'Photos'],
    groups: [[{ key: 'message', label: 'Texte', multiline: true }], []],
    photos: true,
    proof: false,
  },
  other: {
    steps: ['Paire', 'Montant', 'Conditions'],
    groups: [
      [
        { key: 'fromCurrency', label: 'Devise source' },
        { key: 'toCurrency', label: 'Devise reçue' },
      ],
      [
        { key: 'amount', label: 'Montant', numeric: true },
        { key: 'rate', label: 'Taux', numeric: true },
      ],
      [{ key: 'comment', label: 'Commentaire', multiline: true }],
    ],
    photos: false,
    proof: false,
  },
};

const NUMERIC = new Set(['price', 'amount', 'rate', 'pricePerKg', 'capacityKg', 'capacity']);

function asText(value: unknown) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n');
  return String(value);
}

function asImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/** Modifier une publication, mêmes étapes que la publication web. */
export default function EditPublicationScreen() {
  const { type, id } = useLocalSearchParams<{ type: PublicationType; id: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const { colors, isDark } = useTheme();
  const wizard = WIZARDS[type] || WIZARDS.listing;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [proof, setProof] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const titles: Record<string, string> = {
    listing: "Modifier l'annonce",
    parcel: 'Modifier le voyage',
    job: "Modifier l'offre d'emploi",
    event: "Modifier l'événement",
    video: 'Modifier la vidéo',
    post: 'Modifier la publication',
    other: "Modifier l'offre P2P",
  };

  useEffect(() => {
    const table = PUBLICATION_TABLE[type];
    if (!supabase || !table || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then((result) => {
        if (cancelled) return;
        const { data, error } = result;
        if (error || !data) {
          showNotice('Modifier', error?.message || 'Publication introuvable.');
          return;
        }
        const raw = data as Record<string, unknown>;
        const row = fromRow(raw) as Record<string, unknown>;
        const stored = raw.payload && typeof raw.payload === 'object' ? { ...(raw.payload as Record<string, unknown>) } : {};
        const next: Record<string, string> = {};
        for (const group of wizard.groups) {
          for (const field of group) next[field.key] = asText(row[field.key] ?? stored[field.key]);
        }
        setValues(next);
        setImages(asImages(row.images ?? stored.images));
        setProof(asText(row.travelProofUrl ?? stored.travelProofUrl ?? stored.proofPath));
        setPayload(stored);
      })
      .then(
        () => {
          if (!cancelled) setLoading(false);
        },
        () => {
          if (!cancelled) setLoading(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [type, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addPhoto() {
    if (!user) return;
    try {
      const file = await pickLibraryFile('images');
      if (!file) return;
      setProgress(0.4);
      const uploaded = await uploadLikeWeb(type === 'parcel' ? 'parcels' : 'listings', `${user.id}/edits/${Date.now()}.jpg`, file, 'public');
      if (uploaded.url) setImages((prev) => [...prev, uploaded.url as string].slice(0, 5));
      setProgress(1);
    } catch (error) {
      showNotice('Photo', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  async function addProof() {
    if (!user || !id) return;
    try {
      const file = await pickLibraryFile('images');
      if (!file) return;
      const uploaded = await uploadLikeWeb('parcels', `${user.id}/${id}/proof.jpg`, file, 'private');
      setProof(uploaded.path);
    } catch (error) {
      showNotice('Preuve', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  async function save() {
    if (!supabase || !type || !id) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = { payload: { ...payload } };
      for (const group of wizard.groups) {
        for (const field of group) {
          const raw = values[field.key] ?? '';
          patch[field.key] = NUMERIC.has(field.key) ? Number(raw) : raw;
        }
      }
      if (wizard.photos && type !== 'job') {
        patch.images = images;
        patch.imageUrl = images[0] || null;
      }
      if (wizard.photos && type === 'job') {
        (patch.payload as Record<string, unknown>).images = images;
      }
      if (wizard.proof) {
        patch.travelProofUrl = proof || null;
        patch.proofStatus = proof ? 'pending_review' : 'missing';
      }
      await updatePublicationFields(supabase, type, id, patch);
      router.back();
    } catch (error) {
      showNotice('Modifier', error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  const last = wizard.steps.length - 1;
  const fields = wizard.groups[step] || [];

  return (
    <AppChrome pathname="/publications/edit">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">{titles[type] || 'Modifier'}</AppText>
        <StepBar steps={wizard.steps} index={step} />
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)}>
            <AppText className="text-sm font-bold text-app-accent">Retour</AppText>
          </Pressable>
        ) : null}
        {fields.map((field) =>
          field.key === 'city' || field.key === 'location' ? (
            <CitySelector
              key={field.key}
              label={field.label}
              value={values[field.key] || ''}
              onChange={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
            />
          ) : field.key === 'currency' || field.key === 'fromCurrency' || field.key === 'toCurrency' ? (
            <CurrencyChips
              key={field.key}
              label={field.label}
              value={values[field.key] || 'RUB'}
              onChange={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
            />
          ) : (
            <Field
              key={field.key}
              label={field.label}
              value={values[field.key] || ''}
              multiline={field.multiline}
              keyboardType={field.numeric ? 'numeric' : 'default'}
              onChangeText={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
            />
          ),
        )}
        {wizard.photos && step === (type === 'post' ? 1 : type === 'job' || type === 'event' ? 3 : 1) ? (
          <>
            <Pressable onPress={() => void addPhoto()}>
              <AppText className="text-sm font-bold text-app-accent">Ajouter une photo ({images.length}/5)</AppText>
            </Pressable>
            <UploadProgressBar progress={progress} />
          </>
        ) : null}
        {wizard.proof && step === 2 ? (
          <Pressable onPress={() => void addProof()}>
            <AppText className="text-sm font-bold text-app-accent">{proof ? 'Preuve de voyage envoyée' : 'Ajouter la preuve de voyage'}</AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={saving || loading}
          onPress={() => (step < last ? setStep(step + 1) : void save())}
          style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }}>
          <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff' }}>
            {step < last ? 'Continuer' : saving ? 'Enregistrement…' : 'Enregistrer'}
          </AppText>
        </Pressable>
        <View />
      </ScrollView>
    </AppChrome>
  );
}
