import { supabase } from './supabaseClient'
import { compressImage } from './imageUtils'
import {
  fileSliceProgress,
  reportProgress,
  runWithUploadProgress,
  UPLOAD_PHASES,
} from './uploadProgress'

async function upload(bucket, path, file, { onProgress } = {}) {
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
  reportProgress(onProgress, { phase: UPLOAD_PHASES.finalizing, percent: 96 })
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  reportProgress(onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
  return data.publicUrl
}

async function uploadPrivate(bucket, path, file, { onProgress } = {}) {
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
  // Pas de createSignedUrl ici — signer à la consultation (économie bande passante).
  return path
}

function isImageFile(file) {
  return Boolean(
    file?.type?.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(file?.name || ''),
  )
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
  if (imagesOnly && !isImageFile(file)) {
    throw new Error('Seules les images sont autorisées.')
  }
  if (mime.startsWith('image/') && extension === 'pdf') {
    throw new Error('Type de fichier incohérent.')
  }
  if (mime === 'application/pdf' && !/\.pdf$/i.test(file.name || '')) {
    throw new Error('Type de fichier incohérent.')
  }
}

/** Compresse les images de preuve ; laisse PDF / autres fichiers intacts. */
async function maybeCompressProof(file, onProgress) {
  if (!isImageFile(file)) return file
  return compressThenUpload(
    file,
    { maxPx: 1600, quality: 0.82, onProgress },
    async (compressed) => compressed,
  )
}

function ext(file) {
  return String(file?.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
}

/** Aligne extension du nom et MIME après compression (évite .heic + contentType jpeg). */
function alignProofFileExtension(file) {
  if (!file) return file
  const mime = String(file.type || '').toLowerCase()
  let extension = ext(file)
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    if (!['jpg', 'jpeg'].includes(extension)) extension = 'jpg'
  } else if (mime === 'image/png' && extension !== 'png') {
    extension = 'png'
  } else if (mime === 'image/webp' && extension !== 'webp') {
    extension = 'webp'
  } else if (mime === 'application/pdf' && extension !== 'pdf') {
    extension = 'pdf'
  }
  if (!extension || extension === ext(file)) return file
  const base = String(file.name || 'proof').replace(/\.[^.]+$/, '') || 'proof'
  return new File([file], `${base}.${extension}`, {
    type: file.type,
    lastModified: file.lastModified || Date.now(),
  })
}

function wrapFileProgress(onProgress, fileIndex, fileCount, fileName) {
  if (!onProgress) return undefined
  return (update) => {
    const local = update.percent ?? 0
    onProgress({
      ...update,
      percent: fileSliceProgress(fileIndex, fileCount, local),
      fileIndex,
      fileCount,
      fileName: fileName || update.fileName,
    })
  }
}

async function compressThenUpload(file, { maxPx, quality, onProgress }, uploadFn) {
  reportProgress(onProgress, {
    phase: UPLOAD_PHASES.preparing,
    percent: 4,
    fileName: file?.name,
  })
  reportProgress(onProgress, {
    phase: UPLOAD_PHASES.compressing,
    percent: 12,
    fileName: file?.name,
  })
  const compressed = file.type?.startsWith('image/')
    ? await compressImage(file, { maxPx, quality })
    : file
  reportProgress(onProgress, {
    phase: UPLOAD_PHASES.compressing,
    percent: 28,
    fileName: file?.name,
  })
  return uploadFn(compressed)
}

async function uploadImageBatch(files, { onProgress, version = '' }, buildPathAndUpload) {
  const list = Array.isArray(files) ? files.filter(Boolean) : []
  const urls = []
  for (let i = 0; i < list.length; i += 1) {
    const file = list[i]
    const fileProgress = wrapFileProgress(onProgress, i, list.length, file.name)
    reportProgress(fileProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 4,
      fileName: file.name,
    })
    const url = await buildPathAndUpload(file, i, version, fileProgress)
    urls.push(url)
  }
  reportProgress(onProgress, {
    phase: UPLOAD_PHASES.done,
    percent: 100,
    fileCount: list.length,
  })
  return urls
}

