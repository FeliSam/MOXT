import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { Input, PageHeader } from '@/components/ui';
import { ListCard } from '@/components/ui/ListCard';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

type JobItem = {
  id: string;
  title: string;
  company?: string;
  city?: string;
  type?: string;
  status?: string;
  created_at?: string;
};

export default function JobsScreen() {
  const colors = useThemeColors();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, title, company, city, type, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);
    setJobs((data as JobItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') fetchJobs();
  }, [authStatus, fetchJobs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  const filtered = useMemo(() => {
    if (!query.trim()) return jobs;
    const q = query.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.city || '').toLowerCase().includes(q),
    );
  }, [jobs, query]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Accueil</Text>
        </Pressable>
      </View>
      <PageHeader
        eyebrow="Recrutement"
        title="Jobs"
        description={`${filtered.length} offre(s) active(s)`}
      />
      <View style={styles.searchWrap}>
        <Input
          placeholder="Rechercher titre, entreprise, ville..."
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading && jobs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand[700]} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />
          }
          renderItem={({ item }) => (
            <ListCard
              className="relative overflow-hidden pr-28"
              onPress={() => router.push(`/jobs/${item.id}` as any)}>
              {/* Web : badge type absolu top-right */}
              <View style={[styles.typeBadge, {
                backgroundColor: item.company ? '#ecfdf8' : '#fff7ed',
              }]}>
                <Text style={[styles.typeBadgeText, {
                  color: item.company ? '#08705f' : '#b45309',
                }]}>
                  {item.company ? 'ENTREPRISE' : 'PARTICULIER'}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.company ? (
                  <Text style={[styles.cardCompany, { color: colors.primary }]}>
                    {item.company}
                  </Text>
                ) : null}
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {item.city || 'Russie'}
                  {item.created_at ? ` · ${formatShortDate(item.created_at)}` : ''}
                </Text>
              </View>
            </ListCard>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>💼</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune offre</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Les offres d'emploi apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  searchWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  card: {
    position: 'relative',
    borderRadius: radii.lg,
    padding: spacing.lg,
    paddingRight: 110,
    overflow: 'hidden',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  cardBody: { gap: spacing.xs },
  cardTitle: { ...typography.label },
  cardCompany: { fontSize: 13, fontWeight: '600' },
  cardMeta: { ...typography.caption },
  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
    lineHeight: 20,
    ...typography.body,
  },
});
