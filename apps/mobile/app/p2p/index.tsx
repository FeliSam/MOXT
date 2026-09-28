import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { AppText } from '@/components/ui/AppText';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Catalogue P2P (offres actives déjà chargées pour le tableau de bord). */
export default function P2PScreen() {
  const { colors, isDark } = useTheme();
  const offers = useAppSelector((state) => state.dashboard.p2pOffers);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((offer) => offer.status === 'active' || !offer.status).filter((offer) => {
      if (!q) return true;
      return `${offer.fromCurrency} ${offer.toCurrency} ${offer.ownerName || ''}`.toLowerCase().includes(q);
    });
  }, [offers, query]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <BackHeader inline title="P2P" subtitle="Offres d'échange entre membres" />
      <Pressable
        onPress={() => router.push('/p2p/publish' as never)}
        style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
        <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
          Proposer une offre
        </AppText>
      </Pressable>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Devise, membre…"
        placeholderTextColor={colors.textFaint}
        style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text }}
      />
      {visible.map((offer) => {
        const received = p2pReceivedFromOffered(offer.amount, offer.rate);
        return (
          <Pressable key={offer.id} onPress={() => router.push(`/p2p/${offer.id}` as never)} className="border border-app-border bg-app-surface" style={{ borderRadius: 16, padding: 14, gap: 4 }}>
            <AppText className="text-base font-black text-app-text">
              {formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} → {offer.toCurrency}
            </AppText>
            <AppText className="text-sm text-app-text-muted">
              {received ? `Équivalent ${formatCurrency(received, offer.toCurrency, 'fr-FR')}` : `Taux ${offer.rate}`}
              {offer.ownerName ? ` · ${offer.ownerName}` : ''}
            </AppText>
          </Pressable>
        );
      })}
      {!visible.length ? <AppText className="text-sm text-app-text-muted">Aucune offre active pour le moment.</AppText> : null}
    </ScrollView>
  );
}
