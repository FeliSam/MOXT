import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { createStatus } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import { AppText } from '@/components/ui/AppText';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

const STEPS = ['Contenu', 'Confirmation'];

/** Statut éphémère (StatusComposer : légende ou photo, 7 jours). */
export default function PublishStatusScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState(0);
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function addPhoto() {
    try {
      const file = await pickLibraryFile('images');
      if (!file || !user) return;
      const uploaded = await uploadLikeWeb('listings', `${user.id}/statuses/draft/${Date.now()}.jpg`, file, 'public');
      if (uploaded.url) setImages((prev) => [...prev, uploaded.url as string].slice(0, 4));
    } catch (error) {
      showNotice('Photo', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  async function publish() {
    if (!user || !supabase) return;
    if (!caption.trim() && !images.length) {
      showNotice('Statut', 'Légende ou photo requise.');
      return;
    }
    setBusy(true);
    try {
      await createStatus(supabase, {
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`.trim(),
        authorAvatarUrl: user.avatarUrl,
        caption,
        images,
      });
      router.back();
    } catch (error) {
      showNotice('Statut', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm
      pathname="/publish/status"
      title="Statut"
      subtitle={STEPS[step]}
      busy={busy}
      submitLabel={step < 1 ? 'Continuer' : 'Publier'}
      onSubmit={() => (step < 1 ? setStep(1) : void publish())}>
      <StepBar steps={STEPS} index={step} />
      {step > 0 ? (
        <Pressable onPress={() => setStep(0)}>
          <AppText className="text-sm font-bold text-app-accent">Retour</AppText>
        </Pressable>
      ) : null}
      {step === 0 ? (
        <>
          <Field label="Légende" value={caption} onChangeText={setCaption} multiline />
          <Pressable onPress={() => void addPhoto()}>
            <AppText className="text-sm font-bold text-app-accent">Ajouter une photo ({images.length}/4)</AppText>
          </Pressable>
        </>
      ) : (
        <AppText className="text-sm text-app-text">{caption.trim() || 'Sans légende'} · {images.length} photo(s) · 7 jours</AppText>
      )}
    </PublishForm>
  );
}
