import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { StatusBadge } from '@/components/ui/Badge';
import { useAppSelector } from '@/store/store';
import { supabase } from '@/services/supabase';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

type AdminListing = {
  id: string;
  title: string;
  status: string;
  owner_id: string;
  created_at: string;
};

export default function AdminScreen() {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const transfers = useAppSelector((state) => state.transfers.items);
  const listings = useAppSelector((state) => state.marketplace.items);

  const [pendingListings, setPendingListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin || !supabase) return;
    setLoading(true);
    supabase
      .from('listings')
      .select('id, title, status, owner_id, created_at')
      .in('status', ['pending_review', 'reported'])
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPendingListings((data as AdminListing[]) || []);
        setLoading(false);
      });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>🔒</Text>
          <Text style={[styles.accessTitle, { color: colors.text }]}>Accès réservé</Text>
          <Text style={[styles.accessText, { color: colors.textMuted }]}>Cette section est réservée aux administrateurs.</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Accueil</Text>
        </Pressable>
      </View>
      <PageHeader eyebrow="GESTION" title="Administration" />

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{transfers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Transferts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{listings.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Annonces</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{pendingListings.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>En attente</Text>
        </View>
      </View>

      {/* Link to advanced stats */}
      <Pressable
        style={[styles.statsLink, { borderColor: colors.primaryBorder, backgroundColor: colors.primaryLight }]}
        onPress={() => router.push('/admin/stats' as any)}
      >
        <Text style={[styles.statsLinkText, { color: colors.primary }]}>Voir statistiques détaillées →</Text>
      </Pressable>

      {/* Pending moderation */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Annonces à modérer</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={pendingListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.listingMeta, { color: colors.textFaint }]}>{item.id}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyMod}>
              <Text style={{ color: colors.textMuted }}>Aucune annonce en attente de modération.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing['3xl'] },
  accessTitle: { fontSize: 20, fontWeight: '800' },
  accessText: { textAlign: 'center', lineHeight: 20 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: radii.md,
    padding: 14,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
  },
  statNumber: { fontSize: 22, fontWeight: '900' },
  statLabel: { ...typography.eyebrow, fontSize: 11 },
  sectionTitle: { ...typography.sectionTitle, paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: 14,
    gap: spacing.md,
    borderWidth: 1,
  },
  listingTitle: { ...typography.body, fontWeight: '700' },
  listingMeta: { ...typography.caption, fontSize: 11 },
  emptyMod: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  statsLink: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statsLinkText: { ...typography.label, fontSize: 14 },
});
