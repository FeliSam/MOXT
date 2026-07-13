import { isProfileComplete } from './profileCompletion.js'
import { normalizeRussianAuthPhone } from '../utils/phone.js'

const PENDING_STALE_MS = 24 * 60 * 60 * 1000

export function isValidRussianPhone(value = '') {
  const phone = normalizeRussianAuthPhone(value)
  return /^\+7\d{10}$/.test(phone)
}

/** Niveau 1 — numéro russe confirmé par OTP (obligatoire pour publier). */
export function isPhoneVerified(user) {
  if (!user) return false
  if (user.phoneVerified === true) return true
  return Boolean(user.phoneVerifiedAt)
}

/** Niveau 2/3 — identité validée par MOXT (profiles.status = verified). */
export function isIdentityVerified(user) {
  return Boolean(user?.verified) || user?.status === 'verified'
}

export function isPersonallyRegistered(user) {
  return isProfileComplete(user)
}

/** Messagerie, favoris, contact : flux normal sans vérification renforcée. */
export function canInteractNormally(user) {
  return Boolean(user?.id)
}

export function canPublishContent(user) {
  if (!user?.id) return false
  return isPhoneVerified(user) && isValidRussianPhone(user.phone)
}

/** E-mail confirmé (Supabase Auth). */
export function isEmailVerified(user) {
  if (!user) return false
  if (user.emailVerified === true) return true
  return Boolean(user.emailVerifiedAt)
}

export function hasAccountEmail(user) {
  return String(user?.email || '').trim().includes('@')
}

export function canCreateBusiness(user) {
  if (!user?.id) return false
  return isIdentityVerified(user) && isPersonallyRegistered(user) && isEmailVerified(user)
}

export function canSubmitIdentityVerification(user) {
  if (!user?.id) return false
  return isPhoneVerified(user) && isEmailVerified(user) && hasAccountEmail(user)
}

/** Transfert : profil complet + numéro russe vérifié. */
export function canUseTransferAccount(user) {
  if (!user?.id) return false
  return isPersonallyRegistered(user) && isPhoneVerified(user) && isValidRussianPhone(user.phone)
}

export function canPublishP2POffer(user) {
  return canPublishContent(user)
}

export function verificationRequestIsStale(request, now = Date.now()) {
  if (!request || request.status !== 'pending_review') return false
  const created = Date.parse(request.createdAt || '')
  if (!Number.isFinite(created)) return false
  return now - created > PENDING_STALE_MS
}

export function securityGateMessage(kind, user) {
  switch (kind) {
    case 'publish':
      if (!isValidRussianPhone(user?.phone)) {
        return 'Ajoutez un numéro russe (+7) valide dans votre profil.'
      }
      return 'Confirmez votre numéro russe par SMS avant de publier une annonce, un colis, un job, un événement ou une offre P2P.'
    case 'business':
      if (!isPersonallyRegistered(user)) {
        return 'Complétez vos informations personnelles avant de créer une entreprise.'
      }
      if (!isEmailVerified(user)) {
        return 'Confirmez votre adresse e-mail dans Sécurité avant de créer une entreprise.'
      }
      return 'Votre identité doit être vérifiée par MOXT avant de créer une entreprise.'
    case 'transfer':
      if (!isPersonallyRegistered(user)) {
        return 'Complétez vos informations personnelles avant d’utiliser les comptes de transfert.'
      }
      return 'Votre identité doit être vérifiée par MOXT avant d’effectuer un transfert.'
    default:
      return 'Action non autorisée avec votre niveau de vérification actuel.'
  }
}
