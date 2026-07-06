import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ALL_BADGES } from '@/store/badges';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { PageHeader } from '@/components/ui/PageHeader';

export default function BadgesScreen() {
  const colors = useThemeColors();
  const earned = useAppSelector((state) => state.badges.earned);
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>

        <PageHeader
          eyebrow="ACCOMPLISSEMENTS"
          title="Mes Badges"
          description={`${earned.length} / ${ALL_BADGES.length} débloqué(s)`}
        />

        <View style={styles.grid}>
          {ALL_BADGES.map((badge) => {
            const unlocked = earnedIds.has(badge.id);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  shadows.card,
                  !unlocked && { backgroundColor: colors.surfaceMuted, opacity: 0.7 },
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeLabel, { color: unlocked ? colors.text : colors.textFaint }]}>
                  {badge.label}
                </Text>
                <Text style={[styles.badgeDesc, { color: unlocked ? colors.textMuted : colors.textFaint }]}>
                  {badge.description}
                </Text>
                {unlocked ? (
                  <Text style={[styles.unlockTag, { color: colors.success }]}>Débloqué</Text>
                ) : (
                  <Text style={[styles.lockTag, { color: colors.textFaint }]}>Verrouillé</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: 14, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  grid: { gap: spacing.md, marginTop: spacing.sm },
  badgeCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 32 },
  badgeLabel: { ...typography.sectionTitle, marginTop: spacing.xs },
  badgeDesc: { ...typography.bodySmall },
  unlockTag: { ...typography.eyebrow, marginTop: spacing.sm },
  lockTag: { ...typography.eyebrow, marginTop: spacing.sm },
});
