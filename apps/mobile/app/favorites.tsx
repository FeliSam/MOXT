import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLanguage } from '@/providers/LanguageProvider';
import { removeFavorite, FavoriteItem } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';
import { PageHeader } from '@/components/ui/PageHeader';

const TYPE_ICONS: Record<string, string> = { listing: '🏪', parcel: '📦', job: '💼' };

/* Web : sections par type de contenu favori */
const SECTIONS: { type: FavoriteItem['type']; title: string }[] = [
  { type: 'listing', title: 'Annonces' },
  { type: 'parcel', title: 'Colis' },
  { type: 'job', title: 'Jobs' },
];

function FavoriteCard({ item }: { item: FavoriteItem }) {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();

  const handlePress = () => {
    if (item.type === 'listing') router.push(`/listing/${item.id}` as any);
    else if (item.type === 'parcel') router.push(`/parcel/${item.id}` as any);
    else if (item.type === 'job') router.push(`/jobs/${item.id}` as any);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
      onPress={handlePress}>
      <Text style={styles.icon}>{TYPE_ICONS[item.type] || '⭐'}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.subtitle}</Text> : null}
      </View>
      <Pressable hitSlop={8} onPress={() => dispatch(removeFavorite({ id: item.id, type: item.type }))}>
        <Text style={{ fontSize: 18, color: colors.danger }}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const items = useAppSelector((state) => state.favorites.items);

  const grouped = useMemo(
    () => SECTIONS.map((s) => ({ ...s, data: items.filter((i) => i.type === s.type) })),
    [items],
  );

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
        title={translateLabel('Mes favoris')}
        description={`${items.length} élément(s) enregistré(s)`}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>⭐</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun favori</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Touchez le cœur d'une annonce pour la retrouver ici.
            </Text>
          </View>
        ) : (
          grouped.map((section) =>
            section.data.length ? (
              <View key={section.type} style={{ gap: spacing.sm }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                  <Text style={{ color: colors.textFaint }}>  ·  {section.data.length}</Text>
                </Text>
                {section.data.map((item) => (
                  <FavoriteCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </View>
            ) : null,
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  list: { padding: spacing.xl, gap: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: 14,
    gap: spacing.md,
    borderWidth: 1,
  },
  icon: { fontSize: 24 },
  cardTitle: { ...typography.label, fontSize: 15 },
  cardSub: { ...typography.caption },
  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 20 },
});
