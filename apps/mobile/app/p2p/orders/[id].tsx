import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { advanceP2pOrder, syncP2pOrder, withBuyerReceive, withP2pProof } from '@moxt/shared/services/p2pOrderWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { ContactButton } from '@/components/communications/ContactButton';
import { UploadProgressBar } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { loadDashboardData } from '@/store/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const STATUS: Record<string, string> = {
  created: 'En attente du vendeur',
  seller_accepted: 'À payer',
  waiting_payment: 'Paiement envoyé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

/** Commande P2P : accepter, preuve, paiement, confirmation (P2POrderPage). */
export default function P2POrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const order = useAppSelector((state) =>
    (state.dashboard.p2pOrders as Record<string, unknown>[]).find((item) => item.id === id),
  ) as Record<string, any> | undefined;
  const [phone, setPhone] = useState('');
  const [receiveName, setReceiveName] = useState('');
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function save(next: Record<string, unknown>, offer: Record<string, unknown> | null = null) {
    if (!supabase) return;
    setBusy(true);
    try {
      await syncP2pOrder(supabase, next, offer);
      if (user?.id) await dispatch(loadDashboardData(user.id));
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Mise à jour impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function go(status: string) {
    if (!order) return;
    try {
      await save(advanceP2pOrder(order, status));
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Action impossible.');
    }
  }

  async function addProof() {
    if (!order || !user) return;
    try {
      const file = await pickLibraryFile('images');
      if (!file) return;
      setProgress(0.45);
      const path = `${user.id}/p2p/${order.id}/${Date.now()}.jpg`;
      await uploadLikeWeb('transfers', path, file, 'private');
      setProgress(1);
      await save(withP2pProof(order, { userId: user.id, name: file.name, size: file.size, type: file.type, path }));
    } catch (error) {
      showNotice('Preuve', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  if (!order) {
    return (
      <AppChrome pathname="/p2p">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Transaction introuvable.</AppText>
        </View>
      </AppChrome>
    );
  }

  const isSeller = order.sellerId === user?.id;
  const isBuyer = order.buyerId === user?.id;
  const status = String(order.status || 'created');
  const steps = ['created', 'seller_accepted', 'waiting_payment', 'completed'];
  const dueAt = status === 'seller_accepted' ? order.paymentDueAt : status === 'waiting_payment' ? order.confirmDueAt : null;
  const remaining = dueAt ? Math.max(0, new Date(String(dueAt)).getTime() - now) : 0;
  const countdown = dueAt
    ? `${Math.floor(remaining / 60000)} min ${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')} s`
    : '';
  const otherId = isSeller ? order.buyerId : order.sellerId;
  const button = (label: string, onPress: () => void) => (
    <Pressable disabled={busy} onPress={onPress} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
      <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>{label}</AppText>
    </Pressable>
  );

  return (
    <AppChrome pathname="/p2p">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-text-muted">{String(order.id)}</AppText>
        <AppText className="text-2xl font-black text-app-text">{STATUS[status] || status}</AppText>
        <AppText className="text-sm text-app-text-muted">
          {order.sellerName || 'Vendeur'} vers {order.buyerName || 'Acheteur'}
        </AppText>
        {order.amount ? (
          <AppText className="text-base font-bold text-app-text">
            {formatCurrency(Number(order.amount), String(order.fromCurrency || 'XOF'), 'fr-FR')} → {String(order.toCurrency || '')}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {steps.map((step) => (
            <View key={step} style={{ flex: 1, height: 6, borderRadius: 99, backgroundColor: steps.indexOf(step) <= steps.indexOf(status) ? colors.accent : colors.border }} />
          ))}
        </View>
        {countdown ? (
          <AppText className="text-sm font-bold text-app-text">
            {status === 'seller_accepted' ? 'Temps pour payer' : 'Temps pour confirmer'} · {countdown}
          </AppText>
        ) : null}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: isDark ? '#155e75' : '#a5f3fc', backgroundColor: isDark ? '#083344' : '#ecfeff', padding: 12 }}>
          <AppText className="text-sm" style={{ color: isDark ? '#cffafe' : '#083344' }}>
            MOXT ne détient pas vos fonds. Conservez vos preuves dans la commande.
          </AppText>
        </View>
        {otherId ? (
          <ContactButton
            ownerId={String(otherId)}
            relatedType="p2p"
            relatedId={String(order.id)}
            relatedPath={`/p2p/orders/${order.id}`}
            relatedTitle={String(order.id)}
            label="Ouvrir la conversation"
            variant="secondary"
          />
        ) : null}
        <Pressable onPress={() => void addProof()} className="border border-app-border" style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <AppText className="font-bold text-app-text">Ajouter une preuve ({(order.proofs || []).length})</AppText>
        </Pressable>
        <UploadProgressBar progress={progress} />
        {isSeller && status === 'created' ? button('Accepter', () => void go('seller_accepted')) : null}
        {isBuyer && status === 'seller_accepted' ? button('J’ai payé', () => setReceiveOpen(true)) : null}
        {status === 'completed' ? (
          <View style={{ gap: 8 }}>
            <AppText className="text-sm font-bold text-app-text">Noter l’échange</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)}>
                  <AppText className={star <= rating ? 'text-xl text-amber-500' : 'text-xl text-app-text-faint'}>★</AppText>
                </Pressable>
              ))}
            </View>
            <TextInput value={comment} onChangeText={setComment} placeholder="Commentaire" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
            {button('Enregistrer la note', () => {
              const ratings = Array.isArray(order.ratings) ? [...order.ratings] : [];
              const next = ratings.filter((item) => item?.userId !== user?.id);
              next.push({ userId: user?.id, rating, comment: comment.trim(), createdAt: new Date().toISOString() });
              void save({ ...order, ratings: next });
            })}
          </View>
        ) : null}
        {isSeller && status === 'waiting_payment' ? button('Confirmer la réception', () => void go('completed')) : null}
        {(isBuyer || isSeller) && !['completed', 'cancelled'].includes(status) ? (
          <Pressable disabled={busy} onPress={() => void go('cancelled')}>
            <AppText className="text-center text-sm font-bold text-red-600">Annuler</AppText>
          </Pressable>
        ) : null}
        {(isBuyer || isSeller) && !['completed', 'cancelled', 'disputed'].includes(status) ? (
          <Pressable disabled={busy} onPress={() => void go('disputed')}>
            <AppText className="text-center text-sm font-bold text-app-text-muted">Ouvrir un litige</AppText>
          </Pressable>
        ) : null}
      </ScrollView>
      <Modal visible={receiveOpen} animationType="slide" onRequestClose={() => setReceiveOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-xl font-black text-app-text">Coordonnées de réception</AppText>
          <TextInput value={phone} onChangeText={setPhone} placeholder="Téléphone de réception" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
          <TextInput value={receiveName} onChangeText={setReceiveName} placeholder="Nom de réception" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
          {button('Confirmer le paiement', () => {
            setReceiveOpen(false);
            void save(advanceP2pOrder(withBuyerReceive(order, { phone, name: receiveName, method: order.method }), 'waiting_payment'));
          })}
          <Pressable onPress={() => setReceiveOpen(false)}>
            <AppText className="text-center text-sm font-bold text-app-text-muted">Fermer</AppText>
          </Pressable>
        </View>
      </Modal>
    </AppChrome>
  );
}
