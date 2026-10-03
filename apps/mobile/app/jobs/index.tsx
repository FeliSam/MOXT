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
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

type JobItem = {
  id: string;
  title: string;
  company?: string;
  publisherName?: string;
  city?: string;
  location?: string;
  type?: string;
  status?: string;
  businessId?: string | null;
  created_at?: string;
  createdAt?: string;
};

export default function JobsScreen() {
  const colors = useThemeColors();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, title, company, city, type, status, business_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setJobs(
      ((data as (JobItem & { business_id?: string | null })[]) || []).map((row) => ({
        ...row,
        businessId: row.business_id,
      })),
    );
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
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const archived = job.status !== 'active';
      if (tab === 'active' ? archived : !archived) return false;
      if (!q) return true;
      return `${job.title} ${job.company || ''} ${job.publisherName || ''} ${job.city || ''} ${job.location || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [jobs, query, tab]);
  const activeCount = jobs.filter((job) => job.status === 'active').length;
  const archivedCount = jobs.length - activeCount;

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
        description={`${activeCount} offre(s) active(s)`}
      />
      <View style={styles.tabs}>
        {(
          [
            { key: 'active' as const, label: 'Actives', count: activeCount },
            { key: 'archived' as const, label: 'Archives', count: archivedCount },
          ]
        ).map((item) => {
          const on = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.tab, { backgroundColor: on ? brand[700] : colors.surfaceMuted }]}>
              <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '800', fontSize: 13 }}>
                {item.label} · {item.count}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
              {tab === 'archived' ? (
                <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>Archivé</Text>
              ) : null}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.cardCompany, { color: colors.primary }]} numberOfLines={1}>
                    {item.company || item.publisherName || 'Particulier'}
                  </Text>
                  {item.businessId ? <VerifiedIcon size={14} /> : null}
                </View>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {item.city || item.location || 'Russie'}
                  {item.created_at || item.createdAt ? ` · ${formatShortDate(item.created_at || item.createdAt)}` : ''}
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
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  tab: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
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
