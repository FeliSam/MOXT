import { supabase } from '../supabaseClient'
import { mediaConfig, assertUploadBackendAvailable } from '../../config/mediaConfig.js'
import { appendCacheBust } from './mediaUrlUtils.js'
import { uploadToYandex, resolvePrivateSignedUrl } from './yandexMediaClient.js'
import { reportProgress, runWithUploadProgress, UPLOAD_PHASES } from '../uploadProgress'

async function uploadSupabasePublic(bucket, path, file, { onProgress } = {}) {
  assertAllowedUpload(file)
  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 32 })
  await runWithUploadProgress(onProgress, async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '60',
      contentType: file.type || undefined,
    })
    if (error) throw new Error(error.message)
  })
  reportProgress(onProgress, { phase: UPLOAD_PHASES.finalizing, percent: 96 })
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  reportProgress(onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
  return appendCacheBust(data.publicUrl)
}

async function uploadSupabasePrivate(bucket, path, file, { onProgress } = {}) {
  assertAllowedUpload(file)
  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 32 })
  await runWithUploadProgress(onProgress, async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || undefined,
    })
    if (error) throw new Error(error.message)
  })
  reportProgress(onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
  return path
}

const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  'application/pdf',
  'video/mp4',
  'video/webm',
])

const ALLOWED_UPLOAD_EXT = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'heic',
  'heif',
  'avif',
  'pdf',
  'mp4',
  'webm',
])

function assertAllowedUpload(file, { imagesOnly = false } = {}) {
  if (!file) throw new Error('Fichier manquant.')
  const extension = String(file.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
  const mime = String(file.type || '').toLowerCase()
  const mimeOk = mime ? ALLOWED_UPLOAD_MIME.has(mime) : false
  const extOk = extension ? ALLOWED_UPLOAD_EXT.has(extension) : false
  if (!mimeOk && !extOk) {
    throw new Error('Type de fichier non autorisé.')
  }
  if (imagesOnly && !mime.startsWith('image/')) {
    throw new Error('Seules les images sont autorisées.')
  }
}

/**
 * Provider pattern : Yandex primary (media-api) + fallback Supabase Storage temporaire.
 */
export function createMediaStorageProvider({ supabaseFallback = true } = {}) {
  const useYandex = mediaConfig.yandexEnabled
  const blockSupabase = mediaConfig.supabaseUploadsDisabled

  async function uploadPublic(bucket, path, file, options = {}) {
    assertUploadBackendAvailable()
    assertAllowedUpload(file)
    if (useYandex) {
      try {
        const result = await uploadToYandex({
          legacyBucket: bucket,
          legacyPath: path,
          file,
          visibility: 'public',
          onProgress: options.onProgress,
        })
        reportProgress(options.onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
        return appendCacheBust(result.publicUrl)
      } catch (error) {
        if (blockSupabase || !supabaseFallback) throw error
        console.warn('[Media] Yandex upload failed, fallback Supabase:', error.message)
      }
    }
    if (blockSupabase) {
      throw new Error('Upload Supabase Storage désactivé — configurez Yandex.')
    }
    return uploadSupabasePublic(bucket, path, file, options)
  }

  async function uploadPrivate(bucket, path, file, options = {}) {
    assertUploadBackendAvailable()
    assertAllowedUpload(file)
    if (useYandex) {
      try {
        await uploadToYandex({
          legacyBucket: bucket,
          legacyPath: path,
          file,
          visibility: 'private',
          onProgress: options.onProgress,
        })
        reportProgress(options.onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
        return path
      } catch (error) {
        if (blockSupabase || !supabaseFallback) throw error
        console.warn('[Media] Yandex private upload failed, fallback Supabase:', error.message)
      }
    }
    if (blockSupabase) {
      throw new Error('Upload Supabase Storage désactivé — configurez Yandex.')
    }
    return uploadSupabasePrivate(bucket, path, file, options)
  }

  async function signedUrl(bucket, path) {
    return resolvePrivateSignedUrl(bucket, path, async (b, p) => {
      const { data, error } = await supabase.storage.from(b).createSignedUrl(p, 3600)
      if (error) throw new Error(error.message)
      return data.signedUrl
    })
  }

  return { uploadPublic, uploadPrivate, signedUrl }
}

export const mediaStorage = createMediaStorageProvider()

export { assertAllowedUpload }
