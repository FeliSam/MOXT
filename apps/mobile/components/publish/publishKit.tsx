import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import {
  canPublishContent,
  canPublishP2POffer,
  canPublishVoyage,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js';
import { createPost } from '@moxt/shared/services/contentWrites.js';
import { transferCurrenciesForCountry } from '@moxt/shared/domain/transferConfig.js';

import { airportsForCountry } from '@/components/publish/airports';

export type Airport = { code: string; name: string; city: string };
import { RUSSIAN_CITIES } from '@/components/publish/russianCities';
import { DsAlert } from '@/components/ds/Alert';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { pickLibraryFile, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import type { AuthUser } from '@/store/types';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

export type PublishGateKind = 'publish' | 'voyage' | 'p2p';

const CHECK: Record<PublishGateKind, (user: AuthUser | null) => boolean> = {
  publish: canPublishContent,
  voyage: canPublishVoyage,
  p2p: canPublishP2POffer,
};

export function usePublishGate(kind: PublishGateKind) {
  const user = useAppSelector((state) => state.auth.user);
  const allowed = CHECK[kind](user);
  return { user, allowed, message: allowed ? '' : securityGateMessage(kind, user) };
}

/** Bloque la publication tant que téléphone, e-mail ou identité manquent. */
export function SecurityGate({ kind, pathname, children }: { kind: PublishGateKind; pathname: string; children: ReactNode }) {
  const { allowed, message } = usePublishGate(kind);
  const { colors } = useTheme();
  if (allowed) return children;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
      <AppText className="text-2xl font-black text-app-text">Publication protégée</AppText>
      <DsAlert variant="warning" title="Sécurité du compte">
        {message}
      </DsAlert>
      <Button onPress={() => router.push('/security' as never)}>Ouvrir la sécurité</Button>
      <Button variant="secondary" onPress={() => router.back()}>
        Retour
      </Button>
      <AppText className="text-xs text-app-text-faint">{pathname}</AppText>
    </View>
  );
}

export function CitySelector({ label = 'Ville', value, onChange }: { label?: string; value: string; onChange: (city: string) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const cities = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fr');
    if (q.length < 1) return [...RUSSIAN_CITIES];
    return RUSSIAN_CITIES.filter((city) => city.toLocaleLowerCase('fr').includes(q));
  }, [query]);
  return (
    <View style={{ gap: 6 }}>
      <AppText className="text-xs font-bold text-app-text-muted">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', paddingHorizontal: 12 }}>
        <AppText className="text-base text-app-text">{value || 'Choisir une ville...'}</AppText>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-lg font-black text-app-text">Ville</AppText>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher"
            placeholderTextColor={colors.textFaint}
            style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, color: colors.text }}
          />
          <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 32 }}>
            {cities.map((city) => (
              <Pressable
                key={city}
                onPress={() => {
                  onChange(city);
                  setOpen(false);
                  setQuery('');
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}>
                <AppText className={city === value ? 'font-black text-app-accent' : 'text-app-text'}>{city}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export function AirportSelector({
  label,
  countryCode,
  value,
  onChange,
}: {
  label: string;
  countryCode: string;
  value: string;
  onChange: (airport: Airport) => void;
}) {
  const { colors, isDark } = useTheme();
  const airports = airportsForCountry(countryCode) as Airport[];
  if (!airports.length) {
    return <DsAlert variant="warning">Aucun aéroport référencé pour ce pays.</DsAlert>;
  }
  return (
    <View style={{ gap: 6 }}>
      <AppText className="text-xs font-bold text-app-text-muted">{label}</AppText>
      {airports.map((airport) => {
        const on = value === airport.code;
        return (
          <Pressable
            key={airport.code}
            onPress={() => onChange(airport)}
            style={{
              minHeight: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: on ? colors.accent : colors.border,
              backgroundColor: on ? colors.accentSoft : colors.surface,
              paddingHorizontal: 12,
              justifyContent: 'center',
            }}>
            <AppText className="text-sm font-bold" style={{ color: on ? colors.accent : isDark ? colors.text : colors.text }}>
              {airport.city} · {airport.name} ({airport.code})
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CurrencyChips({
  label,
  value,
  onChange,
  countryCode,
}: {
  label: string;
  value: string;
  onChange: (currency: string) => void;
  countryCode?: string;
}) {
  const { colors, isDark } = useTheme();
  const currencies = countryCode ? transferCurrenciesForCountry(countryCode) : ['RUB', 'XOF', 'USD', 'EUR'];
  return (
    <View style={{ gap: 6 }}>
      <AppText className="text-xs font-bold text-app-text-muted">{label}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {currencies.map((currency: string) => {
          const on = value === currency;
          return (
            <Pressable
              key={currency}
              onPress={() => onChange(currency)}
              style={{
                minHeight: 36,
                borderRadius: 999,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.accent : colors.surfaceMuted,
              }}>
              <AppText className="text-xs font-black" style={{ color: on ? (isDark ? '#020617' : '#fff') : colors.text }}>
                {currency}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type PosterPhoto = { uri: string; name: string; url?: string };

export function UploadProgressBar({ progress }: { progress: number | null }) {
  const { colors } = useTheme();
  if (progress == null) return null;
  return (
    <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: colors.accent }} />
    </View>
  );
}

export function PosterUploader({
  photos,
  onChange,
  max = 5,
  label = 'Images',
  progress = null,
}: {
  photos: PosterPhoto[];
  onChange: (photos: PosterPhoto[]) => void;
  max?: number;
  label?: string;
  progress?: number | null;
}) {
  const { colors } = useTheme();
  async function add() {
    const file = await pickLibraryFile('images');
    if (!file || photos.length >= max) return;
    onChange([...photos, { uri: file.uri, name: file.name }]);
  }
  return (
    <View style={{ gap: 8 }}>
      <AppText className="text-sm font-semibold text-app-text">
        {label} ({photos.length}/{max})
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} style={{ width: 88, height: 88, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
            <Image source={{ uri: photo.uri }} style={{ width: 88, height: 88 }} contentFit="cover" />
            <Pressable
              onPress={() => onChange(photos.filter((_, item) => item !== index))}
              style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 99, paddingHorizontal: 6 }}>
              <AppText className="text-xs font-black text-white">×</AppText>
            </Pressable>
          </View>
        ))}
        {photos.length < max ? (
          <Pressable
            onPress={() => void add()}
            style={{ width: 88, height: 88, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <AppText className="text-2xl text-app-text-muted">+</AppText>
          </Pressable>
        ) : null}
      </View>
      <UploadProgressBar progress={progress} />
    </View>
  );
}

const FORMULAS = [
  { key: 'standard', title: 'Standard', description: 'Publication classique dans le fil' },
  { key: 'featured_24h', title: 'Vedette 24 h', description: 'Publication + visibilité prioritaire 24 h' },
  { key: 'featured_7d', title: 'Vedette 7 j', description: 'Publication + visibilité prioritaire 7 jours' },
] as const;

/** Formules web : les options Stars restent verrouillées (module coupé). */
export function PublishFormulaSheet({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <AppText className="text-xs font-bold text-app-text-muted">Formule de publication</AppText>
      {FORMULAS.map((formula) => {
        const locked = formula.key !== 'standard';
        const selected = value === formula.key;
        return (
          <Pressable
            key={formula.key}
            disabled={locked}
            onPress={() => onChange(formula.key)}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.border,
              padding: 12,
              opacity: locked ? 0.65 : 1,
              backgroundColor: colors.surface,
            }}>
            <AppText className="text-sm font-black text-app-text">
              {formula.title}
              {locked ? ' · bientôt' : ''}
            </AppText>
            <AppText className="text-xs text-app-text-muted">{formula.description}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BusinessPublishNotice({
  business,
  contentType,
}: {
  business?: { status?: string; services?: string[] } | null;
  contentType: string;
}) {
  if (!business) return null;
  const ready = ['verified', 'approved', 'active'].includes(String(business.status || ''));
  if (!ready) {
    return (
      <DsAlert variant="warning" title="Entreprise non vérifiée">
        Vous pouvez continuer en tant que particulier.
      </DsAlert>
    );
  }
  const services = business.services || [];
  const needed =
    contentType === 'listing' || contentType === 'video'
      ? 'Marketplace'
      : contentType === 'parcel'
        ? 'Colis'
        : contentType === 'job'
          ? 'Jobs'
          : contentType === 'event'
            ? 'Events'
            : contentType === 'p2p'
              ? 'P2P'
              : '';
  if (needed && !services.includes(needed)) {
    return (
      <DsAlert variant="info" title="Service non déclaré">
        Votre entreprise n&apos;est pas déclarée pour ce service — publication personnelle uniquement.
      </DsAlert>
    );
  }
  return null;
}

export async function uploadPhotos(userId: string, bucket: string, photos: PosterPhoto[], onProgress?: (value: number) => void) {
  const urls: string[] = [];
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    onProgress?.((index + 0.2) / photos.length);
    if (photo.url) {
      urls.push(photo.url);
      continue;
    }
    const file: UploadFile = { uri: photo.uri, name: photo.name, type: 'image/jpeg' };
    const uploaded = await uploadLikeWeb(bucket, `${userId}/${Date.now()}-${index}.jpg`, file, 'public');
    if (uploaded.url) urls.push(uploaded.url);
    onProgress?.((index + 1) / photos.length);
  }
  onProgress?.(1);
  return urls;
}

export function ShareToFeedModal({
  visible,
  message,
  imageUrl,
  onClose,
}: {
  visible: boolean;
  message: string;
  imageUrl?: string;
  onClose: () => void;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const { colors } = useTheme();
  const [text, setText] = useState(message);
  useEffect(() => {
    if (visible) setText(message);
  }, [message, visible]);
  const [busy, setBusy] = useState(false);
  async function share() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createPost(supabase, {
        authorId: user.id,
        authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        message: text.trim(),
        images: imageUrl ? [imageUrl] : [],
      });
      showNotice('Fil', 'Publication partagée.');
      onClose();
    } catch (error) {
      showNotice('Fil', error instanceof Error ? error.message : 'Partage impossible.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
        <AppText className="text-xl font-black text-app-text">Partager sur le fil</AppText>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          style={{ minHeight: 120, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.text, textAlignVertical: 'top' }}
        />
        <Button loading={busy} onPress={() => void share()}>
          Publier sur le fil
        </Button>
        <Button variant="secondary" onPress={onClose}>
          Plus tard
        </Button>
      </View>
    </Modal>
  );
}
