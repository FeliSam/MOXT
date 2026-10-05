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
  ArrowRightLeft,
  Calculator,
  ChevronRight,
  Handshake,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import {
  directionLabel,
  formatTransferDate,
} from '@moxt/shared/utils/transfers.js';

import { TransferCalculatorModal } from '@/components/transfers/TransferCalculatorModal';
import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
import { WebBadge } from '@/components/dashboard/webUi';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadDashboardData } from '@/store/dashboard';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { TransferItem } from '@/store/transfers';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing } from '@/theme/colors';

/** Même format que le web en français : espace de milliers et virgule (`15 450,00`). */
function formatTransferMoney(amount: unknown, currency?: string) {
  return String(formatCurrency(amount, currency, 'fr-FR') ?? '').replace(/[\u202f\u00a0]/g, ' ');
}

const P2P_STATUS: Record<string, string> = {
  created: 'En attente du vendeur',
  seller_accepted: 'À payer',
  waiting_payment: 'Paiement envoyé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

function TransferHistoryCard({ transfer }: { transfer: TransferItem }) {
  const colors = useThemeColors();
  const recipientName = [transfer.recipient?.firstName, transfer.recipient?.lastName]
    .filter(Boolean)
    .join(' ');
  const totalToPay = (transfer as any).totalToPay ?? (Number(transfer.amountSent || 0) + Number(transfer.fee || 0));
  const currFrom = transfer.currencyFrom || 'XOF';

  return (
    <Card className="relative" style={{ marginTop: 14, overflow: 'visible' }}>
      <View style={styles.statusBadge}>
        <TransferStatusBadge status={transfer.status} />
      </View>
      <Pressable onPress={() => router.push(`/transfer/${transfer.id}` as any)} style={styles.historyRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.ref, { color: colors.text }]}>{transfer.id}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {directionLabel(transfer.direction || '')} - {recipientName}
          </Text>
          {transfer.createdAt ? (
            <Text style={[styles.date, { color: colors.textFaint }]}>
              {formatTransferDate(transfer.createdAt)}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', maxWidth: 150 }}>
          <Text style={[styles.totalAmount, { color: colors.text }]}>
            {formatTransferMoney(totalToPay, currFrom)}
          </Text>
          <Text style={[styles.amountLine, { color: colors.textMuted }]}>
            Envoyé : {formatTransferMoney(transfer.amountSent, currFrom)}
          </Text>
          <Text style={[styles.amountLine, { color: colors.textMuted }]}>
            Frais : {formatTransferMoney(transfer.fee, currFrom)}
          </Text>
          <Text style={[styles.amountLine, { color: colors.textMuted }]}>
            Reçu : {transfer.receivedAmount ? formatTransferMoney(transfer.receivedAmount, transfer.currencyTo) : '—'}
          </Text>
        </View>
        <ChevronRight size={18} color={brand[700]} />
      </Pressable>
    </Card>
  );
}

function P2POrderCard({ order }: { order: Record<string, unknown> }) {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const status = String(order.status || 'created');
  const counterpart =
    order.buyerId === user?.id ? String(order.sellerName || 'Vendeur') : String(order.buyerName || 'Acheteur');
  const amount = Number(order.amount || 0);
  const from = String(order.fromCurrency || '');
  const to = String(order.toCurrency || '');

  return (
    <Card className="relative" style={{ marginTop: 8 }}>
      <Pressable onPress={() => router.push(`/p2p/orders/${order.id}` as never)} style={{ gap: 4 }}>
      <View style={styles.statusBadge}>
        <WebBadge tone={status === 'completed' ? 'success' : status === 'cancelled' ? 'danger' : status === 'waiting_payment' || status === 'disputed' ? 'warning' : 'info'}>
          {P2P_STATUS[status] || status}
        </WebBadge>
      </View>
      <Text style={[styles.ref, { color: colors.text }]}>{String(order.id)}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Avec {counterpart}</Text>
      <Text style={[styles.totalAmount, { color: colors.text, marginTop: 8 }]}>
        {amount ? `${amount} ${from}${to ? ` → ${to}` : ''}` : 'P2P'}
      </Text>
      </Pressable>
    </Card>
  );
}

export default function TransfersScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const items = useAppSelector((state) => state.transfers.items);
  const p2pOrders = useAppSelector((state) => state.dashboard.p2pOrders);
  const authStatus = useAppSelector((state) => state.auth.status);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tab, setTab] = useState<'transfers' | 'p2p'>('transfers');
  const [refreshing, setRefreshing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const visibleTransfers = useMemo(() => {
    if (!user?.id) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((transfer) => {
      if (transfer.userId && transfer.userId !== user.id) return false;
      if (statusFilter && transfer.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const recipientName = `${transfer.recipient?.firstName || ''} ${transfer.recipient?.lastName || ''}`.toLowerCase();
      return (
        transfer.id.toLowerCase().includes(normalizedQuery) ||
        recipientName.includes(normalizedQuery)
      );
    })
      .sort(
        (a, b) =>
          new Date(String(b.createdAt || (b as { updatedAt?: string }).updatedAt || 0)).getTime() -
          new Date(String(a.createdAt || (a as { updatedAt?: string }).updatedAt || 0)).getTime(),
      );
  }, [items, query, statusFilter, user?.id]);

  const myP2pOrders = useMemo(() => {
    if (!user?.id) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return (p2pOrders as Record<string, unknown>[])
      .filter((order) => order.buyerId === user.id || order.sellerId === user.id)
      .filter((order) => {
        if (!normalizedQuery) return true;
        const haystack = `${order.id || ''} ${order.sellerName || ''} ${order.buyerName || ''} ${order.fromCurrency || ''} ${order.toCurrency || ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
  }, [p2pOrders, query, user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dispatch(loadCoreData()), user?.id ? dispatch(loadDashboardData(user.id)) : Promise.resolve()]);
    setRefreshing(false);
  }, [dispatch, user?.id]);

  if (authStatus === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand[700]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={(tab === 'transfers' ? visibleTransfers : myP2pOrders) as { id: string }[]}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />
        }
        ListHeaderComponent={
          <>
            <PageHeader
              className="mx-0"
              eyebrow="Historique"
              title={translateLabel('Transferts')}
              description="Estimez, créez et suivez vos transferts entre le Bénin et la Russie."
              actions={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable
                    onPress={() => setCalculatorOpen(true)}
                    style={[styles.headerLink, { backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Calculator size={14} color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Calculatrice</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/transfer/wizard' as any)}
                    style={[styles.headerLink, { backgroundColor: brand[700], flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Plus size={15} color="#fff" strokeWidth={2.5} />
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Nouveau transfert</Text>
                  </Pressable>
                </View>
              }
            />

            <View style={styles.sectionHead}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Manrope_700Bold' }]}>
                  {tab === 'transfers' ? 'Historique' : 'Échanges P2P'}
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                  {tab === 'transfers'
                    ? `${visibleTransfers.length} opération(s)`
                    : `${myP2pOrders.length} échange(s) P2P`}
                </Text>
              </View>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                placeholder={tab === 'transfers' ? 'Référence, destinataire ou opération...' : 'Référence, contrepartie ou devise…'}
                placeholderTextColor={colors.textFaint}
                style={[styles.searchInput, { color: colors.text }]}
                value={query}
                onChangeText={setQuery}
              />
              <Pressable
                onPress={() => setFiltersOpen((value) => !value)}
                style={[styles.filterBtn, { backgroundColor: filtersOpen || statusFilter ? brand[700] : colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <SlidersHorizontal size={12} color={filtersOpen || statusFilter ? '#fff' : colors.textSecondary} />
                <Text style={{ fontSize: 12, color: filtersOpen || statusFilter ? '#fff' : colors.textSecondary, fontWeight: '700' }}>Filtres</Text>
              </Pressable>
            </View>
            {filtersOpen && tab === 'transfers' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <Pressable
                  onPress={() => setStatusFilter('')}
                  style={[styles.filterBtn, { backgroundColor: statusFilter ? colors.surfaceMuted : brand[700] }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: statusFilter ? colors.text : '#fff' }}>Tous les statuts</Text>
                </Pressable>
                {[...new Set(items.filter((item) => !item.userId || item.userId === user?.id).map((item) => item.status).filter(Boolean))].map((value) => (
                  <Pressable
                    key={String(value)}
                    onPress={() => setStatusFilter(String(value))}
                    style={[styles.filterBtn, { backgroundColor: statusFilter === value ? brand[700] : colors.surfaceMuted }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: statusFilter === value ? '#fff' : colors.text }}>
                      {String(value).split('_').join(' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={[styles.searchHint, { color: colors.textFaint }]}>
              Recherche dynamique · {(tab === 'transfers' ? visibleTransfers : myP2pOrders).length} résultat(s)
            </Text>

            <View style={[styles.tabs, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              {(
                [
                  { key: 'transfers' as const, label: 'Transfert', count: visibleTransfers.length },
                  { key: 'p2p' as const, label: 'Échanges P2P', count: myP2pOrders.length },
                ]
              ).map((item) => {
                const active = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setTab(item.key)}
                    style={[styles.tab, active ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border } : null]}>
                    <Text style={{ color: active ? colors.text : colors.textMuted, fontWeight: '900', fontSize: 13 }}>
                      {item.label}
                    </Text>
                    <View style={[styles.tabCount, { backgroundColor: active ? brand[700] : colors.surface }]}>
                      <Text style={{ color: active ? '#fff' : colors.textFaint, fontSize: 10, fontWeight: '900' }}>{item.count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        renderItem={({ item }) =>
          tab === 'transfers' ? (
            <TransferHistoryCard transfer={item as TransferItem} />
          ) : (
            <P2POrderCard order={item as Record<string, unknown>} />
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: brand[50] }]}>
              {tab === 'transfers' ? (
                <ArrowRightLeft size={28} color={brand[700]} />
              ) : (
                <Handshake size={28} color={brand[700]} />
              )}
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tab === 'transfers' ? 'Aucun transfert' : 'Aucun échange P2P'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {tab === 'transfers'
                ? 'Créez votre première opération.'
                : 'Vos commandes P2P apparaîtront ici après acceptation d’une offre.'}
            </Text>
            {tab === 'p2p' ? (
              <Pressable onPress={() => router.push('/p2p' as never)} style={[styles.headerLink, { backgroundColor: brand[700] }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Voir les offres P2P</Text>
              </Pressable>
            ) : null}
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

  headerCard: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  tabs: { flexDirection: 'row', gap: 4, marginBottom: spacing.md, borderRadius: radii.lg, borderWidth: 1, padding: 4 },
  tab: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
  tabCount: { borderRadius: 999, minWidth: 18, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  headerLink: { marginTop: 8, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
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
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    zIndex: 2,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  ref: { fontSize: 15, fontWeight: '800', paddingRight: 100 },
  subtitle: { fontSize: 13, marginTop: 4 },
  date: { fontSize: 11, marginTop: 2 },
  amountBlock: { marginTop: spacing.md, gap: 2 },
  totalAmount: { fontSize: 18, fontWeight: '900' },
  amountLine: { fontSize: 11 },
  arrow: { fontSize: 18, fontWeight: '700' },

  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 13, paddingHorizontal: spacing['2xl'] },
});
