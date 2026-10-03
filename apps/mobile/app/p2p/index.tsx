import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { P2POfferCard } from '@/components/dashboard/P2POfferCard';
import { AppText } from '@/components/ui/AppText';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const CHECKLIST = [
  'Vérifiez le profil et la réputation du membre.',
  'Convenez du taux et du moyen de paiement dans la conversation.',
  'Ne payez qu’après l’acceptation du vendeur.',
  'Conservez vos preuves de paiement dans la commande.',
];

/** Catalogue P2P (P2PPage) : bannière, checklist, onglets Actives / Archives. */
export default function P2PScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const offers = useAppSelector((state) => state.dashboard.p2pOffers);
  const orders = useAppSelector((state) => state.dashboard.p2pOrders);
  const reviews = useAppSelector((state) => state.dashboard.reviews);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers
      .filter((offer) => (tab === 'active' ? offer.status === 'active' || !offer.status : offer.status !== 'active' && Boolean(offer.status)))
      .filter((offer) => {
        if (!q) return true;
        return `${offer.fromCurrency} ${offer.toCurrency} ${offer.ownerName || ''} ${offer.method || ''}`.toLowerCase().includes(q);
      });
  }, [offers, query, tab]);

  return (
    <AppChrome pathname="/p2p">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Échanges</AppText>
        <AppText className="text-2xl font-black text-app-text">Échanges P2P</AppText>
        <Pressable
          onPress={() => router.push('/p2p/publish' as never)}
          style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
            Proposer une offre
          </AppText>
        </Pressable>
        <View className="border border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/40" style={{ borderRadius: 16, padding: 14 }}>
          <AppText className="text-sm leading-5 text-app-text">
            MOXT ne détient pas vos fonds. L’échange se fait directement entre les deux membres.
          </AppText>
        </View>
        <View className="border border-app-border bg-app-surface" style={{ borderRadius: 16, padding: 14, gap: 8 }}>
          <AppText className="font-black text-app-text">Checklist confiance</AppText>
          {CHECKLIST.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <CheckCircle size={16} color={colors.accent} />
              <AppText className="flex-1 text-sm text-app-text-muted">{item}</AppText>
            </View>
          ))}
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Devise, méthode, utilisateur ou condition..."
          placeholderTextColor={colors.textFaint}
          style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { key: 'active' as const, label: 'Offres actives' },
              { key: 'archived' as const, label: 'Archives' },
            ]
          ).map((item) => {
            const active = tab === item.key;
            return (
              <Pressable key={item.key} onPress={() => setTab(item.key)} style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.accent : colors.surfaceMuted }}>
                <AppText className="text-sm font-bold" style={{ color: active ? (isDark ? '#020617' : '#fff') : colors.text }}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {visible.map((offer) => (
          <P2POfferCard
            key={offer.id}
            offer={offer}
            orders={orders}
            reviews={reviews}
            ownerVerified={Boolean(offer.businessId) || (offer.ownerId === user?.id && Boolean(user?.verified))}
          />
        ))}
        {!visible.length ? <AppText className="text-sm text-app-text-muted">Aucune offre pour cet onglet.</AppText> : null}
      </ScrollView>
    </AppChrome>
  );
}
