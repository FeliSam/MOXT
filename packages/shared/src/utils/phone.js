export function normalizePhone(value = '') {
  const trimmed = String(value).trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return `${hasPlus ? '+' : ''}${digits}`
}

export function normalizeRussianAuthPhone(value) {
  const phone = normalizePhone(value)
  return /^8\d{10}$/.test(phone) ? `+7${phone.slice(1)}` : phone
}
