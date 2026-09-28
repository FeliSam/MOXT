import { useEffect, useMemo } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';

import { PageHeader } from '@/components/ui';
import { BackHeader } from '@/components/chrome/BackHeader';
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

/**
 * Entreprises (table `businesses`, comme le web) : mon entreprise + entreprises suivies
 * (`publisher_subscriptions` de type business). Remplace les anciennes « organisations »
 * mobiles (tables organizations / org_members absentes côté web).
 */
function BusinessCard({ business, subtitle }: { business: Business; subtitle?: string }) {
  const colors = useThemeColors();
  const initials = String(business.name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const place = [business.city, business.country].filter(Boolean).join(', ');
  return (
    <Pressable
      testID={`business-card-${business.id}`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
      onPress={() => router.push(`/organization/${business.id}` as any)}>
      {business.logoUrl ? (
        <Image source={{ uri: String(business.logoUrl) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: brand[700] }]}>
          <Text style={styles.avatarText}>{initials || '🏢'}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {business.name || 'Entreprise'}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {[subtitle, businessActivityLabel(business.primaryActivity), place].filter(Boolean).join(' · ') || '—'}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textFaint }]}>›</Text>
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        <PageHeader
          eyebrow="Entreprises"
          title="Mon entreprise"
          description={`${owned.length} entreprise(s) · ${followed.length} suivie(s)`}
        />
        {owned.length ? (
          owned.map((business) => <BusinessCard key={business.id} business={business} subtitle="Propriétaire" />)
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
  body: { flex: 1, gap: 2 },
  name: { ...typography.label, fontSize: 15 },
  meta: { ...typography.caption },
  chevron: { fontSize: 22 },
  emptyText: { ...typography.body },
});
