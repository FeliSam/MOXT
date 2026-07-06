import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { loadDisputes, DisputeStatus } from '@/store/disputes';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_CONFIG: Record<DisputeStatus, { label: string; tone: Tone }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  in_review: { label: 'En examen', tone: 'info' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Fermé', tone: 'neutral' },
  escalated: { label: 'Escaladé', tone: 'danger' },
};

const REASON_LABELS: Record<string, string> = {
  non_received: 'Non reçu',
  wrong_amount: 'Montant incorrect',
  fraud: 'Fraude suspectée',
  damaged: 'Endommagé',
  delay: 'Retard excessif',
  other: 'Autre',
};

export default function DisputesScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const { items, loading } = useAppSelector((s) => s.disputes);

  useEffect(() => {
    if (userId) dispatch(loadDisputes(userId));
  }, [dispatch, userId]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
        <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
      </Pressable>

      <PageHeader
        eyebrow="LITIGES"
        title="Mes litiges"
        actions={
          <Button size="sm" onPress={() => router.push('/disputes/create' as any)}>
            + Nouveau
          </Button>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => { if (userId) dispatch(loadDisputes(userId)); }}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <Pressable onPress={() => router.push(`/disputes/${item.id}` as any)}>
              <Card variant="interactive" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {REASON_LABELS[item.reason] || item.reason}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                      {item.relatedType} • {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Badge tone={cfg.tone}>{cfg.label}</Badge>
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>✅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun litige en cours
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  card: { padding: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardBody: { flex: 1, gap: spacing.xs },
  cardTitle: { ...typography.label },
  cardSub: { ...typography.bodySmall },
  cardMeta: { fontSize: 11 },
  empty: { paddingVertical: spacing['3xl'], alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body },
});
