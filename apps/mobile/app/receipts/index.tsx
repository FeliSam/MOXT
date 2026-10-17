import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';
import { isE2eHarnessActive, readE2eFixtures } from '@/utils/e2eHarness';

type Receipt = {
  id: string;
  userId?: string;
  title?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  status?: string;
};

/** Liste des reçus : icône document + badge REÇU, défilement continu avec SmartNavbar. */
export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();

  const user = useAppSelector((state) => state.auth.user);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isE2eHarnessActive()) {
      const fixtures = readE2eFixtures()?.receipts || [];
      setReceipts(fixtures.filter((item) => !user?.id || !item.userId || item.userId === user.id) as Receipt[]);
      setReady(true);
      return undefined;
    }
    if (!supabase || !user?.id) {
      setReady(true);
      return undefined;
    }
    let alive = true;
    supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(
        ({ data }) => {
          if (!alive) return;
          setReceipts(fromRows(data || []) as Receipt[]);
          setReady(true);
        },
        () => {
          if (alive) setReady(true);
        },
      );
    return () => {
      alive = false;
    };
  }, [user?.id]);

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
          gap: 14,
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
              Mes reçus
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              {receipts.length} justificatif(s) archivé(s)
            </AppText>
          </View>
        </View>

        {receipts.length ? (
          receipts.map((receipt) => (
            <Pressable
              key={receipt.id}
              onPress={() => router.push(`/receipts/${receipt.id}` as never)}
              style={[
                {
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 8,
                },
                shadows.card,
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accentSoft,
                  }}>
                  <FileText size={18} color={colors.accent} />
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: colors.accentSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                  <AppText className="text-[10px] font-black text-app-accent">REÇU</AppText>
                </View>
              </View>
              <AppText className="text-base font-black text-app-text">{receipt.title || 'Opération de transfert'}</AppText>
              <AppText className="text-sm text-app-text-muted">
                <AppText className="text-sm font-bold text-app-text">
                  {formatMoney(receipt.amount, receipt.currency)}
                </AppText>
                {receipt.createdAt ? ` · ${formatTransferDate(receipt.createdAt)}` : ''}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <AppText className="text-xs font-bold text-app-accent">Consulter le reçu</AppText>
                <ChevronRight size={14} color={colors.accent} />
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title={ready ? 'Aucun reçu enregistré' : 'Chargement de vos reçus…'}
            description="Vos justificatifs officiels de transactions apparaîtront ici automatiquement."
          />
        )}
      </ScrollView>
    </View>
  );
}
