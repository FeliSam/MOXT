/**
 * Politique de dépréciation Supabase Storage (Phase 1 cutover).
 * VITE_MEDIA_SUPABASE_UPLOADS_DISABLED=true bloque les nouveaux uploads legacy.
 */
import { mediaConfig } from '../../config/mediaConfig.js'

export function isSupabaseStorageUploadAllowed() {
  return !mediaConfig.supabaseUploadsDisabled
}

export function warnIfSupabaseStorageUsed(context = 'upload') {
  if (mediaConfig.yandexEnabled && !mediaConfig.supabaseUploadsDisabled) {
    console.info(`[Media] ${context} : dual-write Yandex + fallback Supabase actif`)
  }
}

export function getMediaBackendStatus() {
  return {
    yandexEnabled: mediaConfig.yandexEnabled,
    supabaseUploadsDisabled: mediaConfig.supabaseUploadsDisabled,
    cdnBase: mediaConfig.cdnBase,
    primary: mediaConfig.yandexEnabled ? 'yandex' : 'supabase',
  }
}
