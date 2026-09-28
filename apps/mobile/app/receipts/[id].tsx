import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { supabase } from '@/services/supabase';
import { transferMatches } from '@/store/transfers';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { routeParam } from '@/utils/routeParam';

type Receipt = {
  id: string;
  userId?: string;
  title?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  status?: string;
  relatedId?: string;
};

/** Détail d’un reçu (web /receipts/:receiptId). */
export default function ReceiptDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeParam(params.id);
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const transfers = useAppSelector((state) => state.transfers.items);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase || !id || !user?.id) {
      setReady(true);
      return undefined;
    }
    let alive = true;
    supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!alive) return;
          setReceipt(data ? (fromRow(data) as Receipt) : null);
          setReady(true);
        },
        () => {
          if (alive) setReady(true);
        },
      );
    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  const transfer = receipt?.relatedId ? transfers.find((item) => transferMatches(item as never, String(receipt.relatedId))) : null;
  const statusLabel = transfer
    ? TRANSFER_STATUS_LABELS[String((transfer as { status?: string }).status || '')]?.label || String((transfer as { status?: string }).status || '')
    : receipt?.status || 'non défini';

  function share() {
    if (!receipt) return;
    const text = [
      'MOXT — REÇU',
      `Référence: ${receipt.id}`,
      `Objet: ${receipt.title || ''}`,
      `Montant: ${formatMoney(receipt.amount, receipt.currency)}`,
      `Statut: ${statusLabel}`,
      `Créé le: ${receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}`,
      'Conservez ce document comme justificatif de votre opération.',
    ].join('\n');
    void Share.share({ message: text });
  }

  if (!receipt) {
    return (
      <AppChrome pathname="/receipts">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-2xl font-black text-app-text">{ready ? 'Reçu introuvable' : 'Chargement…'}</AppText>
          {ready ? <AppText className="text-sm text-app-text-muted">Ce reçu n’existe pas ou n’est plus accessible.</AppText> : null}
          <Pressable onPress={() => router.replace('/receipts' as never)}>
            <AppText className="font-bold" style={{ color: colors.accent }}>Retour aux reçus</AppText>
          </Pressable>
        </View>
      </AppChrome>
    );
  }

  const fields = [
    ['Référence', receipt.id],
    ['Montant', formatMoney(receipt.amount, receipt.currency)],
    ['Date', receipt.createdAt ? formatTransferDate(receipt.createdAt) : '—'],
    ['Statut', statusLabel],
  ];

  return (
    <AppChrome pathname="/receipts">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 128 }}>
        <Pressable onPress={() => router.back()}>
          <AppText className="font-bold" style={{ color: colors.accent }}>← Retour</AppText>
        </Pressable>
        <AppText className="text-xs font-black uppercase text-app-text-muted">Finances</AppText>
        <AppText className="text-2xl font-black text-app-text">{receipt.title || 'Reçu'}</AppText>
        <AppText className="text-sm text-app-text-muted">
          {formatMoney(receipt.amount, receipt.currency)} · {receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}
        </AppText>
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
          <AppText className="text-xs font-bold" style={{ color: colors.accent }}>Reçu</AppText>
          {fields.map(([label, value]) => (
            <View key={label} style={{ borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 12 }}>
              <AppText className="text-xs text-app-text-muted">{label}</AppText>
              <AppText className="mt-1 font-bold text-app-text">{value}</AppText>
            </View>
          ))}
          {transfer ? (
            <Pressable onPress={() => router.push(`/transfer/${(transfer as { id: string }).id}` as never)}>
              <AppText className="font-bold" style={{ color: colors.accent }}>Voir le transfert</AppText>
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={share} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: '#fff' }}>Partager</AppText>
        </Pressable>
      </ScrollView>
    </AppChrome>
  );
}
