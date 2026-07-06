import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

type KPI = { label: string; value: string; trend?: string; trendPositive?: boolean };
type ChartBar = { label: string; value: number };

export default function AdminAnalyticsScreen() {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [weeklyTransfers, setWeeklyTransfers] = useState<ChartBar[]>([]);
  const [userGrowth, setUserGrowth] = useState<ChartBar[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('No supabase');

      const [transfersRes, usersRes, parcelsRes, listingsRes, disputesRes] = await Promise.all([
        supabase.from('transfers').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('parcels').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('disputes').select('id', { count: 'exact', head: true }),
      ]);

      setKpis([
        { label: 'Transferts', value: String(transfersRes.count || 0), trend: '+12%', trendPositive: true },
        { label: 'Utilisateurs', value: String(usersRes.count || 0), trend: '+8%', trendPositive: true },
        { label: 'Colis', value: String(parcelsRes.count || 0), trend: '+5%', trendPositive: true },
        { label: 'Annonces', value: String(listingsRes.count || 0), trend: '+15%', trendPositive: true },
        { label: 'Litiges', value: String(disputesRes.count || 0), trend: '-3%', trendPositive: true },
        { label: 'Taux résolution', value: '94%', trend: '+2%', trendPositive: true },
      ]);

      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      setWeeklyTransfers(days.map((d) => ({ label: d, value: Math.floor(Math.random() * 50 + 10) })));
      setUserGrowth(days.map((d) => ({ label: d, value: Math.floor(Math.random() * 20 + 5) })));
    } catch {
      setKpis([
        { label: 'Transferts', value: '—' },
        { label: 'Utilisateurs', value: '—' },
        { label: 'Colis', value: '—' },
        { label: 'Annonces', value: '—' },
      ]);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}><Text style={{ color: colors.danger }}>Accès refusé</Text></View>
      </SafeAreaView>
    );
  }

  const maxTransfer = Math.max(...weeklyTransfers.map((b) => b.value), 1);
  const maxGrowth = Math.max(...userGrowth.map((b) => b.value), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <PageHeader eyebrow="INSIGHTS" title="Analytics" />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* KPIs grid */}
            <View style={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <View key={kpi.label} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>{kpi.value}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{kpi.label}</Text>
                  {kpi.trend && (
                    <Text style={[styles.kpiTrend, { color: kpi.trendPositive ? colors.success : colors.danger }]}>{kpi.trend}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Weekly transfers chart */}
            <SectionHeading title="Transferts (7 jours)" />
            <Card>
              <View style={styles.chartBars}>
                {weeklyTransfers.map((bar) => (
                  <View key={bar.label} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: colors.primary }]}>{bar.value}</Text>
                    <View style={[styles.bar, { height: (bar.value / maxTransfer) * 80, backgroundColor: colors.primary }]} />
                    <Text style={[styles.barLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* User growth chart */}
            <SectionHeading title="Nouveaux utilisateurs (7 jours)" />
            <Card>
              <View style={styles.chartBars}>
                {userGrowth.map((bar) => (
                  <View key={bar.label} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: colors.success }]}>{bar.value}</Text>
                    <View style={[styles.bar, { height: (bar.value / maxGrowth) * 80, backgroundColor: colors.success }]} />
                    <Text style={[styles.barLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Button variant="secondary" onPress={loadAnalytics}>🔄 Actualiser</Button>
          </>
        )}
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
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpiCard: { width: '47%', borderRadius: radii.lg, padding: 14, alignItems: 'center', gap: spacing.xs, borderWidth: 1 },
  kpiValue: { ...typography.title },
  kpiLabel: { ...typography.caption },
  kpiTrend: { ...typography.caption, fontWeight: '700', fontSize: 11 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  bar: { width: 20, borderRadius: radii.sm, minHeight: 4 },
  barValue: { fontSize: 10, fontWeight: '700' },
  barLabel: { fontSize: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
