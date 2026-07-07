import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PageHeader } from '@/components/ui/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';

type ArchiveTab = 'active' | 'archived';
type TypeTab = 'listing' | 'parcel' | 'job' | 'other';

const TYPE_TABS: { id: TypeTab; label: string }[] = [
  { id: 'listing', label: 'Annonces' },
  { id: 'parcel', label: 'Colis' },
  { id: 'job', label: 'Jobs' },
  { id: 'other', label: 'Autres' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function isActiveParcel(parcel: { status?: string; departureDate?: string }) {
  if (!parcel || parcel.status !== 'active') return false;
  if (parcel.departureDate && parcel.departureDate < todayIso()) return false;
  return true;
}

export default function MyPublicationsScreen() {
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const listings = useAppSelector((state) =>
    state.marketplace.items.filter((item) => item.ownerId === user?.id && !item.businessId),
  );
  const parcels = useAppSelector((state) =>
    state.parcels.items.filter((item) => item.ownerId === user?.id && !item.businessId),
  );
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('active');
  const [typeTab, setTypeTab] = useState<TypeTab>('listing');

  const activeListings = useMemo(
    () => listings.filter((item) => item.status === 'active'),
    [listings],
  );
  const archivedListings = useMemo(
    () => listings.filter((item) => item.status !== 'active'),
    [listings],
  );
  const activeParcels = useMemo(() => parcels.filter(isActiveParcel), [parcels]);
  const archivedParcels = useMemo(() => parcels.filter((item) => !isActiveParcel(item)), [parcels]);

  const typeCounts = {
    listing: archiveTab === 'active' ? activeListings.length : archivedListings.length,
    parcel: archiveTab === 'active' ? activeParcels.length : archivedParcels.length,
    job: 0,
    other: 0,
  };

  const archiveCounts = {
    active: activeListings.length + activeParcels.length,
    archived: archivedListings.length + archivedParcels.length,
  };

  const visible = useMemo(() => {
    if (typeTab === 'listing') {
      return (archiveTab === 'active' ? activeListings : archivedListings).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.status} · ${item.views || 0} ${translateLabel('vues')}`,
        route: `/listing/${item.id}` as const,
      }));
    }
    if (typeTab === 'parcel') {
      return (archiveTab === 'active' ? activeParcels : archivedParcels).map((item) => ({
        id: item.id,
        title: `${item.origin} → ${item.destination}`,
        subtitle: item.status,
        route: `/(tabs)/parcels` as const,
      }));
    }
    return [];
  }, [
    activeListings,
    activeParcels,
    archiveTab,
    archivedListings,
    archivedParcels,
    translateLabel,
    typeTab,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>{translateLabel('Retour')}</Text>
        </Pressable>
      </View>
      <PageHeader
        eyebrow="Compte"
        title={translateLabel('Mes publications')}
        description={`${archiveCounts.active} active(s) · ${archiveCounts.archived} archive(s)`}
      />

      <View style={styles.tabs}>
        {(['active', 'archived'] as const).map((key) => (
          <Pressable
            key={key}
            style={[
              styles.tab,
              {
                backgroundColor: archiveTab === key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setArchiveTab(key)}>
            <Text style={{ color: archiveTab === key ? '#fff' : colors.text, fontWeight: '800' }}>
              {translateLabel(key === 'active' ? 'Actives' : 'Archives')} (
              {archiveCounts[key]})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeTabs}>
        {TYPE_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.typeTab,
              {
                backgroundColor: typeTab === tab.id ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setTypeTab(tab.id)}>
            <Text style={{ color: typeTab === tab.id ? '#fff' : colors.text, fontWeight: '700' }}>
              {translateLabel(tab.label)} ({typeCounts[tab.id]})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>{typeTab === 'parcel' ? '📦' : typeTab === 'job' ? '💼' : '📋'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {translateLabel(
                archiveTab === 'active' ? 'Aucune publication active' : 'Aucune archive',
              )}
            </Text>
          </View>
        ) : (
          visible.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => router.push(item.route as any)}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.subtitle}</Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>→</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  backArrow: { fontSize: 18, fontWeight: '800' },
  backLabel: { ...typography.bodyBold },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tab: { flex: 1, borderWidth: 1, borderRadius: radii.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  typeTabs: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  typeTab: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: { ...typography.bodyBold },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  emptyTitle: { ...typography.h3 },
});
