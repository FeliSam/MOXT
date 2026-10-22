import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';

import { calculateP2PFee, computeP2PReputation, p2pOfferFromRemoteRow, p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { buildAcceptedOrder, syncP2pOrder } from '@moxt/shared/services/p2pOrderWrites.js';

import { FavoriteButton } from '@/components/account/FavoriteButton';
import { SwipeToAccept } from '@/components/p2p/SwipeToAccept';
import { usePublishGate } from '@/components/publish/publishKit';
import { AppChrome } from '@/components/chrome/AppChrome';
import { ContactButton } from '@/components/communications/ContactButton';
import { DetailFloatingActions } from '@/components/marketplace/DetailFloatingActions';
import { PublisherBlock } from '@/components/publications/PublisherBlock';
import { usePublisherDetailProfile } from '@/components/publications/usePublisherDetailProfile';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DetailFacts, DetailMetrics } from '@/components/ui/DetailBlocks';
import { ReportSheet } from '@/components/ui/ReportSheet';
import { supabase } from '@/services/supabase';
import { loadDashboardData, upsertP2POffer, type P2POffer } from '@/store/dashboard';
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
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const publisherProfile = usePublisherDetailProfile(offer as unknown as Record<string, unknown> | undefined, 'p2p');
  const p2pGate = usePublishGate('p2p');

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
  const reputation = computeP2PReputation(offer.ownerId, { orders, reviews }) as {
    avgRating?: number | null;
    ratingCount?: number;
    completed?: number;
    successRate?: number | null;
  };

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
        <PageHeader
          className="mx-0"
          title={`${formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} vers ${offer.toCurrency}`}
          description={`Offre publiée par ${offer.ownerName || 'un membre'}`}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(22,78,99,0.5)' : 'rgba(165,243,252,0.8)',
            backgroundColor: isDark ? 'rgba(8,51,68,0.35)' : 'rgba(236,254,255,0.9)',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <AppText className="text-base" style={{ color: isDark ? '#67e8f9' : '#0e7490' }}>🛡️</AppText>
          <AppText className="flex-1 text-sm" style={{ color: isDark ? '#cffafe' : '#083344', lineHeight: 24 }}>
            MOXT ne détient pas vos fonds. Suivez les étapes, gardez vos preuves et ne payez qu’aux coordonnées affichées dans la commande.
          </AppText>
        </View>

        <DetailMetrics
          items={[
            { emoji: '🔁', label: 'Équivalent', value: received ? formatCurrency(received, offer.toCurrency, 'fr-FR') : '—' },
            { emoji: '💳', label: 'Méthode', value: String(offer.method || '—') },
            { emoji: '🕐', label: 'Statut', value: offer.status === 'active' ? 'Active' : offer.status === 'archived' ? 'Archivée' : String(offer.status || '—') },
            { emoji: '👤', label: 'Proposé par', value: String(offer.ownerName || '—') },
          ]}
        />

        <View style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText display className="text-base text-app-text">Conditions de l’offre</AppText>
            <AppText className="text-xs font-bold" style={{ color: offer.status === 'active' ? colors.success : colors.textMuted }}>{offer.status}</AppText>
          </View>
          <Row label="Montant proposé" value={formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR')} />
          {received ? <Row label="Équivalent" value={formatCurrency(received, offer.toCurrency, 'fr-FR')} /> : null}
          <Row label="Devise recherchée" value={String(offer.toCurrency || '')} />
          <Row label="Taux" value={String(offer.rate ?? '')} />
          <Row label="Méthode" value={String(offer.method || '')} />
          <Row label="Frais estimés" value={formatCurrency(fee, offer.fromCurrency, 'fr-FR')} />
          <AppText className="text-xs font-bold text-app-text">
            {reputation.avgRating != null
              ? `Réputation ${reputation.avgRating}/5 · ${reputation.ratingCount || 0} avis · ${reputation.completed || completed} réussis${reputation.successRate != null ? ` · ${reputation.successRate} %` : ''}`
              : 'Pas encore de note de réputation'}
          </AppText>
          {offer.comment ? <AppText className="text-sm text-app-text">{String(offer.comment)}</AppText> : null}
        </View>

        {!isOwner ? (
          <View style={card}>
            <AppText display className="text-base text-app-text">Contacter ou accepter</AppText>
            <AppText className="text-sm text-app-text-muted">
              L’acceptation crée une commande suivie dans MOXT. L’argent circule directement entre vous — ajoutez toujours une preuve.
            </AppText>
            {offer.ownerId && offer.status === 'active' ? (
              p2pGate.allowed ? (
                <SwipeToAccept key={swipeKey} label="Glisser pour accepter" onComplete={() => setConfirmOpen(true)} />
              ) : (
                <AppText className="text-sm text-app-text-muted">{p2pGate.message}</AppText>
              )
            ) : null}
            <ContactButton
              ownerId={offer.ownerId}
              relatedType="p2p"
              relatedId={offer.id}
              relatedPath={`/p2p/${offer.id}`}
              relatedTitle={`${offer.fromCurrency} → ${offer.toCurrency}`}
              variant="secondary"
              badge="P2P"
            />
            <FavoriteButton
              relatedId={offer.id}
              relatedType="p2p"
              title={`${offer.amount} ${offer.fromCurrency}`}
              subtitle={`${offer.fromCurrency} → ${offer.toCurrency}`}
              path={`/p2p/${offer.id}`}
            />
            {user?.id ? <Button variant="danger" onPress={() => setReportOpen(true)}>Signaler</Button> : null}
          </View>
        ) : (
          <View style={card}>
            <AppText display className="text-base text-app-text">Gérer l’offre</AppText>
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
          <AppText display className="text-base text-app-text">Détails de l’échange</AppText>
          <DetailFacts
            items={[
              { label: 'Montant disponible', value: formatCurrency(offer.amount, offer.fromCurrency, 'fr-FR') },
              { label: 'Devise demandée', value: String(offer.toCurrency || '') },
              { label: 'Taux proposé', value: String(offer.rate ?? '') },
              { label: 'Frais', value: formatCurrency(fee, offer.fromCurrency, 'fr-FR') },
              { label: 'Méthode', value: String(offer.method || '') },
              { label: 'Profil', value: offer.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Référence', value: offer.id },
            ]}
          />
        </View>

        <PublisherBlock profile={publisherProfile} currentId={offer.id} />

        <View style={card}>
          <AppText display className="text-base text-app-text">Sécurité P2P</AppText>
          <AppText className="text-sm text-app-text-muted">MOXT ne détient pas vos fonds. Ne payez qu’aux coordonnées affichées dans la commande.</AppText>
          <AppText className="text-sm text-app-text-muted">Vérifiez le profil avant d’accepter et gardez vos preuves dans MOXT.</AppText>
          <AppText className="text-sm text-app-text-muted">En cas de problème, ouvrez un litige pour contacter le support.</AppText>
        </View>
      </ScrollView>
      <DetailFloatingActions
        relatedId={offer.id}
        title={`${offer.amount || ''} ${offer.fromCurrency || ''} vers ${offer.toCurrency || ''}`}
        ownerId={offer.ownerId}
        isOwner={isOwner}
        relatedType="p2p"
        relatedPath={`/p2p/${offer.id}`}
        editTo={isOwner ? `/p2p/edit/${offer.id}` : undefined}
      />
      <Modal transparent animationType="fade" visible={confirmOpen} onRequestClose={() => setConfirmOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.82)' : 'rgba(2,6,23,0.6)' }}>
          <View testID="p2p-accept-confirm" style={{ gap: 16, borderRadius: 24, borderWidth: 1, padding: 20, borderColor: colors.border, backgroundColor: colors.surface }}>
            <AppText display className="text-lg text-app-text">Démarrer l’échange ?</AppText>
            <AppText className="text-sm leading-6 text-app-text-muted">
              Vous allez démarrer un échange. MOXT ne détient pas l’argent. Paiement hors app + preuve obligatoire. Continuer ?
            </AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                variant="secondary"
                onPress={() => {
                  setConfirmOpen(false);
                  setSwipeKey((value) => value + 1);
                }}>
                Annuler
              </Button>
              <Button
                onPress={() => {
                  setConfirmOpen(false);
                  void accept();
                }}>
                Confirmer
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <ReportSheet
        open={reportOpen}
        title="Signaler cette offre"
        target="p2p"
        targetId={offer.id}
        userId={user?.id}
        userName={[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
        onClose={() => setReportOpen(false)}
      />
    </AppChrome>
  );
}
