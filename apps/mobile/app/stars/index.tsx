import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Gift,
  Info,
  Package,
  Plus,
  RefreshCw,
  Repeat,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/store';
import {
  fetchStarsBalance,
  listStarsTransactions,
  type StarsBalance,
  type StarsTransaction,
} from '@/services/stars';

const HISTORY_PAGE_SIZE = 10;

const PRICING_ITEMS = [
  { label: 'Annonce Marketplace', cost: 5, icon: Tag, color: '#f59e0b' },
  { label: 'Offre d’Emploi', cost: 5, icon: Sparkles, color: '#0ea5e9' },
  { label: 'Événement', cost: 5, icon: Sparkles, color: '#8b5cf6' },
  { label: 'Transport de Colis', cost: 5, icon: Package, color: '#10b981' },
  { label: 'Vidéo courte', cost: 10, icon: Video, color: '#ec4899' },
  { label: 'Statut (24h)', cost: 3, icon: Zap, color: '#6366f1' },
  { label: 'Boost mise en avant (24h)', cost: 15, icon: TrendingUp, color: '#f97316' },
];

export default function StarsWalletScreen() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [balance, setBalance] = useState<StarsBalance | null>(null);
  const [transactions, setTransactions] = useState<StarsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [bal, txs] = await Promise.all([
        fetchStarsBalance('user', user?.id || null),
        listStarsTransactions('user', user?.id || null),
      ]);
      setBalance(bal);
      setTransactions(txs);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const total = balance?.total ?? 60;
  const bonus = balance?.bonusPool ?? 60;
  const paid = balance?.paid ?? 0;
  const poolQuota = balance?.quotas?.pool ?? 60;
  const poolPct = Math.min(100, Math.round((bonus / Math.max(1, poolQuota)) * 100));

  const totalSplit = bonus + paid;
  const bonusSplitPct = totalSplit > 0 ? Math.round((bonus / totalSplit) * 100) : 100;
  const paidSplitPct = Math.max(0, 100 - bonusSplitPct);

  const historyPageCount = Math.max(1, Math.ceil(transactions.length / HISTORY_PAGE_SIZE));
  const safePage = Math.min(historyPage, historyPageCount);
  const pagedHistory = useMemo(() => {
    const start = (safePage - 1) * HISTORY_PAGE_SIZE;
    return transactions.slice(start, start + HISTORY_PAGE_SIZE);
  }, [transactions, safePage]);

  return (
    <AppChrome pathname="/stars">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={['#f59e0b', '#7c3aed', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Header row */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[11px] font-black uppercase tracking-widest text-white/80">
                {t('stars.eyebrow') || 'ÉCOSYSTÈME MOXT'}
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-white">
                {t('stars.walletTitle') || 'Portefeuille Stars'}
              </Text>
            </View>
            <Pressable
              onPress={onRefresh}
              className="size-10 items-center justify-center rounded-xl bg-white/20 active:opacity-70"
              accessibilityLabel="Actualiser"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <RefreshCw size={18} color="#ffffff" />
              )}
            </Pressable>
          </View>

          {/* Large Balance */}
          <View className="mt-5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-white/75">
              {t('stars.totalAvailable') || 'Solde disponible total'}
            </Text>
            <View className="flex-row items-baseline mt-1">
              <Text className="text-5xl font-black text-white tracking-tight">
                {loading ? '…' : total}
              </Text>
              <Text className="text-2xl font-bold text-white/80 ml-1.5">★</Text>
            </View>
          </View>

          {/* Split bar */}
          <View className="mt-4">
            <View className="h-2 flex-row overflow-hidden rounded-full bg-white/25">
              {bonusSplitPct > 0 && (
                <View style={{ width: `${bonusSplitPct}%` }} className="h-full bg-emerald-300" />
              )}
              {paidSplitPct > 0 && (
                <View style={{ width: `${paidSplitPct}%` }} className="h-full bg-white" />
              )}
            </View>

            <View className="flex-row gap-2 mt-3">
              <View className="flex-1 rounded-xl bg-white/15 p-2.5">
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#fef08a" />
                  <Text className="text-[10px] font-bold uppercase text-white/80">
                    {t('stars.bonusPoolShort') || 'Bonus mensuel'}
                  </Text>
                </View>
                <Text className="text-lg font-black text-white mt-0.5">
                  {bonus} <Text className="text-xs font-bold text-white/70">★</Text>
                </Text>
              </View>

              <View className="flex-1 rounded-xl bg-white/15 p-2.5">
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#ffffff" />
                  <Text className="text-[10px] font-bold uppercase text-white/80">
                    {t('stars.paidBalance') || 'Solde acheté'}
                  </Text>
                </View>
                <Text className="text-lg font-black text-white mt-0.5">
                  {paid} <Text className="text-xs font-bold text-white/70">★</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Pool Meter */}
          <View className="mt-3 rounded-xl bg-white/15 p-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-[11px] font-bold text-white/85">
                {t('stars.bonusPoolSection') || 'Pool mensuel d’activité'}
              </Text>
              <Text className="text-[11px] font-black text-white">
                {bonus}/{poolQuota} ★
              </Text>
            </View>
            <View className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <View style={{ width: `${poolPct}%` }} className="h-full rounded-full bg-emerald-300" />
            </View>
            <Text className="text-[10px] text-white/70 mt-1.5">
              {t('stars.bonusPoolPeriodHint') || 'Renouvelé chaque mois pour vos publications et interactions.'}
            </Text>
          </View>

          {/* CTA Button */}
          <View className="mt-4">
            <Pressable
              onPress={() => router.push('/stars/buy')}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-white py-3 px-4 shadow-md active:bg-white/90"
            >
              <Star size={18} color="#7c3aed" fill="#7c3aed" />
              <Text className="text-sm font-black text-violet-900">
                {t('stars.buyCta') || 'Acheter des Stars'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Pricing Guide Accordion */}
        <Card className="p-0 overflow-hidden">
          <Pressable
            onPress={() => setGuideOpen((v) => !v)}
            className="flex-row items-center justify-between p-4 active:bg-app-surface-muted"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="size-9 rounded-xl bg-violet-500/10 items-center justify-center">
                <Star size={18} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-app-text">
                  {t('stars.pricingTitle') || 'Guide des tarifs Stars'}
                </Text>
                <Text className="text-xs text-app-text-muted mt-0.5">
                  {t('stars.pricingDebitHint') || 'Coût d’utilisation par type de publication'}
                </Text>
              </View>
            </View>
            {guideOpen ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
          </Pressable>

          {guideOpen && (
            <View className="border-t border-app-border px-4 py-2 divide-y divide-app-border/60">
              {PRICING_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <View key={item.label} className="flex-row items-center justify-between py-2.5">
                    <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                      <View
                        style={{ backgroundColor: `${item.color}15` }}
                        className="size-7 rounded-lg items-center justify-center"
                      >
                        <IconComponent size={14} color={item.color} />
                      </View>
                      <Text className="text-xs font-semibold text-app-text">{item.label}</Text>
                    </View>
                    <View className="rounded-md bg-brand-500/10 px-2 py-0.5">
                      <Text className="text-xs font-black text-brand-700 dark:text-brand-300">
                        {item.cost} ★
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Transaction History Card */}
        <Card className="p-0 overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-app-border px-4 py-3">
            <Text className="text-sm font-black text-app-text">
              {t('stars.historyTitle') || 'Historique des opérations'}
            </Text>
            {transactions.length > 0 && (
              <View className="rounded-full bg-app-surface-muted px-2 py-0.5">
                <Text className="text-[10px] font-black text-app-text-muted">
                  {transactions.length}
                </Text>
              </View>
            )}
          </View>

          <View className="p-4">
            {transactions.length === 0 ? (
              <View className="items-center py-6">
                <View className="size-12 rounded-2xl bg-app-surface-muted items-center justify-center mb-2">
                  <Star size={22} color="#94a3b8" />
                </View>
                <Text className="text-sm font-medium text-app-text-muted text-center">
                  {t('stars.historyEmpty') || 'Aucune opération Stars pour le moment.'}
                </Text>
                <Pressable
                  onPress={() => router.push('/stars/buy')}
                  className="mt-3 flex-row items-center gap-1"
                >
                  <Text className="text-xs font-black text-brand-700 dark:text-brand-300">
                    {t('stars.buyCta') || 'Acheter des Stars'}
                  </Text>
                  <ChevronRight size={14} color="#6366f1" />
                </Pressable>
              </View>
            ) : (
              <View className="gap-2">
                {pagedHistory.map((item) => {
                  const isCredit = item.type === 'credit';
                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center gap-3 rounded-xl border border-app-border/60 bg-app-surface p-3"
                    >
                      <View
                        className={`size-9 rounded-xl items-center justify-center ${
                          isCredit ? 'bg-emerald-500/12' : 'bg-amber-500/12'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={16} color="#059669" />
                        ) : (
                          <ArrowUpRight size={16} color="#d97706" />
                        )}
                      </View>
                      <View className="flex-1 pr-1">
                        <View className="flex-row items-baseline gap-1.5">
                          <Text
                            className={`text-sm font-black ${
                              isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isCredit ? '+' : '−'}
                            {Math.abs(item.amount)}★
                          </Text>
                          <Text className="text-xs font-bold text-app-text truncate flex-1" numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                        {item.category && (
                          <Text className="text-[10px] text-app-text-muted mt-0.5">
                            {item.category}
                          </Text>
                        )}
                      </View>
                      <Text className="text-[10px] font-semibold text-app-text-faint">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  );
                })}

                {historyPageCount > 1 && (
                  <View className="flex-row items-center justify-between border-t border-app-border/70 pt-3 mt-2">
                    <Pressable
                      disabled={safePage <= 1}
                      onPress={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className="flex-row items-center gap-1 rounded-lg border border-app-border px-3 py-1.5 active:bg-app-surface-muted disabled:opacity-40"
                    >
                      <ChevronLeft size={14} color="#64748b" />
                      <Text className="text-xs font-bold text-app-text">Précédent</Text>
                    </Pressable>
                    <Text className="text-xs font-black text-app-text-muted">
                      {safePage} / {historyPageCount}
                    </Text>
                    <Pressable
                      disabled={safePage >= historyPageCount}
                      onPress={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))}
                      className="flex-row items-center gap-1 rounded-lg border border-app-border px-3 py-1.5 active:bg-app-surface-muted disabled:opacity-40"
                    >
                      <Text className="text-xs font-bold text-app-text">Suivant</Text>
                      <ChevronRight size={14} color="#64748b" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
});
