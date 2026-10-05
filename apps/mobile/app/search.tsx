import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRightLeft,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react-native';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackHeader } from '@/components/chrome/BackHeader';

type SearchResult = {
  id: string;
  type: 'transfer' | 'parcel' | 'listing' | 'job';
  title: string;
  subtitle?: string;
  city?: string;
  price?: number;
  currency?: string;
  date?: string;
};

type FilterType = 'all' | 'transfer' | 'parcel' | 'listing' | 'job';

const FILTER_CONFIG = [
  { key: 'all' as const, label: 'Tous', icon: Layers },
  { key: 'transfer' as const, label: 'Transferts', icon: ArrowRightLeft },
  { key: 'parcel' as const, label: 'Colis', icon: Package },
  { key: 'listing' as const, label: 'Annonces', icon: Store },
  { key: 'job' as const, label: 'Emplois', icon: Briefcase },
];

const TYPE_CONFIG = {
  transfer: { icon: ArrowRightLeft, color: brand[700], bgLight: brand[50] },
  parcel: { icon: Package, color: '#0284c7', bgLight: '#f0f9ff' },
  listing: { icon: Store, color: '#d97706', bgLight: '#fffbeb' },
  job: { icon: Briefcase, color: '#7c3aed', bgLight: '#faf5ff' },
} as const;

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
        res.push({
          id: t.id,
          type: 'transfer',
          title: t.id,
          subtitle: t.direction ? `Transfert · ${t.direction}` : 'Transfert',
          price: (t as any).amountSent ?? (t as any).amount,
          currency: t.currencyFrom || 'XOF',
          date: t.createdAt,
        });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'parcel') {
      parcels.forEach((p) => {
        const route = `${p.origin || ''} → ${p.destination || ''}`;
        if (q && !route.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return;
        if (city && !(p.origin || '').toLowerCase().includes(city) && !(p.destination || '').toLowerCase().includes(city)) return;
        res.push({
          id: p.id,
          type: 'parcel',
          title: route || p.id,
          subtitle: p.ownerName ? `Expédié par ${p.ownerName}` : 'Colis',
          city: p.origin,
          price: p.reward,
          currency: p.currency || 'XOF',
        });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'listing') {
      listings.forEach((l) => {
        if (q && !l.title.toLowerCase().includes(q) && !(l.city || '').toLowerCase().includes(q)) return;
        if (city && !(l.city || '').toLowerCase().includes(city)) return;
        const price = l.price || 0;
        if (pMin !== null && price < pMin) return;
        if (pMax !== null && price > pMax) return;
        res.push({
          id: l.id,
          type: 'listing',
          title: l.title,
          subtitle: [l.category, l.city].filter(Boolean).join(' · ') || 'Annonce',
          city: l.city,
          price: l.price,
          currency: l.currency || 'RUB',
        });
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

  const activeFiltersCount = (typeFilter !== 'all' ? 1 : 0) + (cityFilter ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackHeader inline title="Recherche" />
        <PageHeader eyebrow="EXPLORER" title={translateLabel('Rechercher')} />

        {/* Modern search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Rechercher transferts, annonces, colis..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={styles.clearBtn}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.filterToggle,
            {
              borderColor: activeFiltersCount > 0 ? brand[700] : colors.border,
              backgroundColor: activeFiltersCount > 0 ? brand[50] : colors.surface,
            },
          ]}
          onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={14} color={activeFiltersCount > 0 ? brand[700] : colors.textSecondary} />
          <Text style={[styles.filterToggleText, { color: activeFiltersCount > 0 ? brand[700] : colors.textSecondary }]}>
            {showFilters ? 'Masquer filtres' : 'Filtres avancés'}
          </Text>
          {activeFiltersCount > 0 ? (
            <View style={[styles.filterBadge, { backgroundColor: brand[700] }]}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          ) : null}
          {showFilters ? (
            <ChevronUp size={14} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={14} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {FILTER_CONFIG.map(({ key, label, icon: Icon }) => {
              const active = typeFilter === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? brand[700] : colors.border,
                      backgroundColor: active ? brand[700] : colors.surfaceMuted,
                    },
                  ]}
                  onPress={() => setTypeFilter(key)}>
                  <Icon size={13} color={active ? '#ffffff' : colors.textMuted} />
                  <Text style={[styles.chipText, { color: active ? '#ffffff' : colors.text }]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.cityInputWrap, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <MapPin size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Ville..."
              placeholderTextColor={colors.textFaint}
              value={cityFilter}
              onChangeText={setCityFilter}
              style={[styles.filterInput, { color: colors.text }]}
            />
            {cityFilter ? (
              <Pressable onPress={() => setCityFilter('')} hitSlop={6}>
                <X size={14} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <View style={[styles.priceInputWrap, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <TextInput
                placeholder="Prix min"
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
                style={[styles.filterInput, { color: colors.text }]}
              />
            </View>
            <View style={[styles.priceInputWrap, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <TextInput
                placeholder="Prix max"
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
                style={[styles.filterInput, { color: colors.text }]}
              />
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.transfer;
          const Icon = cfg.icon;
          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => handlePress(item)}>
              <View style={[styles.iconWrap, { backgroundColor: cfg.bgLight }]}>
                <Icon size={18} color={cfg.color} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={[styles.cardSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {item.price != null && item.price > 0 ? (
                <Text style={[styles.cardPrice, { color: brand[700] }]}>
                  {formatCurrency(item.price, item.currency || 'XOF')}
                </Text>
              ) : null}
              <ChevronRight size={16} color={colors.textFaint} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          query.trim() || cityFilter.trim() || minPrice || maxPrice || typeFilter !== 'all' ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Search size={28} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun résultat</Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                Modifiez vos critères de recherche ou réinitialisez les filtres.
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Search size={28} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Commencez votre recherche</Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                Recherchez des transferts, annonces de marketplace ou envois de colis.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  clearBtn: { padding: 4 },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  filterToggleText: { fontSize: 13, fontWeight: '700' },
  filterBadge: { borderRadius: 999, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  filtersPanel: { marginHorizontal: spacing.xl, borderRadius: radii.lg, padding: 14, gap: 12, borderWidth: 1, marginBottom: 8 },
  filterSectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  cityInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  priceInputWrap: {
    flex: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 42,
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterInput: { flex: 1, fontSize: 14 },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: 14,
    gap: spacing.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12 },
  cardPrice: { fontSize: 13, fontWeight: '800' },
  empty: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: spacing['2xl'] },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
});
