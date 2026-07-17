import { IDENTITY_TYPES } from './identityEnums'

const PASSPORT_REGEX = /^[A-Z0-9]{6,12}$/

/**
 * Builds a message resolver. When a translation function `t` is provided, it
 * resolves `t(key)` (using the French source as the i18n default value). When
 * no `t` is provided, or when the key resolves to nothing / echoes back the
 * key, it falls back to the exact original French message.
 */
const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key, { defaultValue: fallback })
  if (translated == null || translated === key) return fallback
  return translated
}

export function validatePassport(value, t) {
  const m = createMessageResolver(t)
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!normalized) {
    return {
      valid: false,
      message: m('validation.identity.passportRequired', 'Le numéro de passeport est obligatoire.'),
    }
  }
  if (!PASSPORT_REGEX.test(normalized)) {
    return {
      valid: false,
      message: m(
        'validation.identity.passportInvalid',
        'Format invalide (6 à 12 caractères alphanumériques, ex. AB1234567).',
      ),
    }
  }
  return { valid: true, normalized }
}

export function validateIdentityDates(issuedAt, expiresAt, t) {
  const m = createMessageResolver(t)
  const errors = {}
  if (!issuedAt) {
    errors.issuedAt = m('validation.identity.issuedAtRequired', 'La date de délivrance est obligatoire.')
  }
  if (!expiresAt) {
    errors.expiresAt = m('validation.identity.expiresAtRequired', "La date d'expiration est obligatoire.")
  }
  if (issuedAt && expiresAt && expiresAt <= issuedAt) {
    errors.expiresAt = m(
      'validation.identity.expiresAfterIssued',
      "La date d'expiration doit être postérieure à la délivrance.",
    )
  }
  return errors
}

export function validateIdentityFields(data, variant = 'person', t) {
  const m = createMessageResolver(t)
  const errors = {}
  if (variant === 'person') {
    if (!data.firstNames?.trim()) {
      errors.firstNames = m('validation.identity.firstNamesRequired', 'Les prénoms sont obligatoires.')
    }
    if (!data.lastName?.trim()) {
      errors.lastName = m('validation.identity.lastNameRequired', 'Le nom est obligatoire.')
    }
  } else {
    if (!data.companyName?.trim()) {
      errors.companyName = m('validation.identity.companyNameRequired', 'La raison sociale est obligatoire.')
    }
  }
  if (!data.idType || !IDENTITY_TYPES.includes(data.idType)) {
    errors.idType = m('validation.identity.docTypeInvalid', 'Type de pièce invalide.')
  }
  const passport = validatePassport(data.passportNumber, t)
  if (!passport.valid) errors.passportNumber = passport.message
  if (!data.issuedBy?.trim()) {
    errors.issuedBy = m('validation.identity.issuedByRequired', 'Le lieu de délivrance est obligatoire.')
  }
  Object.assign(errors, validateIdentityDates(data.issuedAt, data.expiresAt, t))
  return errors
}