export const storageService = {
  async uploadAvatar(userId, file, { onProgress } = {}) {
    return compressThenUpload(file, { maxPx: 512, quality: 0.88, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      return upload('avatars', `${userId}/avatar.${extension}`, compressed, { onProgress })
    })
  },

  async uploadBusinessLogo(userId, businessId, file, { onProgress } = {}) {
    const ownerId = String(userId || '').trim()
    if (!ownerId) throw new Error('Utilisateur requis pour envoyer le logo.')
    return compressThenUpload(file, { maxPx: 512, quality: 0.88, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      const typed =
        compressed.type && compressed.type.startsWith('image/')
          ? compressed
          : new File([compressed], `logo.${extension}`, {
              type: extension === 'png' ? 'image/png' : 'image/jpeg',
              lastModified: Date.now(),
            })
      return upload(
        'businesses',
        `${ownerId}/${businessId}/logo.${extension}`,
        typed,
        { onProgress },
      )
    })
  },

  async uploadBusinessBanner(userId, businessId, file, { onProgress } = {}) {
    const ownerId = String(userId || '').trim()
    if (!ownerId) throw new Error('Utilisateur requis pour envoyer la bannière.')
    return compressThenUpload(file, { maxPx: 1920, quality: 0.82, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      const typed =
        compressed.type && compressed.type.startsWith('image/')
          ? compressed
          : new File([compressed], `banner.${extension}`, {
              type: extension === 'png' ? 'image/png' : 'image/jpeg',
              lastModified: Date.now(),
            })
      return upload(
        'businesses',
        `${ownerId}/${businessId}/banner.${extension}`,
        typed,
        { onProgress },
      )
    })
  },

  async uploadListingImages(userId, listingId, files, { version = '', onProgress } = {}) {
    return uploadImageBatch(files, { onProgress, version }, async (file, i, ver, fileProgress) =>
      compressThenUpload(
        file,
        { maxPx: 1600, quality: 0.82, onProgress: fileProgress },
        async (compressed) => {
          const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
          const filename = ver ? `${ver}-${i}.${extension}` : `${i}.${extension}`
          return upload(
            'listings',
            `${userId}/${listingId}/${filename}`,
            compressed,
            { onProgress: fileProgress },
          )
        },
      ),
    )
  },

  async uploadJobImages(userId, jobId, files, { version = '', onProgress } = {}) {
    return uploadImageBatch(files, { onProgress, version }, async (file, i, ver, fileProgress) =>
      compressThenUpload(
        file,
        { maxPx: 1600, quality: 0.82, onProgress: fileProgress },
        async (compressed) => {
          const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
          const filename = ver ? `${ver}-${i}.${extension}` : `${i}.${extension}`
          return upload(
            'listings',
            `${userId}/jobs/${jobId}/${filename}`,
            compressed,
            { onProgress: fileProgress },
          )
        },
      ),
    )
  },

  async uploadEventImages(userId, eventId, files, { version = '', onProgress } = {}) {
    return uploadImageBatch(files, { onProgress, version }, async (file, i, ver, fileProgress) =>
      compressThenUpload(
        file,
        { maxPx: 1600, quality: 0.82, onProgress: fileProgress },
        async (compressed) => {
          const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
          const filename = ver ? `${ver}-${i}.${extension}` : `${i}.${extension}`
          return upload(
            'listings',
            `${userId}/events/${eventId}/${filename}`,
            compressed,
            { onProgress: fileProgress },
          )
        },
      ),
    )
  },

  async uploadSupportScreenshot(userId, file, { onProgress } = {}) {
    return compressThenUpload(file, { maxPx: 1600, quality: 0.82, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      return upload(
        'listings',
        `${userId}/support/${Date.now()}.${extension}`,
        compressed,
        { onProgress },
      )
    })
  },

  async uploadPostImage(userId, file, { onProgress } = {}) {
    return compressThenUpload(file, { maxPx: 1600, quality: 0.82, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      return upload(
        'listings',
        `${userId}/posts/${Date.now()}.${extension}`,
        compressed,
        { onProgress },
      )
    })
  },

  async uploadPostImages(userId, postId, files, { version = '', onProgress } = {}) {
    const list = Array.isArray(files) ? files.filter(Boolean).slice(0, 4) : []
    return uploadImageBatch(list, { onProgress, version }, async (file, i, ver, fileProgress) =>
      compressThenUpload(
        file,
        { maxPx: 1600, quality: 0.82, onProgress: fileProgress },
        async (compressed) => {
          const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
          const stamp = ver || Date.now().toString(36)
          const filename = `${stamp}-${i}.${extension}`
          const safePost = String(postId || 'draft').replace(/[^a-zA-Z0-9_-]/g, '_')
          return upload(
            'listings',
            `${userId}/posts/${safePost}/${filename}`,
            compressed,
            { onProgress: fileProgress },
          )
        },
      ),
    )
  },

  async uploadStatusImages(userId, statusId, files, { version = '', onProgress } = {}) {
    const list = Array.isArray(files) ? files.filter(Boolean).slice(0, 4) : []
    return uploadImageBatch(list, { onProgress, version }, async (file, i, ver, fileProgress) =>
      compressThenUpload(
        file,
        { maxPx: 1600, quality: 0.82, onProgress: fileProgress },
        async (compressed) => {
          const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
          const stamp = ver || Date.now().toString(36)
          const filename = `${stamp}-${i}.${extension}`
          const safeStatus = String(statusId || 'draft').replace(/[^a-zA-Z0-9_-]/g, '_')
          return upload(
            'listings',
            `${userId}/statuses/${safeStatus}/${filename}`,
            compressed,
            { onProgress: fileProgress },
          )
        },
      ),
    )
  },

  async uploadMessageImage(userId, conversationId, file, { index = 0, onProgress } = {}) {
    return compressThenUpload(file, { maxPx: 1600, quality: 0.82, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      const stamp = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
      return upload(
        'listings',
        `${userId}/messages/${conversationId}/${stamp}.${extension}`,
        compressed,
        { onProgress },
      )
    })
  },

  async uploadMessageFile(userId, conversationId, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const extension = ext(file) || 'bin'
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const safeName = String(file?.name || 'file')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 80)
    return upload(
      'listings',
      `${userId}/messages/${conversationId}/files/${stamp}-${safeName || `file.${extension}`}`,
      file,
      { onProgress },
    )
  },

  async uploadDocument(userId, category, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const path = `${userId}/${category}-${Date.now()}.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
    await uploadPrivate('documents', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async uploadBusinessDocument(userId, businessId, category, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const safeBusiness = String(businessId || 'business').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeCategory = String(category || 'other').replace(/[^a-zA-Z0-9_-]/g, '_')
    const path = `${userId}/business/${safeBusiness}/${safeCategory}-${Date.now()}.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
    await uploadPrivate('documents', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  /**
   * Supprime un fichier du bucket privé `documents`.
   * Sert de compensation quand l'enregistrement en base échoue après un upload
   * réussi : sans ça le fichier resterait orphelin dans le stockage, invisible
   * pour l'app (donc jamais purgé, et non supprimé à la clôture du compte).
   */
  async removeDocument(path) {
    if (!path) return false
    const { error } = await supabase.storage.from('documents').remove([path])
    if (error) {
      console.warn('[Storage] cleanup failed:', error.message)
      return false
    }
    return true
  },

  /**
   * Liste les fichiers du bucket `documents` que plus aucune ligne ne
   * référence (upload réussi + enregistrement échoué, ou compte supprimé).
   * La détection est faite en base (RPC admin) ; la suppression doit passer
   * par l'API Storage — Postgres interdit `delete from storage.objects`.
   */
  async listOrphanDocuments(graceHours = 24) {
    const { data, error } = await supabase.rpc('moxt_orphan_document_objects', {
      p_grace_hours: graceHours,
    })
    if (error) throw new Error(error.message)
    return (data || []).map((row) => ({
      path: row.object_name,
      uploadedAt: row.uploaded_at,
    }))
  },

  /** Supprime les orphelins listés ci-dessus. Renvoie {removed, failed}. */
  async purgeOrphanDocuments(graceHours = 24) {
    const orphans = await this.listOrphanDocuments(graceHours)
    if (!orphans.length) return { removed: 0, failed: 0 }

    const paths = orphans.map((item) => item.path)
    const { data, error } = await supabase.storage.from('documents').remove(paths)
    if (error) throw new Error(error.message)

    const removed = Array.isArray(data) ? data.length : 0
    return { removed, failed: paths.length - removed }
  },

  extractDocumentsPath(urlOrPath) {
    if (!urlOrPath || typeof urlOrPath !== 'string') return null
    const raw = urlOrPath.trim()
    if (!raw.includes('://') && !raw.startsWith('/')) return raw.replace(/^\/*/, '')
    try {
      const pathname = decodeURIComponent(new URL(raw).pathname)
      const markers = [
        '/object/sign/documents/',
        '/object/authenticated/documents/',
        '/object/public/documents/',
      ]
      for (const marker of markers) {
        const idx = pathname.indexOf(marker)
        if (idx >= 0) {
          return pathname.slice(idx + marker.length).replace(/^\/*/, '')
        }
      }
      const fallback = pathname.match(/\/documents\/(.+)$/)
      if (fallback?.[1]) return decodeURIComponent(fallback[1])
    } catch {
      return null
    }
    return null
  },

  async getDocumentSignedUrl(urlOrPath) {
    const path = this.extractDocumentsPath(urlOrPath)
    if (!path) throw new Error('Chemin document introuvable')
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  async uploadParcelProof(userId, parcelId, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const path = `${userId}/${parcelId}/proof.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
    await uploadPrivate('parcels', path, uploadFile, { onProgress })
    return path
  },

  async uploadTransferProof(userId, transferId, file, { onProgress } = {}) {
    const ownerId = String(userId || '').trim()
    if (!ownerId) throw new Error('Utilisateur requis pour envoyer la preuve.')
    if (!transferId) throw new Error('Référence de transfert manquante.')
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const uploadFile = alignProofFileExtension(await maybeCompressProof(file, onProgress))
    const path = `${ownerId}/${transferId}/proof.${ext(uploadFile) || 'bin'}`
    await uploadPrivate('transfers', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async uploadBusinessTransferProof(userId, transferId, file, { onProgress } = {}) {
    const ownerId = String(userId || '').trim()
    if (!ownerId) throw new Error('Utilisateur requis pour envoyer la preuve.')
    if (!transferId) throw new Error('Référence de transfert manquante.')
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const uploadFile = alignProofFileExtension(await maybeCompressProof(file, onProgress))
    const path = `${ownerId}/${transferId}/business.${ext(uploadFile) || 'bin'}`
    await uploadPrivate('transfers', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async uploadP2POrderProof(userId, orderId, file, { onProgress } = {}) {
    const ownerId = String(userId || '').trim()
    if (!ownerId) throw new Error('Utilisateur requis pour envoyer la preuve.')
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const uploadFile = alignProofFileExtension(await maybeCompressProof(file, onProgress))
    const path = `${ownerId}/p2p/${orderId}/${Date.now()}.${ext(uploadFile) || 'bin'}`
    await uploadPrivate('transfers', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async getParcelProofSignedUrl(path) {
    const { data, error } = await supabase.storage.from('parcels').createSignedUrl(path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  async getTransferProofSignedUrl(path) {
    const { data, error } = await supabase.storage.from('transfers').createSignedUrl(path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  async downloadTransferProof(path) {
    const { data, error } = await supabase.storage.from('transfers').download(path)
    if (error) throw new Error(error.message)
    return data
  },
}
