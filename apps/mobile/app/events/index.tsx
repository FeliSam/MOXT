import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';

import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { PageHeader } from '@/components/ui/PageHeader';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadDashboardData, type DashboardEvent } from '@/store/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const CATEGORIES = ['networking', 'training', 'culture', 'business', 'community'] as const;

/** Catalogue événements (EventsPage) : recherche, cartes, badge vérifié, archives. */
export default function EventsScreen() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const events = useAppSelector((state) => state.dashboard.events);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<'' | 'free' | 'paid'>('');
  const [showMine, setShowMine] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (userId) dispatch(loadDashboardData(userId));
  }, [dispatch, userId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (showMine && (event.ownerId !== userId || event.businessId)) return false;
      if (!showMine && event.status && event.status !== 'published') return false;
      const amount = Number(event.price || 0);
      if (price === 'free' && amount > 0) return false;
      if (price === 'paid' && amount <= 0) return false;
      if (category && event.category !== category) return false;
      if (city && !String(event.city || '').toLowerCase().includes(city.trim().toLowerCase())) return false;
      if (!q) return true;
      return `${event.title || ''} ${event.organizerName || ''} ${event.city || ''} ${event.category || ''} ${event.venue || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [category, city, events, price, query, showMine, userId]);

  return (
    <AppChrome pathname="/events">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <PageHeader
          className="mx-0"
          title={t('events.browse.title')}
          actions={
            <View style={{ gap: 8, alignItems: 'flex-end' }}>
              {userId ? (
                <Pressable onPress={() => setShowMine((value) => !value)}>
                  <AppText className="text-xs font-bold" style={{ color: colors.accent }}>
                    {showMine ? t('events.browse.showAll') : t('events.browse.showMine')}
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable onPress={() => router.push('/publish/event' as never)}>
                <AppText className="text-xs font-bold" style={{ color: colors.accent }}>{t('events.browse.create')}</AppText>
              </Pressable>
            </View>
          }
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('events.browse.searchPlaceholder')}
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 16 }}
          />
          <Pressable onPress={() => setAdvanced((value) => !value)}>
            <AppText className="text-xs font-bold" style={{ color: colors.accent }}>{advanced ? 'Masquer' : 'Filtres'}</AppText>
          </Pressable>
        </View>
        {advanced ? (
          <View style={{ gap: 8 }}>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t('events.browse.city')}
              placeholderTextColor={colors.textFaint}
              style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 16 }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <FilterChip label={t('events.browse.allCategories')} active={!category} onPress={() => setCategory('')} />
              {CATEGORIES.map((item) => (
                <FilterChip key={item} label={t(`events.categories.${item}`)} active={category === item} onPress={() => setCategory(item)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <FilterChip label={t('events.browse.allAccess')} active={!price} onPress={() => setPrice('')} />
              <FilterChip label={t('events.browse.free')} active={price === 'free'} onPress={() => setPrice('free')} />
              <FilterChip label={t('events.browse.paid')} active={price === 'paid'} onPress={() => setPrice('paid')} />
            </ScrollView>
          </View>
        ) : null}
        {visible.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {!visible.length ? <AppText className="text-sm text-app-text-muted">{t('events.browse.empty')}</AppText> : null}
      </ScrollView>
    </AppChrome>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: active ? colors.accent : colors.surfaceMuted }}>
      <AppText className="text-xs font-bold" style={{ color: active ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
    </Pressable>
  );
}

function EventCard({ event }: { event: DashboardEvent }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const price = Number(event.price || 0);
  const cover = Array.isArray(event.images) ? event.images.find((src) => typeof src === 'string') : null;
  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}` as never)}
      className="border border-app-border bg-app-surface"
      style={{ borderRadius: 16, overflow: 'hidden', gap: 8 }}>
      {cover ? <Image source={{ uri: String(cover) }} style={{ width: '100%', height: 160 }} /> : null}
      <View style={{ padding: 14, gap: 8 }}>
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
      <AppText className="text-sm font-bold" style={{ color: colors.accent }}>
        {event.startAt ? formatShortDate(event.startAt) : ''}
        {price > 0 ? ` · ${formatCurrency(price, String(event.currency || 'XOF'))}` : ` · ${t('events.browse.freePrice')}`}
      </AppText>
      </View>
    </Pressable>
  );
}
