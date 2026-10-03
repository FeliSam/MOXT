import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { createEvent } from '@moxt/shared/services/contentWrites.js';

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

const STEPS = ['Bases', 'Programme', 'Lieu', 'Confirmation'];
const CATEGORIES = [
  { value: 'networking', label: 'Réseau' },
  { value: 'training', label: 'Formation' },
  { value: 'culture', label: 'Culture' },
  { value: 'business', label: 'Business' },
  { value: 'community', label: 'Communauté' },
];
const FORMATS = [
  { value: 'in_person', label: 'Sur place' },
  { value: 'online', label: 'En ligne' },
  { value: 'hybrid', label: 'Hybride' },
];

/** PublishEventPage : bases, programme, lieu, confirmation. */
export default function PublishEventScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('community');
  const [format, setFormat] = useState('in_person');
  const [startAt, setStartAt] = useState('');
  const [description, setDescription] = useState('');
  const [program, setProgram] = useState('');
  const [city, setCity] = useState(user?.city || 'Moscou');
  const [photos, setPhotos] = useState<PosterPhoto[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [formula, setFormula] = useState('standard');
  const [shareOpen, setShareOpen] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);
  const [venue, setVenue] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [busy, setBusy] = useState(false);

  function canLeave() {
    if (step === 0) return Boolean(title.trim() && category && startAt.trim());
    if (step === 1) return description.trim().length >= 20;
    if (step === 2) {
      if (!city.trim()) return false;
      if (format === 'online') return Boolean(onlineLink.trim());
      return Boolean(venue.trim());
    }
    return true;
  }

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createEvent(supabase, {
        ownerId: user.id,
        organizerName: `${user.firstName} ${user.lastName}`.trim(),
        title: title.trim(),
        category,
        format,
        startAt,
        city: city.trim(),
        description: description.trim(),
        program: program.trim(),
        venue: venue.trim(),
        onlineLink: onlineLink.trim(),
        images: await uploadPhotos(user.id, 'events', photos, setProgress),
      });
      setShareOpen(true);
    } catch (error) {
      showNotice('Événement', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecurityGate kind="publish" pathname="/publish/event">
    <PublishForm
      pathname="/publish/event"
      title="Publier un événement"
      subtitle={STEPS[step]}
      busy={busy}
      submitLabel={step < 3 ? 'Continuer' : 'Publier'}
      onSubmit={() => {
        if (step < 3) {
          if (!canLeave()) {
            showNotice('Événement', step === 1 ? 'La description doit faire au moins 20 caractères.' : 'Complétez cette étape.');
            return;
          }
          setStep(step + 1);
          return;
        }
        void publish();
      }}>
      <StepBar steps={STEPS} index={step} />
      {step > 0 ? (
        <Pressable onPress={() => setStep(step - 1)}>
          <AppText className="text-sm font-bold text-app-accent">Retour</AppText>
        </Pressable>
      ) : null}
      {step === 0 ? (
        <>
          <Field label="Titre" value={title} onChangeText={setTitle} />
          <AppText className="text-xs font-bold uppercase text-app-text-muted">Catégorie</AppText>
          {CATEGORIES.map((item) => (
            <Pressable key={item.value} onPress={() => setCategory(item.value)}>
              <AppText className={category === item.value ? 'text-sm font-black text-app-accent' : 'text-sm font-bold text-app-text'}>{item.label}</AppText>
            </Pressable>
          ))}
          <AppText className="text-xs font-bold uppercase text-app-text-muted">Format</AppText>
          {FORMATS.map((item) => (
            <Pressable key={item.value} onPress={() => setFormat(item.value)}>
              <AppText className={format === item.value ? 'text-sm font-black text-app-accent' : 'text-sm font-bold text-app-text'}>{item.label}</AppText>
            </Pressable>
          ))}
          <Field label="Début (AAAA-MM-JJTHH:MM)" value={startAt} onChangeText={setStartAt} placeholder="2026-10-12T18:00" />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Field label="Description (20 caractères minimum)" value={description} onChangeText={setDescription} multiline />
          <Field label="Programme" value={program} onChangeText={setProgram} multiline />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <CitySelector value={city} onChange={setCity} />
          <PosterUploader photos={photos} onChange={setPhotos} progress={progress} label="Affiches" />
          {format !== 'online' ? <Field label="Lieu" value={venue} onChangeText={setVenue} /> : null}
          {format !== 'in_person' ? <Field label="Lien en ligne" value={onlineLink} onChangeText={setOnlineLink} /> : null}
        </>
      ) : null}
      {step === 3 ? (
        <AppText className="text-sm text-app-text">
          {title} · {city || 'Ville'} · {FORMATS.find((item) => item.value === format)?.label}
        </AppText>
      ) : null}
      {step === 3 ? (
        <>
          <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="event" />
          <PublishFormulaSheet value={formula} onChange={setFormula} />
        </>
      ) : null}
    </PublishForm>
    <ShareToFeedModal
      visible={shareOpen}
      message={title}
      onClose={() => {
        setShareOpen(false);
        router.replace('/events' as never);
      }}
    />
    </SecurityGate>
  );
}
