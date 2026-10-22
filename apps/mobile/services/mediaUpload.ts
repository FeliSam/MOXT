import {
  inferEntityFromLegacyBucket,
  inferKindFromMime,
  legacyPathToObjectKey,
} from '@moxt/shared/media/objectKeys.js';
import { MEDIA_KIND_BY_LEGACY_BUCKET } from '@moxt/shared/media/storageAudit.js';

import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type UploadFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

async function toBlob(file: UploadFile) {
  const response = await fetch(file.uri);
  return response.blob();
}

/**
 * Même chemin que le web : presign media-api (Yandex) puis repli Supabase Storage.
 * `private` renvoie le chemin (les documents KYC n'exposent pas d'URL publique).
 */
export async function uploadLikeWeb(bucket: string, path: string, file: UploadFile, visibility: 'public' | 'private' = 'public') {
  if (!supabase) throw new Error('Supabase indisponible');
  try {
    const objectKey = legacyPathToObjectKey(bucket, path);
    const inferred = inferEntityFromLegacyBucket(bucket, path);
    const kinds = MEDIA_KIND_BY_LEGACY_BUCKET as Record<string, string>;
    const { data: presign, error } = await supabase.functions.invoke('media-api', {
      body: {
        action: 'presign',
        objectKey,
        mimeType: file.type || 'application/octet-stream',
        visibility,
        kind: kinds[bucket] || inferKindFromMime(file.type),
        entityType: inferred.entityType,
        entityId: inferred.entityId,
        legacySupabaseBucket: bucket,
        legacySupabasePath: path,
      },
    });
    if (!error && presign?.uploadUrl && !presign.error) {
      const blob = await toBlob(file);
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: blob,
      });
      if (!put.ok) throw new Error(`Upload HTTP ${put.status}`);
      const { data: finalized, error: finError } = await supabase.functions.invoke('media-api', {
        body: { action: 'finalize', mediaId: presign.mediaId, byteSize: file.size || blob.size },
      });
      if (finError || finalized?.error) throw new Error(finError?.message || String(finalized?.error));
      return { url: visibility === 'public' ? (finalized?.publicUrl as string) || null : null, path };
    }
  } catch {
    // Repli Storage, comme le web quand Yandex échoue.
  }

  const blob = await toBlob(file);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  if (visibility === 'private') return { url: null, path };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Photo ou PDF, comme l’input web `accept="image/*,.pdf"`. */
export async function pickImageOrPdf(): Promise<UploadFile | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || 'document',
    type: asset.mimeType || (asset.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    size: asset.size,
  };
}

export async function pickLibraryFile(kind: 'images' | 'videos'): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Autorisez l’accès à la galerie pour joindre un fichier.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: [kind], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const fallback = kind === 'videos' ? 'video.mp4' : 'photo.jpg';
  return {
    uri: asset.uri,
    name: asset.fileName || fallback,
    type: asset.mimeType || (kind === 'videos' ? 'video/mp4' : 'image/jpeg'),
    size: asset.fileSize,
  };
}
