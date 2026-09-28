import { useState } from 'react';
import { router } from 'expo-router';

import { createJob } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm } from '@/components/publish/PublishForm';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

/** Offre d'emploi (titre, secteur, description ≥ 30, salaire, lieu). */
export default function PublishJobScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createJob(supabase, {
        ownerId: user.id,
        title: title.trim(),
        sector: sector.trim(),
        description: description.trim(),
        salary: salary.trim(),
        location: location.trim(),
      });
      router.replace('/jobs' as never);
    } catch (error) {
      showNotice('Job', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm title="Publier un job" subtitle="Offre visible dans les emplois MOXT" busy={busy} onSubmit={() => void publish()}>
      <Field label="Titre" value={title} onChangeText={setTitle} />
      <Field label="Secteur" value={sector} onChangeText={setSector} />
      <Field label="Lieu" value={location} onChangeText={setLocation} />
      <Field label="Salaire" value={salary} onChangeText={setSalary} />
      <Field label="Description (30 caractères minimum)" value={description} onChangeText={setDescription} multiline />
    </PublishForm>
  );
}
