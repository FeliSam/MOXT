const DEFAULT_LOCALE = 'fr-FR'
const LOCALE_BY_LANGUAGE = {
  en: 'en-US',
  fr: 'fr-FR',
  pt: 'pt-PT',
  ru: 'ru-RU',
}

function resolveFormatLocale(locale) {
  const requested =
    locale ||
    (typeof globalThis !== 'undefined'
      ? globalThis.document?.documentElement?.lang
      : undefined)
  if (!requested) return DEFAULT_LOCALE
  const normalized = String(requested).trim()
  return LOCALE_BY_LANGUAGE[normalized.toLowerCase()] || normalized
}

export function formatCurrency(amount, currency, locale) {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) return '—'
  const resolvedLocale = resolveFormatLocale(locale)
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: currency || 'XOF',
      maximumFractionDigits: currency === 'XOF' ? 0 : 2,
    }).format(numericAmount)
  } catch {
    return `${numericAmount.toLocaleString(resolvedLocale)} ${currency || ''}`.trim()
  }
}

export function formatDateTime(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(resolveFormatLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatShortDate(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(resolveFormatLocale(locale), { dateStyle: 'medium' }).format(date)
}

export function formatTime(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(resolveFormatLocale(locale), { timeStyle: 'short' }).format(date)
}

export function formatFileSize(bytes, locale) {
  const size = Number(bytes)
  const resolvedLocale = resolveFormatLocale(locale)
  const language = resolvedLocale.toLowerCase().split('-')[0]
  const units =
    language === 'fr'
      ? ['o', 'Ko', 'Mo', 'Go']
      : language === 'ru'
        ? ['Б', 'КБ', 'МБ', 'ГБ']
        : ['B', 'KB', 'MB', 'GB']
  if (!Number.isFinite(size) || size <= 0) return `0 ${units[0]}`
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** unitIndex
  return `${new Intl.NumberFormat(resolvedLocale, { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`
}
