import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

type SearchResult = {
  id: string;
  type: 'transfer' | 'parcel' | 'listing' | 'job';
  title: string;
  subtitle?: string;
  city?: string;
  price?: number;
  date?: string;
};

type FilterType = 'all' | 'transfer' | 'parcel' | 'listing' | 'job';

const TYPE_ICONS: Record<string, string> = { transfer: '💸', parcel: '📦', listing: '🏪', job: '💼' };
const TYPE_LABELS: Record<FilterType, string> = { all: 'Tous', transfer: 'Transferts', parcel: 'Colis', listing: 'Annonces', job: 'Emplois' };

export default function SearchScreen() {
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const listings = useAppSelector((state) => state.marketplace.items);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() && !cityFilter.trim() && !minPrice && !maxPrice && typeFilter === 'all') return [];
    const q = query.toLowerCase();
    const city = cityFilter.toLowerCase().trim();
    const pMin = minPrice ? parseFloat(minPrice) : null;
    const pMax = maxPrice ? parseFloat(maxPrice) : null;
    const res: SearchResult[] = [];

    if (typeFilter === 'all' || typeFilter === 'transfer') {
      transfers.forEach((t) => {
        if (q && !t.id.toLowerCase().includes(q) && !(t.direction || '').toLowerCase().includes(q)) return;
        res.push({ id: t.id, type: 'transfer', title: t.id, subtitle: t.direction, date: t.createdAt });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'parcel') {
      parcels.forEach((p) => {
        const route = `${p.origin || ''} → ${p.destination || ''}`;
        if (q && !route.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return;
        if (city && !(p.origin || '').toLowerCase().includes(city) && !(p.destination || '').toLowerCase().includes(city)) return;
        res.push({ id: p.id, type: 'parcel', title: route, subtitle: p.ownerName, city: p.origin });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'listing') {
      listings.forEach((l) => {
        if (q && !l.title.toLowerCase().includes(q) && !(l.city || '').toLowerCase().includes(q)) return;
        if (city && !(l.city || '').toLowerCase().includes(city)) return;
        const price = l.price || 0;
        if (pMin !== null && price < pMin) return;
        if (pMax !== null && price > pMax) return;
        res.push({ id: l.id, type: 'listing', title: l.title, subtitle: l.city, city: l.city, price: l.price });
      });
    }

    return res.slice(0, 50);
  }, [query, typeFilter, cityFilter, minPrice, maxPrice, transfers, parcels, listings]);

  const handlePress = (item: SearchResult) => {
    if (item.type === 'transfer') router.push(`/transfer/${item.id}` as any);
    else if (item.type === 'parcel') router.push(`/parcel/${item.id}` as any);
    else if (item.type === 'listing') router.push(`/listing/${item.id}` as any);
    else if (item.type === 'job') router.push(`/jobs/${item.id}` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>{translateLabel('Retour')}</Text>
        </Pressable>
        <PageHeader eyebrow="EXPLORER" title={translateLabel('Rechercher')} />
        <Input
          placeholder="Rechercher transferts, annonces, colis..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        <Pressable
          style={[styles.filterToggle, { borderColor: colors.primaryBorder, backgroundColor: colors.primaryLight }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={[styles.filterToggleText, { color: colors.primary }]}>
            {showFilters ? '▲ Masquer filtres' : '▼ Filtres avancés'}
          </Text>
        </Pressable>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {(Object.keys(TYPE_LABELS) as FilterType[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, { borderColor: typeFilter === t ? colors.primary : colors.border, backgroundColor: typeFilter === t ? colors.primaryLight : 'transparent' }]}
                onPress={() => setTypeFilter(t)}
              >
                <Text style={[styles.chipText, { color: typeFilter === t ? colors.primary : colors.textSecondary }]}>{TYPE_LABELS[t]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Input
            placeholder="Ville..."
            value={cityFilter}
            onChangeText={setCityFilter}
          />

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Input placeholder="Prix min" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
            </View>
            <View style={{ flex: 1 }}>
              <Input placeholder="Prix max" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.icon}>{TYPE_ICONS[item.type]}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              {item.subtitle ? <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.subtitle}</Text> : null}
            </View>
            {item.price ? <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} XOF</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim() || cityFilter.trim() || minPrice || maxPrice || typeFilter !== 'all' ? (
            <View style={styles.empty}><Text style={{ color: colors.textMuted }}>Aucun résultat.</Text></View>
          ) : (
            <View style={styles.empty}><Text style={{ color: colors.textMuted }}>Tapez pour rechercher...</Text></View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  filterToggle: { borderRadius: radii.sm, paddingVertical: spacing.sm, paddingHorizontal: 14, alignSelf: 'flex-start', borderWidth: 1 },
  filterToggleText: { ...typography.label },
  filtersPanel: { marginHorizontal: spacing.xl, borderRadius: radii.lg, padding: 14, gap: spacing.md, borderWidth: 1 },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: { borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: spacing.sm, borderWidth: 1 },
  chipText: { ...typography.label, fontSize: 13, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  list: { padding: spacing.xl, gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, padding: 14, gap: spacing.md, borderWidth: 1 },
  icon: { fontSize: 22 },
  cardTitle: { ...typography.label, fontSize: 15 },
  cardSub: { ...typography.caption },
  cardPrice: { ...typography.label, fontSize: 13, fontWeight: '800' },
  empty: { paddingVertical: 60, alignItems: 'center' },
});
