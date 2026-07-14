export const MAX_MESSAGE_IMAGES = 4

/** Constant angular step between stacked images (degrees). */
export const MESSAGE_IMAGE_STACK_ANGLE_STEP = 12

/**
 * Rotation for layer `index` (0 = front / base).
 * Received: positive step fan (opens up-right from shared bottom-left).
 * Sent: negative step fan (opens up-left, stays bubble-aligned).
 */
export function messageImageStackRotation(index, { sent = false } = {}) {
  if (!index) return 0
  const step = sent ? -MESSAGE_IMAGE_STACK_ANGLE_STEP : MESSAGE_IMAGE_STACK_ANGLE_STEP
  return index * step
}

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

/** Plain searchable label (no emoji) for conversation / thread filters. */
export function attachmentSearchText(attachment) {
  if (!attachment) return ''
  const name = attachment.name || ''
  if (isImageAttachment(attachment)) {
    const count = attachmentImageSrcs(attachment).length
    if (count > 1) return `${name} ${count} photos photo images`.trim()
    return `${name} photo image`.trim()
  }
  return name || 'pièce jointe'
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'))
}
