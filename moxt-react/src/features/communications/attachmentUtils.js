import { messagesText } from './messagesI18n'

export const MAX_MESSAGE_IMAGES = 4

/** Constant angular step between stacked images (degrees). */
export const MESSAGE_IMAGE_STACK_ANGLE_STEP = 6

/**
 * Rotation for layer `index` (0 = front / base).
 * Received: positive step fan (opens up-right from shared bottom-right).
 * Sent: negative step fan (opens up-left from shared bottom-left).
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

export function attachmentPreviewLabel(attachment, t) {
  if (!attachment) return ''
  if (isImageAttachment(attachment)) {
    const count = attachmentImageSrcs(attachment).length
    if (count > 1) return messagesText(t, 'messages.attachment.photos', { count })
    return messagesText(t, 'messages.attachment.photo')
  }
  const name = attachment.name || messagesText(t, 'messages.attachment.fileFallback')
  return messagesText(t, 'messages.attachment.file', { name })
}

/** Plain searchable label (no emoji) for conversation / thread filters. */
export function attachmentSearchText(attachment, t) {
  if (!attachment) return ''
  const name = attachment.name || ''
  if (isImageAttachment(attachment)) {
    const count = attachmentImageSrcs(attachment).length
    if (count > 1) {
      return `${name} ${messagesText(t, 'messages.attachment.searchPhotos', { count })}`.trim()
    }
    return `${name} ${messagesText(t, 'messages.attachment.searchPhoto')}`.trim()
  }
  return name || messagesText(t, 'messages.attachment.searchFileFallback')
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'))
}
