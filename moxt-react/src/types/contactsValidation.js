import { IDENTITY_TYPES } from './identityEnums'

const PASSPORT_REGEX = /^[A-Z0-9]{6,12}$/

export function validatePassport(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!normalized) return { valid: false, message: 'Le numéro de passeport est obligatoire.' }
  if (!PASSPORT_REGEX.test(normalized)) {
    return {
      valid: false,
      message: 'Format invalide (6 à 12 caractères alphanumériques, ex. AB1234567).',
    }
  }
  return { valid: true, normalized }
}

export function validateIdentityDates(issuedAt, expiresAt) {
  const errors = {}
  if (!issuedAt) errors.issuedAt = 'La date de délivrance est obligatoire.'
  if (!expiresAt) errors.expiresAt = "La date d'expiration est obligatoire."
  if (issuedAt && expiresAt && expiresAt <= issuedAt) {
    errors.expiresAt = "La date d'expiration doit être postérieure à la délivrance."
  }
  return errors
}

export function validateIdentityFields(data, variant = 'person') {
  const errors = {}
  if (variant === 'person') {
    if (!data.firstNames?.trim()) errors.firstNames = 'Les prénoms sont obligatoires.'
    if (!data.lastName?.trim()) errors.lastName = 'Le nom est obligatoire.'
  } else {
    if (!data.companyName?.trim()) errors.companyName = 'La raison sociale est obligatoire.'
  }
  if (!data.idType || !IDENTITY_TYPES.includes(data.idType)) {
    errors.idType = 'Type de pièce invalide.'
  }
  const passport = validatePassport(data.passportNumber)
  if (!passport.valid) errors.passportNumber = passport.message
  if (!data.issuedBy?.trim()) errors.issuedBy = 'Le lieu de délivrance est obligatoire.'
  Object.assign(errors, validateIdentityDates(data.issuedAt, data.expiresAt))
  return errors
}
