import { supabase } from './supabaseClient'
import { compressImage } from './imageUtils'

async function upload(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

async function uploadPrivate(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(error.message)
  // Signed URL valable 1h pour les buckets privés
  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)
  if (signedError) throw new Error(signedError.message)
  return data.signedUrl
}

function ext(file) {
  return file.name.split('.').pop().toLowerCase()
}

export const storageService = {
  async uploadAvatar(userId, file) {
    const compressed = await compressImage(file, { maxPx: 512, quality: 0.88 })
    const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
    return upload('avatars', `${userId}/avatar.${extension}`, compressed)
  },

  async uploadBusinessLogo(userId, businessId, file) {
    const compressed = await compressImage(file, { maxPx: 512, quality: 0.88 })
    const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
    return upload('businesses', `${userId}/${businessId}/logo.${extension}`, compressed)
  },

  async uploadBusinessBanner(userId, businessId, file) {
    const compressed = await compressImage(file, { maxPx: 1920, quality: 0.82 })
    const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
    return upload('businesses', `${userId}/${businessId}/banner.${extension}`, compressed)
  },

  async uploadListingImages(userId, listingId, files) {
    const urls = await Promise.all(
      files.map(async (file, i) => {
        const compressed = await compressImage(file, { maxPx: 1600, quality: 0.82 })
        const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
        return upload('listings', `${userId}/${listingId}/${i}.${extension}`, compressed)
      }),
    )
    return urls
  },

  // Bucket public 'listings' réutilisé — la RLS impose ${userId}/... comme préfixe.
  async uploadJobImages(userId, jobId, files) {
    return Promise.all(
      files.map(async (file, i) => {
        const compressed = await compressImage(file, { maxPx: 1600, quality: 0.82 })
        const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
        return upload('listings', `${userId}/jobs/${jobId}/${i}.${extension}`, compressed)
      }),
    )
  },

  async uploadEventImages(userId, eventId, files) {
    return Promise.all(
      files.map(async (file, i) => {
        const compressed = await compressImage(file, { maxPx: 1600, quality: 0.82 })
        const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
        return upload('listings', `${userId}/events/${eventId}/${i}.${extension}`, compressed)
      }),
    )
  },

  async uploadSupportScreenshot(userId, file) {
    const compressed = await compressImage(file, { maxPx: 1600, quality: 0.82 })
    const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
    return upload('listings', `${userId}/support/${Date.now()}.${extension}`, compressed)
  },

  async uploadMessageImage(userId, conversationId, file, { index = 0 } = {}) {
    const compressed = await compressImage(file, { maxPx: 1600, quality: 0.82 })
    const extension = compressed.type === 'image/png' ? 'png' : 'jpg'
    const stamp = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
    return upload(
      'listings',
      `${userId}/messages/${conversationId}/${stamp}.${extension}`,
      compressed,
    )
  },

  async uploadDocument(userId, category, file) {
    const path = `${userId}/${category}-${Date.now()}.${ext(file)}`
    return uploadPrivate('documents', path, file)
  },

  async uploadParcelProof(userId, parcelId, file) {
    const path = `${userId}/${parcelId}/proof.${ext(file)}`
    return uploadPrivate('parcels', path, file)
  },

  async uploadTransferProof(userId, transferId, file) {
    const path = `${userId}/${transferId}/proof.${ext(file)}`
    const url = await uploadPrivate('transfers', path, file)
    return { url, path }
  },

  async uploadBusinessTransferProof(userId, transferId, file) {
    const path = `${userId}/${transferId}/business.${ext(file)}`
    const url = await uploadPrivate('transfers', path, file)
    return { url, path }
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
