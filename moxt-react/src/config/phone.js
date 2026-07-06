import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from './geography'

const GENERIC_COUNTRY_RULES = [...FALLBACK_AFRICAN_COUNTRIES, RUSSIA].reduce((result, country) => {
  result[country.code] = {
    label: country.name,
    prefix: country.callingCode,
    placeholder: `${country.callingCode}XXXXXXXXXX`,
    pattern: new RegExp(`^\\${country.callingCode}\\d{7,12}$`),
    message: `Utilisez le format ${country.name.toLowerCase()} ${country.callingCode} suivi du numero local.`,
  }
  return result
}, {})

export const PHONE_RULES = {
  BJ: {
    label: 'Benin',
    prefix: '+22901',
    placeholder: '+22901XXXXXXXX',
    pattern: /^\+22901\d{8}$/,
    message: 'Utilisez le format beninois +22901 suivi de 8 chiffres.',
  },
  RU: {
    label: 'Russie',
    prefix: '+7',
    placeholder: '+7XXXXXXXXXX ou 8XXXXXXXXXX',
    pattern: /^(?:\+7|8)\d{10}$/,
    message: 'Utilisez le format russe +7 ou 8 suivi de 10 chiffres.',
  },
}

export function normalizePhone(value = '') {
  const trimmed = String(value).trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return `${hasPlus ? '+' : ''}${digits}`
}

export function phonePrefix(country) {
  return (PHONE_RULES[country] || GENERIC_COUNTRY_RULES[country] || PHONE_RULES.BJ).prefix
}

export function phonePlaceholder(country) {
  return (PHONE_RULES[country] || GENERIC_COUNTRY_RULES[country] || PHONE_RULES.BJ).placeholder
}

export function ensurePhoneCountry(value, country) {
  const normalized = normalizePhone(value)
  const rule = PHONE_RULES[country] || GENERIC_COUNTRY_RULES[country] || PHONE_RULES.BJ
  if (!normalized || Object.values(PHONE_RULES).some((item) => normalized === item.prefix)) {
    return rule.prefix
  }
  if (country === 'RU') {
    if (/^8\d{10}$/.test(normalized) || /^\+7\d{10}$/.test(normalized)) return normalized
    const digits = normalized.replace(/\D/g, '')
    if (digits.length === 10) return `${rule.prefix}${digits}`
  }
  return normalized
}

export function validatePhone(value, country) {
  const rule = PHONE_RULES[country] || GENERIC_COUNTRY_RULES[country] || PHONE_RULES.BJ
  return rule.pattern.test(normalizePhone(value))
}

export function phoneError(country) {
  return (PHONE_RULES[country] || GENERIC_COUNTRY_RULES[country] || PHONE_RULES.BJ).message
}

export function phonePrefixForCallingCode(callingCode = '') {
  return callingCode.startsWith('+') ? callingCode : `+${callingCode.replace(/\D/g, '')}`
}

export function constrainPhone(value, callingCode, maxSubscriberDigits = 12) {
  const prefix = phonePrefixForCallingCode(callingCode)
  const prefixDigits = prefix.replace(/\D/g, '')
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith(prefixDigits)) digits = digits.slice(prefixDigits.length)
  return `${prefix}${digits.slice(0, maxSubscriberDigits)}`
}

export function constrainRussianPhone(value) {
  const raw = String(value || '').trim()
  const wantsNational = raw.startsWith('8')
  const digits = raw.replace(/\D/g, '')

  if (wantsNational) {
    const local = digits.startsWith('8') ? digits.slice(1) : digits
    return `8${local.slice(0, 10)}`
  }

  const local = digits.startsWith('7') ? digits.slice(1) : digits
  return `+7${local.slice(0, 10)}`
}

export function validateInternationalPhone(value, callingCode) {
  const normalized = normalizePhone(value)
  const prefix = phonePrefixForCallingCode(callingCode)
  const subscriber = normalized.slice(prefix.length)
  return normalized.startsWith(prefix) && /^\d{7,12}$/.test(subscriber)
}
