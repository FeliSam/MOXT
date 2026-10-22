import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, FileText, Share2, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';
import { formatMoney, formatTransferDate } from '@moxt/shared/utils/transfers.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { supabase } from '@/services/supabase';
import { transferMatches } from '@/store/transfers';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';
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

const TIMELINE_LABELS: Record<string, string> = {
  pending_business_acceptance: "En attente d'acceptation",
  pending_payment: 'Paiement attendu',
  business_declined: "Demande refusée par l'entreprise",
  payment_declared: 'Paiement déclaré',
  payment_received: 'Paiement reçu',
  processing: 'En traitement',
  paid_out: 'Payé par le changeur',
  completed: 'Terminé avec succès',
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

export default function ReceiptDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeParam(params.id);
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
  const statusLabel = RECEIPT_STATUS[statusKey] || TRANSFER_STATUS_LABELS[statusKey]?.label || statusKey || 'Confirmé';
  const timeline = Array.isArray((transfer as { timeline?: TimelineEvent[] } | null)?.timeline)
    ? ((transfer as { timeline?: TimelineEvent[] }).timeline as TimelineEvent[])
    : [];

  const handleShare = async () => {
    if (!receipt) return;
    try {
      await Share.share({
        message: `Reçu MOXT — ${receipt.title || 'Transfert'}\nMontant : ${formatMoney(receipt.amount, receipt.currency)}\nDate : ${receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}\nRéf : ${receipt.id}`,
        title: `Reçu MOXT — ${receipt.id}`,
      });
    } catch {
      Alert.alert('Erreur', 'Partage impossible.');
    }
  };

  if (!receipt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: insets.top + 16 }}>
        <Pressable
          onPress={() => router.back()}
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
              marginBottom: 16,
            },
            shadows.card,
          ]}>
          <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
        </Pressable>
        <AppText className="text-center text-sm text-app-text-muted mt-8">
          {ready ? 'Ce reçu n’existe pas ou n’est plus accessible.' : 'Chargement…'}
        </AppText>
      </View>
    );
  }

  const fields = [
    ['Référence officielle', receipt.id],
    ['Montant de l’opération', formatMoney(receipt.amount, receipt.currency)],
    ['Date d’exécution', receipt.createdAt ? formatTransferDate(receipt.createdAt) : '—'],
    ['Statut', statusLabel],
  ];

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
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/receipts' as never))}
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
              {receipt.title || 'Reçu officiel'}
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              {formatMoney(receipt.amount, receipt.currency)} · {receipt.createdAt ? formatTransferDate(receipt.createdAt) : ''}
            </AppText>
          </View>
          <Button size="sm" variant="secondary" onPress={handleShare}>
            <Share2 size={15} color={colors.text} />
          </Button>
        </View>

        {/* Digital Receipt Card */}
        <View
          style={[
            {
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 20,
              gap: 16,
            },
            shadows.card,
          ]}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FileText size={24} color={colors.accent} />
            </View>
            <AppText className="text-xs font-black uppercase text-app-accent" style={{ letterSpacing: 1 }}>
              Reçu de transaction
            </AppText>
            <AppText className="text-2xl font-black text-app-text">
              {formatMoney(receipt.amount, receipt.currency)}
            </AppText>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: colors.accentSoft,
              }}>
              <AppText className="text-xs font-black text-app-accent">{statusLabel}</AppText>
            </View>
          </View>

          <View
            style={{
              height: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              marginVertical: 4,
            }}
          />

          <View style={{ gap: 10 }}>
            {fields.map(([label, value]) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText className="text-xs text-app-text-muted">{label}</AppText>
                <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                  {value}
                </AppText>
              </View>
            ))}
          </View>

          {timeline.length ? (
            <>
              <View
                style={{
                  height: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  marginVertical: 4,
                }}
              />
              <AppText className="text-xs font-black uppercase text-app-text">Étapes du traitement</AppText>
              <View style={{ gap: 8 }}>
                {timeline.map((ev, index) => (
                  <View key={String(ev.at || index)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <AppText className="text-xs font-bold text-app-text">
                        {ev.label || TIMELINE_LABELS[String(ev.status || '')] || ev.status || 'Étape'}
                      </AppText>
                      {ev.at ? <AppText className="text-[10px] text-app-text-muted">{formatTransferDate(ev.at)}</AppText> : null}
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View
            style={{
              height: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              marginVertical: 4,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#059669" />
            <AppText className="text-[11px] text-app-text-muted flex-1">
              Document officiel généré par MOXT. Conservez cet identifiant pour tout échange avec le support.
            </AppText>
          </View>
        </View>

        <Button variant="primary" size="lg" onPress={handleShare}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Share2 size={16} color="#ffffff" />
            <AppText className="text-sm font-bold text-white">Partager ce reçu</AppText>
          </View>
        </Button>

        {receipt.relatedId ? (
          <Button
            variant="secondary"
            onPress={() => router.push(`/transfer/${receipt.relatedId}` as never)}>
            Voir le détail du transfert associé
          </Button>
        ) : null}
      </ScrollView>
    </View>
  );
}
