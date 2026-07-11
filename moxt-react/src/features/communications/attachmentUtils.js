export function isImageAttachment(attachment) {
  if (!attachment) return false
  if (attachment.type?.startsWith('image/')) return true
  const src = attachment.url || attachment.localUrl || ''
  return /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(src)
}

export function attachmentImageSrc(attachment) {
  if (!attachment) return null
  return attachment.url || attachment.localUrl || null
}

export function attachmentPreviewLabel(attachment) {
  if (!attachment) return ''
  if (isImageAttachment(attachment)) return '📷 Photo'
  return `📎 ${attachment.name || 'Pièce jointe'}`
}
