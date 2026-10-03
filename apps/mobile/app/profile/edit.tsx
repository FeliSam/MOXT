import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Flag, Image as ImageIcon, Mail, MapPin, Smile, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';

import { ImagePickerButton } from '@/components/ImagePickerButton';
import { CoverStyleSheet } from '@/components/profile/CoverStyleSheet';
import { MoxtCoverBanner } from '@/components/profile/CoverBanner';
import { defaultCoverStyleForPersonal, resolveCoverStyleId, type CoverStyleId } from '@/components/profile/coverStyles';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/services/supabase';
import { uploadLikeWeb } from '@/services/mediaUpload';
import { updateProfile } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const COUNTRIES = [
  { code: 'BJ', label: 'Bénin' },
  { code: 'TG', label: 'Togo' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'SN', label: 'Sénégal' },
  { code: 'CM', label: 'Cameroun' },
  { code: 'ML', label: 'Mali' },
  { code: 'GN', label: 'Guinée' },
];

const CITIES = ['Moscou', 'Saint-Pétersbourg', 'Kazan', 'Novossibirsk', 'Ekaterinbourg', 'Krasnodar', 'Rostov-sur-le-Don'];

function Section({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {Icon ? <Icon size={16} color={colors.text} /> : null}
        <AppText className="text-sm font-black text-app-text">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

/** Informations personnelles (web PersonalInformationPage) : bannière, identité, résidence, origine, e-mail. */
export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(user?.secondaryPhone || '');
  const [originCountry, setOriginCountry] = useState(user?.originCountry || 'BJ');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [coverOpen, setCoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const canEditOrigin = user?.role === 'admin' || user?.role === 'superadmin';
  const coverStyle = resolveCoverStyleId({
    coverStyle: typeof preferences.coverStyle === 'string' ? preferences.coverStyle : null,
    category: 'personal',
    gender: typeof preferences.gender === 'string' ? preferences.gender : null,
  });

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let alive = true;
    supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!alive) return;
          const next = data?.preferences && typeof data.preferences === 'object' ? data.preferences : {};
          setPreferences(next as Record<string, unknown>);
        },
        () => undefined,
      );
    return () => {
      alive = false;
    };
  }, [user?.id]);

  if (!user) return null;

  async function saveCover(styleId: CoverStyleId) {
    if (!supabase || !user?.id) return;
    const next = await updateAccountPreferences(supabase, user.id, { coverStyle: styleId }, preferences);
    setPreferences(next);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      let nextAvatar = avatarUrl.trim();
      if (nextAvatar && !/^https?:/i.test(nextAvatar)) {
        const uploaded = await uploadLikeWeb('avatars', `${user.id}/avatar-${Date.now()}.jpg`, {
          uri: nextAvatar,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
        if (!uploaded.url) throw new Error('Envoi de la photo impossible.');
        nextAvatar = uploaded.url;
        setAvatarUrl(nextAvatar);
      }
      const result = await dispatch(
        updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          city: city.trim(),
          phone: phone.trim(),
          secondaryPhone: secondaryPhone.trim(),
          originCountry,
          avatarUrl: nextAvatar,
        } as never),
      );
      if (updateProfile.fulfilled.match(result)) {
        showNotice('Profil enregistré', 'Vos informations personnelles sont à jour.');
      } else {
        showNotice('Profil', 'Enregistrement impossible.');
      }
    } catch (error) {
      showNotice('Profil', error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  const originLabel = COUNTRIES.find((item) => item.code === originCountry)?.label || originCountry;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()}>
        <AppText className="font-bold" style={{ color: colors.primary }}>← Retour</AppText>
      </Pressable>

      <Section title="Photo" icon={ImageIcon}>
        <ImagePickerButton label="Choisir une photo" currentUri={avatarUrl || null} onImageSelected={setAvatarUrl} />
        <Button variant="secondary" onPress={() => setAvatarOpen(true)}>Modifier l’avatar</Button>
        <AppText className="text-center text-base font-black text-app-text">{`${firstName} ${lastName}`.trim()}</AppText>
        <AppText className="text-center text-xs text-app-text-muted">{user.email}</AppText>
        {avatarUrl ? (
          <Pressable onPress={() => setAvatarUrl('')}>
            <AppText className="text-center text-xs font-bold" style={{ color: '#dc2626' }}>Retirer la photo</AppText>
          </Pressable>
        ) : null}
      </Section>

      <Section title="Bannière Moxt" icon={ImageIcon}>
        <AppText className="text-xs text-app-text-muted">La bannière s’affiche sur votre profil public.</AppText>
        <View style={{ height: 96, borderRadius: 14, overflow: 'hidden' }}>
          <MoxtCoverBanner styleId={coverStyle || defaultCoverStyleForPersonal(typeof preferences.gender === 'string' ? preferences.gender : null)} />
        </View>
        <Button variant="secondary" onPress={() => setCoverOpen(true)}>Choisir une bannière</Button>
      </Section>

      <Section title="Identité" icon={User}>
        <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
        <Input label="Nom" value={lastName} onChangeText={setLastName} />
      </Section>

      <Section title="Résidence en Russie" icon={MapPin}>
        <Input label="Pays de résidence" value="Russie" editable={false} />
        <AppText className="text-xs text-app-text-muted">Fixé lors de l’inscription.</AppText>
        <AppText className="text-[13px] font-bold text-app-text-muted">Ville en Russie</AppText>
        <Pressable
          onPress={() => setCityOpen(true)}
          style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
          <AppText className="text-base font-bold text-app-text">{city || 'Choisir une ville'}</AppText>
        </Pressable>
        <Input label="Téléphone en Russie" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+7XXXXXXXXXX" />
      </Section>

      <Section title="Pays d’origine" icon={Flag}>
        {canEditOrigin ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {COUNTRIES.map((item) => (
              <Pressable key={item.code} onPress={() => setOriginCountry(item.code)} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: originCountry === item.code ? colors.accentSoft : colors.surfaceMuted }}>
                <AppText className="text-xs font-bold text-app-text">{item.label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : (
          <Input label="Pays d’origine" value={originLabel} editable={false} />
        )}
        <Input label={`Téléphone ${originLabel}`} value={secondaryPhone} onChangeText={setSecondaryPhone} keyboardType="phone-pad" />
      </Section>

      <Section title="E-mail" icon={Mail}>
        <AppText className="text-sm font-bold text-app-text">{user.email || 'Non renseigné'}</AppText>
        <AppText className="text-xs text-app-text-muted">Modifiable dans le formulaire avec validation par code OTP.</AppText>
        <Button variant="secondary" onPress={() => router.push('/kyc' as never)}>Vérifier l’e-mail</Button>
      </Section>

      <Button variant="primary" size="lg" onPress={() => void handleSave()} loading={saving || status === 'loading'}>
        Enregistrer
      </Button>
      {saving ? <ActivityIndicator color={colors.primary} /> : null}

      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setCityOpen(false)}>
          <Pressable onPress={() => undefined} style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface, padding: 16, gap: 8 }}>
            <AppText className="text-base font-black text-app-text">Ville en Russie</AppText>
            {CITIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setCity(item);
                  setCityOpen(false);
                }}
                style={{ minHeight: 44, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 12, backgroundColor: city === item ? colors.accentSoft : colors.surfaceMuted }}>
                <AppText className="font-bold text-app-text">{item}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setAvatarOpen(false)}>
          <Pressable onPress={() => undefined} style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Smile size={16} color={colors.text} />
              <AppText className="text-base font-black text-app-text">Modifier l’avatar</AppText>
            </View>
            <AppText className="text-xs text-app-text-muted">Choisissez un avatar illustré. Il remplace la photo de profil.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {['Feliciano', 'Amina', 'Ivan', 'Nina', 'Samuel', 'Moxt'].map((seed) => {
                const uri = `https://api.dicebear.com/9.x/lorelei/png?seed=${encodeURIComponent(seed)}`;
                const selected = avatarUrl === uri;
                return (
                  <Pressable
                    key={seed}
                    onPress={() => {
                      setAvatarUrl(uri);
                      setAvatarOpen(false);
                    }}
                    style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: colors.surfaceMuted }}>
                    <Image source={{ uri }} style={{ width: 72, height: 72 }} />
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CoverStyleSheet
        visible={coverOpen}
        gender={typeof preferences.gender === 'string' ? preferences.gender : null}
        selected={coverStyle}
        onClose={() => setCoverOpen(false)}
        onSelect={(styleId) => {
          setCoverOpen(false);
          void saveCover(styleId).catch((error) => showNotice('Bannière', error instanceof Error ? error.message : 'Enregistrement impossible.'));
        }}
      />
    </ScrollView>
  );
}
