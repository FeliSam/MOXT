import { supabase } from '../supabaseClient'
import { MEDIA_KIND_BY_LEGACY_BUCKET } from '@moxt/shared/media/storageAudit.js'
import {
  inferEntityFromLegacyBucket,
  inferKindFromMime,
  legacyPathToObjectKey,
} from '@moxt/shared/media/objectKeys.js'
import { reportProgress, UPLOAD_PHASES } from '../uploadProgress'

async function invokeMediaApi(body) {
  if (!supabase) throw new Error('Supabase indisponible')
  const { data, error } = await supabase.functions.invoke('media-api', { body })
  if (error) throw new Error(error.message || 'media-api error')
  if (data?.error) throw new Error(String(data.error))
  return data
}

function putWithProgress(uploadUrl, file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      const local = Math.round((event.loaded / event.total) * 64) + 32
      reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: local })
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload Yandex HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Upload Yandex réseau'))
    xhr.send(file)
  })
}

export async function uploadToYandex({
  legacyBucket,
  legacyPath,
  file,
  visibility,
  kind,
  entityType,
  entityId,
  expiresAt,
  onProgress,
}) {
  const objectKey = legacyPathToObjectKey(legacyBucket, legacyPath)
  const inferred = inferEntityFromLegacyBucket(legacyBucket, legacyPath)
  const presign = await invokeMediaApi({
    action: 'presign',
    objectKey,
    mimeType: file.type || 'application/octet-stream',
    visibility: visibility || (objectKey.startsWith('private/') ? 'private' : 'public'),
    kind: kind || MEDIA_KIND_BY_LEGACY_BUCKET[legacyBucket] || inferKindFromMime(file.type),
    entityType: entityType || inferred.entityType,
    entityId: entityId || inferred.entityId,
    legacySupabaseBucket: legacyBucket,
    legacySupabasePath: legacyPath,
    expiresAt: expiresAt || null,
  })

  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 32 })
  await putWithProgress(presign.uploadUrl, file, { onProgress })

  reportProgress(onProgress, { phase: UPLOAD_PHASES.finalizing, percent: 96 })
  const finalized = await invokeMediaApi({
    action: 'finalize',
    mediaId: presign.mediaId,
    byteSize: file.size,
  })

  return {
    mediaId: finalized.mediaId,
    publicUrl: finalized.publicUrl,
    objectKey: finalized.objectKey || presign.objectKey,
    path: legacyPath,
  }
}

export async function signedGetMediaUrl(mediaId) {
  const data = await invokeMediaApi({ action: 'signed-get', mediaId })
  return data.url
}

export async function resolvePrivateSignedUrl(legacyBucket, legacyPath, supabaseFallback) {
  if (!supabase) return supabaseFallback(legacyBucket, legacyPath)
  const { data: row } = await supabase
    .from('media_objects')
    .select('id, visibility, status, public_url')
    .eq('legacy_supabase_bucket', legacyBucket)
    .eq('legacy_supabase_path', legacyPath)
    .eq('status', 'ready')
    .maybeSingle()

  if (row?.id) {
    if (row.visibility === 'public' && row.public_url) return row.public_url
    return signedGetMediaUrl(row.id)
  }
  return supabaseFallback(legacyBucket, legacyPath)
}
