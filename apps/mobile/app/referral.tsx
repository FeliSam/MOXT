import { useEffect } from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { loadReferralData, Referral } from '@/store/referral';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUS_TONE: Record<string, 'warning' | 'brand' | 'success'> = {
  pending: 'warning',
  confirmed: 'brand',
  rewarded: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  rewarded: 'Récompensé',
};

export default function ReferralScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { code, referrals, totalRewards, loading } = useAppSelector((state) => state.referral);

  useEffect(() => {
    if (userId) dispatch(loadReferralData(userId));
  }, [dispatch, userId]);

  const handleShare = async () => {
    if (!code) return;
    await Share.share({
      message: `Rejoins MOXT avec mon code de parrainage : ${code}\nTélécharge l'app et entre ce code pour obtenir un bonus !`,
      title: 'Parrainage MOXT',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
      <PageHeader eyebrow="RÉCOMPENSES" title="Parrainage" />

      {/* Code card */}
      <View style={[styles.codeCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
        <Text style={[styles.codeLabel, { color: colors.primary }]}>Mon code de parrainage</Text>
        <Text style={[styles.codeValue, { color: colors.primary }]}>{code || '...'}</Text>
        <Button variant="primary" onPress={handleShare}>Partager mon code</Button>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{referrals.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Filleuls</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.statNum, { color: colors.success }]}>{totalRewards}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XOF gagnés</Text>
        </View>
      </View>

      {/* Referrals list */}
      <FlatList
        data={referrals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.cardName, { color: colors.text }]}>{item.referredUserName}</Text>
              <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🤝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Invitez vos amis pour gagner des récompenses !</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  codeCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
  },
  codeLabel: { ...typography.label },
  codeValue: { fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  statCard: { flex: 1, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.xs, borderWidth: 1 },
  statNum: { ...typography.title },
  statLabel: { ...typography.caption },
  list: { padding: spacing.xl, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.md, padding: 14, gap: spacing.md, borderWidth: 1 },
  cardName: { ...typography.label, fontSize: 15 },
  cardDate: { fontSize: 11, fontWeight: '500' },
  empty: { paddingVertical: 40, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing['3xl'] },
});
