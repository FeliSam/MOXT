import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PageHeader } from '@/components/ui/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';

export default function MyListingsScreen() {
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const listings = useAppSelector((state) =>
    state.marketplace.items.filter((item) => item.ownerId === user?.id),
  );
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const active = useMemo(() => listings.filter((item) => item.status === 'active'), [listings]);
  const archived = useMemo(
    () => listings.filter((item) => item.status !== 'active'),
    [listings],
  );
  const visible = tab === 'active' ? active : archived;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>{translateLabel('Retour')}</Text>
        </Pressable>
      </View>
      <PageHeader
        eyebrow="Marketplace"
        title={translateLabel('Mes annonces')}
        description={`${active.length} active(s) · ${archived.length} archive(s)`}
      />

      <View style={styles.tabs}>
        {(['active', 'archived'] as const).map((key) => (
          <Pressable
            key={key}
            style={[
              styles.tab,
              {
                backgroundColor: tab === key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setTab(key)}>
            <Text style={{ color: tab === key ? '#fff' : colors.text, fontWeight: '800' }}>
              {translateLabel(key === 'active' ? 'Actives' : 'Archives')} (
              {key === 'active' ? active.length : archived.length})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🏪</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {translateLabel(tab === 'active' ? 'Aucune annonce active' : 'Aucune archive')}
            </Text>
          </View>
        ) : (
          visible.map((listing) => (
            <Pressable
              key={listing.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => router.push(`/listing/${listing.id}` as any)}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {listing.status} · {listing.views || 0} {translateLabel('vues')}
                </Text>
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
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, borderWidth: 1, borderRadius: radii.lg, paddingVertical: spacing.sm, alignItems: 'center' },
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
