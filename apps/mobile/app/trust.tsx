import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { computeTrustScore, TrustLevel } from '@/store/trustScore';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

const LEVEL_CONFIG: Record<TrustLevel, { icon: string; label: string; color: string }> = {
  new: { icon: '🌱', label: 'Nouveau', color: '#94a3b8' },
  basic: { icon: '🥉', label: 'Basique', color: '#d97706' },
  verified: { icon: '🥈', label: 'Vérifié', color: '#6366f1' },
  trusted: { icon: '🥇', label: 'Fiable', color: '#08705f' },
  elite: { icon: '💎', label: 'Élite', color: '#7c3aed' },
};

export default function TrustScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { score, level, factors } = useAppSelector((state) => state.trustScore);
  const transfers = useAppSelector((state) => state.transfers.items);
  const ratings = useAppSelector((state) => state.ratings);
  const badges = useAppSelector((state) => state.badges.earned);

  useEffect(() => {
    const completedTransfers = transfers.filter((t) => t.status === 'completed').length;
    dispatch(computeTrustScore({
      transferCount: transfers.length,
      completedTransfers,
      ratingsAvg: ratings.averageScore,
      ratingsCount: ratings.received.length,
      kycVerified: false,
      accountAgeDays: 30,
      badgesEarned: badges.length,
    }));
  }, [dispatch, transfers, ratings, badges]);

  const cfg = LEVEL_CONFIG[level];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>

        <PageHeader eyebrow="RÉPUTATION" title="Score de confiance" />

        {/* Score circle */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={styles.levelIcon}>{cfg.icon}</Text>
          <Text style={[styles.scoreValue, { color: cfg.color }]}>{score}/100</Text>
          <Text style={[styles.levelLabel, { color: cfg.color }]}>Niveau {cfg.label}</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: cfg.color }]} />
          </View>
        </View>

        <SectionHeading title="Détail des facteurs" />
        {factors.map((f) => (
          <View key={f.key} style={[styles.factorCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[styles.factorLabel, { color: colors.text }]}>{f.label}</Text>
              <View style={[styles.factorTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View style={[styles.factorFill, { width: `${(f.points / f.maxPoints) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>
            <Text style={[styles.factorPts, { color: colors.primary }]}>{f.points}/{f.maxPoints}</Text>
          </View>
        ))}

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Améliorez votre score</Text>
          <Text style={[styles.tipBody, { color: colors.primary }]}>
            • Complétez des transferts avec succès{'\n'}
            • Vérifiez votre identité (KYC){'\n'}
            • Collectez des avis positifs{'\n'}
            • Débloquez des badges
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  scoreCard: { borderRadius: radii.xl, padding: spacing['2xl'], alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  levelIcon: { fontSize: 48 },
  scoreValue: { fontSize: 36, fontWeight: '900' },
  levelLabel: { fontSize: 16, fontWeight: '700' },
  progressTrack: { width: '100%', height: 8, borderRadius: radii.full, marginTop: spacing.sm },
  progressFill: { height: '100%', borderRadius: radii.full },
  factorCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.md, padding: 14, gap: 14, borderWidth: 1 },
  factorLabel: { ...typography.body, fontWeight: '600' },
  factorTrack: { height: 6, borderRadius: radii.full },
  factorFill: { height: '100%', borderRadius: radii.full },
  factorPts: { ...typography.body, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  tipCard: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1 },
  tipTitle: { ...typography.body, fontWeight: '800' },
  tipBody: { ...typography.bodySmall, lineHeight: 22 },
});
