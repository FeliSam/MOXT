import { useCallback, useEffect, useState } from 'react';
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
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Gift,
  Shield,
  Star,
  XCircle,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';
import {
  createStarsPurchase,
  DEFAULT_PACKAGES,
  fetchStarsPackages,
  fetchStarsPurchases,
  starsPackMeta,
  type StarsPackage,
  type StarsPurchase,
} from '@/services/stars';

export default function StarsBuyScreen() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [packages, setPackages] = useState<StarsPackage[]>(DEFAULT_PACKAGES);
  const [purchases, setPurchases] = useState<StarsPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [packs, purcs] = await Promise.all([
        fetchStarsPackages(),
        fetchStarsPurchases(),
      ]);
      if (packs && packs.length) setPackages(packs);
      setPurchases(purcs);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const onBuy = async (pack: StarsPackage) => {
    setBuyingId(pack.id);
    try {
      const idempotencyKey = `BUY_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const result = await createStarsPurchase({
        packageId: pack.id,
        idempotencyKey,
        ownerType: 'user',
        ownerId: user?.id || null,
      });

      const purchaseId = (result as any)?.purchaseId || (result as any)?.purchase_id || (result as any)?.id || idempotencyKey;

      router.push({
        pathname: '/stars/checkout/[id]',
        params: {
          id: purchaseId,
          pack: JSON.stringify(pack),
        },
      });
    } catch (err: any) {
      showNotice(
        t('stars.purchaseFailedTitle') || 'Échec de l’achat',
        err?.message || t('stars.purchaseFailedBody') || 'Impossible d’initier l’achat de Stars.',
      );
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <AppChrome pathname="/stars/buy">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#6d28d9', '#4f46e5', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[11px] font-black uppercase tracking-widest text-white/80">
                {t('stars.eyebrow') || 'ÉCOSYSTÈME MOXT'}
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-white">
                {t('stars.buyTitle') || 'Acheter des Stars'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/stars')}
              className="size-10 items-center justify-center rounded-xl bg-white/20 active:opacity-70"
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
          </View>

          <Text className="mt-2 text-xs leading-relaxed text-white/90">
            {t('stars.buyDescription') ||
              'Rechargez votre compte en Stars pour publier vos annonces, mettre en avant vos services et booster votre visibilité.'}
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
              <CreditCard size={12} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">
                {t('stars.buyPayRub') || 'Paiement en Roubles (₽)'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
              <Shield size={12} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">
                {t('stars.buySecure') || '100% Sécurisé'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Packages Grid */}
        <View>
          <Text className="mb-3 text-sm font-black text-app-text">
            {t('stars.buyChoosePack') || 'Choisissez votre pack de Stars'}
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {packages.map((pack, index) => {
              const meta = starsPackMeta(pack.id, index);
              const totalStars = pack.stars + (pack.bonus_stars || 0);
              const unitPrice = (pack.price_rub / Math.max(1, totalStars)).toFixed(2);
              const isBuying = buyingId === pack.id;

              return (
                <View
                  key={pack.id}
                  style={styles.packCard}
                  className="rounded-2xl border border-app-border bg-app-surface overflow-hidden"
                >
                  {/* Top gradient banner */}
                  <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 14, paddingBottom: 20 }}
                  >
                    {meta.badge === 'popular' && (
                      <View className="self-start rounded-full bg-white/20 px-2 py-0.5 mb-1.5">
                        <Text className="text-[9px] font-black uppercase text-white tracking-wider">
                          Populaire
                        </Text>
                      </View>
                    )}
                    {meta.badge === 'best' && (
                      <View className="self-start rounded-full bg-amber-400/30 px-2 py-0.5 mb-1.5">
                        <Text className="text-[9px] font-black uppercase text-amber-200 tracking-wider">
                          Meilleure offre
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-3xl font-black text-white">{pack.stars}</Text>
                      {pack.bonus_stars ? (
                        <View className="flex-row items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 ml-1">
                          <Gift size={10} color="#ffffff" />
                          <Text className="text-[11px] font-black text-white">+{pack.bonus_stars}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[11px] text-white/80 mt-1">
                      Total : {totalStars} ★
                    </Text>
                  </LinearGradient>

                  {/* Bottom details & action */}
                  <View className="p-3.5 pt-3 gap-2 flex-1 justify-between bg-app-surface">
                    <View>
                      <Text className="text-xl font-black text-app-text">{pack.price_rub} ₽</Text>
                      <Text className="text-[10px] font-medium text-app-text-muted mt-0.5">
                        ~{unitPrice} ₽ / ★
                      </Text>
                    </View>

                    <Button
                      size="sm"
                      loading={isBuying}
                      onPress={() => onBuy(pack)}
                      icon={<Star size={14} color="#ffffff" fill="#ffffff" />}
                    >
                      Acheter
                    </Button>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Purchase History */}
        {purchases.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <Pressable
              onPress={() => setHistoryOpen((v) => !v)}
              className="flex-row items-center justify-between border-b border-app-border p-4 active:bg-app-surface-muted"
            >
              <View className="flex-row items-center gap-2">
                <CreditCard size={18} color="#64748b" />
                <Text className="text-sm font-black text-app-text">
                  {t('stars.purchasesTitle') || 'Commandes récentes'}
                </Text>
                <View className="rounded-full bg-app-surface-muted px-2 py-0.5">
                  <Text className="text-[10px] font-black text-app-text-muted">
                    {purchases.length}
                  </Text>
                </View>
              </View>
              {historyOpen ? (
                <ChevronUp size={20} color="#94a3b8" />
              ) : (
                <ChevronDown size={20} color="#94a3b8" />
              )}
            </Pressable>

            {historyOpen && (
              <View className="divide-y divide-app-border/60">
                {purchases.map((item) => {
                  const statusKey = String(item.status || 'pending').toLowerCase();
                  const totalStars = item.stars + (item.bonus_stars || 0);

                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center justify-between p-3.5 px-4"
                    >
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View className="size-9 rounded-xl bg-violet-500/10 items-center justify-center">
                          <Star size={18} color="#7c3aed" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-app-text" numberOfLines={1}>
                            Pack Stars {totalStars ? `(${totalStars}★)` : ''}
                          </Text>
                          <Text className="text-[10px] text-app-text-muted mt-0.5">
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end gap-1">
                        <Text className="text-xs font-black text-app-text">
                          {item.price_rub} ₽
                        </Text>
                        {statusKey === 'paid' ? (
                          <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5">
                            <CheckCircle size={10} color="#059669" />
                            <Text className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                              Payé
                            </Text>
                          </View>
                        ) : statusKey === 'failed' ? (
                          <View className="flex-row items-center gap-1 rounded-full bg-rose-500/12 px-2 py-0.5">
                            <XCircle size={10} color="#e11d48" />
                            <Text className="text-[9px] font-black text-rose-700 dark:text-rose-300">
                              Échoué
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5">
                            <Clock size={10} color="#d97706" />
                            <Text className="text-[9px] font-black text-amber-700 dark:text-amber-300">
                              En attente
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        )}
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
  packCard: {
    width: '48%',
    flexGrow: 1,
  },
});
