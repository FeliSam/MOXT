/** Feature flags et URLs média Yandex (Phase 1). */
export const mediaConfig = {
  /** Active uploads via Edge Function media-api → Yandex Object Storage. */
  yandexEnabled: import.meta.env.VITE_MEDIA_YANDEX_ENABLED === 'true',
  /** Après cutover : bloque tout nouvel upload Supabase Storage. */
  supabaseUploadsDisabled: import.meta.env.VITE_MEDIA_SUPABASE_UPLOADS_DISABLED === 'true',
  /** CDN public (ex. https://cdn.moxtapp.ru). Fallback : endpoint S3 direct. */
  cdnBase: String(import.meta.env.VITE_MEDIA_CDN_BASE || '').replace(/\/+$/, ''),
  publicBucket: import.meta.env.VITE_MEDIA_PUBLIC_BUCKET || 'moxt-public',
  privateBucket: import.meta.env.VITE_MEDIA_PRIVATE_BUCKET || 'moxt-private',
}

export function isYandexMediaActive() {
  return mediaConfig.yandexEnabled && !mediaConfig.supabaseUploadsDisabled
}

export function assertUploadBackendAvailable() {
  if (mediaConfig.supabaseUploadsDisabled && !mediaConfig.yandexEnabled) {
    throw new Error('Uploads désactivés : configurez VITE_MEDIA_YANDEX_ENABLED=true.')
  }
}
