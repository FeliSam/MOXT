import { useState } from 'react';
import { router } from 'expo-router';

import { createJob } from '@moxt/shared/services/contentWrites.js';

import { Pressable } from 'react-native';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import {
  BusinessPublishNotice,
  CitySelector,
  PosterUploader,
  PublishFormulaSheet,
  SecurityGate,
  ShareToFeedModal,
  uploadPhotos,
  type PosterPhoto,
} from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { selectOwnedBusinesses } from '@/store/account';
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
  const [photos, setPhotos] = useState<PosterPhoto[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [formula, setFormula] = useState('standard');
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);
  const [step, setStep] = useState(0);
  const steps = ['Offre', 'Détails', 'Lieu', 'Confirmation'];

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      const images = await uploadPhotos(user.id, 'jobs', photos, setProgress);
      await createJob(supabase, {
        ownerId: user.id,
        title: title.trim(),
        sector: sector.trim(),
        description: description.trim(),
        salary: salary.trim(),
        location: location.trim(),
        images,
      });
      setShareOpen(true);
    } catch (error) {
      showNotice('Job', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecurityGate kind="publish" pathname="/publish/job">
    <PublishForm
      pathname="/publish/job"
      title="Publier un job"
      subtitle={steps[step]}
      busy={busy}
      submitLabel={step < 3 ? 'Continuer' : 'Publier'}
      onSubmit={() => (step < 3 ? setStep(step + 1) : void publish())}>
      <StepBar steps={steps} index={step} />
      {step > 0 ? <Pressable onPress={() => setStep(step - 1)}><AppText className="text-sm font-bold text-app-accent">Retour</AppText></Pressable> : null}
      {step === 0 ? (
        <>
          <Field label="Titre" value={title} onChangeText={setTitle} />
          <Field label="Secteur" value={sector} onChangeText={setSector} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Field label="Description (30 caractères minimum)" value={description} onChangeText={setDescription} multiline />
          <Field label="Salaire" value={salary} onChangeText={setSalary} />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <CitySelector label="Lieu" value={location} onChange={setLocation} />
          <PosterUploader photos={photos} onChange={setPhotos} progress={progress} label="Affiches" />
        </>
      ) : null}
      {step === 3 ? (
        <>
          <AppText className="text-sm text-app-text">{title} · {location || 'Lieu à préciser'}</AppText>
          <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="job" />
          <PublishFormulaSheet value={formula} onChange={setFormula} />
        </>
      ) : null}
    </PublishForm>
    <ShareToFeedModal
      visible={shareOpen}
      message={title}
      imageUrl={photos[0]?.url}
      onClose={() => {
        setShareOpen(false);
        router.replace('/jobs' as never);
      }}
    />
    </SecurityGate>
  );
}
