import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { loadWallet, WalletTransaction } from '@/store/wallet';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function WalletScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { balances, transactions, loading } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    if (userId) dispatch(loadWallet(userId));
  }, [dispatch, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
      <PageHeader eyebrow="FINANCE" title="Portefeuille" />

      {/* Balances */}
      <View style={styles.balancesRow}>
        {balances.map((b) => (
          <View
            key={b.currency}
            style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
          >
            <Text style={[styles.balanceCurrency, { color: colors.textSecondary }]}>{b.currency}</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>{formatCurrency(b.amount, b.currency)}</Text>
          </View>
        ))}
      </View>

      {/* Transactions */}
      <SectionHeading title="Historique" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
            >
              <View style={[styles.txIcon, { backgroundColor: item.type === 'credit' ? colors.successBg : colors.dangerBg }]}>
                <Text style={{ fontSize: 16 }}>{item.type === 'credit' ? '↓' : '↑'}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.txLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.txDate, { color: colors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'credit' ? colors.success : colors.danger }]}>
                {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>💰</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune transaction</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  balancesRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  balanceCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  balanceCurrency: { ...typography.label, fontSize: 12 },
  balanceAmount: { fontSize: 16, fontWeight: '900' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
  },
  txIcon: { width: 36, height: 36, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  txLabel: { ...typography.body, fontWeight: '600' },
  txDate: { ...typography.caption, fontSize: 11 },
  txAmount: { ...typography.body, fontWeight: '800' },
  empty: { paddingVertical: 40, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body },
});
