import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { buildBusinessContactSnapshot, openContactConversation } from '@moxt/shared/services/contactService.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
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
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <BackHeader inline title="Offre P2P" />
        <AppText className="text-app-text-muted">Cette offre n'est pas dans le catalogue chargé.</AppText>
      </View>
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <BackHeader inline title="Offre P2P" />
      <AppText className="text-2xl font-black text-app-text">{formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')}</AppText>
      <AppText className="text-base text-app-text-muted">
        {offer.fromCurrency} → {offer.toCurrency}
        {received ? ` · ${formatCurrency(received, offer.toCurrency, 'fr-FR')}` : ''}
      </AppText>
      <AppText className="text-sm text-app-text-muted">Taux {offer.rate}{offer.method ? ` · ${offer.method}` : ''}</AppText>
      {offer.ownerId && offer.ownerId !== user?.id ? (
        <Pressable onPress={() => void contact()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
            Contacter
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
