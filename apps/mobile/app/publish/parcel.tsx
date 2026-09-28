import { useState } from 'react';
import { router } from 'expo-router';

import { createParcel } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm } from '@/components/publish/PublishForm';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

/** Publication d'un trajet colis (champs essentiels de PublishParcelPage). */
export default function PublishParcelScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createParcel(supabase, {
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate,
        capacityKg,
        pricePerKg,
      });
      router.replace('/(tabs)/parcels' as never);
    } catch (error) {
      showNotice('Colis', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm title="Publier un colis" subtitle="Trajet et capacité de transport" busy={busy} onSubmit={() => void publish()}>
      <Field label="Ville de départ" value={origin} onChangeText={setOrigin} />
      <Field label="Ville d'arrivée" value={destination} onChangeText={setDestination} />
      <Field label="Date de départ (AAAA-MM-JJ)" value={departureDate} onChangeText={setDepartureDate} placeholder="2026-10-12" />
      <Field label="Capacité (kg)" value={capacityKg} onChangeText={setCapacityKg} keyboardType="decimal-pad" />
      <Field label="Prix par kg" value={pricePerKg} onChangeText={setPricePerKg} keyboardType="decimal-pad" />
    </PublishForm>
  );
}
