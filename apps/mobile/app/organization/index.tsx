import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRightLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Edit3,
  Layers,
  MapPin,
  Package,
  Plus,
  Search,
  Store,
  X,
} from 'lucide-react-native';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';

import { PageHeader } from '@/components/ui';
import { BackHeader } from '@/components/chrome/BackHeader';
import { BusinessVerificationProgress } from '@/components/business/BusinessVerificationProgress';
import {
  Business,
  loadBusinesses,
  loadBusinessesByIds,
  loadSubscriptions,
  selectMySubscriptions,
  selectOwnedBusinesses,
} from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

const SERVICE_CHIPS = [
  { key: '', label: 'Tous', icon: Layers },
  { key: 'Transfert', label: 'Transfert', icon: ArrowRightLeft },
  { key: 'Colis', label: 'Colis', icon: Package },
  { key: 'Marketplace', label: 'Marketplace', icon: Store },
  { key: 'Jobs', label: 'Jobs', icon: Briefcase },
  { key: 'Events', label: 'Events', icon: Calendar },
];

/**
 * Entreprises (table `businesses`, comme le web) : mon entreprise + entreprises suivies
 * (`publisher_subscriptions` de type business).
 */
function BusinessCard({ business, subtitle }: { business: Business; subtitle?: string }) {
  const colors = useThemeColors();
  const initials = String(business.name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const place = [business.city, business.country].filter(Boolean).join(', ');
  const isVerified = business.verified || ['verified', 'approved', 'active'].includes(String(business.status || ''));

  return (
    <Pressable
      testID={`business-card-${business.id}`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
      onPress={() => router.push(`/organization/${business.id}` as any)}>
      {business.logoUrl ? (
        <Image source={{ uri: String(business.logoUrl) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: brand[700] }]}>
          {initials ? (
            <Text style={styles.avatarText}>{initials}</Text>
          ) : (
            <Building2 size={22} color="#ffffff" />
          )}
        </View>
      )}
      <View style={styles.body}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {business.name || 'Entreprise'}
          </Text>
          {isVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: brand[50] }]}>
              <Check size={10} color={brand[700]} strokeWidth={3} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {[subtitle, businessActivityLabel(business.primaryActivity), place].filter(Boolean).join(' · ') || '—'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function BusinessesScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const businesses = useAppSelector((state) => state.account.businesses);
  const businessById = useAppSelector((state) => state.account.businessById);
  const subscriptions = useAppSelector((state) => state.account.subscriptions);
  const loading = useAppSelector(
    (state) => Boolean(state.account.loading.businesses || state.account.loading.subscriptions),
  );
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');

  const refresh = () => {
    if (!userId) return;
    dispatch(loadBusinesses(userId));
    dispatch(loadSubscriptions());
  };

  useEffect(refresh, [dispatch, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const owned = useMemo(() => selectOwnedBusinesses(businesses, userId), [businesses, userId]);
  const followed = useMemo(
    () =>
      selectMySubscriptions(subscriptions, userId).filter((item) => item.publisherType === 'business'),
    [subscriptions, userId],
  );

  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ready = new Set(['verified', 'approved', 'active']);
    return businesses.filter((business) => {
      if (business.deletedByUserAt) return false;
      if (owned.some((item) => item.id === business.id)) return false;
      const status = String(business.status || '').toLowerCase();
      if (status && !ready.has(status) && !business.verified) return false;
      const services = Array.isArray(business.services) ? business.services.map(String) : [];
      if (service && !services.includes(service)) return false;
      if (city && !String(business.city || '').toLowerCase().includes(city.trim().toLowerCase())) return false;
      if (!q) return true;
      return `${business.name || ''} ${business.city || ''} ${business.primaryActivity || ''}`.toLowerCase().includes(q);
    });
  }, [businesses, city, owned, query, service]);

  const missingIds = useMemo(
    () => followed.map((item) => item.publisherId).filter((id) => !businessById[id]),
    [followed, businessById],
  );
  useEffect(() => {
    if (missingIds.length) dispatch(loadBusinessesByIds(missingIds));
  }, [dispatch, missingIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <BackHeader inline title="Entreprises" />
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={brand[700]} />}>
        <PageHeader
          className="mx-0"
          eyebrow="Annuaire"
          title="Entreprises"
          description={`${directory.length} entreprise(s) visible(s)`}
          actions={
            <Pressable
              onPress={() => router.push('/organization/setup' as never)}
              style={[styles.createBtn, { backgroundColor: brand[700] }]}>
              {owned.length ? (
                <Edit3 size={13} color="#ffffff" />
              ) : (
                <Plus size={14} color="#ffffff" strokeWidth={2.5} />
              )}
              <Text style={styles.createBtnText}>
                {owned.length ? 'Modifier' : 'Créer'}
              </Text>
            </Pressable>
          }
        />

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nom, activité..."
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <X size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* City input */}
        <View style={[styles.cityBar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <MapPin size={16} color={colors.textMuted} />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Filtrer par ville..."
            placeholderTextColor={colors.textFaint}
            style={[styles.cityInput, { color: colors.text }]}
          />
          {city ? (
            <Pressable onPress={() => setCity('')} hitSlop={6}>
              <X size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Services filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SERVICE_CHIPS.map(({ key, label, icon: Icon }) => {
            const active = service === key;
            return (
              <Pressable
                key={key || 'all'}
                onPress={() => setService(key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? brand[700] : colors.surfaceMuted,
                    borderColor: active ? brand[700] : colors.border,
                  },
                ]}>
                <Icon size={12} color={active ? '#ffffff' : colors.textMuted} />
                <Text style={[styles.chipText, { color: active ? '#ffffff' : colors.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {directory.map((business) => (
          <BusinessCard key={business.id} business={business} subtitle={String(business.city || '')} />
        ))}
        {!directory.length ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceMuted }]}>
              <Building2 size={24} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune entreprise dans l’annuaire.</Text>
          </View>
        ) : null}

        <PageHeader
          className="mx-0"
          eyebrow="Compte"
          title="Mon entreprise"
          description={`${owned.length} entreprise(s) · ${followed.length} suivie(s)`}
        />
        {owned.length ? (
          owned.map((business) => (
            <View key={business.id} style={{ gap: spacing.md }}>
              <BusinessCard business={business} subtitle="Propriétaire" />
              <BusinessVerificationProgress business={business} />
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucune entreprise à votre nom.
          </Text>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Entreprises suivies
          <Text style={{ color: colors.textFaint }}>  ·  {followed.length}</Text>
        </Text>
        {followed.length ? (
          followed.map((sub) => {
            const business =
              businessById[sub.publisherId] ||
              ({ id: sub.publisherId, ownerId: '', name: sub.publisherName || 'Entreprise' } as Business);
            return <BusinessCard key={sub.id} business={business} />;
          })
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Vous ne suivez aucune entreprise.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  list: { padding: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginTop: spacing.lg },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  cityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  cityInput: { flex: 1, fontSize: 14 },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: 14,
    gap: spacing.md,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  verifiedBadge: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  name: { ...typography.label, fontSize: 15 },
  meta: { ...typography.caption },
  emptyContainer: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.body },
});
