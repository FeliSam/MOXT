import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { ListCard } from '@/components/ui/ListCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadListings, ListingItem } from '@/store/marketplace';
import { addFavorite, removeFavorite } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing } from '@/theme/colors';

const CARD_GAP = spacing.md;
const CARD_PADDING = spacing.lg;

const TYPE_LABELS: Record<string, string> = {
  product: 'Produit',
  service: 'Service',
  rental: 'Location',
  vehicle: 'Véhicule',
  digital: 'Numérique',
  real_estate: 'Immobilier',
  food: 'Alimentation',
  other: 'Autre',
};

function ListingCard({ listing, width }: { listing: ListingItem; width: number }) {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const typeLabel = TYPE_LABELS[listing.type || ''] || listing.type || '';
  const liked = useAppSelector((state) =>
    state.favorites.items.some((f) => f.id === listing.id && f.type === 'listing'),
  );

  function toggleLike() {
    if (liked) {
      dispatch(removeFavorite({ id: listing.id, type: 'listing' }));
    } else {
      dispatch(addFavorite({ id: listing.id, type: 'listing', title: listing.title, subtitle: listing.city }));
    }
  }

  return (
    <ListCard
      className="overflow-hidden p-0"
      style={{ width }}
      onPress={() => router.push(`/listing/${listing.id}` as any)}>
      {/* Image */}
      <View style={[styles.cardImageWrap, { backgroundColor: brand[100] }]}>
        {listing.images?.[0] ? (
          <Image source={{ uri: listing.images[0] }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 28 }}>🛍️</Text>
        )}
        {/* Heart */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); toggleLike(); }}
          hitSlop={8}
          style={[styles.heartBtn, { backgroundColor: liked ? '#e11d48' : 'rgba(0,0,0,0.3)' }]}>
          <Text style={{ fontSize: 12, color: '#fff' }}>♥</Text>
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {typeLabel ? (
          <View style={[styles.tagPill, { backgroundColor: brand[50] }]}>
            <Text style={[styles.tagText, { color: brand[700] }]}>{typeLabel}</Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text }]}>
          {listing.title}
        </Text>
        {listing.city && (
          <Text style={[styles.cardCity, { color: colors.textFaint }]}>{listing.city}</Text>
        )}
        <Text style={[styles.cardPrice, { color: brand[700] }]}>
          {listing.price ? formatCurrency(listing.price, listing.currency || 'RUB') : 'Sur devis'}
        </Text>
      </View>
    </ListCard>
  );
}

export default function MarketplaceScreen() {
  const dispatch = useAppDispatch();
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const { width: viewportWidth } = useWindowDimensions();
  const items = useAppSelector((state) => state.marketplace.items);
  const loading = useAppSelector((state) => state.marketplace.loading);
  const authStatus = useAppSelector((state) => state.auth.status);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const columnCount = viewportWidth >= 720 ? 3 : 2;
  const cardWidth = (
    Math.min(viewportWidth, 960) - CARD_PADDING * 2 - CARD_GAP * (columnCount - 1)
  ) / columnCount;

  useEffect(() => {
    if (authStatus === 'authenticated') {
      dispatch(loadListings());
    }
  }, [dispatch, authStatus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.city || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    });
  }, [items, query, typeFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(loadListings());
    setRefreshing(false);
  }, [dispatch]);

  if (authStatus === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand[700]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: brand[700] }]} />
              <Text style={[styles.eyebrow, { color: brand[700] }]}>MARKETPLACE</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{translateLabel('Marketplace')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {filtered.length} annonce(s) active(s)
            </Text>
          </View>
          <Pressable
            style={[styles.publishBtn, { backgroundColor: brand[800] }]}
            onPress={() => router.push('/listing/create' as any)}>
            <Text style={styles.publishBtnText}>+ Publier</Text>
          </Pressable>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            placeholder="Rechercher titre, ville, catégorie..."
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Web : chips de types filtrantes */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Pressable
            style={[styles.chip, !typeFilter
              ? { backgroundColor: brand[700] }
              : { backgroundColor: colors.surfaceMuted }]}
            onPress={() => setTypeFilter(null)}>
            <Text style={[styles.chipText, { color: !typeFilter ? '#fff' : colors.textMuted }]}>Tout</Text>
          </Pressable>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.chip, typeFilter === value
                ? { backgroundColor: brand[700] }
                : { backgroundColor: colors.surfaceMuted }]}
              onPress={() => setTypeFilter(typeFilter === value ? null : value)}>
              <Text style={[styles.chipText, { color: typeFilter === value ? '#fff' : colors.textMuted }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading && items.length === 0 ? (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={brand[700]} />
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
            Chargement marketplace...
          </Text>
        </View>
      ) : (
        <FlatList
          key={columnCount}
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={columnCount}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />
          }
          renderItem={({ item }) => <ListingCard listing={item} width={cardWidth} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: brand[50] }]}>
                <Text style={{ fontSize: 32 }}>🛍️</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune annonce</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Les annonces du marketplace apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },

  publishBtn: { borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: '800' },

  listContent: { padding: CARD_PADDING, paddingTop: spacing.sm },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },

  card: {
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cardImageWrap: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: spacing.md, gap: 4 },
  tagPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  cardCity: { fontSize: 11 },
  cardPrice: { fontSize: 14, fontWeight: '900', marginTop: 2 },

  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing['2xl'], fontSize: 13 },
});
