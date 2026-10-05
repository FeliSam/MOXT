import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { STAR_GIFT_AMOUNTS, giftStarsToPublisher } from '@moxt/shared/services/contentWrites.js';

import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** Bouton étoiles du Fil (StarsGiftButton du web) : visible seulement si le module et l'abonnement sont actifs. */
export function StarsGiftButton({
  publisherType,
  publisherId,
  publisherName,
}: {
  publisherType: 'user' | 'business';
  publisherId: string;
  publisherName: string;
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const userId = useAppSelector((state) => state.auth.user?.id);

  async function refreshBalance() {
    if (!supabase || !userId) return;
    const { data } = await supabase.rpc('stars_get_balance', { p_owner_type: 'user', p_owner_id: userId });
    const row = (Array.isArray(data) ? data[0] : data) as { paid_balance?: number; paidBalance?: number } | null;
    const paid = Number(row?.paid_balance ?? row?.paidBalance);
    if (Number.isFinite(paid)) setBalance(paid);
  }

  async function gift(amount: number) {
    setBusy(amount);
    try {
      await giftStarsToPublisher(supabase, {
        recipientType: publisherType,
        recipientId: publisherId,
        amount,
        idempotencyKey: `gift-${publisherId}-${amount}-${Date.now()}`,
      });
      await refreshBalance();
      setOpen(false);
      showNotice('Étoiles', `${amount} étoiles offertes à ${publisherName || 'cet éditeur'}.`);
    } catch (error) {
      showNotice('Étoiles', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Offrir des étoiles"
        onPress={() => {
          setOpen(true);
          void refreshBalance();
        }}
        style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.92)' }}>
        <Star size={14} color="#fff" strokeWidth={2} fill="#fff" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <Pressable onPress={(event) => event.stopPropagation()} className="bg-app-surface" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
            <AppText className="text-lg font-black text-app-text">Offrir des étoiles</AppText>
            <AppText className="text-sm text-app-text-muted">
              {publisherName}
              {balance != null ? ` · solde ${balance}` : ''}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {STAR_GIFT_AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  disabled={busy != null}
                  onPress={() => void gift(amount)}
                  style={{ minWidth: 72, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? colors.surfaceMuted : '#fffbeb', borderWidth: 1, borderColor: '#f59e0b' }}>
                  {busy === amount ? <ActivityIndicator /> : <AppText className="font-black text-app-text">{amount}</AppText>}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
