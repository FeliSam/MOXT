import { useState } from 'react';
import { router } from 'expo-router';

import { createEvent } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm } from '@/components/publish/PublishForm';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

/** Événement (titre, catégorie, date, description ≥ 20, ville). */
export default function PublishEventScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [startAt, setStartAt] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createEvent(supabase, {
        ownerId: user.id,
        organizerName: `${user.firstName} ${user.lastName}`.trim(),
        title: title.trim(),
        category: category.trim(),
        startAt,
        city: city.trim(),
        description: description.trim(),
        venue: venue.trim(),
        format: 'in_person',
      });
      router.replace('/(tabs)/feed?type=event' as never);
    } catch (error) {
      showNotice('Événement', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm title="Publier un événement" subtitle="Rencontre visible dans le fil" busy={busy} onSubmit={() => void publish()}>
      <Field label="Titre" value={title} onChangeText={setTitle} />
      <Field label="Catégorie" value={category} onChangeText={setCategory} />
      <Field label="Début (AAAA-MM-JJTHH:MM)" value={startAt} onChangeText={setStartAt} placeholder="2026-10-12T18:00" />
      <Field label="Ville" value={city} onChangeText={setCity} />
      <Field label="Lieu" value={venue} onChangeText={setVenue} />
      <Field label="Description (20 caractères minimum)" value={description} onChangeText={setDescription} multiline />
    </PublishForm>
  );
}
