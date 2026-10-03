import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { PageHeader } from '@/components/ui/PageHeader';
import { TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { supabase } from '@/services/supabase';
import { transferMatches } from '@/store/transfers';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { isE2eHarnessActive, readE2eFixtures } from '@/utils/e2eHarness';
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

type TimelineEvent = { status?: string; at?: string; label?: string };

/** Libellés de la chronologie web (transferTimelineLabels). */
const TIMELINE_LABELS: Record<string, string> = {
  pending_business_acceptance: "En attente d'acceptation",
  pending_payment: 'Transfert créé, paiement attendu',
  business_declined: "Demande refusée par l'entreprise",
  payment_declared: 'Paiement déclaré par le client',
  payment_received: 'Paiement reçu par le partenaire',
  processing: 'Ancien transfert en traitement',
  paid_out: "Transfert effectué par l'entreprise",
  completed: 'Paiement validé, transfert terminé',
  cancelled: 'Transfert annulé',
  expired: 'Délai de paiement expiré',
};

const RECEIPT_STATUS: Record<string, string> = {
  pending_payment: 'Paiement attendu',
  payment_declared: 'Paiement déclaré',
  payment_received: 'Paiement reçu',
  paid_out: 'Payé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  expired: 'Expiré',
};

/** Détail d’un reçu : icône, badge et chronologie Traitement, comme le web. */
export default function ReceiptDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeParam(params.id);
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const transfers = useAppSelector((state) => state.transfers.items);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isE2eHarnessActive()) {
      const fixtures = readE2eFixtures()?.receipts || [];
      const match = fixtures.find((item) => item.id === id && (!user?.id || !item.userId || item.userId === user.id));
      setReceipt(match ? (match as Receipt) : null);
      setReady(true);
      return undefined;
    }
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

  const transfer = receipt?.relatedId
    ? transfers.find((item) => transferMatches(item as never, String(receipt.relatedId)))
    : null;
  const statusKey = String((transfer as { status?: string } | null)?.status || receipt?.status || '');
  const statusLabel = RECEIPT_STATUS[statusKey] || TRANSFER_STATUS_LABELS[statusKey]?.label || statusKey || 'non défini';
  const timeline = Array.isArray((transfer as { timeline?: TimelineEvent[] } | null)?.timeline)
    ? ((transfer as { timeline?: TimelineEvent[] }).timeline as TimelineEvent[])
    : [];

  if (!receipt) {
    return (
      <AppChrome pathname="/receipts">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <PageHeader className="mx-0" title={ready ? 'Reçu introuvable' : 'Chargement…'} />
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
        <PageHeader
          className="mx-0"
          eyebrow="Reçu"
          title={receipt.title || 'Reçu'}
          description={`${formatMoney(receipt.amount, receipt.currency)} · ${receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}`}
          actions={
            <Pressable onPress={() => router.back()}>
              <AppText className="font-bold" style={{ color: colors.accent }}>Retour</AppText>
            </Pressable>
          }
        />
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
              <FileText size={22} color={colors.accent} />
            </View>
            <View style={{ borderRadius: 999, backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3 }}>
              <AppText className="text-[10px] font-black" style={{ color: colors.accent }}>REÇU</AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {fields.map(([label, value]) => (
              <View key={label} style={{ width: '48%', borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 12 }}>
                <AppText className="text-xs text-app-text-muted">{label}</AppText>
                <AppText className="mt-1 font-bold text-app-text">{value}</AppText>
              </View>
            ))}
          </View>
          {timeline.length ? (
            <View style={{ marginTop: 8, borderRadius: 16, backgroundColor: colors.surfaceMuted, padding: 14, gap: 8 }}>
              <AppText display className="text-sm text-app-text">Traitement</AppText>
              {timeline.map((event, index) => {
                const status = String(event.status || '');
                const label = event.label || TIMELINE_LABELS[status] || TRANSFER_STATUS_LABELS[status]?.label || status || 'Étape';
                return (
                  <View key={`${event.status}-${event.at}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <AppText className="flex-1 text-xs font-bold text-app-text">{label}</AppText>
                    <AppText className="text-xs text-app-text-muted">{event.at ? formatTransferDate(event.at) : ''}</AppText>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppChrome>
  );
}
