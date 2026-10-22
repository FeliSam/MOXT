import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { canClientDeclareReception } from '@moxt/shared/domain/transferActionUtils.js';
import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { UploadProgressBar } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { PageHeader } from '@/components/ui/PageHeader';
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

  const alreadyDeclared = Boolean(transfer?.receivedAt);
  const expected = transfer?.amountReceived ?? transfer?.receivedAmount;
  const currency = transfer?.currencyTo || transfer?.toCurrency || '';

  return (
    <AppChrome pathname="/transfers">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 128 }}>
        <PageHeader
          className="mx-0"
          eyebrow="Réception"
          title="J’ai reçu les fonds"
          description={transfer ? `Transfert ${transfer.id}` : 'Déclarez le montant reçu et joignez une preuve.'}
          actions={
            <Pressable onPress={() => (transfer ? router.push(`/transfer/${transfer.id}` as never) : router.back())} style={{ minHeight: 44, borderRadius: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
              <AppText className="text-sm font-bold text-app-text">Retour</AppText>
            </Pressable>
          }
        />
        {!transfer ? (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 8 }}>
            <AppText className="text-sm text-app-text-muted">Ce transfert est introuvable.</AppText>
            <Pressable onPress={() => router.push('/(tabs)/transfers' as never)}>
              <AppText className="text-sm font-bold" style={{ color: colors.accent }}>Retour aux transferts</AppText>
            </Pressable>
          </View>
        ) : null}
        {transfer && !allowed ? (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20, gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(120,53,15,0.4)' : '#fffbeb' }}>
              <AppText style={{ fontSize: 20 }}>⏱</AppText>
            </View>
            <AppText display className="text-lg text-app-text">
              {alreadyDeclared ? 'Réception déjà déclarée' : 'En attente du partenaire'}
            </AppText>
            <AppText className="text-sm text-app-text-muted">
              {alreadyDeclared
                ? 'Vous avez déjà confirmé la réception de ces fonds.'
                : 'La réception se déclare une fois le partenaire a confirmé le virement et joint une preuve.'}
            </AppText>
            <Pressable onPress={() => router.push(`/transfer/${transfer.id}` as never)} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
              <AppText className="font-bold text-app-text">Voir le transfert</AppText>
            </Pressable>
          </View>
        ) : null}
        {transfer && allowed ? (
          <>
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
              <AppText className="text-xs font-black uppercase text-app-text-muted">Résumé</AppText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <AppText className="text-sm text-app-text-muted">Montant attendu</AppText>
                  <AppText className="text-base font-black" style={{ color: colors.accent }}>{expected ? `${expected} ${currency}` : '—'}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText className="text-sm text-app-text-muted">Échangeur</AppText>
                  <AppText className="text-base font-bold text-app-text">{String(transfer.exchanger?.name || '—')}</AppText>
                </View>
              </View>
            </View>
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
              <AppText className="text-sm font-bold text-app-text">Montant reçu</AppText>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Montant reçu" placeholderTextColor={colors.textFaint} style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.text, paddingHorizontal: 16 }} />
              <AppText className="text-sm font-bold text-app-text">Moyen de réception</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {METHODS.map(([idMethod, label]) => (
                  <Pressable key={idMethod} onPress={() => setMethod(idMethod)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: method === idMethod ? colors.accent : colors.surfaceMuted }}>
                    <AppText className="text-xs font-bold" style={{ color: method === idMethod ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
                  </Pressable>
                ))}
              </View>
              <AppText className="text-sm font-bold text-app-text">Preuve</AppText>
              <Pressable onPress={() => void attach()} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <AppText className="font-bold text-app-text">{proofName || 'Ajouter une preuve'}</AppText>
              </Pressable>
              <UploadProgressBar progress={progress} />
              <Pressable disabled={busy} onPress={() => void submit()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#08705f', opacity: busy ? 0.6 : 1 }}>
                <AppText className="font-bold text-white">{busy ? 'Enregistrement…' : 'Confirmer la réception'}</AppText>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
