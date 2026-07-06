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
    return upload('businesses', `${userId}/${businessId}/logo.${ext(file)}`, file)
  },

  async uploadBusinessBanner(userId, businessId, file) {
    return upload('businesses', `${userId}/${businessId}/banner.${ext(file)}`, file)
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
    return uploadPrivate('transfers', path, file)
  },
}
