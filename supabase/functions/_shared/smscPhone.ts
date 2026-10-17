export function normalizeE164(phone = '') {
  const trimmed = String(phone).trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  if (trimmed.startsWith('+')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 10) return `+7${digits}`
  return `+${digits}`
}

export function phoneToSmsc(phone: string) {
  const e164 = normalizeE164(phone)
  const digits = e164.replace(/\D/g, '')
  if (!digits || digits.length < 8) {
    throw new Error('SMSC : numéro de téléphone invalide.')
  }
  return digits
}
