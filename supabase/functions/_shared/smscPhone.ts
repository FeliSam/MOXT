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
  if (!e164.startsWith('+7') || e164.length !== 12) {
    throw new Error('SMSC : seuls les numéros russes (+7) sont pris en charge pour l’instant.')
  }
  return e164.slice(1)
}
