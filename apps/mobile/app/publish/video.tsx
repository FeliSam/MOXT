import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { createVideo } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm } from '@/components/publish/PublishForm';
import { AppText } from '@/components/ui/AppText';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { selectOwnedBusinesses } from '@/store/account';
import { useAppSelector } from '@/store/store';
import { showNotice } from '@/utils/notice';

/** Vidéo du fil (PublishVideoPage : titre + fichier, entreprise requise). */
export default function PublishVideoScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [fileName, setFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function pick() {
    if (!user || !business) return;
    try {
      const file = await pickLibraryFile('videos');
      if (!file) return;
      setBusy(true);
      const id = `VID-${Date.now().toString(36).toUpperCase()}`;
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const uploaded = await uploadLikeWeb('videos', `${user.id}/${business.id}/${id}.${ext}`, file, 'public');
      if (!uploaded.url) throw new Error('URL vidéo manquante');
      setVideoUrl(uploaded.url);
      setFileName(file.name);
    } catch (error) {
      showNotice('Vidéo', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!user || !business || !supabase) return;
    setBusy(true);
    try {
      await createVideo(supabase, {
        ownerId: user.id,
        businessId: business.id,
        businessName: business.name,
        title: title.trim(),
        caption: caption.trim(),
        videoUrl,
      });
      router.replace('/(tabs)/feed?type=video' as never);
    } catch (error) {
      showNotice('Vidéo', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublishForm title="Publier une vidéo" subtitle="Clip vertical pour le fil" busy={busy} onSubmit={() => void publish()}>
      {!business ? (
        <AppText className="text-sm text-app-text-muted">Une entreprise est nécessaire pour publier une vidéo, comme sur le web.</AppText>
      ) : (
        <AppText className="text-sm text-app-text-muted">Publiée au nom de {business.name}.</AppText>
      )}
      <Field label="Titre" value={title} onChangeText={setTitle} />
      <Field label="Légende" value={caption} onChangeText={setCaption} multiline />
      <Pressable onPress={() => void pick()} disabled={!business}>
        <AppText className="text-sm font-bold text-app-accent">{fileName || 'Choisir une vidéo'}</AppText>
      </Pressable>
    </PublishForm>
  );
}
