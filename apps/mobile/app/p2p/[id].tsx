import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { openContactConversation } from '@moxt/shared/services/contactService.js';
import { buildAcceptedOrder, syncP2pOrder } from '@moxt/shared/services/p2pOrderWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { loadDashboardData } from '@/store/dashboard';
import { mapConversationRow, receiveRemoteConversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** Fiche d'offre P2P : montants et contact du vendeur. */
export default function P2PDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const offer = useAppSelector((state) => state.dashboard.p2pOffers.find((item) => item.id === id));
  if (!offer) {
    return (
      <AppChrome pathname="/p2p">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-app-text-muted">Cette offre n'est pas dans le catalogue chargé.</AppText>
        </View>
      </AppChrome>
    );
  }
  const received = p2pReceivedFromOffered(offer.amount, offer.rate);

  async function contact() {
    if (!user?.id || !offer?.ownerId || !supabase) {
      router.push('/login' as never);
      return;
    }
    try {
      const result = await openContactConversation(supabase, {
        createdBy: user.id,
        ownerId: offer.ownerId,
        relatedType: 'p2p',
        relatedId: offer.id,
        relatedPath: `/p2p/${offer.id}`,
        relatedSnapshot: {
          type: 'p2p',
          id: offer.id,
          title: `${offer.amount} ${offer.fromCurrency}`,
          path: `/p2p/${offer.id}`,
          subtitle: `${offer.fromCurrency} → ${offer.toCurrency}`,
          badge: 'P2P',
          details: [],
        },
      });
      dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
      router.push(`/messages/${result.id}` as never);
    } catch (error) {
      showNotice('Contacter', error instanceof Error ? error.message : 'Conversation impossible.');
    }
  }

  async function accept() {
    if (!user || !supabase || !offer) {
      router.push('/login' as never);
      return;
    }
    try {
      const order = buildAcceptedOrder(user, offer);
      await syncP2pOrder(supabase, order, { ...offer, status: 'accepted' });
      await dispatch(loadDashboardData(user.id));
      router.replace(`/p2p/orders/${order.id}` as never);
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Acceptation impossible.');
    }
  }

  return (
    <AppChrome pathname="/p2p">
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
      <AppText className="text-2xl font-black text-app-text">{formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')}</AppText>
      <AppText className="text-base text-app-text-muted">
        {offer.fromCurrency} → {offer.toCurrency}
        {received ? ` · ${formatCurrency(received, offer.toCurrency, 'fr-FR')}` : ''}
      </AppText>
      <AppText className="text-sm text-app-text-muted">Taux {offer.rate}{offer.method ? ` · ${offer.method}` : ''}</AppText>
      {offer.ownerId && offer.ownerId !== user?.id && offer.status !== 'accepted' ? (
        <Pressable onPress={() => void accept()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Accepter l’offre</AppText>
        </Pressable>
      ) : null}
      {offer.ownerId && offer.ownerId !== user?.id ? (
        <Pressable onPress={() => void contact()} className="border border-app-border" style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <AppText className="font-bold text-app-text">Contacter</AppText>
        </Pressable>
      ) : null}
    </ScrollView>
    </AppChrome>
  );
}
