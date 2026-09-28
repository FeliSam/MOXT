import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadReviews, Review } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackHeader } from '@/components/chrome/BackHeader';

function StarRow({ score, colors }: { score: number; colors: any }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[styles.star, { color: n <= score ? '#f59e0b' : colors.border }]}>
          {n <= score ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({ review, colors }: { review: Review; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardUser, { color: colors.text }]}>{review.authorName || 'Membre MOXT'}</Text>
        <StarRow score={Math.round(Number(review.rating) || 0)} colors={colors} />
      </View>
      {review.comment ? <Text style={[styles.cardComment, { color: colors.textSecondary }]}>{review.comment}</Text> : null}
      {review.replyText ? (
        <Text style={[styles.cardComment, { color: colors.textMuted }]}>↳ {review.replyText}</Text>
      ) : null}
      <Text style={[styles.cardDate, { color: colors.textFaint }]}>
        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : ''}
      </Text>
    </View>
  );
}

/**
 * Avis reçus sur mon profil — table `reviews` comme le web (target_type user_profile).
 * L’ancienne table mobile `ratings` et son formulaire « noter un ID » sont supprimés :
 * sur le web, un avis se laisse depuis la page de la publication ou du profil (phase 3).
 */
export default function RatingsScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const received = useAppSelector((state) => state.account.reviewsReceived);
  const average = useAppSelector((state) => state.account.reviewsAverage);
  const loading = useAppSelector((state) => Boolean(state.account.loading.reviews));

  useEffect(() => {
    if (userId) dispatch(loadReviews(userId));
  }, [dispatch, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackHeader inline title="Avis" />
        <PageHeader eyebrow="COMMUNAUTÉ" title="Avis reçus" />
        {average != null ? (
          <View style={styles.avgRow}>
            <Text style={[styles.avgScore, { color: colors.primary }]}>{average.toFixed(1)}</Text>
            <StarRow score={Math.round(average)} colors={colors} />
            <Text style={[styles.avgCount, { color: colors.textMuted }]}>({received.length} avis reçus)</Text>
          </View>
        ) : (
          <Text style={[styles.noRating, { color: colors.textMuted }]}>Aucun avis reçu pour le moment.</Text>
        )}
      </View>

      {loading && !received.length ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={received}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ReviewCard review={item} colors={colors} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>⭐</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun avis reçu.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avgScore: { fontSize: 28, fontWeight: '900' },
  avgCount: { ...typography.bodySmall },
  noRating: { ...typography.body },
  form: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm },
  formLabel: { ...typography.label },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    borderRadius: radii.lg,
    padding: 14,
    gap: spacing.sm,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUser: { ...typography.label, fontSize: 15 },
  cardComment: { ...typography.body, lineHeight: 20 },
  cardDate: { ...typography.caption, fontSize: 11 },
  starRow: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 20 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.sm },
  emptyText: { fontSize: 16 },
});
