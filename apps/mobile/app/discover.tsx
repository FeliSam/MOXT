import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { clearSearchHistory, mergeSearchTerm, normalizeSearchHistory, readSearchHistory, saveSearchTerm } from '@/services/searchHistory';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

type Hit = { id: string; type: string; title: string; subtitle: string; path: string };

const TYPES = [
  ['all', 'Tout'],
  ['listing', 'Annonces'],
  ['job', 'Emplois'],
  ['event', 'Événements'],
  ['parcel', 'Colis'],
  ['business', 'Entreprises'],
  ['p2p', 'P2P'],
] as const;

/** Recherche publique (DiscoverPage) : index local, historique, filtre de type. */
export default function DiscoverScreen() {
  const { colors, isDark } = useTheme();
  const listings = useAppSelector((state) => state.marketplace.items);
  const jobs = useAppSelector((state) => state.dashboard.jobs);
  const events = useAppSelector((state) => state.dashboard.events);
  const parcels = useAppSelector((state) => state.parcels.items);
  const businesses = useAppSelector((state) => state.account.businesses);
  const offers = useAppSelector((state) => state.dashboard.p2pOffers);
  const user = useAppSelector((state) => state.auth.user);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number][0]>('all');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    void readSearchHistory().then(setHistory);
  }, []);

  const index = useMemo<Hit[]>(() => {
    const rows: Hit[] = [];
    listings.forEach((item) => rows.push({ id: item.id, type: 'listing', title: String(item.title || 'Annonce'), subtitle: String(item.city || ''), path: `/listing/${item.id}` }));
    jobs.forEach((item) => rows.push({ id: String(item.id), type: 'job', title: String(item.title || 'Emploi'), subtitle: String(item.location || item.city || ''), path: `/jobs/${item.id}` }));
    events.forEach((item) => rows.push({ id: item.id, type: 'event', title: String(item.title || 'Événement'), subtitle: String(item.city || ''), path: `/events/${item.id}` }));
    parcels.forEach((item) => rows.push({ id: item.id, type: 'parcel', title: `${item.origin || ''} → ${item.destination || ''}`, subtitle: String(item.ownerName || ''), path: `/parcel/${item.id}` }));
    businesses.forEach((item) => rows.push({ id: item.id, type: 'business', title: item.name, subtitle: [item.city, item.country].filter(Boolean).join(', '), path: `/organization/${item.id}` }));
    offers.forEach((item) => rows.push({ id: item.id, type: 'p2p', title: `${item.amount || ''} ${item.fromCurrency || ''} → ${item.toCurrency || ''}`, subtitle: String(item.ownerName || ''), path: `/p2p/${item.id}` }));
    return rows;
  }, [businesses, events, jobs, listings, offers, parcels]);

  const needle = query.trim().toLocaleLowerCase('fr');
  const results = index.filter((item) => (type === 'all' || item.type === type) && (!needle || `${item.title} ${item.subtitle}`.toLocaleLowerCase('fr').includes(needle)));

  function open(hit: Hit) {
    if (needle.length >= 2) {
      void saveSearchTerm(query).then(() => setHistory((prev) => mergeSearchTerm(normalizeSearchHistory(prev), query)));
    }
    if (!user) {
      router.push('/login' as never);
      return;
    }
    router.push(hit.path as never);
  }

  return (
    <AppChrome pathname="/discover">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Explorer</AppText>
        <AppText className="text-2xl font-black text-app-text">Découvrir</AppText>
        <AppText className="text-sm text-app-text-muted">Annonces, emplois, événements, colis, entreprises et échanges visibles dans l’application.</AppText>
        <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, backgroundColor: colors.surface }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TYPES.map(([id, label]) => (
            <Pressable key={id} onPress={() => setType(id)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: type === id ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: type === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
            </Pressable>
          ))}
        </ScrollView>
        {history.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <AppText className="text-xs font-bold text-app-text-muted">Récent</AppText>
            {history.map((term) => (
              <Pressable key={term} onPress={() => setQuery(term)} style={{ borderRadius: 999, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 6 }}>
                <AppText className="text-xs text-app-text">{term}</AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => { void clearSearchHistory(); setHistory([]); }}>
              <AppText className="text-xs font-bold text-app-accent">Effacer</AppText>
            </Pressable>
          </View>
        ) : null}
        <AppText className="text-xs text-app-text-muted">{results.length} résultat(s)</AppText>
        {results.length === 0 ? (
          <AppText className="text-sm text-app-text-muted">Aucun contenu ne correspond. Connectez-vous pour charger plus de catalogues.</AppText>
        ) : (
          results.slice(0, 40).map((hit) => (
            <Pressable key={`${hit.type}-${hit.id}`} onPress={() => open(hit)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
              <AppText className="text-xs font-black uppercase text-app-accent">{hit.type}</AppText>
              <AppText className="font-black text-app-text">{hit.title}</AppText>
              {hit.subtitle ? <AppText className="text-sm text-app-text-muted">{hit.subtitle}</AppText> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </AppChrome>
  );
}
