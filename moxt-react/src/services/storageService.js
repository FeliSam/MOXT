import { supabase } from './supabaseClient'
import { compressImage } from './imageUtils'
import {
  fileSliceProgress,
  reportProgress,
  runWithUploadProgress,
  UPLOAD_PHASES,
} from './uploadProgress'

async function upload(bucket, path, file, { onProgress } = {}) {
  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 32 })
  await runWithUploadProgress(onProgress, async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    })
    if (error) throw new Error(error.message)
  })
  reportProgress(onProgress, { phase: UPLOAD_PHASES.finalizing, percent: 96 })
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  reportProgress(onProgress, { phase: UPLOAD_PHASES.done, percent: 100 })
  return data.publicUrl
}

async function uploadPrivate(bucket, path, file, { onProgress } = {}) {
  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 32 })
  await runWithUploadProgress(onProgress, async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '3600',
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
  return file.name.split('.').pop().toLowerCase()
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
    return compressThenUpload(file, { maxPx: 512, quality: 0.88, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      return upload(
        'businesses',
        `${userId}/${businessId}/logo.${extension}`,
        compressed,
        { onProgress },
      )
    })
  },

  async uploadBusinessBanner(userId, businessId, file, { onProgress } = {}) {
    return compressThenUpload(file, { maxPx: 1920, quality: 0.82, onProgress }, async (compressed) => {
      const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
      return upload(
        'businesses',
        `${userId}/${businessId}/banner.${extension}`,
        compressed,
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
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const path = `${userId}/${transferId}/proof.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
    await uploadPrivate('transfers', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async uploadBusinessTransferProof(userId, transferId, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const path = `${userId}/${transferId}/business.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
    await uploadPrivate('transfers', path, uploadFile, { onProgress })
    return { url: null, path }
  },

  async uploadP2POrderProof(userId, orderId, file, { onProgress } = {}) {
    reportProgress(onProgress, {
      phase: UPLOAD_PHASES.preparing,
      percent: 6,
      fileName: file?.name,
    })
    const path = `${userId}/p2p/${orderId}/${Date.now()}.${ext(file)}`
    const uploadFile = await maybeCompressProof(file, onProgress)
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
