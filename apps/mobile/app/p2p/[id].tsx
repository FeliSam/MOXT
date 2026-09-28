import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';

import { calculateP2PFee, p2pOfferFromRemoteRow, p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { openContactConversation } from '@moxt/shared/services/contactService.js';
import { buildAcceptedOrder, syncP2pOrder } from '@moxt/shared/services/p2pOrderWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { loadDashboardData, upsertP2POffer, type P2POffer } from '@/store/dashboard';
import { mapConversationRow, receiveRemoteConversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { idFromPath, routeParam } from '@/utils/routeParam';
import { showNotice } from '@/utils/notice';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText className="text-sm text-app-text-muted">{label}</AppText>
      <AppText className="text-sm font-bold text-app-text" style={{ flexShrink: 1, textAlign: 'right' }}>{value || '—'}</AppText>
    </View>
  );
}

/** Fiche d’offre P2P (web P2PDetailPage) : conditions, équivalent, contact, détails. */
export default function P2PDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeParam(params.id) || idFromPath(usePathname());
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const offer = useAppSelector((state) => state.dashboard.p2pOffers.find((item) => item.id === id));
  const orders = useAppSelector((state) => state.dashboard.p2pOrders);
  const reviews = useAppSelector((state) => state.dashboard.reviews);
  const [pending, setPending] = useState(!offer);

  useEffect(() => {
    if (!id || !supabase || offer) {
      setPending(false);
      return undefined;
    }
    let alive = true;
    supabase
      .from('p2p_offers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!alive) return;
          const mapped = data ? (p2pOfferFromRemoteRow(data) as P2POffer | null) : null;
          if (mapped) dispatch(upsertP2POffer(mapped));
          setPending(false);
        },
        () => {
          if (alive) setPending(false);
        },
      );
    return () => {
      alive = false;
    };
  }, [dispatch, id, offer]);

  if (!offer) {
    return (
      <AppChrome pathname="/p2p">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, justifyContent: 'center' }}>
          <AppText className="text-base font-black text-app-text">{pending ? 'Chargement…' : 'Offre P2P introuvable'}</AppText>
        </View>
      </AppChrome>
    );
  }

  const received = p2pReceivedFromOffered(offer.amount, offer.rate);
  const fee = calculateP2PFee(offer.amount, offer.fromCurrency);
  const isOwner = Boolean(user?.id && offer.ownerId === user.id);
  const completed = (orders as { sellerId?: string; buyerId?: string; status?: string }[]).filter(
    (order) => (order.sellerId === offer.ownerId || order.buyerId === offer.ownerId) && order.status === 'completed',
  ).length;
  const ownerReviews = (reviews as { targetId?: string; rating?: number }[]).filter((review) => review.targetId === offer.ownerId);
  const average = ownerReviews.length
    ? ownerReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / ownerReviews.length
    : 0;

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

  async function setStatus(status: 'archived' | 'active') {
    if (!supabase || !offer) return;
    const { error } = await supabase.from('p2p_offers').update({ status }).eq('id', offer.id);
    if (error) {
      showNotice('P2P', error.message);
      return;
    }
    dispatch(upsertP2POffer({ ...offer, status }));
    showNotice('P2P', status === 'archived' ? 'Offre archivée.' : 'Offre republiée.');
  }

  const card = { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 };

  return (
    <AppChrome pathname="/p2p">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-text-muted">Échanges communautaires</AppText>
        <AppText className="text-2xl font-black text-app-text">
          {formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} vers {offer.toCurrency}
        </AppText>
        <AppText className="text-sm text-app-text-muted">Offre publiée par {offer.ownerName || 'un membre'}</AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['Équivalent', received ? formatCurrency(received, offer.toCurrency, 'fr-FR') : '—'],
            ['Méthode', String(offer.method || '—')],
            ['Statut', offer.status === 'active' ? 'Active' : offer.status === 'archived' ? 'Archivée' : String(offer.status || '—')],
            ['Proposé par', String(offer.ownerName || '—')],
          ].map(([label, value]) => (
            <View key={label} style={{ width: '48%', borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 12 }}>
              <AppText className="text-xs text-app-text-muted">{label}</AppText>
              <AppText className="mt-1 font-black text-app-text">{value}</AppText>
            </View>
          ))}
        </View>

        <View style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText className="font-black text-app-text">Conditions de l’offre</AppText>
            <AppText className="text-xs font-bold" style={{ color: offer.status === 'active' ? '#059669' : colors.textMuted }}>{offer.status}</AppText>
          </View>
          <Row label="Montant proposé" value={formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} />
          {received ? <Row label="Équivalent" value={formatCurrency(received, offer.toCurrency, 'fr-FR')} /> : null}
          <Row label="Devise recherchée" value={String(offer.toCurrency || '')} />
          <Row label="Taux" value={String(offer.rate ?? '')} />
          <Row label="Méthode" value={String(offer.method || '')} />
          <Row label="Frais estimés" value={formatCurrency(fee, offer.fromCurrency, 'fr-FR')} />
          <AppText className="text-xs text-app-text-muted">
            {ownerReviews.length ? `${average.toFixed(1)} / 5 · ${completed} échanges réussis` : 'Pas encore de note'}
          </AppText>
          {offer.comment ? <AppText className="text-sm text-app-text">{String(offer.comment)}</AppText> : null}
        </View>

        {!isOwner ? (
          <View style={card}>
            <AppText className="font-black text-app-text">Contacter ou accepter</AppText>
            <AppText className="text-sm text-app-text-muted">
              L’acceptation crée une commande suivie dans MOXT. L’argent circule directement entre vous — ajoutez toujours une preuve.
            </AppText>
            {offer.ownerId && offer.status !== 'accepted' ? (
              <Pressable onPress={() => void accept()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Accepter l’offre</AppText>
              </Pressable>
            ) : null}
            <Pressable onPress={() => void contact()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
              <AppText className="font-bold text-app-text">Contacter</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={card}>
            <AppText className="font-black text-app-text">Gérer l’offre</AppText>
            <AppText className="text-sm text-app-text-muted">L’archivage retire l’offre du catalogue actif.</AppText>
            {offer.status === 'active' ? (
              <Pressable onPress={() => void setStatus('archived')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <AppText className="font-bold text-app-text">Archiver l’offre</AppText>
              </Pressable>
            ) : (
              <Pressable onPress={() => void setStatus('active')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <AppText className="font-bold text-app-text">Republier l’offre</AppText>
              </Pressable>
            )}
          </View>
        )}

        <View style={card}>
          <AppText className="font-black text-app-text">Détails de l’échange</AppText>
          <Row label="Montant disponible" value={formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} />
          <Row label="Devise demandée" value={String(offer.toCurrency || '')} />
          <Row label="Taux proposé" value={String(offer.rate ?? '')} />
          <Row label="Frais" value={formatCurrency(fee, offer.fromCurrency, 'fr-FR')} />
          <Row label="Méthode" value={String(offer.method || '')} />
          <Row label="Profil" value={offer.businessId ? 'Entreprise' : 'Particulier'} />
          <Row label="Référence" value={offer.id} />
        </View>

        <View style={card}>
          <AppText className="font-black text-app-text">Sécurité P2P</AppText>
          <AppText className="text-sm text-app-text-muted">MOXT ne détient pas vos fonds. Ne payez qu’aux coordonnées affichées dans la commande.</AppText>
          <AppText className="text-sm text-app-text-muted">Vérifiez le profil avant d’accepter et gardez vos preuves dans MOXT.</AppText>
          <AppText className="text-sm text-app-text-muted">En cas de problème, ouvrez un litige pour contacter le support.</AppText>
        </View>
      </ScrollView>
    </AppChrome>
  );
}
