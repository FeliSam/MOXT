import { useState } from 'react';
import { router } from 'expo-router';

import { createP2POffer } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm } from '@/components/publish/PublishForm';
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
  const [busy, setBusy] = useState(false);

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
      });
      router.replace('/p2p' as never);
    } catch (error) {
      showNotice('P2P', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm title="Proposer une offre" subtitle="Échange entre particuliers, sans séquestre" busy={busy} onSubmit={() => void publish()}>
      <Field label="Je donne (devise)" value={fromCurrency} onChangeText={setFromCurrency} />
      <Field label="Je reçois (devise)" value={toCurrency} onChangeText={setToCurrency} />
      <Field label="Montant" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Taux" value={rate} onChangeText={setRate} keyboardType="decimal-pad" />
      <Field label="Moyen de réception" value={method} onChangeText={setMethod} placeholder="Virement, carte…" />
    </PublishForm>
  );
}
