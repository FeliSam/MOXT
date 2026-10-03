import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { canClientDeclareReception } from '@moxt/shared/domain/transferActionUtils.js';
import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { UploadProgressBar } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { pickImageOrPdf, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { upsertTransfer } from '@/store/transfers';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const METHODS = [
  ['cash', 'Espèces'],
  ['mobile_money', 'Mobile money'],
  ['bank', 'Virement'],
  ['other', 'Autre'],
];

/** Déclaration de réception des fonds (ReceiveTransferScreen). */
export default function ReceiveTransferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const transfer = useAppSelector((state) => state.transfers.items.find((item) => item.id === id)) as Record<string, any> | undefined;
  const [amount, setAmount] = useState(String(transfer?.amountReceived ?? transfer?.receivedAmount ?? ''));
  const [method, setMethod] = useState('mobile_money');
  const [proofName, setProofName] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const isSender = Boolean(user?.id && (transfer?.userId === user.id || transfer?.senderId === user.id));
  const allowed = Boolean(transfer && canClientDeclareReception(transfer, isSender));

  async function attach() {
    if (!user || !transfer) return;
    const file = await pickImageOrPdf();
    if (!file) return;
    setProgress(0.4);
    const path = `${user.id}/transfers/${transfer.id}-receive/${Date.now()}`;
    await uploadLikeWeb('transfers', path, file, 'private');
    setProofName(file.name);
    setProgress(1);
  }

  async function submit() {
    if (!transfer || !user || !supabase || !allowed) return;
    const numeric = Number(String(amount).replace(',', '.'));
    if (!(numeric > 0)) {
      showNotice('Transfert', 'Indiquez le montant reçu.');
      return;
    }
    setBusy(true);
    const receivedAt = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('transfers')
        .update({
          status: TRANSFER_STATUS.COMPLETED,
          received_amount: numeric,
          received_method: method,
          received_at: receivedAt,
          updated_at: receivedAt,
        })
        .eq('id', transfer.id);
      if (error) throw new Error(error.message);
      dispatch(upsertTransfer({ id: String(transfer.id), status: TRANSFER_STATUS.COMPLETED, receivedAmount: numeric }));
      showNotice('Transfert', 'Réception enregistrée.');
      router.replace(`/transfer/${transfer.id}` as never);
    } catch (error) {
      showNotice('Transfert', error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome pathname="/transfers">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">J’ai reçu les fonds</AppText>
        {!transfer ? <AppText className="text-sm text-app-text-muted">Transfert introuvable.</AppText> : null}
        {transfer && !allowed ? (
          <AppText className="text-sm text-app-text-muted">
            La réception se déclare une fois le partenaire a confirmé le virement et joint une preuve.
          </AppText>
        ) : null}
        {allowed ? (
          <>
            <AppText className="text-sm text-app-text-muted">
              Partenaire : {String(transfer?.exchanger?.name || transfer?.businessName || 'Entreprise')}
            </AppText>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Montant reçu" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {METHODS.map(([idMethod, label]) => (
                <Pressable key={idMethod} onPress={() => setMethod(idMethod)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: method === idMethod ? colors.accent : colors.surfaceMuted }}>
                  <AppText className="text-xs font-bold" style={{ color: method === idMethod ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => void attach()} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
              <AppText className="font-bold text-app-text">{proofName || 'Ajouter une preuve'}</AppText>
            </Pressable>
            <UploadProgressBar progress={progress} />
            <Pressable disabled={busy} onPress={() => void submit()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
              <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Confirmer la réception</AppText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
