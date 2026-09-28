import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

type Receipt = {
  id: string;
  userId?: string;
  title?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  status?: string;
};

/** Liste des reçus (web /receipts). */
export default function ReceiptsScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
        <AppText className="text-xs font-black uppercase text-app-text-muted">Finances</AppText>
        <AppText className="text-2xl font-black text-app-text">Reçus</AppText>
        <AppText className="text-sm text-app-text-muted">Justificatifs de vos opérations enregistrées sur MOXT.</AppText>
        {receipts.length ? receipts.map((receipt) => (
          <Pressable
            key={receipt.id}
            onPress={() => router.push(`/receipts/${receipt.id}` as never)}
            style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 6 }}>
            <AppText className="text-xs font-bold" style={{ color: colors.accent }}>Reçu</AppText>
            <AppText className="text-base font-black text-app-text">{receipt.title || 'Opération'}</AppText>
            <AppText className="text-sm font-bold text-app-text">{formatMoney(receipt.amount, receipt.currency)}</AppText>
            <AppText className="text-xs text-app-text-muted">{receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}</AppText>
            <AppText className="text-sm font-bold" style={{ color: colors.accent }}>Voir le détail</AppText>
          </Pressable>
        )) : (
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
            <AppText className="font-black text-app-text">{ready ? 'Aucun reçu enregistré' : 'Chargement…'}</AppText>
          </View>
        )}
      </ScrollView>
    </AppChrome>
  );
}
