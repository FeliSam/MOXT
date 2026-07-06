const DEFAULT_LOCALE = 'fr-FR'

export function formatCurrency(amount, currency, locale = DEFAULT_LOCALE) {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) return '—'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'XOF',
      maximumFractionDigits: currency === 'XOF' ? 0 : 2,
    }).format(numericAmount)
  } catch {
    return `${numericAmount.toLocaleString(locale)} ${currency || ''}`.trim()
  }
}

export function formatDateTime(value, locale = DEFAULT_LOCALE) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date indisponible'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatShortDate(value, locale = DEFAULT_LOCALE) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date indisponible'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function formatFileSize(bytes, locale = DEFAULT_LOCALE) {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size <= 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** unitIndex
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`
}
