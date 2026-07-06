import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { loadRatings, submitRating, Rating } from '@/store/ratings';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

function StarRow({ score, onSelect, colors }: { score: number; onSelect?: (n: number) => void; colors: any }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onSelect?.(n)} hitSlop={8}>
          <Text style={[styles.star, { color: n <= score ? '#f59e0b' : colors.border }]}>
            {n <= score ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RatingCard({ rating, colors }: { rating: Rating; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardUser, { color: colors.text }]}>{rating.fromUserName}</Text>
        <StarRow score={rating.score} colors={colors} />
      </View>
      {rating.comment ? <Text style={[styles.cardComment, { color: colors.textSecondary }]}>{rating.comment}</Text> : null}
      <Text style={[styles.cardDate, { color: colors.textFaint }]}>
        {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
      </Text>
    </View>
  );
}

export default function RatingsScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userName = useAppSelector((state) => {
    const u = state.auth.user;
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  const { received, averageScore, loading } = useAppSelector((state) => state.ratings);

  const [showForm, setShowForm] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userId) dispatch(loadRatings(userId));
  }, [dispatch, userId]);

  const handleSubmit = async () => {
    if (!userId || !targetUserId.trim()) {
      Alert.alert('ID destinataire requis');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        submitRating({
          fromUserId: userId,
          fromUserName: userName,
          toUserId: targetUserId.trim(),
          score,
          comment: comment.trim() || undefined,
        }),
      ).unwrap();
      Alert.alert('Merci !', 'Votre avis a été publié.');
      setShowForm(false);
      setTargetUserId('');
      setComment('');
      setScore(5);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <PageHeader eyebrow="COMMUNAUTÉ" title="Avis & Notations" />
        {averageScore != null ? (
          <View style={styles.avgRow}>
            <Text style={[styles.avgScore, { color: colors.primary }]}>{averageScore}</Text>
            <StarRow score={Math.round(averageScore)} colors={colors} />
            <Text style={[styles.avgCount, { color: colors.textMuted }]}>({received.length} avis reçus)</Text>
          </View>
        ) : (
          <Text style={[styles.noRating, { color: colors.textMuted }]}>Aucun avis reçu pour le moment.</Text>
        )}
        <Button variant={showForm ? 'secondary' : 'primary'} onPress={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Laisser un avis'}
        </Button>
      </View>

      {showForm ? (
        <View style={styles.form}>
          <Input
            label="ID de l'utilisateur à évaluer"
            value={targetUserId}
            onChangeText={setTargetUserId}
            placeholder="ID utilisateur"
          />
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Note</Text>
          <StarRow score={score} onSelect={setScore} colors={colors} />
          <Input
            label="Commentaire (optionnel)"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Votre expérience..."
            style={{ height: 70, textAlignVertical: 'top' }}
          />
          <Button variant="primary" onPress={handleSubmit} loading={submitting}>
            Publier l'avis
          </Button>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={received}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RatingCard rating={item} colors={colors} />}
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
