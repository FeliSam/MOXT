import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';

import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { loadDashboardData, type DashboardEvent } from '@/store/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Catalogue événements (EventsPage) : recherche, cartes, badge vérifié, archives. */
export default function EventsScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const events = useAppSelector((state) => state.dashboard.events);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    if (userId) dispatch(loadDashboardData(userId));
  }, [dispatch, userId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const published = event.status === 'published' || !event.status;
      if (tab === 'active' ? !published : published) return false;
      if (!q) return true;
      return `${event.title || ''} ${event.organizerName || ''} ${event.city || ''} ${event.category || ''} ${event.venue || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [events, query, tab]);

  return (
    <AppChrome pathname="/events">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Communauté</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <AppText className="flex-1 text-2xl font-black text-app-text">Événements</AppText>
          <Pressable
            onPress={() => router.push('/publish/event' as never)}
            style={{ minHeight: 40, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <AppText className="text-sm font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
              Créer
            </AppText>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Titre, organisateur, ville..."
          placeholderTextColor={colors.textFaint}
          style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { key: 'active' as const, label: 'Publiés' },
              { key: 'archived' as const, label: 'Archives' },
            ]
          ).map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.accent : colors.surfaceMuted }}>
                <AppText className="text-sm font-bold" style={{ color: active ? (isDark ? '#020617' : '#fff') : colors.text }}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {visible.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {!visible.length ? <AppText className="text-sm text-app-text-muted">Aucun événement pour cet onglet.</AppText> : null}
      </ScrollView>
    </AppChrome>
  );
}

function EventCard({ event }: { event: DashboardEvent }) {
  const { colors } = useTheme();
  const price = Number(event.price || 0);
  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}` as never)}
      className="border border-app-border bg-app-surface"
      style={{ borderRadius: 16, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
          <Calendar size={18} color={colors.accent} />
        </View>
        {event.category ? (
          <AppText className="text-[10px] font-black uppercase text-app-accent">{String(event.category)}</AppText>
        ) : null}
      </View>
      <AppText className="text-base font-black text-app-text">{event.title}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AppText className="text-sm text-app-text-muted" numberOfLines={1}>
          {event.businessId ? 'Entreprise' : 'Particulier'} · {event.organizerName || 'Organisateur'}
        </AppText>
        {event.businessId ? <VerifiedIcon size={14} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MapPin size={14} color={colors.accent} />
        <AppText className="flex-1 text-sm text-app-text-muted" numberOfLines={1}>
          {[event.venue, event.city].filter(Boolean).map(String).join(', ') || 'Lieu à confirmer'}
        </AppText>
      </View>
      <AppText className="text-sm font-bold text-app-text">
        {event.startAt ? formatShortDate(event.startAt) : ''}
        {price > 0 ? ` · ${formatCurrency(price, String(event.currency || 'XOF'))}` : event.startAt ? ' · Gratuit' : 'Gratuit'}
      </AppText>
    </Pressable>
  );
}
