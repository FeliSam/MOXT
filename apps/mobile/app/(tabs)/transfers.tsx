import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  directionLabel,
  formatMoney,
  formatTransferDate,
} from '@moxt/shared/utils/transfers.js';

import { TransferCalculatorModal } from '@/components/transfers/TransferCalculatorModal';
import { TransferPageHeader } from '@/components/transfers/TransferPageHeader';
import { ListCard } from '@/components/ui/ListCard';
import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { TransferItem } from '@/store/transfers';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing } from '@/theme/colors';

function TransferHistoryCard({ transfer }: { transfer: TransferItem }) {
  const colors = useThemeColors();
  const recipientName = [transfer.recipient?.firstName, transfer.recipient?.lastName]
    .filter(Boolean)
    .join(' ');
  const st =
    TRANSFER_STATUS_LABELS[transfer.status ?? 'pending_payment'] ||
    TRANSFER_STATUS_LABELS.pending_payment;
  const totalToPay = (transfer as any).totalToPay ?? (Number(transfer.amountSent || 0) + Number(transfer.fee || 0));
  const currFrom = transfer.currencyFrom || 'XOF';

  return (
    <ListCard
      finance
      className="relative"
      onPress={() => router.push(`/transfer/${transfer.id}` as any)}>
      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
      </View>

      <Text style={[styles.ref, { color: colors.text }]}>{transfer.id}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {directionLabel(transfer.direction || '')} - {recipientName}
      </Text>
      {transfer.createdAt ? (
        <Text style={[styles.date, { color: colors.textFaint }]}>
          {formatTransferDate(transfer.createdAt)}
        </Text>
      ) : null}

      <View style={styles.amountBlock}>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          {formatMoney(totalToPay, currFrom)}
        </Text>
        <Text style={[styles.amountLine, { color: colors.textMuted }]}>
          Envoyé: {formatMoney(transfer.amountSent, currFrom)}
        </Text>
        <Text style={[styles.amountLine, { color: colors.textMuted }]}>
          Frais: {formatMoney(transfer.fee, currFrom)}
        </Text>
        <Text style={[styles.amountLine, { color: colors.textMuted }]}>
          Reçu: {transfer.receivedAmount ? formatMoney(transfer.receivedAmount, transfer.currencyTo) : '—'}
        </Text>
      </View>

      <Text style={[styles.arrow, { color: brand[700] }]}>→</Text>
    </ListCard>
  );
}

export default function TransfersScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const items = useAppSelector((state) => state.transfers.items);
  const authStatus = useAppSelector((state) => state.auth.status);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const visibleTransfers = useMemo(() => {
    if (!user?.id) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((transfer) => {
      if (transfer.userId && transfer.userId !== user.id) return false;
      if (!normalizedQuery) return true;
      const recipientName = `${transfer.recipient?.firstName || ''} ${transfer.recipient?.lastName || ''}`.toLowerCase();
      return (
        transfer.id.toLowerCase().includes(normalizedQuery) ||
        recipientName.includes(normalizedQuery)
      );
    });
  }, [items, query, user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(loadCoreData());
    setRefreshing(false);
  }, [dispatch]);

  if (authStatus === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand[700]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={visibleTransfers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />
        }
        ListHeaderComponent={
          <>
            <TransferPageHeader
              eyebrow="Historique"
              title={translateLabel('Transferts')}
              description="Estimez, créez et suivez vos transferts entre le Bénin et la Russie."
              actions={[
                { label: 'Calculatrice', onPress: () => setCalculatorOpen(true) },
                { label: 'Nouveau transfert', onPress: () => router.push('/transfer/wizard' as any), primary: true },
              ]}
            />

            <View style={styles.sectionHead}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                  {visibleTransfers.length} opération(s)
                </Text>
              </View>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
              <Text>🔍</Text>
              <TextInput
                placeholder="Référence, destinataire ou opération..."
                placeholderTextColor={colors.textFaint}
                style={[styles.searchInput, { color: colors.text }]}
                value={query}
                onChangeText={setQuery}
              />
              <Pressable style={[styles.filterBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700' }}>Filtres</Text>
              </Pressable>
            </View>
            <Text style={[styles.searchHint, { color: colors.textFaint }]}>
              Recherche dynamique · {visibleTransfers.length} résultat(s)
            </Text>
          </>
        }
        renderItem={({ item }) => <TransferHistoryCard transfer={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: brand[50] }]}>
              <Text style={{ fontSize: 32 }}>💸</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun transfert</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Créez votre première opération.
            </Text>
          </View>
        }
      />

      <TransferCalculatorModal visible={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: BOTTOM_NAV_PADDING, gap: spacing.md },

  sectionHead: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionSub: { fontSize: 13, marginTop: 2 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: spacing.xs,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  searchHint: { fontSize: 11, marginBottom: spacing.md },

  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  ref: { fontSize: 15, fontWeight: '800', paddingRight: 100 },
  subtitle: { fontSize: 13, marginTop: 4 },
  date: { fontSize: 11, marginTop: 2 },
  amountBlock: { marginTop: spacing.md, gap: 2 },
  totalAmount: { fontSize: 18, fontWeight: '900' },
  amountLine: { fontSize: 11 },
  arrow: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, fontSize: 18, fontWeight: '700' },

  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 13, paddingHorizontal: spacing['2xl'] },
});
