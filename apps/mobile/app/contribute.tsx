import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const CHANNELS = [
  { id: 'ru', title: 'Banques russes', number: '+7 980 069 29 24', currencies: 'RUB' },
  { id: 'bj', title: 'MTN Bénin', number: '+229 01 57 63 63 11', currencies: 'XOF' },
];

/** Contribution volontaire : canaux et ticket de suivi (ContributePage). */
export default function ContributeScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const allowed = user?.role === 'admin' || user?.role === 'superadmin';
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('RUB');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    const reference = `MOXT-${Date.now().toString(36).toUpperCase()}`;
    setBusy(true);
    try {
      await upsertStrippingUnknown('support_tickets', {
        id: `SUP-${Date.now().toString(36).toUpperCase()}`,
        user_id: user.id,
        user_name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        subject: `Contribution ${reference}`,
        message: `Contribution ${amount} ${currency}. Référence ${reference}.`,
        category: 'contribution',
        status: 'open',
        created_at: new Date().toISOString(),
      });
      showNotice('Contribution', `Demande ${reference} ouverte auprès du support.`);
    } catch (error) {
      showNotice('Contribution', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <AppChrome pathname="/contribute">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Réservé à l’administration.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/contribute">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Contribuer</AppText>
        <AppText className="text-sm text-app-text-muted">Transférez le montant sur un canal, puis ouvrez un ticket avec la référence.</AppText>
        {CHANNELS.map((channel) => (
          <View key={channel.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
            <AppText className="font-black text-app-text">{channel.title}</AppText>
            <AppText className="text-sm text-app-text">{channel.number}</AppText>
            <AppText className="text-xs text-app-text-muted">{channel.currencies} · FANOU S. Feliciano</AppText>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['RUB', 'XOF'].map((code) => (
            <Pressable key={code} onPress={() => setCurrency(code)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: currency === code ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: currency === code ? (isDark ? '#020617' : '#fff') : colors.text }}>{code}</AppText>
            </Pressable>
          ))}
        </View>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Montant" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
        <Pressable disabled={busy} onPress={() => void submit()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Ouvrir le suivi</AppText>
        </Pressable>
      </ScrollView>
    </AppChrome>
  );
}
