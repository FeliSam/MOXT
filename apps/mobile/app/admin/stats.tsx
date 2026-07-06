import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

type Stats = {
  totalTransfers: number;
  completedTransfers: number;
  totalVolume: number;
  activeParcels: number;
  activeListings: number;
  totalUsers: number;
  activeJobs: number;
  pendingModeration: number;
};

function StatCard({ label, value, color, colors }: { label: string; value: string | number; color?: string; colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
      <Text style={[styles.statValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function BarChart({ data, colors }: { data: { label: string; value: number; color: string }[]; colors: any }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((d) => (
        <View key={d.label} style={styles.barRow}>
          <Text style={[styles.barLabel, { color: colors.textMuted }]}>{d.label}</Text>
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.barFill, { width: `${(d.value / maxVal) * 100}%`, backgroundColor: d.color }]} />
          </View>
          <Text style={[styles.barValue, { color: colors.text }]}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AdminStatsScreen() {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ label: string; value: number; color: string }[]>([]);

  useEffect(() => {
    if (!supabase || !isAdmin) { setLoading(false); return; }
    (async () => {
      const [transfers, parcels, listings, users, jobs] = await Promise.all([
        supabase.from('transfers').select('id, status, amount_sent', { count: 'exact' }),
        supabase.from('parcels').select('id, status', { count: 'exact' }).eq('status', 'active'),
        supabase.from('listings').select('id, status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id, status', { count: 'exact' }).eq('status', 'active'),
      ]);

      const allTransfers = transfers.data || [];
      const completed = allTransfers.filter((t: any) => t.status === 'completed');
      const volume = allTransfers.reduce((sum: number, t: any) => sum + (t.amount_sent || 0), 0);
      const allListings = listings.data || [];
      const pending = allListings.filter((l: any) => l.status === 'pending_moderation' || l.status === 'pending');

      setStats({
        totalTransfers: transfers.count || allTransfers.length,
        completedTransfers: completed.length,
        totalVolume: volume,
        activeParcels: parcels.count || (parcels.data || []).length,
        activeListings: allListings.filter((l: any) => l.status === 'active').length,
        totalUsers: users.count || (users.data || []).length,
        activeJobs: jobs.count || (jobs.data || []).length,
        pendingModeration: pending.length,
      });

      const months = [];
      const tealShades = [brand[800], brand[700], brand[600], brand[500], brand[400], brand[300]];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toLocaleDateString('fr-FR', { month: 'short' });
        const count = allTransfers.filter((t: any) => {
          if (!t.id) return false;
          return true;
        }).length;
        months.push({ label: monthStr, value: Math.round(count / 6), color: tealShades[5 - i] });
      }
      setMonthlyData(months);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.accessDenied, { color: colors.textMuted }]}>Accès réservé aux administrateurs.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Admin</Text>
        </Pressable>

        <PageHeader eyebrow="TABLEAU DE BORD" title="Statistiques" />

        {stats ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Transferts" value={stats.totalTransfers} color={colors.primary} colors={colors} />
              <StatCard label="Complétés" value={stats.completedTransfers} color={colors.success} colors={colors} />
              <StatCard label="Volume total" value={`${Math.round(stats.totalVolume / 1000)}K`} color="#7c3aed" colors={colors} />
              <StatCard label="Utilisateurs" value={stats.totalUsers} color={colors.teal} colors={colors} />
              <StatCard label="Colis actifs" value={stats.activeParcels} color={colors.warning} colors={colors} />
              <StatCard label="Annonces" value={stats.activeListings} color={colors.warm} colors={colors} />
              <StatCard label="Emplois" value={stats.activeJobs} color={colors.success} colors={colors} />
              <StatCard label="En modération" value={stats.pendingModeration} color={colors.danger} colors={colors} />
            </View>

            <Card>
              <SectionHeading title="Transferts par mois" />
              <BarChart data={monthlyData} colors={colors} />
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  accessDenied: { fontSize: 16, textAlign: 'center', marginTop: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    width: '47%',
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { ...typography.caption, textAlign: 'center' },
  chartContainer: { gap: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 40, ...typography.caption, textAlign: 'right' },
  barTrack: { flex: 1, height: 18, borderRadius: radii.sm, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radii.sm },
  barValue: { width: 30, ...typography.caption, fontWeight: '700' },
});
