import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { p2pOfferToRemoteRow } from '@moxt/shared/services/contentWrites.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { CurrencyChips } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { upsertP2POffer, type P2POffer } from '@/store/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** Édition d’une offre P2P active ou archivée (EditP2POfferPage). */
export default function EditP2POfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const offer = useAppSelector((state) => state.dashboard.p2pOffers.find((item) => item.id === id));
  const [fromCurrency, setFromCurrency] = useState(String(offer?.fromCurrency || 'RUB'));
  const [toCurrency, setToCurrency] = useState(String(offer?.toCurrency || 'XOF'));
  const [amount, setAmount] = useState(String(offer?.amount ?? ''));
  const [rate, setRate] = useState(String(offer?.rate ?? ''));
  const [method, setMethod] = useState(String(offer?.method || ''));
  const [comment, setComment] = useState(String(offer?.comment || ''));
  const [busy, setBusy] = useState(false);

  const field = { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, backgroundColor: colors.surface };
  const owned = Boolean(user?.id && offer?.ownerId === user.id);
  const editable = owned && (!offer?.status || offer.status === 'active' || offer.status === 'archived');

  async function save() {
    if (!offer || !editable) return;
    const next: P2POffer = {
      ...offer,
      fromCurrency,
      toCurrency,
      amount: Number(amount),
      rate: Number(rate),
      method: method.trim(),
      comment: comment.trim(),
    };
    if (!(Number(next.amount) > 0) || !(Number(next.rate) > 0)) {
      showNotice('P2P', 'Montant et taux requis.');
      return;
    }
    setBusy(true);
    try {
      await upsertStrippingUnknown('p2p_offers', p2pOfferToRemoteRow(next) as Record<string, unknown>);
      dispatch(upsertP2POffer(next));
      router.replace(`/p2p/${offer.id}` as never);
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }

  if (!offer || !editable) {
    return (
      <AppChrome pathname="/p2p">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">{offer ? 'Cette offre ne peut pas être modifiée.' : 'Offre introuvable.'}</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/p2p">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Modifier l’offre</AppText>
        <CurrencyChips label="Devise proposée" value={fromCurrency} onChange={setFromCurrency} countryCode={user?.originCountry} />
        <CurrencyChips label="Devise recherchée" value={toCurrency} onChange={setToCurrency} countryCode={user?.originCountry} />
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Montant" placeholderTextColor={colors.textFaint} style={field} />
        <TextInput value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="Taux" placeholderTextColor={colors.textFaint} style={field} />
        <TextInput value={method} onChangeText={setMethod} placeholder="Méthode" placeholderTextColor={colors.textFaint} style={field} />
        <TextInput value={comment} onChangeText={setComment} placeholder="Commentaire" placeholderTextColor={colors.textFaint} style={[field, { minHeight: 88 }]} multiline />
        <Pressable disabled={busy} onPress={() => void save()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Enregistrer</AppText>
        </Pressable>
        <Pressable onPress={() => router.back()}><AppText className="text-center font-bold text-app-text-muted">Annuler</AppText></Pressable>
      </ScrollView>
    </AppChrome>
  );
}
