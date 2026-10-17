import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Repeat,
  Send,
  Wallet,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { loadWallet } from '@/store/wallet';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';

export default function WalletScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { isDark } = useTheme();
  const { onScroll } = useSmartNavbarScroll();

  const userId = useAppSelector((state) => state.auth.user?.id);
  const { balances, transactions, loading } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    if (userId) dispatch(loadWallet(userId));
  }, [dispatch, userId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile' as never))}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              Portefeuille
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Soldes multi-devises et historique
            </AppText>
          </View>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              if (userId) dispatch(loadWallet(userId));
            }}>
            <RefreshCw size={15} color={colors.text} />
          </Button>
        </View>

        {/* Balances Grid */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Wallet size={16} color={colors.accent} />
            <AppText className="text-sm font-black text-app-text">Soldes disponibles</AppText>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {balances.map((b) => (
              <View
                key={b.currency}
                style={[
                  {
                    flexBasis: '48%',
                    flexGrow: 1,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: 14,
                    gap: 6,
                  },
                  shadows.card,
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText className="text-xs font-bold text-app-text-muted">{b.currency}</AppText>
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      backgroundColor: colors.accentSoft,
                    }}>
                    <AppText className="text-[10px] font-black text-app-accent">ACTIF</AppText>
                  </View>
                </View>
                <AppText className="text-xl font-black text-app-text" numberOfLines={1}>
                  {formatCurrency(b.amount, b.currency)}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            variant="primary"
            style={{ flex: 1 }}
            onPress={() => router.push('/transfer/wizard' as never)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Send size={15} color="#ffffff" />
              <AppText className="text-xs font-bold text-white">Transférer</AppText>
            </View>
          </Button>
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => router.push('/exchangers' as never)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Repeat size={15} color={colors.text} />
              <AppText className="text-xs font-bold text-app-text">Changeurs</AppText>
            </View>
          </Button>
        </View>

        {/* Transactions Section */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <AppText className="text-sm font-black text-app-text">Historique des opérations</AppText>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : transactions.length > 0 ? (
            <View style={{ gap: 8 }}>
              {transactions.map((item) => {
                const isCredit = item.type === 'credit';
                return (
                  <Card
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      gap: 12,
                    }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: isCredit
                          ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5'
                          : isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {isCredit ? (
                        <ArrowDownLeft size={18} color="#059669" />
                      ) : (
                        <ArrowUpRight size={18} color="#dc2626" />
                      )}
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                        {item.label}
                      </AppText>
                      <AppText className="text-[11px] text-app-text-muted mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </AppText>
                    </View>

                    <AppText
                      className="text-sm font-black"
                      style={{ color: isCredit ? '#059669' : '#dc2626' }}>
                      {isCredit ? '+' : '-'}
                      {formatCurrency(item.amount, item.currency)}
                    </AppText>
                  </Card>
                );
              })}
            </View>
          ) : (
            <EmptyState
              title="Aucune transaction"
              description="Vos opérations de dépôt, retrait et transfert s'afficheront ici."
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
