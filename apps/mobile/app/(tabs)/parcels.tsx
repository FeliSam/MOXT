import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing } from '@/theme/colors';
import { splitBrowseParcels } from '@moxt/shared/domain/parcelRules.js';

import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { ParcelItem } from '@/store/parcels';

/** resolveParcelProofStatus + parcelProofTone du web. */
function proofStatus(parcel: ParcelItem) {
  const row = parcel as { proofStatus?: string; travelProofUrl?: string };
  const status = row.proofStatus;
  if (status === 'verified' || status === 'rejected' || status === 'missing') return status;
  if (status === 'pending_review' || row.travelProofUrl) return 'pending_review';
  return 'missing';
}

const PROOF_META: Record<string, { key: string; light: [string, string]; dark: [string, string] }> = {
  verified: { key: 'parcels.card.proofVerified', light: ['#d1fae5', '#047857'], dark: ['rgba(6,78,59,0.5)', '#6ee7b7'] },
  pending_review: { key: 'parcels.card.proofPending', light: ['#fef3c7', '#b45309'], dark: ['rgba(120,53,15,0.5)', '#fcd34d'] },
  rejected: { key: 'parcels.card.proofRejected', light: ['#fee2e2', '#b91c1c'], dark: ['rgba(127,29,29,0.5)', '#fca5a5'] },
  missing: { key: 'parcels.card.proofMissing', light: ['#e0f2fe', '#0369a1'], dark: ['rgba(12,74,110,0.5)', '#7dd3fc'] },
};

function ParcelCard({ parcel, archived = false }: { parcel: ParcelItem; archived?: boolean }) {
  const colors = useThemeColors();
  const { t } = useLanguage();
  const isDark = colors.background === '#0c0c0e';
  const isCompany = Boolean((parcel as any).ownerType === 'business' || (parcel as any).businessId);
  const kg = parcel.remainingKg ?? parcel.capacityKg ?? 0;
  const proof = PROOF_META[proofStatus(parcel)];
  const [proofBg, proofFg] = isDark ? proof.dark : proof.light;
  const extra = parcel as { depositDeadline?: string; distributionDate?: string };

  if (archived) {
    return (
      <ListCard className="overflow-hidden p-0" onPress={() => router.push(`/parcel/${parcel.id}` as any)}>
        <View style={{ opacity: 0.8, padding: spacing.lg, gap: spacing.md }}>
          <Text testID="parcel-archived-badge" style={[styles.archivedBadge, { alignSelf: 'flex-end', color: colors.textFaint, backgroundColor: colors.surfaceMuted, borderWidth: 0 }]}>
            {t('parcels.card.archived')}
          </Text>
          <Text style={[styles.parcelOwner, { color: colors.text, paddingRight: 0 }]} numberOfLines={1}>
            {parcel.ownerName || parcel.id}
          </Text>
          <View style={[styles.routeBlock, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.routeCity, { color: colors.text, textAlign: 'center' }]} numberOfLines={1}>
              {(parcel.origin || '—').toUpperCase()}
            </Text>
            <Text style={{ color: colors.textMuted }}>→</Text>
            <Text style={[styles.routeCity, { color: colors.text, textAlign: 'center' }]} numberOfLines={1}>
              {(parcel.destination || '—').toUpperCase()}
            </Text>
          </View>
          {parcel.departureDate ? (
            <Text style={[styles.parcelDate, { color: colors.textMuted }]}>
              {t('parcels.card.departure', { date: formatShortDate(parcel.departureDate) })}
            </Text>
          ) : null}
        </View>
      </ListCard>
    );
  }

  return (
    <ListCard className="overflow-hidden p-0" onPress={() => router.push(`/parcel/${parcel.id}` as any)}>
      <View style={styles.ownerBadge}>
        <View style={{ borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: proofBg }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: proofFg }}>{t(proof.key)}</Text>
        </View>
        <View style={{ borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: isCompany ? colors.accentSoft : colors.surfaceMuted }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: isCompany ? colors.accent : colors.textFaint }}>
            {isCompany ? t('parcels.card.business') : t('parcels.card.individual')}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.parcelOwner, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
            {parcel.ownerName || parcel.id}
          </Text>
          {isCompany ? <VerifiedIcon size={14} /> : null}
        </View>

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

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.infoTile, { flex: 1, backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.infoTileValue, { color: colors.text }]}>{kg} kg</Text>
            <Text style={[styles.infoTileLabel, { color: colors.textMuted }]}>{t('parcels.card.available')}</Text>
          </View>
          {parcel.pricePerKg != null ? (
            <View style={[styles.infoTile, { flex: 1, backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.infoTileValue, { color: colors.text }]}>
                {formatCurrency(parcel.pricePerKg, parcel.currency || 'RUB')}
              </Text>
              <Text style={[styles.infoTileLabel, { color: colors.textMuted }]}>{t('parcels.card.perKg')}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 6 }}>
          {parcel.departureDate ? (
            <Text style={[styles.parcelDate, { color: colors.textMuted }]}>
              {t('parcels.card.departure', { date: formatShortDate(parcel.departureDate) })}
            </Text>
          ) : null}
          {extra.depositDeadline || parcel.departureDate ? (
            <Text style={[styles.parcelDate, { color: colors.textMuted }]}>
              {t('parcels.card.depositBefore', { date: formatShortDate(String(extra.depositDeadline || parcel.departureDate)) })}
            </Text>
          ) : null}
          {extra.distributionDate ? (
            <Text style={[styles.parcelDate, { color: colors.textMuted }]}>
              {t('parcels.card.pickupFrom', { date: formatShortDate(extra.distributionDate) })}
            </Text>
          ) : null}
        </View>

        <View style={[styles.detailBtn, { backgroundColor: isDark ? brand[600] : brand[700] }]}>
          <Text style={styles.detailBtnText}>{t('parcels.card.viewDetail')}  →</Text>
        </View>
      </View>
    </ListCard>
  );
}

