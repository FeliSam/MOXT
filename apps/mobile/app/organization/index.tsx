import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        <PageHeader
          className="mx-0"
          eyebrow="Annuaire"
          title="Entreprises"
          description={`${directory.length} entreprise(s) visible(s)`}
          actions={
            <Pressable onPress={() => router.push('/organization/setup' as never)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: brand[700] }}>
                {owned.length ? 'Modifier' : 'Créer'}
              </Text>
            </Pressable>
          }
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nom, ville, activité..."
          placeholderTextColor={colors.textFaint}
          style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 16 }}
        />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Ville"
          placeholderTextColor={colors.textFaint}
          style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 16 }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['', 'Transfert', 'Colis', 'Marketplace', 'Jobs', 'Events'].map((item) => {
            const active = service === item;
            return (
              <Pressable key={item || 'all'} onPress={() => setService(item)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: active ? brand[700] : colors.surfaceMuted }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : colors.text }}>{item || 'Tous les services'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {directory.map((business) => (
          <BusinessCard key={business.id} business={business} subtitle={String(business.city || '')} />
        ))}
        {!directory.length ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune entreprise dans l’annuaire.</Text>
        ) : null}
        <PageHeader
          className="mx-0"
          eyebrow="Compte"
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
