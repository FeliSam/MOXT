import { useState } from 'react';
import { router } from 'expo-router';

import { createP2POffer } from '@moxt/shared/services/contentWrites.js';

import { Pressable } from 'react-native';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

/** Offre P2P (devises, montant, taux) comme PublishP2PPage. */
export default function PublishP2PScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [fromCurrency, setFromCurrency] = useState('RUB');
  const [toCurrency, setToCurrency] = useState('XOF');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [method, setMethod] = useState('');
  const [receivePhone, setReceivePhone] = useState('');
  const [receiveName, setReceiveName] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const steps = ['Paire', 'Montant', 'Conditions'];

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createP2POffer(supabase, {
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`.trim(),
        fromCurrency: fromCurrency.trim().toUpperCase(),
        toCurrency: toCurrency.trim().toUpperCase(),
        amount,
        rate,
        method: method.trim(),
        receivePhone: receivePhone.trim(),
        receiveName: receiveName.trim(),
        comment: comment.trim(),
      });
      router.replace('/p2p' as never);
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm
      pathname="/p2p/publish"
      title="Proposer une offre"
      subtitle={steps[step]}
      busy={busy}
      submitLabel={step < 2 ? 'Continuer' : 'Publier'}
      onSubmit={() => (step < 2 ? setStep(step + 1) : void publish())}>
      <StepBar steps={steps} index={step} />
      {step > 0 ? <Pressable onPress={() => setStep(step - 1)}><AppText className="text-sm font-bold text-app-accent">Retour</AppText></Pressable> : null}
      {step === 0 ? (
        <>
          <Field label="Je donne (devise)" value={fromCurrency} onChangeText={setFromCurrency} />
          <Field label="Je reçois (devise)" value={toCurrency} onChangeText={setToCurrency} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Field label="Montant" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <Field label="Taux" value={rate} onChangeText={setRate} keyboardType="decimal-pad" />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Field label="Moyen de réception" value={method} onChangeText={setMethod} placeholder="Virement, carte…" />
          <Field label="Téléphone de réception" value={receivePhone} onChangeText={setReceivePhone} />
          <Field label="Nom de réception" value={receiveName} onChangeText={setReceiveName} />
          <Field label="Commentaire" value={comment} onChangeText={setComment} multiline />
        </>
      ) : null}
    </PublishForm>
  );
}
