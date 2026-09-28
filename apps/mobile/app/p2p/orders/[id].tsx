import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { AppText } from '@/components/ui/AppText';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const STATUS: Record<string, string> = {
  created: 'En attente du vendeur',
  seller_accepted: 'À payer',
  waiting_payment: 'Paiement envoyé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

/** Fiche lecture d’une commande P2P (même source que l’historique web). */
export default function P2POrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const order = useAppSelector((state) =>
    (state.dashboard.p2pOrders as Record<string, unknown>[]).find((item) => item.id === id),
  );

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <BackHeader inline title="Transaction P2P" />
        <AppText className="mt-4 text-sm text-app-text-muted">Transaction introuvable.</AppText>
      </View>
    );
  }

  const counterpart =
    order.buyerId === userId ? String(order.sellerName || 'Vendeur') : String(order.buyerName || 'Acheteur');
  const amount = Number(order.amount || 0);
  const from = String(order.fromCurrency || '');
  const to = String(order.toCurrency || '');
  const status = String(order.status || 'created');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <BackHeader inline title="Transaction P2P" subtitle={`${order.sellerName || 'Vendeur'} vers ${order.buyerName || 'Acheteur'}`} />
      <View className="border border-app-border bg-app-surface" style={{ borderRadius: 16, padding: 16, gap: 8 }}>
        <AppText className="text-xs font-black uppercase text-app-text-muted">{String(order.id)}</AppText>
        <AppText className="text-lg font-black text-app-text">{STATUS[status] || status}</AppText>
        <AppText className="text-sm text-app-text-muted">Avec {counterpart}</AppText>
        {amount ? (
          <AppText className="text-base font-bold text-app-text">
            {formatCurrency(amount, from || 'XOF', 'fr-FR')}
            {to ? ` → ${to}` : ''}
          </AppText>
        ) : null}
        <AppText className="text-sm leading-5 text-app-text-muted">
          Cette opération est traitée via MOXT. Restez vigilant et conservez vos preuves dans la conversation.
        </AppText>
      </View>
    </ScrollView>
  );
}
