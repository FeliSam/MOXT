import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { isActiveVideo } from '@moxt/shared/domain/publicationRules.js';
import { fetchPublicProfile } from '@moxt/shared/services/profileService.js';
import { fetchUserPublications, summarizeUserPublications } from '@moxt/shared/services/publicationsService.js';

import { ProfilePageShell } from '@/components/profile/ProfilePageShell';
import { MyPublicationCard, type PublicationItem, type PublicationType } from '@/components/profile/PublicationCard';
import { PublicProfileHero } from '@/components/profile/PublicProfileHero';
import { defaultCoverStyleForPersonal } from '@/components/profile/coverStyles';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useLocalSearchParams, router } from 'expo-router';

function openRoute(type: PublicationType, item: PublicationItem) {
  if (type === 'listing') router.push(`/listing/${item.id}` as never);
  else if (type === 'parcel') router.push(`/parcel/${item.id}` as never);
  else if (type === 'job') router.push(`/jobs/${item.id}` as never);
  else if (type === 'event') router.push(`/events/${item.id}` as never);
  else if (type === 'post') router.push(`/news/${item.id}` as never);
  else if (type === 'video') router.push(`/(tabs)/feed?type=video&item=${encodeURIComponent(`video:${item.id}`)}` as never);
}

/** Vue publique d'un membre (web /users/:id/publications) : publications actives, sans gestion. */
export default function PublicPublicationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [coverStyle, setCoverStyle] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [items, setItems] = useState<{ type: PublicationType; item: PublicationItem }[]>([]);

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let cancelled = false;
    fetchPublicProfile(supabase, id)
      .then((profile) => {
        if (cancelled || !profile) return;
        setName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Profil');
        setCity(profile.city || '');
        setAvatar(profile.avatarUrl || null);
        setVerified(Boolean(profile.verified));
        setCoverStyle(profile.coverStyle);
        setGender(profile.gender);
      })
      .catch(() => undefined);
    fetchUserPublications(supabase, id)
      .then((result) => {
        if (cancelled) return;
        const summary = summarizeUserPublications(result.publications);
        const active = summary.scoped as Record<string, PublicationItem[]>;
        const next: { type: PublicationType; item: PublicationItem }[] = [];
        for (const type of ['listing', 'parcel', 'job', 'event', 'video', 'post', 'other'] as PublicationType[]) {
          const key = type === 'other' ? 'others' : `${type}s`;
          const list = (type === 'video' ? (active.videos || []).filter(isActiveVideo) : active[key] || []) as PublicationItem[];
          for (const item of list) {
            if (type !== 'video' && item.status === 'archived') continue;
            next.push({ type, item });
          }
        }
        setItems(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const count = useMemo(() => items.length, [items]);

  return (
    <ProfilePageShell pathname="/users/publications" scope="personal">
      <PublicProfileHero
        name={name || 'Profil'}
        verified={verified}
        city={city}
        avatarUrl={avatar}
        profileKind="personal"
        coverCategory="personal"
        coverStyle={coverStyle || defaultCoverStyleForPersonal(gender)}
        gender={gender}
      />
      {count ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {items.map(({ type, item }) => (
            <View key={`${type}-${item.id}`} style={{ width: '48%' }}>
              <MyPublicationCard type={type} item={item} readonly onOpen={() => openRoute(type, item)} />
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6">
          <AppText className="text-base font-black text-app-text">Aucune publication publique</AppText>
          <AppText className="text-center text-sm text-app-text-muted">Les publications actives apparaîtront ici.</AppText>
        </View>
      )}
    </ProfilePageShell>
  );
}
