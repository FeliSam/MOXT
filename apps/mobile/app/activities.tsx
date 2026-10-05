import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

type Activity = { id: string; label: string; title: string; path: string; at?: string };

/** Journal du compte (ActivitiesPage) : favoris, messages, transferts, candidatures, réservations. */
export default function ActivitiesScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const favorites = useAppSelector((state) => state.favorites.items);
  const conversations = useAppSelector((state) => state.messages.conversations);
  const transfers = useAppSelector((state) => state.transfers.items);
  const listings = useAppSelector((state) => state.marketplace.items);
  const [extra, setExtra] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    const client = supabase;
    void Promise.all([
      client.from('job_applications').select('*').eq('user_id', user.id).limit(40),
      client.from('parcel_requests').select('*').eq('user_id', user.id).limit(40),
      client.from('event_registrations').select('*').eq('user_id', user.id).limit(40),
    ]).then(([jobs, parcels, events]) => {
      const rows: Activity[] = [];
      fromRows(jobs.data || []).forEach((item: Record<string, unknown>) => {
        rows.push({ id: `job-${item.id}`, label: 'Candidature', title: String(item.message || item.status || 'Candidature'), path: item.jobId ? `/jobs/${item.jobId}` : '/jobs', at: String(item.createdAt || '') });
      });
      fromRows(parcels.data || []).forEach((item: Record<string, unknown>) => {
        rows.push({ id: `parcel-${item.id}`, label: 'Colis', title: String(item.status || 'Demande'), path: item.parcelId ? `/parcel/${item.parcelId}` : '/(tabs)/parcels', at: String(item.createdAt || '') });
      });
      fromRows(events.error ? [] : events.data || []).forEach((item: Record<string, unknown>) => {
        rows.push({ id: `event-${item.id}`, label: 'Événement', title: String(item.status || 'Inscription'), path: item.eventId ? `/events/${item.eventId}` : '/events', at: String(item.createdAt || '') });
      });
      setExtra(rows);
    });
  }, [user?.id]);

  const items: Activity[] = [
    ...favorites.map((item) => ({ id: `fav-${item.type}-${item.id}`, label: 'Favori', title: item.title || item.id, path: item.path || '/favorites' })),
    ...listings
      .filter((item) => (item.favorites || []).includes(user?.id || ''))
      .map((item) => ({ id: `like-${item.id}`, label: 'Annonce', title: item.title, path: `/listing/${item.id}` })),
    ...conversations.map((item) => ({ id: `msg-${item.id}`, label: 'Message', title: item.title || 'Conversation', path: `/messages/${item.id}`, at: item.updatedAt })),
    ...transfers
      .filter((item) => !item.userId || item.userId === user?.id)
      .map((item) => ({ id: `tr-${item.id}`, label: 'Transfert', title: item.status || item.id, path: `/transfer/${item.id}`, at: item.createdAt })),
    ...extra,
  ];

  return (
    <AppChrome pathname="/activities">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Mes activités</AppText>
        {items.length === 0 ? (
          <AppText className="text-sm text-app-text-muted">Aucune activité pour le moment.</AppText>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(item.path as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
              <AppText className="text-xs font-black uppercase text-app-accent">{item.label}</AppText>
              <AppText className="font-bold text-app-text">{item.title}</AppText>
              {item.at ? <AppText className="text-xs text-app-text-muted">{item.at}</AppText> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </AppChrome>
  );
}
