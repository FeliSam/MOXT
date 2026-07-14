export const MAX_MESSAGE_IMAGES = 4

/** Mild per-layer twists for a leftward pile (paired with ~-15% translateX). */
export const MESSAGE_IMAGE_STACK_ROTATIONS = [0, -3, 2.5, -4]

/** Horizontal offset per stacked image, as a fraction of card width. */
export const MESSAGE_IMAGE_STACK_OFFSET = 0.15

export function isImageAttachment(attachment) {
  if (!attachment) return false
  if (Array.isArray(attachment.urls) && attachment.urls.length > 0) return true
  if (attachment.type?.startsWith('image/')) return true
  const src = attachment.url || attachment.localUrl || ''
  return /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(src)
}

export function attachmentImageSrc(attachment) {
  if (!attachment) return null
  if (Array.isArray(attachment.urls) && attachment.urls.length > 0) {
    return attachment.urls[0] || null
  }
  return attachment.url || attachment.localUrl || null
}

/** All image URLs for a message attachment (max 4). Backward compatible with single `url`. */
export function attachmentImageSrcs(attachment) {
  if (!attachment) return []
  if (Array.isArray(attachment.urls) && attachment.urls.length > 0) {
    return attachment.urls.filter(Boolean).slice(0, MAX_MESSAGE_IMAGES)
  }
  const src = attachment.url || attachment.localUrl || null
  return src ? [src] : []
}

export function attachmentPreviewLabel(attachment) {
  if (!attachment) return ''
  if (isImageAttachment(attachment)) {
    const count = attachmentImageSrcs(attachment).length
    if (count > 1) return `📷 ${count} photos`
    return '📷 Photo'
  }
  return `📎 ${attachment.name || 'Pièce jointe'}`
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'))
}
