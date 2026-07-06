import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { TransferPageHeader } from '@/components/transfers/TransferPageHeader';
import { FALLBACK_EXCHANGERS } from '@/constants/transfers';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing } from '@/theme/colors';

export default function ExchangersScreen() {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FALLBACK_EXCHANGERS;
    return FALLBACK_EXCHANGERS.filter((ex) =>
      `${ex.name} ${ex.averageDelay}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TransferPageHeader
          eyebrow="Finances"
          title="Échangeurs"
          description="Comparez les partenaires disponibles avant de créer une opération."
          actions={[{ label: 'Nouveau transfert', onPress: () => router.push('/transfer/wizard' as any), primary: true }]}
        />

        <Text style={[styles.stats, { color: colors.textMuted }]}>
          {visible.length} partenaire(s)
        </Text>

        <View style={[styles.searchBar, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
          <Text>🔍</Text>
          <TextInput
            placeholder="Échangeur, ville ou délai..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          <Pressable style={[styles.filterBtn, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700' }}>Filtres</Text>
          </Pressable>
        </View>

        <FlatList
          data={visible}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <View style={styles.cardAccent} />
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: brand[50] }]}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: brand[700] }}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  <View style={[styles.availableBadge, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.availableText, { color: colors.success }]}>DISPONIBLE</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.compareRow, { backgroundColor: colors.surfaceMuted }]}>
                <View style={styles.compareCell}>
                  <Text style={[styles.compareValue, { color: colors.text }]}>⭐ {item.rating}</Text>
                  <Text style={[styles.compareLabel, { color: colors.textFaint }]}>Note</Text>
                </View>
                <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                <View style={styles.compareCell}>
                  <Text style={[styles.compareValue, { color: colors.text }]}>{item.feePercent}%</Text>
                  <Text style={[styles.compareLabel, { color: colors.textFaint }]}>Frais</Text>
                </View>
                <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                <View style={styles.compareCell}>
                  <Text style={[styles.compareValue, { color: colors.text }]}>🕐</Text>
                  <Text style={[styles.compareLabel, { color: colors.textFaint }]} numberOfLines={1}>
                    {item.averageDelay}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.viewBtn, { borderColor: colors.border }]}
                onPress={() => router.push(`/transfer/wizard?exchangerId=${item.id}` as any)}>
                <Text style={[styles.viewBtnText, { color: brand[700] }]}>Voir la fiche</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun échangeur disponible</Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  stats: { fontSize: 13, marginTop: -spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },

  card: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.lg, paddingLeft: spacing.xl, overflow: 'hidden' },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: brand[200],
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800' },
  availableBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  availableText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  compareRow: { flexDirection: 'row', marginTop: spacing.lg, borderRadius: radii.lg, padding: spacing.md },
  compareCell: { flex: 1, alignItems: 'center', gap: 2 },
  compareValue: { fontSize: 14, fontWeight: '900' },
  compareLabel: { fontSize: 10, textAlign: 'center' },
  compareDivider: { width: 1 },

  viewBtn: { marginTop: spacing.lg, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 12, alignItems: 'center' },
  viewBtnText: { fontSize: 14, fontWeight: '700' },

  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