export default function ParcelsScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const items = useAppSelector((state) => state.parcels.items);
  const authStatus = useAppSelector((state) => state.auth.status);
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [showMine, setShowMine] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const preferredCountry = user?.originCountry || user?.country || 'RU';

  // Onglets identiques à la page Colis web (règles partagées) : actifs = pays + statut actif,
  // archives = tous les trajets archivés du catalogue (50 derniers, même fenêtre que le web).
  const browse = useMemo(
    () => splitBrowseParcels(items, { countryCode: preferredCountry, today }) as {
      active: ParcelItem[];
      archived: ParcelItem[];
    },
    [items, preferredCountry, today],
  );

  const visibleParcels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const source = (tab === 'active' ? browse.active : browse.archived).filter((parcel) =>
      showMine ? parcel.ownerId === user?.id : true,
    );
    return source.filter((parcel) => {
      const haystack =
        `${parcel.origin || ''} ${parcel.destination || ''} ${parcel.ownerName || ''}`.toLowerCase();
      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      if (origin && !String(parcel.origin || '').toLowerCase().includes(origin.trim().toLowerCase())) return false;
      if (destination && !String(parcel.destination || '').toLowerCase().includes(destination.trim().toLowerCase())) return false;
      return true;
    });
  }, [browse, destination, origin, query, showMine, tab, user?.id]);

  // Même écran que le web quand le catalogue actif est vide : ouvrir Archives.
  useEffect(() => {
    if (browse.active.length === 0 && browse.archived.length > 0) setTab('archived');
  }, [browse.active.length, browse.archived.length]);

  const activeCount = browse.active.length;
  const archivedCount = browse.archived.length;

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <View style={styles.header}>
        <PageHeader
          className="mx-0"
          title={t('parcels.browse.title')}
          actions={
            <View style={{ gap: 8 }}>
              <Pressable onPress={() => setShowMine((value) => !value)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: brand[700] }}>
                  {showMine ? t('parcels.browse.actions.allParcels') : t('parcels.browse.actions.myParcels')}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/publish/parcel' as never)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: brand[700] }}>{t('parcels.browse.actions.publish')}</Text>
              </Pressable>
            </View>
          }
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.statTile, { flex: 1, backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{visibleParcels.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('parcels.browse.stats.availableTrips')}</Text>
          </View>
          <View style={[styles.statTile, { flex: 1, backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {t('parcels.browse.stats.availableKgValue', {
                kg: visibleParcels.reduce((sum, parcel) => sum + Number(parcel.remainingKg ?? parcel.capacityKg ?? 0), 0),
              })}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('parcels.browse.stats.availableKg')}</Text>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            placeholder={t('parcels.browse.search.placeholder')}
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text, fontSize: 16 }]}
            value={query}
            onChangeText={setQuery}
          />
          <Pressable onPress={() => setAdvanced((value) => !value)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: brand[700] }}>{advanced ? 'Masquer' : 'Filtres'}</Text>
          </Pressable>
        </View>
        {advanced ? (
          <View style={{ gap: 8 }}>
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              placeholder={t('parcels.browse.filters.origin')}
              placeholderTextColor={colors.textFaint}
              style={[styles.searchBar, { color: colors.text, fontSize: 16, backgroundColor: colors.surface }]}
            />
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder={t('parcels.browse.filters.destination')}
              placeholderTextColor={colors.textFaint}
              style={[styles.searchBar, { color: colors.text, fontSize: 16, backgroundColor: colors.surface }]}
            />
          </View>
        ) : null}

        {/* Web : CatalogArchiveTabs — Voyages actifs / Archives (avec compteurs) */}
        <View style={styles.tabsUnderline}>
          {([['active', t('parcels.browse.tabs.active'), activeCount], ['archived', t('parcels.browse.tabs.archived'), archivedCount]] as const).map(
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
        renderItem={({ item }) => <ParcelCard parcel={item} archived={tab === 'archived'} />}
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
  archivedBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
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
  cardContent: { padding: spacing.lg, paddingTop: 36, gap: spacing.md },

  ownerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    flexDirection: 'row',
    gap: 4,
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
