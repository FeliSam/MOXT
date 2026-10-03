import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { createPost } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import { AppText } from '@/components/ui/AppText';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

const STEPS = ['Texte', 'Photos', 'Confirmation'];

/** Publication du fil (ShareToFeedModal : texte, jusqu'à 4 photos). */
export default function PublishPostScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function addPhoto() {
    try {
      const file = await pickLibraryFile('images');
      if (!file || !user) return;
      const uploaded = await uploadLikeWeb('listings', `${user.id}/posts/${Date.now()}.jpg`, file, 'public');
      if (uploaded.url) setPhotos((prev) => [...prev, uploaded.url as string].slice(0, 4));
    } catch (error) {
      showNotice('Photo', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  async function publish() {
    if (!user || !supabase) return;
    if (!message.trim() && !photos.length) {
      showNotice('Publication', 'Texte ou photo requis.');
      return;
    }
    setBusy(true);
    try {
      await createPost(supabase, {
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`.trim(),
        authorAvatarUrl: user.avatarUrl,
        message,
        images: photos,
      });
      router.replace('/(tabs)/feed' as never);
    } catch (error) {
      showNotice('Publication', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm
      pathname="/publish/post"
      title="Fil d’actualité"
      subtitle={STEPS[step]}
      busy={busy}
      submitLabel={step < 2 ? 'Continuer' : 'Publier'}
      onSubmit={() => (step < 2 ? setStep(step + 1) : void publish())}>
      <StepBar steps={STEPS} index={step} />
      {step > 0 ? (
        <Pressable onPress={() => setStep(step - 1)}>
          <AppText className="text-sm font-bold text-app-accent">Retour</AppText>
        </Pressable>
      ) : null}
      {step === 0 ? <Field label="Message" value={message} onChangeText={setMessage} multiline placeholder="Quoi de neuf ?" /> : null}
      {step === 1 ? (
        <Pressable onPress={() => void addPhoto()}>
          <AppText className="text-sm font-bold text-app-accent">Ajouter une photo ({photos.length}/4)</AppText>
        </Pressable>
      ) : null}
      {step === 2 ? (
        <AppText className="text-sm text-app-text">{message.trim() || 'Sans texte'} · {photos.length} photo(s)</AppText>
      ) : null}
    </PublishForm>
  );
}
