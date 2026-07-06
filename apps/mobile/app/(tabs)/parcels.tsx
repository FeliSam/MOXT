import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';

import { ListCard } from '@/components/ui/ListCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing } from '@/theme/colors';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { ParcelItem } from '@/store/parcels';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'ACTIF', color: '#047857', bg: '#d1fae5' },
  completed: { label: 'TERMINÉ', color: '#6b7280', bg: '#f3f4f6' },
  reserved: { label: 'RÉSERVÉ', color: '#6d28d9', bg: '#ede9fe' },
};

function isArchived(parcel: ParcelItem, today: string) {
  return parcel.status === 'completed' || (parcel.departureDate && parcel.departureDate < today);
}

function ParcelCard({ parcel }: { parcel: ParcelItem }) {
  const colors = useThemeColors();
  const isCompany = Boolean((parcel as any).ownerType === 'business' || (parcel as any).businessId);
  const kg = parcel.remainingKg ?? parcel.capacityKg ?? 0;

  return (
    <ListCard className="overflow-hidden p-0" onPress={() => router.push(`/parcel/${parcel.id}` as any)}>
      {/* Web : badge Particulier/Entreprise absolu top-right */}
      <View style={[styles.ownerBadge, { backgroundColor: isCompany ? colors.accentSoft : '#fdf0e8' }]}>
        <Text style={[styles.ownerBadgeText, { color: isCompany ? brand[700] : '#b45309' }]}>
          {isCompany ? 'Entreprise' : 'Particulier'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        {/* Owner */}
        <Text style={[styles.parcelOwner, { color: colors.text }]} numberOfLines={1}>
          {parcel.ownerName || parcel.id}
        </Text>

        {/* Web : bloc route pastel avec flèche circulaire verte */}
        <View style={[styles.routeBlock, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.routeCity, { color: colors.text }]} numberOfLines={1}>
            {(parcel.origin || '—').toUpperCase()}
          </Text>
          <View style={[styles.routeArrow, { backgroundColor: brand[700] }]}>
            <Text style={styles.routeArrowText}>→</Text>
          </View>
          <Text style={[styles.routeCity, styles.routeCityRight, { color: colors.text }]} numberOfLines={1}>
            {(parcel.destination || '—').toUpperCase()}
          </Text>
        </View>

        {/* Tuile kg */}
        <View style={[styles.infoTile, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.infoTileValue, { color: colors.text }]}>{kg} kg</Text>
          <Text style={[styles.infoTileLabel, { color: colors.textMuted }]}>Disponible</Text>
        </View>

        {/* Tuile prix */}
        {parcel.pricePerKg != null ? (
          <View style={[styles.infoTile, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.infoTileValue, { color: colors.text }]}>
              {formatCurrency(parcel.pricePerKg, 'RUB')}
            </Text>
            <Text style={[styles.infoTileLabel, { color: colors.textMuted }]}>Par kg</Text>
          </View>
        ) : null}

        {parcel.departureDate ? (
          <Text style={[styles.parcelDate, { color: colors.textFaint }]}>
            Départ · {formatShortDate(parcel.departureDate)}
          </Text>
        ) : null}

        {/* Web : bouton "Voir le détail →" pleine largeur */}
        <View style={[styles.detailBtn, { backgroundColor: brand[700] }]}>
          <Text style={styles.detailBtnText}>Voir le détail  →</Text>
        </View>
      </View>
    </ListCard>
  );
}

export default function ParcelsScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const items = useAppSelector((state) => state.parcels.items);
  const authStatus = useAppSelector((state) => state.auth.status);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const today = new Date().toISOString().slice(0, 10);
  const preferredCountry = user?.originCountry || user?.country || 'RU';

  const visibleParcels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((parcel) => {
      const archived = isArchived(parcel, today);
      if (tab === 'active' ? archived : !archived) return false;
      const from = parcel.fromCountry || parcel.originCountry;
      const to = parcel.toCountry || parcel.destinationCountry;
      const matchesCountry = !preferredCountry || from === preferredCountry || to === preferredCountry;
      if (!matchesCountry) return false;
      if (!normalizedQuery) return true;
      const haystack =
        `${parcel.origin || ''} ${parcel.destination || ''} ${parcel.ownerName || ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, preferredCountry, query, tab, today]);

  const { activeCount, archivedCount } = useMemo(() => {
    let a = 0;
    let arch = 0;
    for (const parcel of items) {
      const from = parcel.fromCountry || parcel.originCountry;
      const to = parcel.toCountry || parcel.destinationCountry;
      if (preferredCountry && from !== preferredCountry && to !== preferredCountry) continue;
      if (isArchived(parcel, today)) arch += 1;
      else a += 1;
    }
    return { activeCount: a, archivedCount: arch };
  }, [items, preferredCountry, today]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(loadCoreData());
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
      <View style={styles.header}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: brand[700] }]} />
          <Text style={[styles.eyebrow, { color: brand[700] }]}>TRANSPORT</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {translateLabel('Colis et voyages')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Publiez une capacité de transport ou réservez une place disponible.
        </Text>

        {/* Web : "Tous les colis" + "Publier un voyage" */}
        <View style={styles.headerBtnRow}>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => setTab('active')}>
            <Text style={[styles.headerBtnText, { color: brand[700] }]}>Tous les colis</Text>
          </Pressable>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: brand[700] }]}
            onPress={() => router.push('/parcel/reserve' as any)}>
            <Text style={[styles.headerBtnText, { color: '#fff' }]}>+ Publier un voyage</Text>
          </Pressable>
        </View>

        {/* Web : stat "N Trajets disponibles" */}
        <View style={[styles.statTile, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{activeCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Trajets disponibles</Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            placeholder="Pays, ville, voyageur, entreprise..."
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Web : CatalogArchiveTabs — Voyages actifs / Archives (avec compteurs) */}
        <View style={styles.tabsUnderline}>
          {([['active', 'Voyages actifs', activeCount], ['archived', 'Archives', archivedCount]] as const).map(
            ([key, label, count]) => (
              <Pressable key={key} style={styles.tabUnderlineBtn} onPress={() => setTab(key)}>
                <View style={styles.tabUnderlineRow}>
                  <Text style={[styles.tabUnderlineText, { color: tab === key ? colors.text : colors.textMuted }]}>
                    {label}
                  </Text>
                  <View style={[styles.tabCount, { backgroundColor: tab === key ? brand[700] : colors.surfaceMuted }]}>
                    <Text style={[styles.tabCountText, { color: tab === key ? '#fff' : colors.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                </View>
                {tab === key ? <View style={[styles.tabUnderlineBar, { backgroundColor: brand[700] }]} /> : null}
              </Pressable>
            ),
          )}
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={visibleParcels}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />
        }
        renderItem={({ item }) => <ParcelCard parcel={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: brand[50] }]}>
              <Text style={{ fontSize: 32 }}>📦</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun colis disponible
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Les trajets actifs s'affichent ici après synchronisation.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2, lineHeight: 19 },

  headerBtnRow: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 13, alignItems: 'center' },
  headerBtnText: { fontSize: 13, fontWeight: '800' },

  statTile: { borderRadius: radii.md, padding: 14 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 12, marginTop: 2 },

  tabsUnderline: { flexDirection: 'row', gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  tabUnderlineBtn: { paddingBottom: 8 },
  tabUnderlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabUnderlineText: { fontSize: 15, fontWeight: '800' },
  tabCount: { minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabCountText: { fontSize: 11, fontWeight: '800' },
  tabUnderlineBar: { height: 2, borderRadius: 2, marginTop: 6 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 20 },

  card: { borderRadius: radii.lg, overflow: 'hidden' },
  cardContent: { padding: spacing.lg, paddingTop: 18, gap: spacing.md },

  ownerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ownerBadgeText: { fontSize: 11, fontWeight: '800' },


  parcelOwner: { fontSize: 16, fontWeight: '900', paddingRight: 90 },

  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  routeCity: { flex: 1, fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  routeCityRight: { textAlign: 'right' },
  routeArrow: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeArrowText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  infoTile: { borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 16 },
  infoTileValue: { fontSize: 16, fontWeight: '900' },
  infoTileLabel: { fontSize: 12, marginTop: 2 },

  parcelDate: { fontSize: 12 },
  detailBtn: {
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
  },
  detailBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing['2xl'], fontSize: 13 },
});
