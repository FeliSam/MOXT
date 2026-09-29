import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, FileText } from 'lucide-react-native';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
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

/** Liste des reçus (web /receipts) : icône document + badge REÇU. */
export default function ReceiptsScreen() {
  const { colors } = useTheme();
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
    <AppChrome pathname="/receipts">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        {receipts.length ? receipts.map((receipt) => (
          <Pressable
            key={receipt.id}
            onPress={() => router.push(`/receipts/${receipt.id}` as never)}
            style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                <FileText size={18} color={colors.accent} />
              </View>
              <View style={{ borderRadius: 999, backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3 }}>
                <AppText className="text-[10px] font-black" style={{ color: colors.accent }}>REÇU</AppText>
              </View>
            </View>
            <AppText className="text-base font-black text-app-text">{receipt.title || 'Opération'}</AppText>
            <AppText className="text-sm text-app-text-muted">
              <AppText className="text-sm font-bold text-app-text">{formatMoney(receipt.amount, receipt.currency)}</AppText>
              {receipt.createdAt ? ` · ${formatTransferDate(receipt.createdAt)}` : ''}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <AppText className="text-sm font-bold" style={{ color: colors.accent }}>Voir le détail</AppText>
              <ChevronRight size={16} color={colors.accent} />
            </View>
          </Pressable>
        )) : (
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', gap: 8 }}>
            <FileText size={22} color={colors.textMuted} />
            <AppText className="font-black text-app-text">{ready ? 'Aucun reçu enregistré' : 'Chargement…'}</AppText>
          </View>
        )}
      </ScrollView>
    </AppChrome>
  );
}
